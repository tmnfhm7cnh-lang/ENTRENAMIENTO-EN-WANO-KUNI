/**
 * The character, derived from the log.
 *
 * This file is the architecture decision of 2026-08-14, and the rule it enforces is one sentence:
 * **the log is the only input; everything the character shows is a pure function of it.** XP, level,
 * rank, the four attributes and the progress of every skill are computed here, from logged sets,
 * every time they are displayed. None of them is stored.
 *
 * Before this, all of them were stored and editable: XP was typed per entry, attributes were seed
 * constants, and skill progress moved by pressing a button. That is a character sheet with a Wano
 * skin, not a game fed by training — and it is also where the two bugs already found came from. The
 * corda deduced from the game level, and the avatar URL persisted with a build hash inside it, are
 * both the same mistake: a derived thing that was written down.
 *
 * No Web Audio, no React, no storage. Pure, so tools/test-derive.mjs can run it.
 */

// Explicit .ts extension so Node can import this file straight from source, with no build step, and
// tools/test-derive.mjs can run the real thing rather than a copy of it. tsconfig already has
// allowImportingTsExtensions, and Vite resolves it unchanged.
import { EXERCISE_BY_ID, type Capacity } from "../data/exercises.ts";

/* ------------------------------------------------------------------ the log */

export interface LoggedSet {
  exerciseId: string;
  reps?: number;
  loadKg?: number;
  seconds?: number;
  /** Borg CR-10. Optional: a set with no RPE still counts, it just does not get the effort bonus. */
  rpe?: number;
}

export interface SessionEntry {
  id: string;
  /** YYYY-MM-DD. */
  date: string;
  sets: LoggedSet[];
  notes?: string;
}

/* ----------------------------------------------------------- the calibration */

/**
 * Four sessions a week, not six.
 *
 * PLAN §1.3 calibrated the whole economy to "6 sesiones semanales × 52 = ~312 al año". That was
 * written on 2026-08-08 against v1 of his training plan, which had seven weekly slots. v2 cut it to
 * **four fixed slots** — and three during September, when four capoeira classes a week return.
 *
 * Calibrating to six would mean the game told him he was falling behind while he followed his own
 * plan exactly. For a man whose stated problem is sustaining, that is the worst failure available.
 */
export const SESSIONS_PER_WEEK = 4;

/** Twelve ranks across the corda year (PLAN §1.1: the season runs batizado to batizado). */
export const RANKS_PER_SEASON = 12;
export const SEASON_WEEKS = 52;

/**
 * What one XP is worth, per unit of work. Provisional and meant to be re-tuned against real logged
 * sessions — the numbers matter far less than the property the tests lock down: showing up every
 * week for a whole season gets you about two thirds of the way, and never to the end.
 */
const XP = {
  perRep: 0.6,
  /** Load adds on top of reps rather than multiplying, so a heavy triple beats a light one. */
  perRepPer10Kg: 0.12,
  perHoldSecond: 0.5,
  perDurationMinute: 1.8,
  /** A completed week at target. This is what rewards not missing, as opposed to doing more. */
  weeklyTarget: 60,
  /** Each consecutive completed week adds this, capped, so a streak is worth building. */
  streakStep: 12,
  streakCap: 6,
};

const EFFORT = (rpe?: number) => (rpe === undefined ? 1 : 0.8 + Math.min(10, Math.max(0, rpe)) / 25);

/* ------------------------------------------------------------------- helpers */

/** Monday-based ISO week key, e.g. "2026-W33". Dates are plain YYYY-MM-DD, no timezone games. */
export function weekKey(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((dt.getTime() - start.getTime()) / 86400000 + 1) / 7);
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function daysBetween(from: string, to: string): number {
  const p = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(to) - p(from)) / 86400000);
}

/* ----------------------------------------------------------------- volume XP */

/** The work in one set, in XP, before any bonus. Unknown exercises score zero rather than throw. */
export function xpForSet(set: LoggedSet): number {
  const ex = EXERCISE_BY_ID[set.exerciseId];
  if (!ex) return 0;
  let base = 0;
  if (ex.metric === "reps") base = (set.reps ?? 0) * XP.perRep;
  else if (ex.metric === "load") {
    base = (set.reps ?? 0) * (XP.perRep + ((set.loadKg ?? 0) / 10) * XP.perRepPer10Kg);
  } else if (ex.metric === "hold") base = (set.seconds ?? 0) * XP.perHoldSecond;
  else if (ex.metric === "duration" || ex.metric === "distance") {
    base = ((set.seconds ?? 0) / 60) * XP.perDurationMinute;
  }
  return base * EFFORT(set.rpe);
}

export function xpForSession(s: SessionEntry): number {
  return s.sets.reduce((n, set) => n + xpForSet(set), 0);
}

/* --------------------------------------------------------------- constancy XP */

export interface WeekSummary {
  week: string;
  sessions: number;
  complete: boolean;
  /** Consecutive complete weeks ending at this one. */
  streak: number;
}

/**
 * One entry per week that has any training, in order. A missed week breaks the streak but is not
 * itself penalised: PLAN §1.3 is explicit that nothing punishes beyond losing the streak, because
 * the problem being solved is starting and sustaining, not guilt.
 */
