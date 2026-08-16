/*
 * Asserts the derived character. Run: node tools/test-derive.mjs
 *
 * The properties here are the design decisions, not the numbers. If a constant is re-tuned these
 * must still hold; if one of them stops holding, the economy has stopped meaning what it was built
 * to mean.
 */
const D = await import('../src/game/derive.ts');

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

const addDays = (date, n) => {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};

/** A representative session: his actual gym work, from sesiones.csv. */
const gymSession = (date, id = date) => ({
  id, date, sets: [
    { exerciseId: 'power-clean', reps: 2, loadKg: 75, rpe: 8 },
    { exerciseId: 'power-clean', reps: 2, loadKg: 75, rpe: 8 },
    { exerciseId: 'power-clean', reps: 2, loadKg: 75, rpe: 8 },
    { exerciseId: 'front-squat', reps: 2, loadKg: 80, rpe: 8 },
    { exerciseId: 'front-squat', reps: 2, loadKg: 80, rpe: 8 },
    { exerciseId: 'front-squat', reps: 2, loadKg: 80, rpe: 8 },
    { exerciseId: 'remo', reps: 8, loadKg: 60, rpe: 7 },
    { exerciseId: 'fondos', reps: 10, rpe: 7 },
  ],
});

console.log('== una serie vale mas cuanto mas trabajo lleva ==');
const s = (set) => D.xpForSet(set);
ok('mas repeticiones, mas XP', s({ exerciseId: 'fondos', reps: 10 }) > s({ exerciseId: 'fondos', reps: 5 }));
ok('mas carga, mas XP', s({ exerciseId: 'front-squat', reps: 3, loadKg: 100 }) > s({ exerciseId: 'front-squat', reps: 3, loadKg: 60 }));
ok('mas RPE, mas XP', s({ exerciseId: 'fondos', reps: 10, rpe: 9 }) > s({ exerciseId: 'fondos', reps: 10, rpe: 5 }));
ok('un triple pesado supera a un triple ligero', s({ exerciseId: 'front-squat', reps: 3, loadKg: 120 }) > s({ exerciseId: 'front-squat', reps: 3, loadKg: 40 }));
ok('sin RPE la serie sigue contando', s({ exerciseId: 'fondos', reps: 10 }) > 0);
check('un ejercicio inventado vale cero, no revienta', s({ exerciseId: 'no-existe', reps: 10 }), 0);
check('una serie vacia vale cero', s({ exerciseId: 'fondos' }), 0);

console.log('\n== no se puede subir sin apuntar ==');
check('un registro vacio da 0 XP', D.totalXp([]), 0);
check('y nivel 1', D.rankFor(0).level, 1);
check('los atributos de un registro vacio son cero', D.statsFrom([], '2026-08-14'), { strength: 0, agility: 0, balance: 0, rhythm: 0 });
check('una habilidad sin series apuntadas esta a cero', D.skillProgress([], 'calis_frontlever', 300), 0);

console.log('\n== la constancia se mide en dias, no en entradas ==');
const twoEntriesOneDay = [
  { id: 'a', date: '2026-08-10', sets: [{ exerciseId: 'fondos', reps: 10 }] },
  { id: 'b', date: '2026-08-10', sets: [{ exerciseId: 'dominada', reps: 8 }] },
];
check('dos entradas el mismo dia son una sesion', D.weeks(twoEntriesOneDay)[0].sessions, 1);

console.log('\n== la temporada NO se completa solo apareciendo ==');
// 52 weeks at exactly the target, never missing: the best a man can do without ever setting a mark.
const perfect = [];
let d = '2026-05-25'; // a Monday
for (let w = 0; w < D.SEASON_WEEKS; w++) {
  for (let i = 0; i < D.SESSIONS_PER_WEEK; i++) perfect.push(gymSession(addDays(d, i), `w${w}s${i}`));
  d = addDays(d, 7);
}
const perfectXp = D.totalXp(perfect);
const frac = perfectXp / D.SEASON_XP;
console.log(`        temporada perfecta = ${perfectXp} XP = ${(frac * 100).toFixed(1)}% de la temporada`);
ok('aparecer siempre NO llega al final', frac < 1, `llega al ${(frac * 100).toFixed(1)}%`);
ok('pero llega a unos dos tercios (55-75%)', frac > 0.55 && frac < 0.75, `llega al ${(frac * 100).toFixed(1)}%`);
ok('y eso deja el ultimo tercio a los logros', frac < 0.8);

