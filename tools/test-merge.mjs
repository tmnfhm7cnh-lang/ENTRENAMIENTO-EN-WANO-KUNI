/*
 * Asserts the merge of the generated data file into the log. Run: node tools/test-merge.mjs
 *
 * This file exists because of one bug, and the bug is arithmetic rather than cosmetic: the same
 * training session counted twice pays XP twice, and XP is the whole point of the app. It could only
 * happen once he logged the same session in two places — which is exactly what the decision of
 * 2026-08-20 asks him to do while the Numbers notebook is the register of record and this app is
 * the candidate trying to replace it.
 */
const { mergeSessions } = await import('../src/utils/datafile.ts');

let fails = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? 'OK  ' : 'FALLA'}  ${name}`);
  if (!ok) console.log(`        esperado ${JSON.stringify(want)}\n        obtenido ${JSON.stringify(got)}`);
};
const ok = (name, cond, detail = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'OK  ' : 'FALLA'}  ${name}${cond ? '' : ' — ' + detail}`);
};

/** How TodayScreen names a session when he taps a set in the gym. */
const tapped = (date, bloque, sesion, sets) => ({
  id: `${date}|${bloque}|${sesion}`, date, bloque, sesion, sets, notes: '',
});

/** How build-plan.mjs names the same session once it has come back through sesiones.csv. */
const generated = (date, bloque, sesion, sets) => ({
  id: `${date}|${bloque}|${sesion}`, date, bloque, sesion, sets, notes: 'del cuaderno',
});

/** How build-plan.mjs named it BEFORE 2026-08-20 — still sitting in his phone's storage. */
const legacy = (date, bloque, sesion, sets) => ({
  id: `csv-${date}|${bloque}|${sesion}`, date, bloque, sesion, sets, notes: 'importado antes',
});

const set = (exerciseId, reps, rpe) => ({ exerciseId, reps, rpe });

// ---------------------------------------------------------------------------
// The bug itself.
// ---------------------------------------------------------------------------

const inApp = tapped('2026-08-20', 'albufeira', 'intervalos', [set('airbike', undefined, 8)]);
const fromNotebook = generated('2026-08-20', 'albufeira', 'intervalos', [set('airbike', undefined, 8)]);

check(
  'la misma sesion apuntada y luego traida del cuaderno cuenta UNA vez',
  mergeSessions([inApp], [fromNotebook]).length,
  1,
);

ok(
  'y el prefijo csv- ya no existe en el resultado',
  mergeSessions([inApp], [fromNotebook]).every((s) => !s.id.startsWith('csv-')),
);

// ---------------------------------------------------------------------------
// The trap: fixing only the generator would have doubled what his phone already holds.
// ---------------------------------------------------------------------------

const stored = legacy('2026-06-29', 'samurai', 'fuerza-max', [set('power-clean', 2)]);
const regenerated = generated('2026-06-29', 'samurai', 'fuerza-max', [set('power-clean', 2)]);

check(
  'una sesion ya importada con el id viejo no se duplica al reimportar',
  mergeSessions([stored], [regenerated]).length,
  1,
);

check(
  'y su id queda normalizado, asi que la forma vieja se vacia sola',
  mergeSessions([stored], [regenerated])[0].id,
  '2026-06-29|samurai|fuerza-max',
);

// ---------------------------------------------------------------------------
// Idempotence, which is the property the weekly refresh depends on.
// ---------------------------------------------------------------------------

const once = mergeSessions([], [regenerated, fromNotebook]);
const twice = mergeSessions(once, [regenerated, fromNotebook]);
check('dos importaciones del mismo archivo dejan el diario igual que una', twice, once);

// ---------------------------------------------------------------------------
// Who wins, and who is never touched.
// ---------------------------------------------------------------------------

const tappedWrong = tapped('2026-08-20', 'albufeira', 'intervalos', [set('airbike', undefined, 3)]);
const corrected = generated('2026-08-20', 'albufeira', 'intervalos', [set('airbike', undefined, 8)]);
check(
  'el cuaderno manda: corrige lo que se apunto en la app',
  mergeSessions([tappedWrong], [corrected])[0].sets[0].rpe,
  8,
);

const onlyInApp = tapped('2026-08-21', 'albufeira', 'rango', [set('jefferson-curl', 8, 6)]);
check(
  'pero una sesion que solo vivio en la app sobrevive intacta',
  mergeSessions([onlyInApp], [corrected]).find((s) => s.date === '2026-08-21'),
  { ...onlyInApp, id: '2026-08-21|albufeira|rango' },
);

// ---------------------------------------------------------------------------
// Ordering, because the Today screen and the streak both read the log in order.
// ---------------------------------------------------------------------------

const shuffled = mergeSessions(
  [tapped('2026-08-20', 'a', 'x', []), tapped('2026-06-29', 'a', 'x', [])],
  [generated('2026-07-15', 'a', 'x', [])],
);
check(
  'el diario sale ordenado por fecha',
  shuffled.map((s) => s.date),
  ['2026-06-29', '2026-07-15', '2026-08-20'],
);

console.log(fails === 0 ? '\ntodas las comprobaciones pasan' : `\n${fails} comprobaciones FALLAN`);
// `process.exitCode` and not `process.exit()`: forcing the exit while Node's TypeScript loader is
// still tearing down trips a libuv assertion on Windows and reports 127, which reads as a failing
// test when every check passed. Setting the code lets the process drain and end on its own.
process.exitCode = fails === 0 ? 0 : 1;
