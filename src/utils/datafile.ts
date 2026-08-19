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

/** Existing entries win: what he logged in the app is never overwritten by the generated file. */
export function mergeSessions(current: SessionEntry[], incoming: SessionEntry[]): SessionEntry[] {
  const seen = new Set(current.map((s) => s.id));
  return [...current, ...incoming.filter((s) => !seen.has(s.id))].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
}
