/**
 * The plan, turned into data.
 *
 * Daniel's training block lives in frentes/mi-entrenamiento/programacion/semanas/*.csv — nineteen
 * files, one per week, written for a human and rendered into the .xlsx he fills in on the iPad.
 * This turns them into the JSON the app reads, so the phone can open on "what am I doing today"
 * instead of asking him to remember it.
 *
 * The .csv stays the source. This never writes to it.
 *
 * The output does NOT live in this repository. The repo is public — GitHub Pages needs it to be —
 * and his plan carries injuries, schedules and coaching notes. The file is written into his own
 * system folder, syncs to OneDrive, and he imports it into the app once.
 *
 * Usage:
 *   node tools/build-plan.mjs <carpeta-semanas> <sesiones.csv> <salida.json>
 *   node tools/build-plan.mjs --names <carpeta-semanas>
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/* ------------------------------------------------------------------- the CSV */

/**
 * A real CSV reader, because these files need one: cells are quoted, quoted cells contain the
 * semicolon separator, and — the one that breaks naive splitting — several contain a literal
 * newline inside the quotes, where the workbook wraps a category name over two lines.
 */
export function parseCsv(text, sep = ";") {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const push = () => {
    row.push(cell);
    cell = "";
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) push();
    else if (c === "\n") {
      push();
      rows.push(row);
      row = [];
    } else if (c !== "\r") cell += c;
  }
  push();
  rows.push(row);
  return rows;
}

const clean = (s) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();

