/**
 * The written score. No Web Audio here on purpose: this file is pure data plus arithmetic, so it
 * can be run and asserted outside a browser (see tools/test-score.mjs). Soundtrack.tsx owns the
 * instruments and the clock; this file owns what is played and when.
 *
 * Why it was rewritten (2026-08-11): the previous engine had fixed phrases but random gaps between
 * them and random note lengths, and it fired each note with its own setTimeout. Two consequences,
 * and both are the reason it did not sound like music. There was no pulse — nothing a listener
 * could feel as a beat — and setTimeout drifts, so even the intended rhythm arrived late and
 * unevenly. The taiko existed but never played except when a button was pressed.
 *
 * So: one fixed grid in beats, one written composition, drums included. Nothing random.
 *
 * The shape follows jo-ha-kyū, the three-part progression Japanese theatre and music are built on:
 * jo, a slow deliberate opening; ha, the body, where the pulse settles and breaks up; kyū, a fast
 * close. It repeats. It is not a transcription of any particular piece — it is written to that
 * pattern with the instruments of the genre.
 */

/**
 * The yo scale (陽旋法), rooted on A: A B D E F#. Intervals 2-3-2-2-3, no semitones anywhere.
 *
 * This replaced Hirajoshi on 2026-08-14, and the reason is the whole point. Japanese traditional
 * music has two families of scale: *in* (陰), dark, built on semitone steps, and *yo* (陽), bright,
 * built without them. Hirajoshi is *in* — it is the sound of a ghost scene, and Daniel's verdict on
 * it was "muy fea y da miedo". That was not a mistake in the arrangement; the scale was doing
 * exactly what that scale does. The yo scale is the same tradition — it is what folk song and
 * festival music use — without the menace.
 *
 * If a dark section is ever wanted deliberately, it belongs in one section, not in the loop a man
 * hears every time he opens his training diary.
 */
export const SCALE_HZ = [
  220.0, // 0  A3
  246.94, // 1  B3
  293.66, // 2  D4
  329.63, // 3  E4
  369.99, // 4  F#4
  440.0, // 5  A4
  493.88, // 6  B4
  587.33, // 7  D5
  659.25, // 8  E5
  739.99, // 9  F#5
];

export type Voice = "shamisen" | "koto" | "flute" | "taiko" | "tsuzumi";

/** One scheduled sound. `beat` is absolute from the top of the loop. */
export interface Event {
  beat: number;
  voice: Voice;
  /** Index into SCALE_HZ. Absent for drums. */
  degree?: number;
  /** Seconds; drums ignore it. */
  dur?: number;
  /** 0..1, relative within the voice. */
  gain?: number;
}

// 72 bpm was funeral pace. At 96 the same material reads as festival rather than dread — the other
// half of the "da miedo" fix, along with the scale and the sound design in Soundtrack.tsx.
export const BPM = 96;
export const BEAT_SEC = 60 / BPM;
const BAR = 4;

/** Shorthand: notes as [beatWithinSection, degree, dur?, gain?]. */
type N = [number, number, number?, number?];
type D = [number, number?];

function notes(voice: Voice, offset: number, list: N[]): Event[] {
  return list.map(([b, degree, dur, gain]) => ({ beat: offset + b, voice, degree, dur: dur ?? 0.9, gain }));
}
function drums(voice: Voice, offset: number, list: D[]): Event[] {
  return list.map(([b, gain]) => ({ beat: offset + b, voice, gain }));
}

/* --------------------------------------------------------------------- jo */
/* Four bars. Taiko on every downbeat, a held flute line above it, the shamisen answering in the
   gaps, and the hand drum halfway through each bar.
   That last one is not decoration. The first draft left the taiko alone here, four beats apart, on
   the theory that a slow opening should only imply the pulse — and the test caught it: these are
   the first thirteen seconds Daniel hears when he presses play, and a listener with nothing to hold
   onto hears exactly the aimlessness this rewrite exists to remove. Bare is relative to ha and
   kyu, not absolute. */
