/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SkillCategory, PhysicalCapacityType, TrainingLogEntry } from "../types";
import { Calendar, ClipboardList, PenTool, Plus, Sparkles, Flame } from "lucide-react";

interface TrainingLoggerProps {
  logs: TrainingLogEntry[];
  onAddLog: (log: Omit<TrainingLogEntry, "id" | "date">) => void;
}

export default function TrainingLogger({ logs, onAddLog }: TrainingLoggerProps) {
  const [activity, setActivity] = useState("");
  const [category, setCategory] = useState<SkillCategory>(SkillCategory.Calisthenics);
  const [capacity, setCapacity] = useState<PhysicalCapacityType>(PhysicalCapacityType.Strength);
  const [repsOrMinutes, setRepsOrMinutes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim() || !repsOrMinutes.trim()) return;

    onAddLog({
      activity,
      category,
      repsOrMinutes,
      xpGained: 25, // Form submission gives 25 XP
      capacityBoosted: capacity,
    });

    // Reset fields
    setActivity("");
    setRepsOrMinutes("");
  };

  // Preset quick logging actions to speed up interaction
  const PRESET_WORKOUTS = [
    {
      activity: "Entrenamiento de dominadas en viga baja",
      category: SkillCategory.Calisthenics,
      capacity: PhysicalCapacityType.Strength,
      quantity: "4 series de 8 reps",
      label: "🥋 +8 Dominadas"
    },
    {
      activity: "Sincronía Ginga y patada Armada en el dojo",
      category: SkillCategory.Capoeira,
      capacity: PhysicalCapacityType.Rhythm,
      quantity: "20 minutos",
      label: "🥁 Ritmo Ginga"
    },
    {
      activity: "Sólida parada de manos Lvl 1 contra pared",
      category: SkillCategory.Calisthenics,
      capacity: PhysicalCapacityType.Balance,
      quantity: "5 intentos de 20s",
      label: "⛰️ Parada Manos"
    },
    {
      activity: "Esquivas fluidas con rolê en tatami",
      category: SkillCategory.Capoeira,
      capacity: PhysicalCapacityType.Agility,
      quantity: "15 minutos",
      label: "🍃 Esquivas & Rolê"
    }
  ];

  const handleQuickLog = (preset: typeof PRESET_WORKOUTS[0]) => {
    onAddLog({
      activity: preset.activity,
      category: preset.category,
      repsOrMinutes: preset.quantity,
      xpGained: 20, // Quick logs gain 20 XP
      capacityBoosted: preset.capacity,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="training-logger-section">
      
      {/* Exercise logging form */}
      <div className="lg:col-span-1 wood-panel p-5 rounded-xl border border-wano-gold/15 flex flex-col gap-4">
        
        <div>
          <h3 className="font-japanese text-sm text-wano-gold tracking-wider uppercase flex items-center gap-1.5 pb-2 border-b border-wano-gold/10">
            <PenTool className="w-4 h-4 text-wano-crimson" />
            REGISTRO DE SESION DIRECTA
          </h3>
          <p className="text-[10px] text-zinc-400 font-mono mt-1">
            Sube tu práctica real para energizar el aliento samurái.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          
          {/* Activity Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-japanese tracking-wide text-[#dac8ac]">ACTIVIDAD FÍSICA / MOVIMIENTO</label>
            <input
              type="text"
              required
              placeholder="Ej: Flexiones arqueras, L-sit de suelo"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="px-3 py-2 text-xs bg-black/55 border border-wano-gold/20 hover:border-wano-gold/40 focus:border-wano-gold focus:outline-none rounded text-wano-parchment"
            />
          </div>

          {/* Style Category Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-japanese tracking-wide text-[#dac8ac]">DISCIPLINA MARCIAL</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SkillCategory)}
              className="px-3 py-2 text-xs bg-black/55 border border-wano-gold/20 focus:border-wano-gold focus:outline-none rounded text-wano-parchment"
            >
              <option value={SkillCategory.Calisthenics}>Calistenia (Fuerza de Acero)</option>
              <option value={SkillCategory.Capoeira}>Capoeira (Instinto del Ginga)</option>
            </select>
          </div>

          {/* Physical Capacity Target Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-japanese tracking-wide text-[#dac8ac]">CAPACIDAD POTENCIADA</label>
            <select
              value={capacity}
              onChange={(e) => setCapacity(e.target.value as PhysicalCapacityType)}
              className="px-3 py-2 text-xs bg-black/55 border border-wano-gold/20 focus:border-wano-gold focus:outline-none rounded text-wano-parchment"
            >
              {Object.values(PhysicalCapacityType).map((cap) => (
                <option key={cap} value={cap}>
                  {cap}
                </option>
              ))}
            </select>
          </div>

          {/* Reps, Sets, or Duration */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-japanese tracking-wide text-[#dac8ac]">DOSIFICACIÓN (REPS O TIEMPO)</label>
            <input
              type="text"
              required
              placeholder="Ej: 4 series de 10 reps, 20 minutos"
              value={repsOrMinutes}
              onChange={(e) => setRepsOrMinutes(e.target.value)}
              className="px-3 py-2 text-xs bg-black/55 border border-wano-gold/20 hover:border-wano-gold/40 focus:border-wano-gold focus:outline-none rounded text-wano-parchment"
            />
          </div>

          <button
            type="submit"
            className="mt-2 py-2 bg-wano-crimson hover:bg-wano-crimson-light text-wano-parchment font-japanese text-xs font-bold tracking-wider rounded border border-wano-gold/30 hover:border-wano-gold transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> REGISTRAR SESIÓN (+25 XP)
          </button>
        </form>

        {/* Instantly logged routines section */}
        <div className="pt-2 border-t border-wano-gold/10">
          <h4 className="text-[10px] font-japanese text-wano-gold uppercase font-bold tracking-wide mb-2 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-wano-gold" /> ACCIÓN RÁPIDA DE DOJO
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_WORKOUTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickLog(preset)}
                className="p-1 px-2 text-[10px] font-medium bg-[#1a1414] border border-wano-gold/10 hover:border-wano-gold/50 rounded text-left transition-colors font-sans flex flex-col justify-between h-12 hover:bg-wano-crimson/10 cursor-pointer"
              >
                <span className="truncate text-wano-parchment font-semibold">{preset.label}</span>
                <span className="text-[8px] text-zinc-500 font-mono truncate">{preset.quantity}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Styled Antique scroll of Training logs */}
      <div className="lg:col-span-2 wood-panel p-5 rounded-xl border border-wano-gold/15 flex flex-col gap-4">
        
        <div className="flex items-center justify-between border-b border-wano-gold/10 pb-2">
          <h3 className="font-japanese text-sm text-wano-gold tracking-wider uppercase flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-wano-crimson" />
            DIARIO MARCIAL DE WANO
          </h3>
          <span className="text-[10px] bg-wano-ink border border-wano-gold/20 text-wano-gold font-mono px-2 py-0.5 rounded uppercase">
            {logs.length} SESIONES ANOTADAS
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <Calendar className="w-10 h-10 text-zinc-600" />
            <p className="font-japanese text-xs text-zinc-400">Su diario está en blanco, samurai.</p>
            <p className="text-[10px] text-zinc-500 font-mono">Consagre su espíritu anotando una sesión arriba o entrenando.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
            
            {logs.map((log) => {
              const isCalisthenics = log.category === SkillCategory.Calisthenics;
              return (
                <div
                  key={log.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-[#171313] border-l-4 border rounded-r-lg shadow-sm transition-all hover:translate-x-1"
                  style={{
                    borderLeftColor: isCalisthenics ? "#9e1b20" : "#0f766e",
                    borderColor: "rgba(212,175,55,0.08)"
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isCalisthenics ? "#9e1b20" : "#115e59" }} />
                    <div>
                      <h4 className="font-sans text-xs font-semibold text-wano-parchment">{log.activity}</h4>
                      <div className="flex flex-wrap gap-2.5 items-center mt-1 text-[10px] text-zinc-400 font-sans">
                        <span className="font-japanese text-wano-gold">{log.category}</span>
                        <span className="text-zinc-600">|</span>
                        <span className="bg-wano-ink px-1.5 py-0.2 rounded text-[9px] border border-zinc-800 text-zinc-300 font-mono">
                          {log.capacityBoosted}
                        </span>
                        <span className="text-zinc-600">|</span>
                        <span className="font-mono text-[#dac8ac]">{log.repsOrMinutes}</span>
                      </div>
                    </div>
                  </div>

                  {/* XP Gain marker */}
                  <div className="flex items-center gap-1.5 self-end md:self-center mt-2 md:mt-0 font-japanese text-[10px] bg-wano-crimson/15 border border-wano-gold/30 px-2.5 py-1 rounded text-wano-gold font-bold">
                    <Sparkles className="w-3 h-3 text-wano-gold" />
                    +{log.xpGained} XP
                  </div>
                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}
