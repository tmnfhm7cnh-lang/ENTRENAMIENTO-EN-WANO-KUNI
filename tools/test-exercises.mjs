/*
 * Asserts the exercise catalogue against the CSV it has to feed.
 *
 *   node tools/test-exercises.mjs [path/to/sesiones.csv]
 *
 * With the CSV path given it checks that every exercise already logged in eight weeks of real
 * training exists in the catalogue. That is the check that keeps the app's vocabulary and the
 * system's vocabulary from drifting apart — the same class of bug as the `instrumento` column that
 * the dryland app missed for three days.
 */
import fs from 'node:fs';

import path from 'node:path';
import url from 'node:url';

const ROOT = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const { EXERCISES, EXERCISE_BY_ID, exercisesOf, DISCIPLINES } = await import('../src/data/exercises.ts');
const CSV = process.argv[2];

// initialData.ts cannot be imported here: it pulls in PNG avatars and uses extensionless imports,
// both of which Vite resolves and Node does not. The skill ids are read out of the source text
// instead — narrow enough to be reliable, and it keeps this file dependency-free.
const skillSource = fs.readFileSync(path.join(ROOT, 'src', 'data', 'initialData.ts'), 'utf8');
const skillsBlock = skillSource.slice(
  skillSource.indexOf('INITIAL_SKILLS'),
  skillSource.indexOf('INITIAL_LOGS'),
);
const skillIds = new Set([...skillsBlock.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]));

let fails = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? 'OK  ' : 'FALLA'}  ${name}`);
  if (!ok) console.log(`        esperado ${JSON.stringify(want)}\n        obtenido ${JSON.stringify(got)}`);
};

console.log('== el catalogo es consistente consigo mismo ==');
check('sin ids repetidos', EXERCISES.length, new Set(EXERCISES.map((e) => e.id)).size);
check('sin nombres repetidos', EXERCISES.length, new Set(EXERCISES.map((e) => e.name)).size);
check('los ids son kebab-case sin tildes', EXERCISES.filter((e) => !/^[a-z0-9-]+$/.test(e.id)).map((e) => e.id), []);
check('toda disciplina esta declarada',
  EXERCISES.filter((e) => !DISCIPLINES.some((d) => d.id === e.discipline)).map((e) => e.id), []);
check('toda metrica es valida',
  EXERCISES.filter((e) => !['reps', 'load', 'hold', 'duration', 'distance'].includes(e.metric)).map((e) => e.id), []);
check('toda capacidad es una de las cuatro del personaje',
  EXERCISES.filter((e) => !['strength', 'agility', 'balance', 'rhythm'].includes(e.capacity)).map((e) => e.id), []);
check('el indice cubre todo', Object.keys(EXERCISE_BY_ID).length, EXERCISES.length);

console.log('\n== los enlaces al arbol de habilidades apuntan a algo ==');
check('se han leido las 12 habilidades del arbol', skillIds.size, 12);
const linked = EXERCISES.filter((e) => e.skillId);
check('todo skillId existe en el arbol', linked.filter((e) => !skillIds.has(e.skillId)).map((e) => e.id), []);
check('ninguna habilidad tiene dos ejercicios', linked.length, new Set(linked.map((e) => e.skillId)).size);
// Every skill in the tree needs a way to be trained, or it can never progress from a logged set.
check('toda habilidad del arbol tiene su ejercicio',
  [...skillIds].filter((id) => !linked.some((e) => e.skillId === id)), []);

console.log('\n== el orden pone los objetivos antes que los accesorios ==');
for (const d of DISCIPLINES) {
  const list = exercisesOf(d.id);
  const firstAccessory = list.findIndex((e) => e.accessory);
  const lastGoal = list.map((e) => !e.accessory).lastIndexOf(true);
  check(`${d.id}: accesorios al final`, firstAccessory === -1 || firstAccessory > lastGoal, true);
}

if (CSV) {
  console.log('\n== cubre lo que ya esta registrado de verdad ==');
  const rows = fs.readFileSync(CSV, 'utf8').trim().split('\n').slice(1);
  const logged = [...new Set(rows.map((r) => r.split(',')[3]).filter(Boolean))];
  const missing = logged.filter((id) => !EXERCISE_BY_ID[id]);
  check(`los ${logged.length} ejercicios ya registrados estan en el catalogo`, missing, []);
} else {
  console.log('\n....  sin comprobar contra sesiones.csv: pasa su ruta como argumento');
}

console.log(fails ? `\n${fails} COMPROBACIONES FALLIDAS` : '\ntodas las comprobaciones pasan');
process.exit(fails ? 1 : 0);
