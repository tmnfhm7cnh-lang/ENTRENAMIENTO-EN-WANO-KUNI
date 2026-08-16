/**
 * The exercise catalogue.
 *
 * Every `id` here is written verbatim into the `ejercicio` column of
 * frentes/mi-entrenamiento/registro/sesiones.csv, which already exists and already holds real
 * sessions. The identifiers are Spanish and kebab-case for that reason and no other: the schema
 * predates this app, and an app that invents its own vocabulary forces a translation step forever.
 *
 * Seeded on 2026-08-14 from the 59 rows already in that file, so the first session logged in the
 * app can be compared against the eight weeks logged before it.
 *
 * A seed, not a cage (PLAN §1.6): the app must be able to add an exercise the same afternoon a
 * teacher shows him one. What it must never do is accept free text, because free text cannot be
 * counted, compared or plotted — the point of a catalogue is that "fondos" is always the same
 * string.
 */

/** Which column of sesiones.csv a logged set fills in. */
export type Metric =
  | "reps" // series × reps
  | "load" // series × reps × carga_kg
  | "hold" // tiempo_s, a static hold
  | "duration" // tiempo_s, continuous work
  | "distance"; // distancia, in the notes column for now

export type Discipline = "calistenia" | "capoeira" | "gimnasio" | "atletismo" | "acondicionamiento";

/**
 * Which attribute a set feeds. Deliberately the same four the character sheet shows, so the link
 * between "I did this" and "this moved" is one hop and can be explained in one line.
 */
export type Capacity = "strength" | "agility" | "balance" | "rhythm";

export interface Exercise {
  /** Written verbatim into the CSV. Never change one of these without migrating the file. */
  id: string;
  name: string;
  discipline: Discipline;
  metric: Metric;
  capacity: Capacity;
  /** Links to a TrainingSkill in initialData when this exercise is one of the tree's goals. */
  skillId?: string;
  /** True when the movement is a progression step rather than an end in itself. */
  accessory?: boolean;
}

export const EXERCISES: Exercise[] = [
  // --- Already in sesiones.csv, most-used first. These are what he actually does. ---
  { id: "power-clean", name: "Power clean", discipline: "gimnasio", metric: "load", capacity: "strength" },
  { id: "front-squat", name: "Front squat", discipline: "gimnasio", metric: "load", capacity: "strength" },
  { id: "remo", name: "Remo", discipline: "gimnasio", metric: "load", capacity: "strength" },
  { id: "salto-vertical", name: "Salto vertical", discipline: "atletismo", metric: "reps", capacity: "agility" },
  { id: "fondos", name: "Fondos", discipline: "calistenia", metric: "reps", capacity: "strength" },
  { id: "lu-raises", name: "Lu raises", discipline: "gimnasio", metric: "load", capacity: "strength", accessory: true },
  { id: "dominada", name: "Dominadas", discipline: "calistenia", metric: "reps", capacity: "strength", skillId: "calis_pullups" },
  { id: "muscle-up", name: "Muscle up", discipline: "calistenia", metric: "reps", capacity: "strength" },
  { id: "front-lever", name: "Front lever", discipline: "calistenia", metric: "hold", capacity: "strength", skillId: "calis_frontlever" },
  { id: "planche", name: "Planche", discipline: "calistenia", metric: "hold", capacity: "strength", skillId: "calis_planche" },
  { id: "compresion-activa", name: "Compresión activa", discipline: "calistenia", metric: "hold", capacity: "balance", accessory: true },
  { id: "tabata", name: "Tabata", discipline: "acondicionamiento", metric: "duration", capacity: "rhythm" },
  { id: "tabata-capoeira", name: "Tabata de capoeira", discipline: "capoeira", metric: "duration", capacity: "rhythm" },
  { id: "bici", name: "Bici", discipline: "acondicionamiento", metric: "duration", capacity: "rhythm" },
  { id: "caminata", name: "Caminata", discipline: "acondicionamiento", metric: "duration", capacity: "rhythm" },

  // --- Tree goals with no rows yet. They exist so the first set logged has somewhere to land. ---
  { id: "flexiones", name: "Flexiones", discipline: "calistenia", metric: "reps", capacity: "strength", skillId: "calis_pushups" },
  { id: "l-sit", name: "L-sit", discipline: "calistenia", metric: "hold", capacity: "balance", skillId: "calis_lsit" },
  { id: "pino", name: "Pino", discipline: "calistenia", metric: "hold", capacity: "balance", skillId: "calis_handstand" },
  { id: "back-lever", name: "Back lever", discipline: "calistenia", metric: "hold", capacity: "strength" },
  { id: "press-pino", name: "Press a pino", discipline: "calistenia", metric: "reps", capacity: "balance" },
  { id: "pino-una-mano", name: "Pino a una mano", discipline: "calistenia", metric: "hold", capacity: "balance" },
  { id: "dominada-una-mano", name: "Dominada a una mano", discipline: "calistenia", metric: "reps", capacity: "strength" },

  // --- Capoeira. The full movement catalogue is Fase 3 and goes to biblioteca/metodos/; these six
  //     are the ones the skill tree already names, so the two stay in step. ---
  { id: "ginga", name: "Ginga", discipline: "capoeira", metric: "duration", capacity: "rhythm", skillId: "capo_ginga" },
  { id: "esquiva", name: "Esquiva", discipline: "capoeira", metric: "reps", capacity: "agility", skillId: "capo_esquiva" },
  { id: "meia-lua-de-compasso", name: "Meia lua de compasso", discipline: "capoeira", metric: "reps", capacity: "agility", skillId: "capo_meialua" },
  { id: "au-sem-mao", name: "Aú sem mão", discipline: "capoeira", metric: "reps", capacity: "agility", skillId: "capo_au" },
  { id: "macaco", name: "Macaco", discipline: "capoeira", metric: "reps", capacity: "balance", skillId: "capo_macaco" },
  { id: "envergado", name: "Envergado", discipline: "capoeira", metric: "reps", capacity: "rhythm", skillId: "capo_envergado" },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

export const DISCIPLINES: { id: Discipline; label: string }[] = [
  { id: "calistenia", label: "Calistenia" },
  { id: "capoeira", label: "Capoeira" },
  { id: "gimnasio", label: "Gimnasio" },
  { id: "atletismo", label: "Atletismo" },
  { id: "acondicionamiento", label: "Acondicionamiento" },
];

/** Exercises of a discipline, goals before accessories, so the list opens on what matters. */
export function exercisesOf(discipline: Discipline): Exercise[] {
  return EXERCISES.filter((e) => e.discipline === discipline).sort(
    (a, b) => Number(a.accessory ?? false) - Number(b.accessory ?? false),
  );
}
