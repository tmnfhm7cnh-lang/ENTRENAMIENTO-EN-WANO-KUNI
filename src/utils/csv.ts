/**
 * The export, in the format the system already had.
 *
 * frentes/mi-entrenamiento/registro/sesiones.csv exists since before this app and holds sixty rows
 * of real training. The app does not get to invent its own columns: it writes that header,
 * verbatim, so a file exported from the phone can be appended to the one on the PC without a
 * single conversion. Same rule as dryland-test-logger.
 *
 *   fecha,bloque,sesion,ejercicio,series,reps,carga_kg,tiempo_s,rpe,notas
 *
 * One row per set. The old file sometimes collapses identical sets into one row with `series` = 3;
 * writing them out one by one is a superset of that and keeps a per-set RPE, which the collapsed
 * form cannot hold.
 */

import type { SessionEntry } from "../game/derive.ts";

export const CSV_HEADER = "fecha,bloque,sesion,ejercicio,series,reps,carga_kg,tiempo_s,rpe,notas";

const cell = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function sessionsToCsv(sessions: SessionEntry[]): string {
  const lines = [CSV_HEADER];
  for (const s of [...sessions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))) {
    // The note belongs to the session, so it rides on its first row and is not repeated: a note
    // copied onto every set reads, when you open the file, like six different notes.
    let first = true;
    for (const set of s.sets) {
      lines.push(
        [
          cell(s.date),
          cell(s.bloque ?? "libre"),
          cell(s.sesion ?? "libre"),
          cell(set.exerciseId),
          cell(1),
          cell(set.reps),
          cell(set.loadKg),
          cell(set.seconds),
          cell(set.rpe),
          cell(first ? s.notes : ""),
        ].join(","),
      );
      first = false;
    }
    if (!s.sets.length && s.notes) {
      lines.push([cell(s.date), cell(s.bloque ?? "libre"), cell(s.sesion ?? "libre"), "", "", "", "", "", "", cell(s.notes)].join(","));
    }
  }
  return lines.join("\n") + "\n";
}

export function csvFilename(today: string): string {
  return `sesiones-wano-${today}.csv`;
}

/**
 * Hands the CSV to the OS. Share sheet first, because that is the only route on iOS that drops the
 * file straight into OneDrive; a download link lands it in Files and he has to go move it.
 */
export async function exportCsv(sessions: SessionEntry[], today: string): Promise<"share" | "download"> {
  const text = sessionsToCsv(sessions);
  const name = csvFilename(today);
  const file = new File([text], name, { type: "text/csv" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return "share";
    } catch {
      /* dismissed, or refused: fall through so the export is never a dead end */
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return "download";
}
