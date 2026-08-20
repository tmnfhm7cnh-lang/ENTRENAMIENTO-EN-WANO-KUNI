/**
 * The plan, the defaults it produces, and the CSV it exports.
 *
 * Runs against the real nineteen weeks when you pass the folder, because a parser that only ever
 * sees its own fixture is a parser that has not been tested:
 *
 *   node tools/test-plan.mjs "C:/.../programacion/semanas" "C:/.../registro/sesiones.csv"
 */

import { parseCsv, norm, ALIASES } from "./build-plan.mjs";
import { defaultsFor, prescribedSets, todayISO, dowOf, weekFor, dayFor } from "../src/data/plan.ts";
import { EXERCISE_BY_ID } from "../src/data/exercises.ts";
import { sessionsToCsv, CSV_HEADER } from "../src/utils/csv.ts";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

let failed = 0;
const ok = (label, cond) => {
  console.log(`${cond ? "OK  " : "FALLA"}  ${label}`);
  if (!cond) failed++;
};
const section = (t) => console.log(`\n== ${t} ==`);

/* ------------------------------------------------------------------ the CSV */

section("el lector de csv aguanta lo que traen sus archivos");
{
  const rows = parseCsv('a;b;c\n"con;punto y coma";x;y\n"dos\nlineas";z;w\n');
  ok("separa por punto y coma", rows[0].join("|") === "a|b|c");
  ok("una celda entrecomillada se queda entera", rows[1][0] === "con;punto y coma");
  ok("un salto de linea dentro de comillas no parte la fila", rows[2][0] === "dos\nlineas");
  ok("y la fila siguiente sigue teniendo tres columnas", rows[2].length === 3);
}

/* --------------------------------------------------------------- the dates */

section("las fechas son las suyas, no las de UTC");
{
  // 23:30 in Madrid on the 19th is already the 20th in UTC. The log has to say the 19th.
  const tarde = new Date(2026, 7, 19, 23, 30, 0);
  ok("una serie apuntada a las 23:30 es del mismo dia", todayISO(tarde) === "2026-08-19");
  ok("el lunes es 0, como las columnas del cuaderno", dowOf("2026-08-17") === 0);
  ok("y el domingo es 6", dowOf("2026-08-23") === 6);
}

/* ------------------------------------------------------- what one tap logs */

section("lo prescrito rellena la serie antes de tocarla");
{
  const item = (over) => ({ kind: "ejercicio", category: "", name: "", note: "", sets: "3", reps: "3", target: "", ...over });

  const clean = defaultsFor(item({ exerciseId: "power-clean", reps: "3", target: "70–75 kg" }));
  ok("una carga con rango coge el extremo bajo", clean.reps === 3 && clean.loadKg === 70);

  const dom = defaultsFor(item({ exerciseId: "dominada", reps: "4–5", target: "BW" }));
  ok("unas reps con rango, tambien", dom.reps === 4);

  const zona = defaultsFor(item({ exerciseId: "zona-2", reps: "30 min", target: "Conversacional" }));
  ok("los minutos se guardan en segundos", zona.seconds === 1800);

  const tramp = defaultsFor(item({ exerciseId: "trampolines", reps: "1 h", target: "Aprendizaje" }));
  ok("y una hora tambien", tramp.seconds === 3600);

  const hold = defaultsFor(item({ exerciseId: "pallof-press", reps: "20 s por lado", target: "RPE 8" }));
  ok("un hold en segundos se lee tal cual", hold.seconds === 20);

  // The bug this file exists for: "50 % del volumen" is how hard, not how long.
  const lever = defaultsFor(item({ exerciseId: "front-lever", reps: "hold", target: "50 % del volumen" }));
  ok("un porcentaje NO es un numero de segundos", lever.seconds === 20);
  const fuerzaC = defaultsFor(item({ exerciseId: "front-squat", reps: "5", target: "70 % de la A" }));
  ok("ni una carga en kilos", fuerzaC.loadKg === 0);

  ok("las series prescritas se leen del rango", prescribedSets(item({ exerciseId: "remo", sets: "2–3" })) === 2);
}

/* ------------------------------------------------------------- the export */

section("el .csv que sale es el que el sistema ya tenia");
{
  const sessions = [
    {
      id: "b",
      date: "2026-08-19",
      bloque: "albufeira",
      sesion: "fuerza-b",
      notes: "el aductor mejor",
      sets: [
        { exerciseId: "power-clean", reps: 2, loadKg: 70 },
        { exerciseId: "power-clean", reps: 2, loadKg: 70, rpe: 8 },
      ],
    },
    { id: "a", date: "2026-08-18", bloque: "albufeira", sesion: "zona-2", sets: [{ exerciseId: "caminata", seconds: 2700 }] },
  ];
  const csv = sessionsToCsv(sessions).trim().split("\n");
  ok("la cabecera es la heredada", csv[0] === CSV_HEADER);
  ok("diez columnas", CSV_HEADER.split(",").length === 10);
  ok("ordena por fecha", csv[1].startsWith("2026-08-18"));
  ok("una fila por serie", csv.length === 4);
  ok("la fila lleva bloque y sesion", csv[2].startsWith("2026-08-19,albufeira,fuerza-b,power-clean,1,2,70"));
  ok("el RPE viaja con SU serie", csv[3].split(",")[8] === "8" && csv[2].split(",")[8] === "");
  ok("la nota va una sola vez", csv.filter((l) => l.includes("el aductor mejor")).length === 1);
  ok("una nota con coma no rompe el archivo", sessionsToCsv([{ id: "x", date: "2026-08-19", sets: [], notes: "uno, dos" }]).includes('"uno, dos"'));
}