const JO_BARS = 4;
const jo = (o: number): Event[] => [
  ...drums("taiko", o, [[0, 1], [4, 0.5], [8, 0.85], [12, 0.5]]),
  ...drums("tsuzumi", o, [[2, 0.45], [6, 0.4], [10, 0.5], [14, 0.45], [15, 0.6]]),
  ...notes("flute", o, [
    [0, 5, 3.4, 0.5],
    [4.5, 4, 2.6, 0.42],
    [9, 3, 3.0, 0.46],
    [13, 5, 2.2, 0.4],
  ]),
  ...notes("shamisen", o, [
    [2, 0, 1.1, 0.7],
    [3, 1, 0.7, 0.55],
    [6.5, 2, 1.0, 0.6],
    [10.5, 1, 0.8, 0.6],
    [11.5, 0, 1.3, 0.7],
    [14, 3, 0.9, 0.6],
    [15, 2, 1.1, 0.55],
  ]),
];

/* --------------------------------------------------------------------- ha */
/* Eight bars, and the section that carries the piece. The shamisen holds a two-bar ostinato — the
   repetition is the point, it is what a listener locks onto — while the koto states the melody on
   top and the tsuzumi marks the offbeats. */
const HA_BARS = 8;
const haOstinato: N[] = [
  [0, 0, 0.55, 0.72], [1, 2, 0.5, 0.5], [1.5, 1, 0.45, 0.42], [2, 0, 0.55, 0.66], [3, 3, 0.5, 0.52], [3.5, 2, 0.45, 0.4],
];
const ha = (o: number): Event[] => [
  ...notes("shamisen", o, haOstinato),
  ...notes("shamisen", o + 4, haOstinato),
  ...notes("shamisen", o + 8, haOstinato),
  ...notes("shamisen", o + 12, haOstinato),
  ...notes("shamisen", o + 16, haOstinato),
  ...notes("shamisen", o + 20, haOstinato),
  ...notes("shamisen", o + 24, haOstinato),
  ...notes("shamisen", o + 28, haOstinato),

  // The melody: a four-bar phrase, then the same phrase answered an octave apart.
  ...notes("koto", o, [
    [0, 5, 1.3, 0.85], [1.5, 4, 0.7, 0.6], [2, 3, 1.6, 0.8],
    [4, 4, 0.9, 0.7], [5, 5, 1.2, 0.8], [6.5, 6, 1.8, 0.75],
    [8, 5, 0.8, 0.7], [9, 3, 0.8, 0.62], [10, 2, 2.2, 0.8],
    [12.5, 3, 0.9, 0.6], [13.5, 4, 0.7, 0.58], [14, 5, 2.0, 0.78],
  ]),
  ...notes("koto", o + 16, [
    [0, 8, 1.3, 0.8], [1.5, 7, 0.7, 0.58], [2, 6, 1.6, 0.75],
    [4, 7, 0.9, 0.66], [5, 8, 1.2, 0.78], [6.5, 9, 1.8, 0.72],
    [8, 8, 0.8, 0.68], [9, 6, 0.8, 0.6], [10, 5, 2.2, 0.8],
    [12.5, 6, 0.9, 0.58], [13.5, 5, 0.7, 0.56], [14, 3, 2.4, 0.8],
  ]),

  ...drums("taiko", o, [[0, 0.9], [8, 0.7], [16, 0.95], [22, 0.6], [24, 0.8], [30, 0.7]]),
  ...drums(
    "tsuzumi",
    o,
    // Beats 2 and 4 of every bar, with the last bar of each half filled in.
    Array.from({ length: HA_BARS }, (_, bar) => bar * BAR).flatMap((b, i) =>
      i === 3 || i === 7
        ? ([[b + 1, 0.7], [b + 2, 0.5], [b + 3, 0.8], [b + 3.5, 0.55]] as D[])
        : ([[b + 1, 0.65], [b + 3, 0.75]] as D[]),
    ),
  ),
];

/* -------------------------------------------------------------------- kyu */
/* Four bars, twice the drum density and the melody at the top of the scale, then a stop. The
   silence in the last bar is written, not an accident: it is what makes the loop land. */
