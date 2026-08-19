/**
 * Persistence layer.
 *
 * The whole app state lives in a single versioned record in localStorage.
 * Rationale: this is a single-user app with no backend and no accounts, and the
 * state is small enough (a few hundred KB at most, even after a full season of
 * training logs) that partial writes would add complexity without buying
 * anything.
 *
 * localStorage on iOS Safari can be evicted by the system when storage runs
 * low, and it is wiped if the user clears website data. That is not a bug we
 * can fix from here — it is the reason `exportBackup` / `importBackup` exist
 * and are surfaced in the UI. The JSON backup is the real source of truth.
 */

import {
  SamuraiCharacter,
  TrainingSkill,
  TrainingLogEntry,
  MeritQuest,
} from "../types";
import type { SessionEntry } from "../game/derive";
import type { PlanData } from "../data/plan";

const STORAGE_KEY = "wano-kuni:state";

/**
 * Bump when the shape of PersistedState changes in a way older records cannot
 * satisfy. `loadState` refuses to read a record it does not understand rather
 * than feeding half-migrated data into the app.
 */
export const SCHEMA_VERSION = 2;

export interface PersistedState {
  schemaVersion: number;
  savedAt: string;
  character: SamuraiCharacter;
  skills: TrainingSkill[];
  /**
   * The old free-text log. Version 2 stopped writing to it and nothing reads it for the
   * character any more, but it is kept, untouched, because it is the only copy of whatever he
   * typed before — and a migration that quietly drops a training log is not a migration.
   */
  logs: TrainingLogEntry[];
  quests: MeritQuest[];
  availablePoints: number;
  activeScenarioId: string;
  /** The real log since version 2: sessions made of sets. This is what the character derives from. */
  sessions: SessionEntry[];
  /** His written block, imported. Null until he loads it. */
  plan: PlanData | null;
}

export type LoadResult =
  | { status: "ok"; state: PersistedState }
  | { status: "empty" }
  | { status: "unreadable"; reason: string };

/**
 * Version 1 records become version 2 by gaining two empty fields. Nothing is read differently and
 * nothing is discarded, so this can never lose data: it is the whole reason loadState migrates
 * instead of refusing, which is what it did before and would have wiped his phone.
 */
function migrate(state: PersistedState): PersistedState {
  if (state.schemaVersion === SCHEMA_VERSION) return state;
  return {
    ...state,
    schemaVersion: SCHEMA_VERSION,
    sessions: Array.isArray(state.sessions) ? state.sessions : [],
    plan: state.plan ?? null,
  };
}

function isPlausibleState(value: unknown): value is PersistedState {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.schemaVersion === "number" &&
    typeof s.character === "object" &&
    s.character !== null &&
    Array.isArray(s.skills) &&
    Array.isArray(s.logs) &&
    Array.isArray(s.quests)
  );
}

export function loadState(): LoadResult {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    // Private browsing on iOS can throw on access rather than return null.
    return { status: "unreadable", reason: `localStorage inaccesible: ${err}` };
  }

  if (raw === null) return { status: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "unreadable", reason: "el registro guardado no es JSON válido" };
  }

  if (!isPlausibleState(parsed)) {
    return { status: "unreadable", reason: "el registro guardado no tiene la forma esperada" };
  }

  if (parsed.schemaVersion > SCHEMA_VERSION) {
    return {
      status: "unreadable",
      reason: `el registro es de la versión ${parsed.schemaVersion} y esta app usa la ${SCHEMA_VERSION}`,
    };
  }

  return { status: "ok", state: migrate(parsed) };
}

export function saveState(state: Omit<PersistedState, "schemaVersion" | "savedAt">): boolean {
  const record: PersistedState = {
    ...state,
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    // Quota exceeded, or storage disabled. The caller warns the user; we do not
    // want a failed write to take the whole app down mid-session.
    return false;
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing useful to do here */
  }
}

/** Filename stamped with the date, so successive backups do not overwrite. */
export function backupFilename(now: Date): string {
  const iso = now.toISOString().split("T")[0];
  return `wano-kuni-${iso}.json`;
}

export type ExportRoute = "share" | "download";

/**
 * Hands the backup to the OS.
 *
 * On iOS the share sheet is the only route that lets the user drop the file
 * straight into OneDrive; a plain <a download> lands it in Files > Downloads
 * and they have to go move it by hand. So: share sheet when the browser
 * supports it for files, download link everywhere else. Same approach as
 * dryland-test-logger.
 *
 * Returns which route was taken so the UI can tell the user where to look.
 */
export async function exportBackup(
  state: Omit<PersistedState, "schemaVersion" | "savedAt">,
  now: Date = new Date()
): Promise<ExportRoute> {
  const record: PersistedState = {
    ...state,
    schemaVersion: SCHEMA_VERSION,
    savedAt: now.toISOString(),
  };
  const text = JSON.stringify(record, null, 2);
  const name = backupFilename(now);
  const file = new File([text], name, { type: "application/json" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return "share";
    } catch {
      // The user dismissed the sheet, or the browser refused. Fall through to
      // the download so the export is never a dead end.
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return "download";
}

export async function importBackup(file: File): Promise<LoadResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { status: "unreadable", reason: "no se pudo leer el archivo" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: "unreadable", reason: "el archivo no es JSON válido" };
  }

  if (!isPlausibleState(parsed)) {
    return { status: "unreadable", reason: "el archivo no es una copia de Wano Kuni" };
  }

  if (parsed.schemaVersion > SCHEMA_VERSION) {
    return {
      status: "unreadable",
      reason: `la copia es de la versión ${parsed.schemaVersion} y esta app usa la ${SCHEMA_VERSION}`,
    };
  }

  return { status: "ok", state: migrate(parsed) };
}