console.log('\n== calibrado a SUS cuatro sesiones, no a seis ==');
check('el objetivo semanal son 4', D.SESSIONS_PER_WEEK, 4);
// The failure this guards against: the game telling him he is behind while he follows his own plan.
const onPlan = [];
d = '2026-05-25';
for (let w = 0; w < 8; w++) {
  for (let i = 0; i < 4; i++) onPlan.push(gymSession(addDays(d, i), `p${w}${i}`));
  d = addDays(d, 7);
}
ok('cumpliendo su plan, todas las semanas cuentan como completas', D.weeks(onPlan).every((w) => w.complete));
ok('y la racha crece sin interrupcion', D.weeks(onPlan).at(-1).streak === 8);

console.log('\n== fallar rompe la racha y nada mas ==');
const withGap = onPlan.filter((x) => !x.id.startsWith('p3'));
const wg = D.weeks(withGap);
ok('la semana fallada no da bonus', wg.some((w) => !w.complete) || wg.length < 8);
ok('la racha se reinicia', Math.max(...wg.map((w) => w.streak)) < 8);
ok('pero no se pierde XP: el volumen se conserva', D.totalXp(withGap) > 0.7 * D.totalXp(onPlan));
ok('fallar nunca da XP negativa', D.totalXp(withGap) >= 0);

console.log('\n== los atributos BAJAN al dejar de entrenar ==');
const recent = [];
for (let i = 0; i < 12; i++) recent.push(gymSession(addDays('2026-07-01', i * 2), `r${i}`));
const enForma = D.statsFrom(recent, '2026-07-25');
const unMesDespues = D.statsFrom(recent, addDays('2026-07-25', 40));
console.log(`        fuerza entrenando = ${enForma.strength} · 40 dias despues = ${unMesDespues.strength}`);
ok('entrenando, la fuerza sube de cero', enForma.strength > 0);
ok('dejando de entrenar, cae a cero sola', unMesDespues.strength === 0);
ok('a mitad de camino ya ha bajado', D.statsFrom(recent, addDays('2026-07-25', 14)).strength < enForma.strength);
ok('la ventana son 28 dias', D.ATTRIBUTE_WINDOW_DAYS === 28);

console.log('\n== cada ejercicio alimenta su atributo, y solo el suyo ==');
const soloCapoeira = [{ id: 'c', date: '2026-08-14', sets: [{ exerciseId: 'ginga', seconds: 900 }] }];
const st = D.statsFrom(soloCapoeira, '2026-08-14');
ok('la ginga sube el ritmo', st.rhythm > 0);
check('y no toca la fuerza', st.strength, 0);

console.log('\n== el arbol solo se mueve apuntando ese movimiento ==');
const conFrontLever = [{ id: 'f', date: '2026-08-14', sets: [{ exerciseId: 'front-lever', seconds: 20, rpe: 9 }] }];
ok('apuntar front lever mueve su habilidad', D.skillProgress(conFrontLever, 'calis_frontlever', 300) > 0);
check('y no mueve la del planche', D.skillProgress(conFrontLever, 'calis_planche', 500), 0);
ok('el progreso nunca pasa de 1', D.skillProgress(Array.from({ length: 500 }, (_, i) => ({ id: 'x' + i, date: '2026-08-14', sets: [{ exerciseId: 'front-lever', seconds: 60 }] })), 'calis_frontlever', 300) === 1);

console.log('\n== los rangos ==');
check('12 rangos por temporada', D.RANKS_PER_SEASON, 12);
check('cero XP es nivel 1', D.rankFor(0).level, 1);
check('la temporada entera es nivel 12', D.rankFor(D.SEASON_XP).level, 12);
ok('no se pasa del 12 por mucha XP que acumules', D.rankFor(D.SEASON_XP * 5).level === 12);
ok('la fraccion siempre esta entre 0 y 1',
  [0, 100, 5000, D.SEASON_XP, D.SEASON_XP * 3].every((x) => D.rankFor(x).fraction >= 0 && D.rankFor(x).fraction <= 1));
ok('el nivel nunca baja al subir la XP',
  Array.from({ length: 60 }, (_, i) => D.rankFor(i * 800).level).every((l, i, a) => i === 0 || l >= a[i - 1]));

console.log('\n== la vista completa ==');
const v = D.deriveCharacter(onPlan, addDays('2026-05-25', 7 * 7 + 3));
ok('cuenta las sesiones de esta semana', v.sessionsThisWeek === 4, JSON.stringify(v.sessionsThisWeek));
ok('mantiene la racha viva', v.currentStreak > 0);
ok('trae rango y atributos', v.rank.level >= 1 && v.stats.strength > 0);
// A streak from months ago must not still be displayed as current.
const viejo = D.deriveCharacter(onPlan, '2026-12-01');
check('una racha vieja ya no cuenta como actual', viejo.currentStreak, 0);
ok('pero la XP ganada no se borra', viejo.xp === v.xp || viejo.xp > 0);

console.log(fails ? `\n${fails} COMPROBACIONES FALLIDAS` : '\ntodas las comprobaciones pasan');
process.exit(fails ? 1 : 0);