const KYU_BARS = 4;
const kyu = (o: number): Event[] => [
  ...notes("shamisen", o, [
    [0, 5, 0.4, 0.8], [0.5, 4, 0.4, 0.6], [1, 3, 0.4, 0.7], [1.5, 4, 0.4, 0.6],
    [2, 5, 0.4, 0.8], [2.5, 6, 0.4, 0.6], [3, 7, 0.4, 0.75], [3.5, 6, 0.4, 0.6],
    [4, 5, 0.4, 0.8], [4.5, 4, 0.4, 0.6], [5, 3, 0.4, 0.7], [5.5, 2, 0.4, 0.6],
    [6, 3, 0.4, 0.75], [6.5, 4, 0.4, 0.6], [7, 5, 0.9, 0.85],
    [8, 8, 0.5, 0.85], [8.5, 7, 0.4, 0.6], [9, 6, 0.5, 0.75], [9.5, 5, 0.4, 0.6],
    [10, 6, 0.5, 0.8], [10.5, 7, 0.4, 0.6], [11, 8, 1.1, 0.9],
  ]),
  ...notes("koto", o, [
    [0, 8, 1.0, 0.85], [2, 9, 1.0, 0.8], [4, 8, 1.6, 0.85], [6, 6, 1.6, 0.8],
    [8, 9, 1.2, 0.9], [10, 8, 1.2, 0.85], [12, 5, 3.6, 0.9],
  ]),
  ...notes("flute", o + 12, [[0.5, 8, 3.2, 0.45]]),
  ...drums("taiko", o, [
    [0, 1], [1, 0.55], [2, 0.8], [3, 0.6],
    [4, 1], [5, 0.55], [6, 0.8], [7, 0.7],
    [8, 1], [8.5, 0.6], [9, 0.7], [10, 0.85], [11, 0.75],
    [12, 1],
  ]),
  ...drums("tsuzumi", o, [
    [0.5, 0.6], [1.5, 0.7], [2.5, 0.6], [3.5, 0.75],
    [4.5, 0.6], [5.5, 0.7], [6.5, 0.6], [7.5, 0.8],
    [8.25, 0.6], [8.75, 0.65], [9.5, 0.7], [10.25, 0.6], [10.75, 0.65], [11.5, 0.85],
  ]),
];

const SECTIONS: { name: string; bars: number; build: (offset: number) => Event[] }[] = [
  { name: "jo", bars: JO_BARS, build: jo },
  { name: "ha", bars: HA_BARS, build: ha },
  { name: "kyu", bars: KYU_BARS, build: kyu },
];

export const LOOP_BEATS = SECTIONS.reduce((n, s) => n + s.bars * BAR, 0);
export const LOOP_SEC = LOOP_BEATS * BEAT_SEC;

/** The whole loop, sorted by time. Built once; it never changes. */
export const SCORE: Event[] = (() => {
  const out: Event[] = [];
  let beat = 0;
  for (const s of SECTIONS) {
    out.push(...s.build(beat));
    beat += s.bars * BAR;
  }
  return out.sort((a, b) => a.beat - b.beat);
})();

export const SECTION_MAP = SECTIONS.map((s, i) => ({
  name: s.name,
  startBeat: SECTIONS.slice(0, i).reduce((n, x) => n + x.bars * BAR, 0),
  bars: s.bars,
}));

/**
 * Every event whose beat falls in `[fromBeat, toBeat)` of an endlessly repeating loop, with the
 * absolute beat it should sound at. The scheduler asks for a slice a fraction of a second ahead
 * and hands the results to the AudioContext clock, so nothing depends on a timer firing on time.
 */
export function eventsInWindow(fromBeat: number, toBeat: number): (Event & { absBeat: number })[] {
  const out: (Event & { absBeat: number })[] = [];
  const firstLoop = Math.floor(fromBeat / LOOP_BEATS);
  const lastLoop = Math.floor((toBeat - 1e-9) / LOOP_BEATS);
  for (let loop = firstLoop; loop <= lastLoop; loop++) {
    const base = loop * LOOP_BEATS;
    for (const e of SCORE) {
      const abs = base + e.beat;
      if (abs >= fromBeat && abs < toBeat) out.push({ ...e, absBeat: abs });
    }
  }
  return out.sort((a, b) => a.absBeat - b.absBeat);
}
