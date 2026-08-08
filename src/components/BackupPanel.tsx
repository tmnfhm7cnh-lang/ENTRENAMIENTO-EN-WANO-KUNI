import { useRef, useState } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import {
  SamuraiCharacter,
  TrainingSkill,
  TrainingLogEntry,
  MeritQuest,
} from "../types";
import { exportBackup, importBackup, clearState } from "../utils/storage";

export interface BackupState {
  character: SamuraiCharacter;
  skills: TrainingSkill[];
  logs: TrainingLogEntry[];
  quests: MeritQuest[];
  availablePoints: number;
  activeScenarioId: string;
}

interface BackupPanelProps {
  state: BackupState;
  onRestore: (state: BackupState) => void;
  onReset: () => void;
}

/**
 * The app keeps everything in localStorage, which iOS can evict without
 * warning. This panel is the escape hatch: a JSON file the user owns.
 */
export default function BackupPanel({ state, onRestore, onReset }: BackupPanelProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importBackup(file);
    if (result.status === "ok") {
      const s = result.state;
      onRestore({
        character: s.character,
        skills: s.skills,
        logs: s.logs,
        quests: s.quests,
        availablePoints: s.availablePoints,
        activeScenarioId: s.activeScenarioId,
      });
      setMessage(`Copia del ${s.savedAt.split("T")[0]} restaurada: ${s.logs.length} sesiones.`);
    } else {
      setMessage(
        result.status === "unreadable"
          ? `No se pudo importar: ${result.reason}.`
          : "El archivo está vacío."
      );
    }

    // Let the same file be picked twice in a row.
    e.target.value = "";
  };

  const handleReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    clearState();
    onReset();
    setConfirmingReset(false);
    setMessage("Todo borrado.");
  };

  return (
    <div className="wood-panel p-4 rounded-xl border border-wano-gold/15 flex flex-col gap-3" id="backup-panel">
      <div>
        <h4 className="font-japanese text-xs tracking-wider text-wano-gold uppercase font-bold border-b border-wano-gold/10 pb-1.5">
          Copia de seguridad
        </h4>
        <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed font-sans">
          Tu diario vive solo en este teléfono. Si borras los datos del navegador o iOS libera espacio,
          se pierde. Exporta de vez en cuando y guarda el archivo en OneDrive.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          id="btn-export-backup"
          onClick={() => exportBackup(state)}
          className="flex-1 min-w-[120px] py-2 px-3 bg-wano-crimson/25 hover:bg-wano-crimson text-wano-parchment border border-wano-crimson/50 hover:border-wano-gold/40 rounded text-xs font-japanese font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Exportar
        </button>

        <button
          id="btn-import-backup"
          onClick={() => fileInput.current?.click()}
          className="flex-1 min-w-[120px] py-2 px-3 bg-[#1a1414] hover:bg-wano-crimson/10 text-wano-parchment border border-wano-gold/20 hover:border-wano-gold/50 rounded text-xs font-japanese font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" /> Importar
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      <button
        id="btn-reset-all"
        onClick={handleReset}
        onBlur={() => setConfirmingReset(false)}
        className={`py-1.5 px-3 rounded text-[11px] font-mono transition-colors border cursor-pointer ${
          confirmingReset
            ? "bg-wano-crimson text-wano-parchment border-wano-gold/50"
            : "bg-transparent text-zinc-500 border-zinc-800 hover:text-wano-crimson-light hover:border-wano-crimson/40"
        }`}
      >
        <span className="flex items-center justify-center gap-1.5">
          <Trash2 className="w-3 h-3" />
          {confirmingReset ? "Pulsa otra vez para borrarlo todo" : "Borrar todo"}
        </span>
      </button>

      {message && (
        <p className="text-[10px] text-wano-gold font-mono leading-relaxed border-t border-wano-gold/10 pt-2">
          {message}
        </p>
      )}
    </div>
  );
}
