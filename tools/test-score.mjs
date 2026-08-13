/*
 * Asserts the written score. Run: node tools/test-score.mjs
 *
 * What can actually be checked without ears: that the grid is a grid, that the loop is seamless,
 * that every voice appears, that the drums state a pulse, that nothing lands off the scale, and
 * that the scheduler's windowing emits each event exactly once. Whether it SOUNDS good is Daniel's
 * call and nobody else's — this only proves the thing plays what it says it plays.
 */
// Imported straight from source: score.ts holds only interfaces, type aliases and arithmetic, so
// Node 24 strips the annotations itself and no build step is involved. If this ever fails with an
// "erasable syntax" error, something non-type crept into the file that does not belong there.
const S = await import('../src/audio/score.ts');

let fails = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? 'OK  ' : 'FALLA'}  ${name}`);
  if (!ok) console.log(`        esperado ${JSON.stringify(want)}\n        obtenido ${JSON.stringify(got)}`);
};
const near = (name, got, want, tol = 1e-6) => {
  const ok = Math.abs(got - want) < tol;
  if (!ok) fails++;
  console.log(`${ok ? 'OK  ' : 'FALLA'}  ${name}${ok ? '' : ` — esperado ${want}, obtenido ${got}`}`);
};

console.log('== la escala es Hirajoshi en La ==');
// Intervals in semitones from the root, computed from the frequencies actually used.
const semis = S.SCALE_HZ.slice(0, 5).map((f) => Math.round(12 * Math.log2(f / S.SCALE_HZ[0])));
check('intervalos 2-1-4-1-4', semis, [0, 2, 3, 7, 8]);
check('la octava se repite exacta', Math.round(12 * Math.log2(S.SCALE_HZ[5] / S.SCALE_HZ[0])), 12);

console.log('\n== el bucle y la rejilla ==');
check('16 compases: 4 jo + 8 ha + 4 kyu', S.LOOP_BEATS, 64);
near('dura 53,3 s a 72 bpm', S.LOOP_SEC, 64 * (60 / 72), 1e-9);
check('secciones en orden', S.SECTION_MAP.map((s) => `${s.name}@${s.startBeat}`), ['jo@0', 'ha@16', 'kyu@48']);
check('ningun evento se sale del bucle', S.SCORE.filter((e) => e.beat < 0 || e.beat >= S.LOOP_BEATS).length, 0);
check('todo cae en semicorcheas o mas largo', S.SCORE.filter((e) => Math.abs(e.beat * 4 - Math.round(e.beat * 4)) > 1e-9).length, 0);
check('ordenado por tiempo', S.SCORE.every((e, i, a) => i === 0 || a[i - 1].beat <= e.beat), true);

console.log('\n== hay pulso, que es lo que faltaba ==');
const drumsAt = (v) => S.SCORE.filter((e) => e.voice === v).map((e) => e.beat);
const taiko = drumsAt('taiko');
const tsuzumi = drumsAt('tsuzumi');
check('el taiko suena', taiko.length > 0, true);
check('el tsuzumi suena', tsuzumi.length > 0, true);
check('hay percusion en los 16 compases', new Set([...taiko, ...tsuzumi].map((b) => Math.floor(b / 4))).size, 16);
check('todos los compases empiezan con taiko en jo', [0, 1, 2, 3].every((bar) => taiko.includes(bar * 4)), true);
// The gap between consecutive hits is what a listener feels as tempo.
const hits = [...taiko, ...tsuzumi].sort((a, b) => a - b);
const gaps = hits.slice(1).map((b, i) => +(b - hits[i]).toFixed(3));
check('ningun hueco de percusion pasa de 2 tiempos', Math.max(...gaps) <= 2, true);
check('kyu es mas denso que jo',
  hits.filter((b) => b >= 48).length / 4 > hits.filter((b) => b < 16).length / 4, true);

console.log('\n== las cinco voces, y ninguna nota fuera de la escala ==');
check('voces presentes', [...new Set(S.SCORE.map((e) => e.voice))].sort(), ['flute', 'koto', 'shamisen', 'taiko', 'tsuzumi']);
const pitched = S.SCORE.filter((e) => e.voice !== 'taiko' && e.voice !== 'tsuzumi');
check('toda nota tiene grado valido', pitched.every((e) => Number.isInteger(e.degree) && e.degree >= 0 && e.degree < S.SCALE_HZ.length), true);
check('los tambores no llevan nota', S.SCORE.filter((e) => (e.voice === 'taiko' || e.voice === 'tsuzumi') && e.degree !== undefined).length, 0);
check('toda nota tiene duracion positiva', pitched.every((e) => e.dur > 0), true);
check('las ganancias estan en 0..1', S.SCORE.every((e) => e.gain === undefined || (e.gain > 0 && e.gain <= 1)), true);

console.log('\n== el ostinato del shamisen repite de verdad ==');
const sham = S.SCORE.filter((e) => e.voice === 'shamisen' && e.beat >= 16 && e.beat < 48);
const barPattern = (bar) => sham.filter((e) => e.beat >= bar * 4 && e.beat < (bar + 1) * 4).map((e) => [+(e.beat % 4).toFixed(2), e.degree]);
const first = barPattern(4);
check('el patron no esta vacio', first.length > 0, true);
check('los 8 compases de ha llevan el mismo patron',
  [4, 5, 6, 7, 8, 9, 10, 11].every((bar) => JSON.stringify(barPattern(bar)) === JSON.stringify(first)), true);

console.log('\n== la melodia responde una octava aparte ==');
const koto = (from, to) => S.SCORE.filter((e) => e.voice === 'koto' && e.beat >= from && e.beat < to);
const firstHalf = koto(16, 32).map((e) => e.degree);
const secondHalf = koto(32, 48).map((e) => e.degree);
check('las dos mitades tienen las mismas notas', firstHalf.length, secondHalf.length);
check('la segunda va mas arriba', secondHalf.reduce((a, b) => a + b, 0) > firstHalf.reduce((a, b) => a + b, 0), true);

console.log('\n== el kyu cierra en silencio, para que el bucle aterrice ==');
const lastBar = S.SCORE.filter((e) => e.beat >= 60);
check('el ultimo compas casi no tiene ataques', lastBar.length <= 3, true);

console.log('\n== la ventana del planificador emite cada nota una sola vez ==');
// Walk two whole loops in ragged 0.7-beat steps, the way a slipping timer would.
const seen = [];
let cursor = 0;
while (cursor < S.LOOP_BEATS * 2) {
  const next = Math.min(cursor + 0.7, S.LOOP_BEATS * 2);
  for (const e of S.eventsInWindow(cursor, next)) seen.push(e.absBeat.toFixed(4) + ':' + e.voice + ':' + e.degree);
  cursor = next;
}
check('dos bucles = dos veces la partitura', seen.length, S.SCORE.length * 2);
check('sin duplicados', new Set(seen).size, seen.length);
check('sin huecos entre bucles', S.eventsInWindow(S.LOOP_BEATS - 0.5, S.LOOP_BEATS + 0.5).length > 0, true);
check('la nota del bucle 2 va 64 tiempos despues',
  S.eventsInWindow(S.LOOP_BEATS, S.LOOP_BEATS + 0.001)[0]?.absBeat, S.LOOP_BEATS);
check('una ventana vacia no devuelve nada', S.eventsInWindow(10.01, 10.02).length, 0);

console.log(fails ? `\n${fails} COMPROBACIONES FALLIDAS` : '\ntodas las comprobaciones pasan');
process.exit(fails ? 1 : 0);
