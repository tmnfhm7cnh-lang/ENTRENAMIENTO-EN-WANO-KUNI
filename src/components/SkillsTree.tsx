/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { TrainingSkill, SkillCategory, PhysicalCapacityType } from "../types";
import { Lock, Sword, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { synthManager } from "./Soundtrack";

interface SkillsTreeProps {
  skills: TrainingSkill[];
  currentLevel: number;
  onPracticeSkill: (skillId: string) => void;
  soundEnabled: boolean;
}

export default function SkillsTree({
  skills,
  currentLevel,
  onPracticeSkill,
  soundEnabled,
}: SkillsTreeProps) {
  const [activeTab, setActiveTab] = useState<SkillCategory>(SkillCategory.Calisthenics);

  const filteredSkills = skills.filter((s) => s.category === activeTab);

  const handlePractice = (skill: TrainingSkill) => {
    if (!skill.unlocked || currentLevel < skill.levelRequired) return;
    
    // Play sound effects if enabled
    if (soundEnabled) {
      if (skill.category === SkillCategory.Calisthenics) {
        synthManager.playTaiko();
      } else {
        synthManager.playKoto(440);
      }
    }
    
    onPracticeSkill(skill.id);
  };

  return (
    <div className="w-full flex flex-col gap-6 wood-panel p-6 rounded-xl border border-wano-gold/15" id="skills-tree-panel">
      
      {/* Tab Selectors styled like traditional scroll handles */}
      <div className="flex flex-wrap items-center justify-between border-b border-wano-gold/15 pb-4 gap-4">
        <div>
          <h3 className="font-japanese text-lg text-wano-parchment tracking-widest uppercase flex items-center gap-1.5">
            <Sword className="w-5 h-5 text-wano-crimson" />
            PERGAMINOS DE HABILIDADES DE WANO
          </h3>
          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
            Practica movimientos de disciplinas físicas y de lucha para ascender.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2">
          {Object.values(SkillCategory).map((cat) => (
            <button
              key={cat}
              id={`tab-select-${cat.toLowerCase()}`}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 font-japanese text-xs tracking-wider rounded border transition-all uppercase cursor-pointer ${
                activeTab === cat
                  ? "bg-wano-crimson border-wano-gold text-wano-parchment font-extrabold shadow-[0_0_10px_rgba(158,27,32,0.4)]"
                  : "bg-wano-ink/90 border-wano-gold/20 text-[#dac8ac] hover:bg-wano-crimson/10"
              }`}
            >
              {cat === SkillCategory.Calisthenics ? "Calistenia 鋼" : "Capoeira 踊"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Scrolls / Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSkills.map((skill) => {
          const isRequirementsMet = currentLevel >= skill.levelRequired;
          const isUnlocked = skill.unlocked && isRequirementsMet;
          const progressPercent = Math.min(100, Math.floor((skill.progress / skill.maxProgress) * 100));

          return (
            <div
              key={skill.id}
              className={`relative flex flex-col justify-between p-4 rounded-lg border transition-all duration-300 ${
                isUnlocked
                  ? "bg-gradient-to-br from-[#1b1515] to-[#120e0e] border-wano-gold/20 hover:border-wano-gold/50 shadow-md"
                  : "bg-black/40 border-zinc-800 opacity-60 hover:opacity-80"
              }`}
              id={`skill-card-${skill.id}`}
            >
              {/* Locked scroll shadow */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/5 pointer-events-none rounded-lg z-10 flex items-center justify-center">
                  <div className="bg-wano-ink/95 border border-wano-crimson/50 px-3 py-1.5 rounded flex items-center gap-1.5 shadow-lg select-none">
                    <Lock className="w-3.5 h-3.5 text-wano-crimson" />
                    <span className="font-japanese text-[10px] tracking-widest text-[#dac8ac] uppercase font-bold">
                      Bloqueado: Nivel {skill.levelRequired}
                    </span>
                  </div>
                </div>
              )}

              {/* Skill Core Metadata */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] text-wano-gold font-japanese font-semibold tracking-wider">
                      {skill.japaneseName}
                    </span>
                    <h4 className="font-japanese text-base text-wano-parchment font-bold tracking-wide mt-0.5">
                      {skill.name}
                    </h4>
                  </div>
                  <span className="text-[10px] bg-wano-ink border border-wano-gold/30 text-wano-gold font-mono px-2 py-0.5 rounded shrink-0 uppercase">
                    {skill.capacityType.split(" ")[0]}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mt-2 line-clamp-2 md:line-clamp-3">
                  {skill.description}
                </p>

                {/* Boosted attributes logs */}
                <div className="flex gap-2.5 mt-3 flex-wrap">
                  {Object.entries(skill.rewardStats).map(([stat, val]) => (
                    <span
                      key={stat}
                      className="text-[9px] bg-wano-crimson/15 border border-wano-crimson/30 text-[#fca5a5] font-mono px-1.5 py-0.5 rounded capitalize"
                    >
                      +{val} {stat === "strength" ? "Fuerza" : stat === "agility" ? "Agilidad" : stat === "balance" ? "Equilibrio" : "Ritmo"}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress and training button */}
              <div className="mt-4 pt-4 border-t border-wano-gold/10 flex flex-col gap-2 relative z-20">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#cccccc]">Maestría del Pergamino</span>
                  <span className="text-wano-gold font-bold">
                    {skill.progress} / {skill.maxProgress} PT ({progressPercent}%)
                  </span>
                </div>

                {/* Progress bar container */}
                <div className="relative w-full h-2 bg-gray-900 border border-wano-gold/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r transition-all duration-300 ${
                      activeTab === SkillCategory.Calisthenics
                        ? "from-wano-crimson to-wano-gold"
                        : "from-teal-700 to-emerald-400"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Training CTA */}
                {isUnlocked && (
                  <button
                    id={`btn-train-${skill.id}`}
                    onClick={() => handlePractice(skill)}
                    className={`mt-2 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 font-japanese text-xs font-bold transition-all cursor-pointer ${
                      progressPercent >= 100
                        ? "bg-teal-900/40 border border-teal-500/50 text-teal-400 hover:bg-teal-900/60"
                        : "bg-wano-crimson/25 hover:bg-wano-crimson text-wano-parchment border border-wano-crimson/50 hover:border-wano-gold/40"
                    }`}
                  >
                    {progressPercent >= 100 ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Competido (¡Volver a entrenar!)
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-wano-gold" /> Práctica Ancestral
                      </>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
