/**
 * His written block, as the app sees it.
 *
 * The shape mirrors what tools/build-plan.mjs produces out of
 * frentes/mi-entrenamiento/programacion/semanas/*.csv. Nothing here is authored in the app: the
 * plan is written outside, in the same nineteen files that generate the workbook he fills in on
 * the iPad, and it arrives as an imported file.
 *
 * Why imported rather than shipped: this repository is public, because GitHub Pages will not serve
 * a private one for free, and the plan carries loaded adductors, gym schedules and coaching notes.
 * Publishing that is not the app's decision to make.
 */

import { EXERCISE_BY_ID, type Exercise } from "./exercises.ts";

export interface PlanExercise {
  kind: "ejercicio";
  exerciseId: string;
  category: string;
  /** As written in the plan — "Front lever — tucked avanzado", not the catalogue name. */
  name: string;
  note: string;
  sets: string;
  reps: string;
  target: string;
}

/** A row of the plan that is not a movement: a warning, a reminder, a filter for the day. */
export interface PlanNotice {
  kind: "aviso";
  category: string;
  text: string;
}

export type PlanItem = PlanExercise | PlanNotice;

export interface PlanDay {
  /** 0 = Monday, as the weekday columns of the workbook run. */
  dow: number;
  date: string | null;
  name: string;
  sessionId: string;
  place: string;
  banner: string;
  items: PlanItem[];
}

export interface PlanExtra {
  title: string;
  sessionId: string;
  items: PlanItem[];
}

export interface PlanWeek {
  n: number;
  monday: string | null;
  sunday: string | null;
  title: string;
  phase: string;
  headline: string;
  daily: PlanItem[];
  days: PlanDay[];
  extras: PlanExtra[];
  closing: { question: string }[];
}

export interface PlanData {
  kind: "wano-kuni:datos";
  version: number;
  generatedAt: string;
  source: string;
  /** The `bloque` column of sesiones.csv. Today: "albufeira". */
  block: string;
  weeks: PlanWeek[];
  history?: unknown[];
}

export function isPlanData(value: unknown): value is PlanData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return v.kind === "wano-kuni:datos" && Array.isArray(v.weeks) && typeof v.block === "string";
}

/* ------------------------------------------------------------------ the date */

/**
 * Today, in his timezone, as YYYY-MM-DD.
 *
 * Deliberately not `toISOString().slice(0,10)`: that is UTC, and in Madrid it rolls the date over
 * at 01:00 or 02:00 local. A man logging the last set of an evening session would have it land on
 * tomorrow.
 */
export function todayISO(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** 0 = Monday. JavaScript counts from Sunday; the plan does not. */
export function dowOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function weekFor(plan: PlanData | null, date: string): PlanWeek | null {
  if (!plan) return null;
  return plan.weeks.find((w) => w.monday && w.sunday && w.monday <= date && date <= w.sunday) ?? null;
}

export function dayFor(week: PlanWeek | null, date: string): PlanDay | null {
  if (!week) return null;
  return week.days.find((d) => d.date === date) ?? week.days.find((d) => d.dow === dowOf(date)) ?? null;
}

/* ------------------------------------------------- what a prescription means */

export interface SetDefaults {
  reps?: number;
  loadKg?: number;
  seconds?: number;
}

const firstNumber = (text: string): number | undefined => {
  const m = text.replace(",", ".").match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : undefined;
};

/**
 * What one tap on "+ serie" should log, read off the prescription.
 *
 * The plan writes ranges — "3", "8–10", "70–85 kg", "20–30 s", "30 min" — and the bottom of a
 * range is the honest default: it is what he is certain to have done, and raising a number is one
 * tap while remembering to lower it is a whole decision. Everything here is a starting point he
 * can change before logging.
 */
export function defaultsFor(item: PlanExercise): SetDefaults {
  const ex: Exercise | undefined = EXERCISE_BY_ID[item.exerciseId];
  const reps = firstNumber(item.reps);
  const out: SetDefaults = {};
  if (!ex) return out;

  // "50 % del volumen" and "70 % de la A" are instructions about how hard, not how much. Reading a
  // number out of them gave a front lever a fifty-second hold, which is not a thing he can do.
  const target = item.target.replace(/\d+(?:[.,]\d+)?\s*%/g, " ");

  if (ex.metric === "reps" || ex.metric === "load") {
    out.reps = reps ?? 8;
    if (ex.metric === "load") out.loadKg = firstNumber(target) ?? 0;
    return out;
  }

  // Holds and continuous work both live in tiempo_s, and the plan writes them in different units.
  const unit = `${item.reps} ${target}`.toLowerCase();
  const n = reps ?? firstNumber(target);
  if (n === undefined) return ex.metric === "hold" ? { seconds: 20 } : { seconds: 20 * 60 };
  if (/\bmin\b|minuto/.test(unit)) out.seconds = Math.round(n * 60);
  else if (/\bh\b|hora/.test(unit)) out.seconds = Math.round(n * 3600);
  else out.seconds = Math.round(n);
  return out;
}

/** "3 series" out of a "3" or "2–3" cell. Used only to show progress against the prescription. */
export function prescribedSets(item: PlanExercise): number | undefined {
  return firstNumber(item.sets);
}