/** Accent-free, punctuation-free key. Used only to look a name up, never written anywhere. */
export function norm(text) {
  return clean(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Written into the `sesion` column of sesiones.csv, so it stays short and stable. */
export function slug(text) {
  return norm(text).slice(0, 40).replace(/-+$/, "");
}

/* -------------------------------------------------- the plan's exercise names
 *
 * The plan is prose written for a coach: the same movement is "Plancha", "Plancha — lean en
 * paralelas" and "Plancha + front lever combinados" depending on the week. The catalogue is what
 * the CSV and the game speak. This table is the join, and it is written by hand on purpose —
 * fuzzy-matching a training log is how you end up with two exercises that are the same movement.
 *
 * A name that is not here is not an exercise: it is a warning, a reminder or a question, and it
 * reaches the screen as an `aviso` — visible, not loggable.
 */
export const ALIASES = {
  // gimnasio
  "power-clean": "power-clean",
  "front-squat": "front-squat",
  remo: "remo",
  "sentadilla-a-una-pierna-con-carga": "sentadilla-una-pierna",
  "extension-lumbar-o-reverse-hyper": "extension-lumbar",
  "extension-lumbar-isometrica-tumbado-tronco-en-horizontal": "extension-lumbar-iso",
  "copenhagen-rodilla-apoyada": "copenhagen",
  "pallof-press": "pallof-press",
  "pallof-press-o-antirrotacion-isometrica": "pallof-press",
  "plancha-lateral-con-elevacion-de-cadera": "plancha-lateral",
  "bird-dog-lento": "bird-dog",
  "bird-dog-dead-bug": "bird-dog",
  "lu-raises": "lu-raises",
  // saltos
  "salto-vertical-en-contraste": "salto-vertical",
  saltos: "salto-vertical",
  "contraste-al-terminar-la-sentadilla": "salto-vertical",
  "contraste-si-quedan-piernas": "salto-vertical",
  // calistenia
  fondos: "fondos",
  "fondos-y-flexiones-en-pino": "hspu",
  "hspu-o-straddle-down": "hspu",
  "dominadas-o-muscle-ups": "dominada",
  "dominadas-lastradas-y-muscle-ups": "dominada-lastrada",
  "front-lever": "front-lever",
  "front-lever-tucked-avanzado": "front-lever",
  "plancha-front-lever-combinados": "front-lever",
  plancha: "planche",
  "plancha-lean-en-paralelas": "planche",
  "compresion-activa": "compresion-activa",
  "compresion-activa-l-sit-o-straddle-lift": "compresion-activa",
  deadhang: "deadhang",
  "skin-the-cat": "skin-the-cat",
  "bloque-de-elevacion-escapular": "elevacion-escapular",
  "codo-y-escapula": "preparacion-codo",
  "codo-en-brazo-recto": "preparacion-codo",
  // pino
  "hs-en-pared-full-y-tucked": "pino-pared",
  "oahs-shifts-de-peso-y-asistido": "pino-una-mano",
  "olimpico-intentos-o-negativas": "press-pino",
  "pino-libre-cronometrado": "pino",
  "pino-largo": "pino",
  // capoeira
  "pateos-y-esquivas": "pateos",
  "pateos-a-amplitud-maxima": "pateos",
  "pateos-a-amplitud-media-alta": "pateos",
  "tesoura-y-vingativa-con-companero": "queda",
  "defender-la-queda": "queda",
  "tramo-de-queda-con-companero": "queda",
  "3-jogos-de-45-s-con-60-s-de-pausa-exactos": "jogo",
  "3-45-s-60-s-con-el-guion": "jogo",
  "guion-completo-de-45-s": "jogo",
  "guion-completo-de-45-s-a-intensidad-maxima": "jogo",
  "guion-completo-de-45-s-en-fresco": "jogo",
  // aerobico
  "zona-2": "zona-2",
  "zona-2-al-terminar": "zona-2",
  "zona-2-larga": "zona-2",
  "zona-2-suave": "zona-2",
  "zona-1-2-caminando": "caminata",
  "60-s-fuerte-60-s-suave": "intervalos",
  "parque-de-trampolines": "trampolines",
  // movilidad
  "munecas-flexion-extension-y-rotaciones": "movilidad-munecas",
  "dislocaciones-con-pica": "dislocaciones",
  "sentadilla-profunda": "sentadilla-profunda",
  "lunge-con-rotacion": "lunge-rotacion",
  "elephant-walk": "elephant-walk",
  cobra: "cobra",
  ponte: "ponte",
  "ponte-progresion": "ponte",
  "cat-camel": "cat-camel",
  "pigeon-activo": "pigeon",
  "frog-activo": "frog",
  "pancake-con-pelvic-tilt-activo": "pancake",
  "abertura-lateral-spagat": "spagat",
  "espalda-hombros-y-munecas": "movilidad-hombro",
  "espalda-y-hombro": "movilidad-hombro",
  "espalda-hombros-munecas-y-cadera": "movilidad-hombro",
  "cadera-en-flexion-y-tobillo": "movilidad-cadera",
};

/* --------------------------------------------------------------- the grammar */

const WEEKDAYS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];

function readDayHeader(raw) {
  const text = clean(raw.replace(/^▶/, ""));
  const parts = text.split("·").map(clean).filter(Boolean);
  if (!parts.length) return null;
  const first = parts[0].toUpperCase();
  const dow = WEEKDAYS.findIndex((d) => first.startsWith(d));
  if (dow === -1) return null;
  return {
    dow,
    name: parts[1] ?? WEEKDAYS[dow],
    place: parts[2] ?? "",
    extra: parts.slice(3).join(" · "),
  };
}

const isDaily = (raw) => /BLOQUE\s+DIARIO/i.test(raw);
const isClosing = (raw) => /CIERRE\s+DE\s+LA\s+SEMANA/i.test(raw);
const isBlockHeader = (raw) => clean(raw).startsWith("▶");
const isColumnHeader = (row) => /^(CATEGOR[ÍI]A|PREGUNTA)$/i.test(clean(row[0]));

function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function parseWeek(file, text) {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  const monday = file.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  const n = Number(file.match(/^s(\d+)/)?.[1] ?? 0);
  const title = clean(rows[0]?.[0] ?? "");
  const headline = clean(rows.slice(1, 4).map((r) => clean(r[1])).find(Boolean) ?? "");
  const phase = title.split("·").map(clean).slice(2).join(" · ");

  const week = {
    n,
    monday,
    sunday: monday ? addDays(monday, 6) : null,
    title,
    phase,
    headline,
    daily: [],
    days: [],
    extras: [],
    closing: [],
  };
  let target = null;
  let category = "";

  for (const row of rows) {
    const a = clean(row[0]);
    if (isBlockHeader(a)) {
      category = "";
      const label = clean(a.replace(/^▶/, ""));
      if (isDaily(a)) target = week.daily;
      else if (isClosing(a)) target = week.closing;
      else {
        const head = readDayHeader(a);
        if (head) {
          const day = {
            dow: head.dow,
            date: monday ? addDays(monday, head.dow) : null,
            name: head.name,
            sessionId: slug(head.name),
            place: head.place,
            banner: head.extra,
            items: [],
          };
          week.days.push(day);
          target = day.items;
        } else {
          // "SEMANA DE COMPETICION", "LUNES A DOMINGO - LA QUEDA CON GAFANHOTO", "RE-TEST
          // COMPLETO": blocks that belong to the week rather than to one weekday. Dropping them
          // would silently lose the most important week of the whole block.
          const extra = { title: label, sessionId: slug(label), items: [] };
          week.extras.push(extra);
          target = extra.items;
        }
      }
      continue;
    }
    if (!target || isColumnHeader(row)) continue;

    if (a) category = a.replace(/\s*\n\s*/g, " ");
    const name = clean(row[1]);
    const note = clean(row[2]);

    if (target === week.closing) {
      if (a) target.push({ question: a });
      continue;
    }
    if (!name && !note) continue;

    const exerciseId = ALIASES[norm(name)] ?? null;
    if (!exerciseId) {
      target.push({ kind: "aviso", category, text: [name, note].filter(Boolean).join(" — ") });
      continue;
    }
    target.push({
      kind: "ejercicio",
      exerciseId,
      category,
      name,
      note,
      sets: clean(row[3]),
      reps: clean(row[4]),
      target: clean(row[5]),
    });
  }
  return week;
}

/* ----------------------------------------------------- the eight weeks logged */

/**
 * sesiones.csv, turned into the same SessionEntry the app writes. Seeding with this is the
 * difference between a character that says he has trained nothing and one that starts where he
 * actually is: sixty rows since 2026-06-29.
 */
function readHistory(file) {
  const rows = parseCsv(readFileSync(file, "utf8").replace(/^﻿/, ""), ",");
  const head = rows[0].map(clean);
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  const bySession = new Map();
  const num = (v) => {
    const s = clean(v);
    if (s === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };
  for (const row of rows.slice(1)) {
    const date = clean(row[idx.fecha]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const bloque = clean(row[idx.bloque]) || "libre";
    const sesion = clean(row[idx.sesion]) || "libre";
    const key = `${date}|${bloque}|${sesion}`;
    if (!bySession.has(key)) {
      bySession.set(key, { id: `csv-${key}`, date, bloque, sesion, sets: [], notes: "" });
    }
    const entry = bySession.get(key);
    // `series` in the CSV counts identical sets; the app stores them one by one, which is what
    // later lets a single set carry its own RPE.
    const series = Math.max(1, num(row[idx.series]) ?? 1);
    for (let i = 0; i < series; i++) {
      entry.sets.push({
        exerciseId: clean(row[idx.ejercicio]),
        reps: num(row[idx.reps]),
        loadKg: num(row[idx.carga_kg]),
        seconds: num(row[idx.tiempo_s]),
        rpe: num(row[idx.rpe]),
      });
    }
    const note = clean(row[idx.notas]);
    if (note) entry.notes = [entry.notes, note].filter(Boolean).join(" · ");
  }
  return [...bySession.values()];
}

/* -------------------------------------------------------------------- driver */

// Only when run directly. tools/test-plan.mjs imports the parser and the alias table from this
// file, and a module that writes a file the moment it is imported is a module you cannot test.
function main(args) {
  if (args[0] === "--names") {
    const dir = args[1];
    const names = new Map();
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".csv")).sort()) {
      const w = parseWeek(f, readFileSync(join(dir, f), "utf8"));
      const all = [...w.daily, ...w.days.flatMap((d) => d.items), ...w.extras.flatMap((e) => e.items)];
      for (const it of all) {
        const key =
          it.kind === "ejercicio" ? `${it.name}  ->  ${it.exerciseId}` : `(aviso) ${it.text.slice(0, 70)}`;
        names.set(key, (names.get(key) ?? 0) + 1);
      }
    }
    for (const [k, c] of [...names].sort((a, b) => b[1] - a[1])) console.log(String(c).padStart(3), k);
    return 0;
  }

  const [dir, sesiones, out] = args;
  if (!dir || !sesiones || !out) {
    console.error("uso: node tools/build-plan.mjs <carpeta-semanas> <sesiones.csv> <salida.json>");
    return 1;
  }

  const weeks = readdirSync(dir)
    .filter((f) => f.endsWith(".csv"))
    .sort()
    .map((f) => parseWeek(f, readFileSync(join(dir, f), "utf8")));

  const history = readHistory(sesiones);

  const data = {
    kind: "wano-kuni:datos",
    version: 1,
    generatedAt: new Date().toISOString(),
    source: "frentes/mi-entrenamiento/programacion/semanas + registro/sesiones.csv",
    block: "albufeira",
    weeks,
    history,
  };

  writeFileSync(out, JSON.stringify(data));

  const items = weeks.flatMap((w) => [
    ...w.daily,
    ...w.days.flatMap((d) => d.items),
    ...w.extras.flatMap((e) => e.items),
  ]);
  const ejercicios = items.filter((i) => i.kind === "ejercicio");
  console.log(`${weeks.length} semanas - ${weeks.reduce((n, w) => n + w.days.length, 0)} dias`);
  console.log(`${ejercicios.length} filas de ejercicio - ${items.length - ejercicios.length} avisos`);
  console.log(`${new Set(ejercicios.map((e) => e.exerciseId)).size} ejercicios distintos del catalogo`);
  console.log(
    `${history.length} sesiones historicas - ${history.reduce((n, h) => n + h.sets.length, 0)} series`,
  );
  console.log(`escrito en ${out}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
