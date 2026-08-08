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

const STORAGE_KEY = "wano-kuni:state";

/**
 * Bump when the shape of PersistedState changes in a way older records cannot
 * satisfy. `loadState` refuses to read a record it does not understand rather
 * than feeding half-migrated data into the app.
 */
export const SCHEMA_VERSION = 1;

export interface PersistedState {
  schemaVersion: number;
  savedAt: string;
  character: SamuraiCharacter;
  skills: TrainingSkill[];
  logs: TrainingLogEntry[];
  quests: MeritQuest[];
  availablePoints: number;
  activeScenarioId: string;
}

export type LoadResult =
  | { status: "ok"; state: PersistedState }
  | { status: "empty" }
  | { status: "unreadable"; reason: string };

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

  if (parsed.schemaVersion !== SCHEMA_VERSION) {
    return {
      status: "unreadable",
      reason: `el registro es de la versión ${parsed.schemaVersion} y esta app usa la ${SCHEMA_VERSION}`,
    };
  }

  return { status: "ok", state: parsed };
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

export function exportBackup(
  state: Omit<PersistedState, "schemaVersion" | "savedAt">,
  now: Date = new Date()
): void {
  const record: PersistedState = {
    ...state,
    schemaVersion: SCHEMA_VERSION,
    savedAt: now.toISOString(),
  };
  const blob = new Blob([JSON.stringify(record, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = backupFilename(now);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

  if (parsed.schemaVersion !== SCHEMA_VERSION) {
    return {
      status: "unreadable",
      reason: `la copia es de la versión ${parsed.schemaVersion} y esta app usa la ${SCHEMA_VERSION}`,
    };
  }

  return { status: "ok", state: parsed };
}
