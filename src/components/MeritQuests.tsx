/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeritQuest, SamuraiCharacter } from "../types";
import { Award, Scroll, Calendar, CheckSquare, Compass, ShieldAlert } from "lucide-react";
import { synthManager } from "./Soundtrack";

interface MeritQuestsProps {
  quests: MeritQuest[];
  character: SamuraiCharacter;
  onClaimQuest: (questId: string) => void;
  soundEnabled: boolean;
}

export default function MeritQuests({
  quests,
  character,
  onClaimQuest,
  soundEnabled,
}: MeritQuestsProps) {
  
  const handleClaim = (questId: string, item: string) => {
    if (soundEnabled) {
      synthManager.playLevelUp(); // Play celebration note
    }
    onClaimQuest(questId);
  };

  return (
    <div className="w-full flex flex-col gap-6 wood-panel p-6 rounded-xl border border-wano-gold/15" id="merit-quests-shrine">
      
      {/* Scroll Header */}
      <div className="border-b border-wano-gold/15 pb-4">
        <h3 className="font-japanese text-lg text-wano-parchment tracking-widest uppercase flex items-center gap-2">
          <Scroll className="w-5 h-5 text-wano-gold" />
          MISIONES Y MÉRITOS DEL CAMINO DEL MAESTRO
        </h3>
        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
          Pruebas físicas legendarias para validar tus méritos deportivos en Wano. Completa la estadística requerida para consagrar tu honor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {quests.map((quest) => {
          // Check if user has sufficient stats to claim the quest
          const currentStatValue = character.stats[quest.requiredStatValue.stat];
          const hasSufficientStats = currentStatValue >= quest.requiredStatValue.value;
          const isClaimable = !quest.completed && hasSufficientStats;

          const statLabelMap = {
            strength: "Fuerza Muscular",
            agility: "Agilidad & Acrobacia",
            balance: "Equilibrio Zen",
            rhythm: "Ritmo del Ginga"
          };

          return (
            <div
              key={quest.id}
              className={`p-4 rounded-lg border flex flex-col justify-between gap-4 transition-all duration-300 relative ${
                quest.completed
                  ? "bg-stone-900/30 border-emerald-900/40 opacity-75"
                  : isClaimable
                    ? "bg-gradient-to-br from-[#241c1c] to-[#120e0e] border-wano-gold shadow-[0_0_15px_rgba(212,175,55,0.15)] scale-[1.01]"
                    : "bg-[#141111] border-zinc-800"
              }`}
              id={`quest-card-${quest.id}`}
            >
              {/* Completed Watermark Ribbon */}
              {quest.completed && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-950/90 border border-emerald-500 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-japanese uppercase tracking-wider">
                  <CheckSquare className="w-3 h-3" /> CONSAGRADA
                </div>
              )}

              {/* Quest Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] text-wano-gold font-japanese font-semibold tracking-wider">
                      {quest.japaneseName}
                    </span>
                    <h4 className="font-japanese text-sm text-wano-parchment font-extrabold tracking-wide mt-0.5">
                      {quest.title}
                    </h4>
                  </div>
                  {!quest.completed && (
                    <span className={`text-[9px] font-japanese tracking-widest uppercase font-bold px-2 py-0.5 rounded border ${
                      quest.difficulty === "Fácil"
                        ? "bg-zinc-800 border-zinc-705 text-zinc-300"
                        : quest.difficulty === "Medio"
                          ? "bg-teal-950 border-teal-800 text-teal-400"
                          : quest.difficulty === "Difícil"
                            ? "bg-amber-950 border-amber-800 text-amber-500"
                            : "bg-wano-crimson/30 border-wano-crimson text-wano-crimson-light animate-pulse"
                    }`}>
                      {quest.difficulty}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mt-2.5">
                  {quest.description}
                </p>

                {/* Target statistics display */}
                <div className="mt-3.5 p-2 bg-black/40 border border-[#2d2525] rounded flex items-center justify-between text-[11px] font-sans">
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-wano-gold" />
                    <span className="text-[#cccccc]">Requisito Deportivo:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-japanese text-[#dac8ac]">{statLabelMap[quest.requiredStatValue.stat]}:</span>
                    <span className={`font-mono font-bold ${hasSufficientStats ? "text-emerald-400" : "text-wano-crimson"}`}>
                      {currentStatValue} / {quest.requiredStatValue.value} PT
                    </span>
                  </div>
                </div>
              </div>

              {/* Rewards area */}
              <div className="pt-3 border-t border-wano-gold/15 flex items-center justify-between">
                <div className="flex gap-2.5">
                  {/* XP Reward */}
                  <div className="flex items-center gap-1 text-[10px] text-wano-gold font-japanese font-semibold bg-wano-crimson/15 border border-wano-crimson/30 px-2 py-0.5 rounded">
                    +{quest.rewardXp} XP
                  </div>
                  {/* Item Loot */}
                  <div className="flex items-center gap-1 text-[10px] text-[#f5ebd6] font-sans bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded italic">
                    <Award className="w-3 h-3 text-wano-gold" /> {quest.rewardItem}
                  </div>
                </div>

                {/* Confirm merit button / locked warning */}
                {quest.completed ? (
                  <span className="text-[10px] font-japanese text-zinc-500 italic uppercase">Reclamada</span>
                ) : isClaimable ? (
                  <button
                    id={`btn-claim-${quest.id}`}
                    onClick={() => handleClaim(quest.id, quest.rewardItem)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-wano-crimson to-wano-gold text-wano-ink font-japanese text-[11px] font-bold rounded shadow-md border border-wano-gold/40 hover:brightness-110 active:scale-95 transition-all text-center uppercase cursor-pointer"
                  >
                    Reclamar Pergamino
                  </button>
                ) : (
                  <span className="text-[9px] font-japanese text-zinc-500 flex items-center gap-1 uppercase select-none">
                    <ShieldAlert className="w-3 h-3 text-zinc-600" /> Insuficiente
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
