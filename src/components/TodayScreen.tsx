/**
 * Hoy.
 *
 * The screen the app exists for. Everything else — the tree, the quests, the lore — is what the
 * training turns into; this is where the training gets written down.
 *
 * Three rules it is built around, all of them from how he actually trains:
 *
 * 1. **His plan is prescribed.** The block runs nineteen weeks and every day already says what to
 *    do, with sets, reps and a target load. Asking him to pick an exercise from a list, in a gym,
 *    when the plan already knows, is asking him to do the app's work.
 * 2. **One tap is one set.** The prescription fills the numbers in advance, so logging a set is
 *    pressing the plus. Adjusting first is possible, not required. A logged set can be undone by
 *    tapping it, because the fastest button is the one you can press wrong.
 * 3. **The daily block is seven days a week.** It is not a session, it is a habit, and it gets one
 *    button of its own — plus its own timed handstand, which is a real measurement he tracks.
 */

import { useMemo, useState } from "react";
import { Plus, ChevronDown, ChevronRight, AlertTriangle, Check, Undo2, Upload, Search } from "lucide-react";
import {
  dayFor,
  defaultsFor,
  prescribedSets,
  todayISO,
  weekFor,
  type PlanData,
  type PlanExercise,
  type PlanItem,
} from "../data/plan";
import { EXERCISE_BY_ID, EXERCISES, DISCIPLINES, type Exercise } from "../data/exercises";
import { xpForSet, type LoggedSet, type SessionEntry } from "../game/derive";

interface Props {
  plan: PlanData | null;
  sessions: SessionEntry[];
  onSessions: (next: SessionEntry[]) => void;
  onImport: () => void;
  today?: string;
}

const BLOQUE_DIARIO_SEGUNDOS = 25 * 60;

