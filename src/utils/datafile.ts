/**
 * The file that carries his plan into the app.
 *
 * Generated outside, by tools/build-plan.mjs, from the nineteen weekly .csv that already exist in
 * his system. It holds two things: the written block, and the sessions logged before the app knew
 * how to log anything — sixty rows since 2026-06-29.
 *
 * Importing history is a merge, never a replace. Two imports of the same file leave the log
 * exactly as one import did, because every entry carries the id the generator gave it.
 */

import { isPlanData, type PlanData } from "../data/plan.ts";
import type { SessionEntry } from "../game/derive.ts";

export interface DataFile {
  plan: PlanData;
  history: SessionEntry[];
}

export type ReadDataResult =
  | { status: "ok"; data: DataFile }
  | { status: "error"; reason: string };

function isSession(value: unknown): value is SessionEntry {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return typeof s.id === "string" && typeof s.date === "string" && Array.isArray(s.sets);
}

export async function readDataFile(file: File): Promise<ReadDataResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { status: "error", reason: "no se pudo leer el archivo" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: "error", reason: "el archivo no es JSON válido" };
  }

  if (!isPlanData(parsed)) {
    return { status: "error", reason: "esto no es el archivo de programación de Wano" };
  }

  const history = Array.isArray(parsed.history) ? parsed.history.filter(isSession) : [];
  return { status: "ok", data: { plan: parsed, history } };
}

/**
 * The dedupe key, which is not the raw id.
 *
 * Both sides already name a session the same way — `date|bloque|sesion` — except that until
 * 2026-08-20 the generator prefixed its own with `csv-`. So the same session logged in the app and
 * later brought back from sesiones.csv arrived as two different ids, survived the merge twice and
 * paid XP twice. Harmless while nobody did both; the decision of 2026-08-20 — the Numbers notebook
 * is the register of record and this app is the candidate — means he now does both on purpose, for
 * as long as the trial lasts.
 *
 * Stripping the prefix here, rather than only in the generator, is what makes the fix safe for a
 * phone that already imported the prefixed ids: they collapse onto the new ones instead of doubling.
 * Normalising the id on the way through means the old shape drains out of storage on its own.
 */
const sessionKey = (s: SessionEntry): string => s.id.replace(/^csv-/, "");

/**
 * Incoming wins, and that is a reversal.
 *
 * This used to say "existing entries win: what he logged in the app is never overwritten by the
 * generated file". With the notebook as the register of record that is backwards: when the same
 * session exists on both sides, the generated copy is by definition the corrected one. Nothing is
 * lost by yielding to it — a session that only ever lived in the app is absent from the generated
 * file, so it never collides and survives untouched.
 *
 * What it does cost is per-set RPE, which the collapsed CSV form cannot carry: three sets logged at
 * 7, 8 and 9 come back as three sets at whatever single RPE the row holds. That is the price of
 * letting the notebook be the truth, and it is written here rather than discovered later.
 */
export function mergeSessions(current: SessionEntry[], incoming: SessionEntry[]): SessionEntry[] {
  const merged = new Map<string, SessionEntry>();
  for (const s of [...current, ...incoming]) {
    const key = sessionKey(s);
    merged.set(key, { ...s, id: key });
  }
  return [...merged.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