/* ------------------------------------------------- against the real nineteen */

const dir = process.argv[2];
const sesionesCsv = process.argv[3];

// Both arguments, not one: the hint used to name only the folder, and running it that way passes
// `undefined` down to the generator, which dies reading a history file called "undefined".
if (!dir || !sesionesCsv) {
  console.log("\n....  sin comprobar contra las 19 semanas. Uso:");
  console.log("      node tools/test-plan.mjs <carpeta-semanas> <sesiones.csv>");
} else {
  section("las diecinueve semanas de verdad");
  const files = readdirSync(dir).filter((f) => f.endsWith(".csv")).sort();
  ok("hay diecinueve archivos", files.length === 19);

  // Rebuild through the same path the app uses, without re-implementing the parser here.
  const { execFileSync } = await import("node:child_process");
  const tmp = join(process.env.TEMP ?? ".", "wano-test-plan.json");
  execFileSync(process.execPath, ["tools/build-plan.mjs", dir, sesionesCsv, tmp], { stdio: "pipe" });
  const data = JSON.parse(readFileSync(tmp, "utf8"));

  ok("cada semana trae su lunes", data.weeks.every((w) => /^\d{4}-\d{2}-\d{2}$/.test(w.monday)));
  ok("y las semanas van en orden", data.weeks.every((w, i) => i === 0 || data.weeks[i - 1].monday < w.monday));
  ok("todas tienen bloque diario", data.weeks.every((w) => w.daily.length > 0));

  const days = data.weeks.flatMap((w) => w.days);
  ok("todos los dias caen dentro de su semana", days.every((d) => !d.date || (d.date >= data.weeks.find((w) => w.days.includes(d)).monday && d.date <= data.weeks.find((w) => w.days.includes(d)).sunday)));
  ok("ningun dia se queda sin identificador de sesion", days.every((d) => d.sessionId.length > 0));

  const items = [
    ...data.weeks.flatMap((w) => w.daily),
    ...days.flatMap((d) => d.items),
    ...data.weeks.flatMap((w) => w.extras.flatMap((e) => e.items)),
  ];
  const ejercicios = items.filter((i) => i.kind === "ejercicio");
  const huerfanos = [...new Set(ejercicios.filter((e) => !EXERCISE_BY_ID[e.exerciseId]).map((e) => e.exerciseId))];
  ok(`ningun ejercicio del plan cae fuera del catalogo${huerfanos.length ? ": " + huerfanos.join(", ") : ""}`, huerfanos.length === 0);
  ok("y hay bastantes filas de ejercicio", ejercicios.length > 500);

  // Every alias must be earning its keep: one that matches nothing is a name that changed.
  const usados = new Set(ejercicios.map((e) => norm(e.name)));
  const muertos = Object.keys(ALIASES).filter((k) => !usados.has(k));
  ok(`ningun alias apunta a un nombre que ya no existe${muertos.length ? ": " + muertos.join(", ") : ""}`, muertos.length === 0);

  section("la semana en curso se encuentra sola");
  const w2 = weekFor(data, "2026-08-19");
  ok("el 19 de agosto cae en la semana 2", w2?.n === 2);
  const miercoles = dayFor(w2, "2026-08-19");
  ok("y el miercoles es Fuerza B", /FUERZA B/i.test(miercoles?.name ?? ""));
  ok("con sus ejercicios dentro", miercoles.items.filter((i) => i.kind === "ejercicio").length >= 5);
  ok("el sabado 22 es el simulacro", /SIMULACRO/i.test(dayFor(w2, "2026-08-22")?.name ?? ""));

  section("las sesiones ya registradas entran enteras");
  const sets = data.history.flatMap((h) => h.sets);
  ok("hay historico", data.history.length > 15);
  ok("toda serie apunta a un ejercicio del catalogo", sets.every((s) => EXERCISE_BY_ID[s.exerciseId]));
  ok("toda sesion lleva fecha, bloque y sesion", data.history.every((h) => h.date && h.bloque && h.sesion));
  ok("los ids no se repiten", new Set(data.history.map((h) => h.id)).size === data.history.length);
}

console.log(failed === 0 ? "\ntodas las comprobaciones pasan" : `\n${failed} comprobaciones fallan`);
process.exit(failed === 0 ? 0 : 1);