export default function TodayScreen({ plan, sessions, onSessions, onImport, today = todayISO() }: Props) {
  const week = useMemo(() => weekFor(plan, today), [plan, today]);
  const day = useMemo(() => dayFor(week, today), [week, today]);
  const block = plan?.block ?? "libre";

  const [openDaily, setOpenDaily] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);

  const todaysEntries = sessions.filter((s) => s.date === today);
  const todaysSets = todaysEntries.flatMap((s) => s.sets);
  const xpToday = Math.round(todaysSets.reduce((n, s) => n + xpForSet(s), 0));

  function entryId(sessionId: string) {
    return `${today}|${block}|${sessionId}`;
  }

  function addSet(sessionId: string, set: LoggedSet) {
    const id = entryId(sessionId);
    const existing = sessions.find((s) => s.id === id);
    if (existing) {
      onSessions(sessions.map((s) => (s.id === id ? { ...s, sets: [...s.sets, set] } : s)));
      return;
    }
    onSessions([
      ...sessions,
      { id, date: today, bloque: block, sesion: sessionId, sets: [set], notes: "" },
    ]);
  }

  function removeLast(sessionId: string, exerciseId: string) {
    const id = entryId(sessionId);
    const entry = sessions.find((s) => s.id === id);
    if (!entry) return;
    const last = entry.sets.map((s) => s.exerciseId).lastIndexOf(exerciseId);
    if (last === -1) return;
    const sets = entry.sets.filter((_, i) => i !== last);
    onSessions(
      sessions
        .map((s) => (s.id === id ? { ...s, sets } : s))
        .filter((s) => s.sets.length > 0 || (s.notes ?? "").length > 0),
    );
  }

  function setNote(sessionId: string, notes: string) {
    const id = entryId(sessionId);
    const existing = sessions.find((s) => s.id === id);
    if (existing) {
      onSessions(sessions.map((s) => (s.id === id ? { ...s, notes } : s)));
      return;
    }
    onSessions([...sessions, { id, date: today, bloque: block, sesion: sessionId, sets: [], notes }]);
  }

  const setsOf = (sessionId: string, exerciseId: string) =>
    sessions.find((s) => s.id === entryId(sessionId))?.sets.filter((s) => s.exerciseId === exerciseId) ?? [];

  const dailyDone = setsOf("bloque-diario", "bloque-diario").length > 0;
  const dailySessionId = "bloque-diario";
  const sessionId = day?.sessionId ?? "libre";

  return (
    <div className="flex flex-col gap-4" id="today-screen">
      {/* ---------------------------------------------------------- the day */}
      <div className="wood-panel border border-wano-gold/20 rounded-xl p-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="font-japanese text-xl text-wano-parchment uppercase tracking-wider">
            {longDate(today)}
          </h2>
          {week && (
            <span className="font-mono text-[10px] text-wano-gold bg-wano-crimson/20 border border-wano-gold/25 rounded px-2 py-0.5">
              SEMANA {week.n} · {week.phase || "—"}
            </span>
          )}
        </div>
        {week?.headline && <p className="text-xs text-[#d8c9b4] mt-2 leading-relaxed">{week.headline}</p>}
        {day && (
          <p className="font-japanese text-sm text-wano-gold mt-2 uppercase">
            {day.name}
            {day.place && <span className="text-[#a99b86] normal-case font-sans text-xs"> · {day.place}</span>}
          </p>
        )}
        {day?.banner && <p className="text-[11px] text-wano-crimson-light mt-1">{day.banner}</p>}

        <div className="flex gap-4 mt-3 pt-3 border-t border-wano-gold/10 font-mono text-[11px] text-[#bdae97]">
          <span>
            <b className="text-wano-gold">{todaysSets.length}</b> series hoy
          </span>
          <span>
            <b className="text-wano-gold">+{xpToday}</b> XP
          </span>
        </div>
      </div>

      {!plan && (
        <button
          onClick={onImport}
          className="w-full border border-dashed border-wano-gold/40 rounded-xl p-4 text-left hover:bg-wano-crimson/10 transition-colors cursor-pointer"
        >
          <span className="font-japanese text-sm text-wano-gold uppercase flex items-center gap-2">
            <Upload className="w-4 h-4" /> Cargar tu programación
          </span>
          <span className="block text-xs text-[#bdae97] mt-1 leading-relaxed">
            Sin ella puedes apuntar igual, eligiendo el ejercicio a mano. Con ella, la pantalla abre
            en la sesión de hoy con las series, las reps y la carga ya puestas. El archivo es{" "}
            <b className="text-wano-parchment">wano-datos.json</b>, en la carpeta de programación.
          </span>
        </button>
      )}

      {/* ------------------------------------------------------ daily block */}
      {week && (
        <div className="wood-panel border border-wano-gold/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4">
            <button
              onClick={() => setOpenDaily((v) => !v)}
              className="flex items-center gap-2 text-left cursor-pointer"
            >
              {openDaily ? <ChevronDown className="w-4 h-4 text-wano-gold" /> : <ChevronRight className="w-4 h-4 text-wano-gold" />}
              <span className="font-japanese text-sm uppercase tracking-wide text-wano-parchment">
                Bloque diario
              </span>
              <span className="font-mono text-[10px] text-[#a99b86]">los siete días</span>
            </button>
            <button
              onClick={() =>
                dailyDone
                  ? removeLast(dailySessionId, "bloque-diario")
                  : addSet(dailySessionId, { exerciseId: "bloque-diario", seconds: BLOQUE_DIARIO_SEGUNDOS })
              }
              className={`shrink-0 font-japanese text-[11px] uppercase tracking-wider px-3 py-2 rounded border transition-colors cursor-pointer ${
                dailyDone
                  ? "bg-wano-lime/20 border-wano-lime/50 text-wano-lime"
                  : "bg-wano-crimson/25 border-wano-gold/30 text-wano-parchment hover:bg-wano-crimson/40"
              }`}
            >
              {dailyDone ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Hecho
                </span>
              ) : (
                "Marcar hecho"
              )}
            </button>
          </div>

          {openDaily && (
            <div className="border-t border-wano-gold/10 p-3 flex flex-col gap-2 bg-black/25">
              {week.daily.map((item, i) => (
                <PlanRow
                  key={i}
                  item={item}
                  sessionId={dailySessionId}
                  sets={item.kind === "ejercicio" ? setsOf(dailySessionId, item.exerciseId) : []}
                  onAdd={addSet}
                  onUndo={removeLast}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------- today's work */}
      {day && day.items.length > 0 && (
        <div className="wood-panel border border-wano-gold/20 rounded-xl p-3 flex flex-col gap-2">
          <h3 className="font-japanese text-sm uppercase tracking-wide text-wano-gold px-1">
            La sesión de hoy
          </h3>
          {day.items.map((item, i) => (
            <PlanRow
              key={i}
              item={item}
              sessionId={sessionId}
              sets={item.kind === "ejercicio" ? setsOf(sessionId, item.exerciseId) : []}
              onAdd={addSet}
              onUndo={removeLast}
            />
          ))}
        </div>
      )}

      {week?.extras.map((extra) => (
        <div key={extra.sessionId} className="wood-panel border border-wano-purple/25 rounded-xl p-3 flex flex-col gap-2">
          <h3 className="font-japanese text-sm uppercase tracking-wide text-wano-purple px-1">{extra.title}</h3>
          {extra.items.map((item, i) => (
            <PlanRow
              key={i}
              item={item}
              sessionId={extra.sessionId}
              sets={item.kind === "ejercicio" ? setsOf(extra.sessionId, item.exerciseId) : []}
              onAdd={addSet}
              onUndo={removeLast}
            />
          ))}
        </div>
      ))}

      {/* ------------------------------------------------------- free entry */}
      <div className="wood-panel border border-wano-gold/15 rounded-xl p-3">
        <button
          onClick={() => setOpenPicker((v) => !v)}
          className="w-full font-japanese text-[11px] uppercase tracking-wider text-wano-gold flex items-center justify-center gap-2 py-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Apuntar otra cosa
        </button>
        {openPicker && <Picker onPick={(ex) => addSet(sessionId, starterSet(ex))} />}
      </div>

      {/* ------------------------------------------------------------ notes */}
      <div className="wood-panel border border-wano-gold/15 rounded-xl p-3">
        <label className="font-japanese text-[11px] uppercase tracking-wider text-wano-gold">
          Nota del día
        </label>
        <textarea
          value={sessions.find((s) => s.id === entryId(sessionId))?.notes ?? ""}
          onChange={(e) => setNote(sessionId, e.target.value)}
          rows={2}
          placeholder="Cómo ha ido, qué has recortado, qué te ha dolido"
          className="w-full mt-2 bg-black/40 border border-wano-gold/20 rounded p-2 text-xs text-wano-parchment placeholder:text-[#7a6f60] focus:outline-none focus:border-wano-gold/50"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ one row */

function PlanRow({
  item,
  sessionId,
  sets,
  onAdd,
  onUndo,
}: {
  item: PlanItem;
  sessionId: string;
  sets: LoggedSet[];
  onAdd: (sessionId: string, set: LoggedSet) => void;
  onUndo: (sessionId: string, exerciseId: string) => void;
}) {
  if (item.kind === "aviso") {
    return (
      <div className="flex gap-2 items-start bg-wano-crimson/10 border border-wano-crimson/25 rounded p-2">
        <AlertTriangle className="w-3.5 h-3.5 text-wano-crimson-light shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#e2d3bd] leading-snug">{item.text}</p>
      </div>
    );
  }
  return <ExerciseRow item={item} sessionId={sessionId} sets={sets} onAdd={onAdd} onUndo={onUndo} />;
}

function ExerciseRow({
  item,
  sessionId,
  sets,
  onAdd,
  onUndo,
}: {
  item: PlanExercise;
  sessionId: string;
  sets: LoggedSet[];
  onAdd: (sessionId: string, set: LoggedSet) => void;
  onUndo: (sessionId: string, exerciseId: string) => void;
}) {
  const exercise = EXERCISE_BY_ID[item.exerciseId];
  const defaults = useMemo(() => defaultsFor(item), [item]);
  const [reps, setReps] = useState(defaults.reps ?? 0);
  const [loadKg, setLoadKg] = useState(defaults.loadKg ?? 0);
  const [seconds, setSeconds] = useState(defaults.seconds ?? 0);
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [openNote, setOpenNote] = useState(false);

  if (!exercise) return null;
  const metric = exercise.metric;
  const target = prescribedSets(item);
  const done = sets.length;

  const build = (): LoggedSet => {
    const set: LoggedSet = { exerciseId: exercise.id };
    if (metric === "reps" || metric === "load") set.reps = reps;
    if (metric === "load") set.loadKg = loadKg;
    if (metric === "hold" || metric === "duration" || metric === "distance") set.seconds = seconds;
    if (rpe !== undefined) set.rpe = rpe;
    return set;
  };

  const prescription = [item.sets, item.reps, item.target].map((s) => s.trim()).filter(Boolean).join(" · ");

  return (
    <div
      className={`rounded-lg border p-2.5 transition-colors ${
        done > 0 ? "border-wano-lime/35 bg-wano-lime/5" : "border-wano-gold/15 bg-black/25"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-wano-parchment font-medium leading-tight">{item.name}</p>
          {prescription && <p className="font-mono text-[10px] text-[#a99b86] mt-0.5">{prescription}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 44 px minimum on both, which is Apple's own floor for a touch target. The first
              version came out at 35 and this is the button he presses with chalk on his hands. */}
          {done > 0 && (
            <button
              onClick={() => onUndo(sessionId, exercise.id)}
              aria-label="Quitar la última serie"
              className="min-h-11 min-w-11 flex items-center justify-center rounded border border-wano-gold/20 text-[#bdae97] hover:text-wano-parchment cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onAdd(sessionId, build())}
            aria-label={`Apuntar una serie de ${exercise.name}`}
            className="min-h-11 px-4 rounded bg-wano-crimson/30 border border-wano-gold/30 text-wano-parchment hover:bg-wano-crimson/50 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="font-mono text-[11px]">
              {done}
              {target ? `/${target}` : ""}
            </span>
          </button>
        </div>
      </div>

      {item.note && (
        <button
          onClick={() => setOpenNote((v) => !v)}
          className="text-[10px] text-wano-gold/70 mt-1 text-left cursor-pointer"
        >
          {openNote ? item.note : `${item.note.slice(0, 58)}${item.note.length > 58 ? "…" : ""}`}
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-2">
        {(metric === "reps" || metric === "load") && (
          <Stepper label="reps" value={reps} step={1} onChange={setReps} />
        )}
        {metric === "load" && <Stepper label="kg" value={loadKg} step={2.5} onChange={setLoadKg} />}
        {metric === "hold" && <Stepper label="s" value={seconds} step={5} onChange={setSeconds} />}
        {(metric === "duration" || metric === "distance") && (
          <Stepper label="min" value={Math.round(seconds / 60)} step={5} onChange={(v) => setSeconds(v * 60)} />
        )}
        <Rpe value={rpe} onChange={setRpe} />
      </div>

      {done > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {sets.map((s, i) => (
            <span
              key={i}
              className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-wano-lime/10 border border-wano-lime/30 text-wano-lime"
            >
              {describeSet(s, metric)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function describeSet(set: LoggedSet, metric: Exercise["metric"]): string {
  const rpe = set.rpe !== undefined ? ` @${set.rpe}` : "";
  if (metric === "load") return `${set.reps ?? 0}×${set.loadKg ?? 0}kg${rpe}`;
  if (metric === "reps") return `${set.reps ?? 0}${rpe}`;
  if (metric === "hold") return `${set.seconds ?? 0}s${rpe}`;
  return `${Math.round((set.seconds ?? 0) / 60)}min${rpe}`;
}

function starterSet(ex: Exercise): LoggedSet {
  if (ex.metric === "load") return { exerciseId: ex.id, reps: 5, loadKg: 0 };
  if (ex.metric === "reps") return { exerciseId: ex.id, reps: 8 };
  if (ex.metric === "hold") return { exerciseId: ex.id, seconds: 20 };
  return { exerciseId: ex.id, seconds: 20 * 60 };
}

/* --------------------------------------------------------------- the inputs */

function Stepper({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const round = (n: number) => Math.round(n * 100) / 100;
  return (
    <div className="flex items-center rounded border border-wano-gold/20 bg-black/40 overflow-hidden">
      <button
        onClick={() => onChange(Math.max(0, round(value - step)))}
        aria-label={`Bajar ${label}`}
        className="px-3.5 min-h-11 text-wano-gold hover:bg-wano-crimson/20 cursor-pointer font-mono"
      >
        −
      </button>
      <span className="font-mono text-xs text-wano-parchment min-w-[54px] text-center tabular-nums">
        {value} {label}
      </span>
      <button
        onClick={() => onChange(round(value + step))}
        aria-label={`Subir ${label}`}
        className="px-3.5 min-h-11 text-wano-gold hover:bg-wano-crimson/20 cursor-pointer font-mono"
      >
        +
      </button>
    </div>
  );
}

/** Optional on purpose: derive.ts scores a set with no RPE, it just does not get the effort bonus. */
function Rpe({ value, onChange }: { value: number | undefined; onChange: (v: number | undefined) => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-mono text-[11px] px-2 py-1.5 rounded border border-wano-gold/20 bg-black/40 text-[#a99b86] hover:text-wano-parchment cursor-pointer"
      >
        {value === undefined ? "RPE —" : `RPE ${value}`}
      </button>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {[undefined, 5, 6, 7, 8, 9, 10].map((n, i) => (
        <button
          key={i}
          onClick={() => {
            onChange(n);
            setOpen(false);
          }}
          className={`font-mono text-[11px] w-8 h-8 rounded border cursor-pointer ${
            value === n
              ? "bg-wano-crimson/50 border-wano-gold/40 text-wano-parchment"
              : "bg-black/40 border-wano-gold/20 text-[#bdae97]"
          }`}
        >
          {n ?? "—"}
        </button>
      ))}
    </div>
  );
}

function Picker({ onPick }: { onPick: (ex: Exercise) => void }) {
  const [query, setQuery] = useState("");
  const found = EXERCISES.filter((e) =>
    query.trim() === ""
      ? true
      : `${e.name} ${e.discipline}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="mt-2 border-t border-wano-gold/10 pt-3">
      <div className="flex items-center gap-2 bg-black/40 border border-wano-gold/20 rounded px-2">
        <Search className="w-3.5 h-3.5 text-wano-gold shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ejercicio"
          className="w-full bg-transparent py-2 text-xs text-wano-parchment placeholder:text-[#7a6f60] focus:outline-none"
        />
      </div>
      <div className="max-h-64 overflow-y-auto mt-2 flex flex-col gap-3">
        {DISCIPLINES.map((d) => {
          const list = found.filter((e) => e.discipline === d.id);
          if (!list.length) return null;
          return (
            <div key={d.id}>
              <p className="font-japanese text-[10px] uppercase tracking-widest text-wano-gold/70 mb-1">
                {d.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {list.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onPick(e)}
                    className="text-[11px] px-2 py-1.5 rounded border border-wano-gold/20 bg-black/30 text-[#e2d3bd] hover:bg-wano-crimson/25 cursor-pointer"
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- format */

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DAYS[dt.getUTCDay()]} ${d} de ${MONTHS[m - 1]}`;
}