export function weeks(log: SessionEntry[], target = SESSIONS_PER_WEEK): WeekSummary[] {
  const byWeek = new Map<string, Set<string>>();
  for (const s of log) {
    const k = weekKey(s.date);
    if (!byWeek.has(k)) byWeek.set(k, new Set());
    // Two entries on the same day are one session: the unit of constancy is the day, not the entry.
    byWeek.get(k)!.add(s.date);
  }
  const keys = [...byWeek.keys()].sort();
  const out: WeekSummary[] = [];
  let streak = 0;
  let prev: string | null = null;
  for (const week of keys) {
    const sessions = byWeek.get(week)!.size;
    const complete = sessions >= target;
    // A skipped calendar week between two logged weeks breaks the streak.
    if (prev && consecutive(prev, week) === false) streak = 0;
    streak = complete ? streak + 1 : 0;
    out.push({ week, sessions, complete, streak });
    prev = week;
  }
  return out;
}

function consecutive(a: string, b: string): boolean {
  const n = (s: string) => Number(s.slice(0, 4)) * 53 + Number(s.slice(6));
  return n(b) - n(a) === 1;
}

export function constancyXp(log: SessionEntry[], target = SESSIONS_PER_WEEK): number {
  return weeks(log, target).reduce((n, w) => {
    if (!w.complete) return n;
    return n + XP.weeklyTarget + Math.min(w.streak - 1, XP.streakCap) * XP.streakStep;
  }, 0);
}

/* ------------------------------------------------------------------ the total */

export function totalXp(log: SessionEntry[], target = SESSIONS_PER_WEEK): number {
  const volume = log.reduce((n, s) => n + xpForSession(s), 0);
  return Math.round(volume + constancyXp(log, target));
}

/**
 * XP to finish the season, set so that appearing at target every week for a whole season lands at
 * roughly two thirds of it. The last third has to come from achievements — PLAN §1.3: the season
 * cannot be completed by turning up.
 */
export const SEASON_XP = 22000;

export interface Rank {
  level: number;
  xpInto: number;
  xpForNext: number;
  fraction: number;
}

/** Twelve ranks, evenly spaced. Even spacing is a choice: no wall at the end to demoralise. */
export function rankFor(xp: number): Rank {
  const per = SEASON_XP / RANKS_PER_SEASON;
  const level = Math.min(RANKS_PER_SEASON, Math.floor(xp / per) + 1);
  const floor = (level - 1) * per;
  return {
    level,
    xpInto: Math.round(xp - floor),
    xpForNext: Math.round(per),
    fraction: Math.min(1, (xp - floor) / per),
  };
}

/* ------------------------------------------------------- attributes, that fall */

/**
 * How far back an attribute looks. Everything older stops counting, which is the entire mechanism:
 * stop training and the number comes down on its own, with no punishment logic anywhere. PLAN §1.2
 * asks for attributes that can go down; a rolling window is the cheapest honest way to get it.
 */
export const ATTRIBUTE_WINDOW_DAYS = 28;

export type Stats = Record<Capacity, number>;

const ZERO: Stats = { strength: 0, agility: 0, balance: 0, rhythm: 0 };

/**
 * Each attribute is the XP of work feeding that capacity inside the window, on a compressed scale
 * so that early training moves the number a lot and later training moves it less — which is how
 * adaptation actually behaves, and it also stops a single enormous session from spiking it.
 */
export function statsFrom(log: SessionEntry[], today: string): Stats {
  const acc: Stats = { ...ZERO };
  for (const s of log) {
    const age = daysBetween(s.date, today);
    if (age < 0 || age >= ATTRIBUTE_WINDOW_DAYS) continue;
    for (const set of s.sets) {
      const ex = EXERCISE_BY_ID[set.exerciseId];
      if (!ex) continue;
      acc[ex.capacity] += xpForSet(set);
    }
  }
  const out: Stats = { ...ZERO };
  for (const k of Object.keys(acc) as Capacity[]) {
    out[k] = Math.round(12 * Math.log10(1 + acc[k] / 25) * 10) / 10;
  }
  return out;
}

/* ---------------------------------------------------------------- skill tree */

/**
 * Progress toward a skill, 0..1, from sets of the exercise that trains it. Unlike the old stored
 * `progress`, this cannot be advanced by pressing anything — only by logging the movement.
 *
 * Deliberately *not* windowed: a skill you built and stopped training does not un-learn as fast as
 * an attribute decays, and the honest signal for "you have lost it" is the attribute, not the tree.
 */
export function skillProgress(log: SessionEntry[], skillId: string, maxProgress: number): number {
  const exercise = Object.values(EXERCISE_BY_ID).find((e) => e.skillId === skillId);
  if (!exercise) return 0;
  let acc = 0;
  for (const s of log) {
    for (const set of s.sets) if (set.exerciseId === exercise.id) acc += xpForSet(set);
  }
  return Math.min(1, acc / maxProgress);
}

/* ------------------------------------------------------------------ the view */

export interface DerivedCharacter {
  xp: number;
  rank: Rank;
  stats: Stats;
  weeks: WeekSummary[];
  currentStreak: number;
  sessionsThisWeek: number;
}

/** Everything the character sheet needs, in one pass. Nothing here is ever written to storage. */
export function deriveCharacter(log: SessionEntry[], today: string): DerivedCharacter {
  const xp = totalXp(log);
  const ws = weeks(log);
  const thisWeek = ws.find((w) => w.week === weekKey(today));
  const last = ws[ws.length - 1];
  return {
    xp,
    rank: rankFor(xp),
    stats: statsFrom(log, today),
    weeks: ws,
    // A streak only stands if the last completed week is this one or the one before.
    currentStreak: last && (last.week === weekKey(today) || consecutive(last.week, weekKey(today))) ? last.streak : 0,
    sessionsThisWeek: thisWeek?.sessions ?? 0,
  };
}
