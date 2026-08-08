/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Compass, Sparkles, Map, Dumbbell } from "lucide-react";

export interface ScenicScenario {
  id: string;
  name: string;
  japanese: string;
  discipline: string;
  description: string;
  bonus: string;
  visualVibe: string;
  unlockedAt: number;
}

interface WanoMapLoreProps {
  currentLevel: number;
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
}

export const SCENARIOS: ScenicScenario[] = [
  {
    id: "scen_kuri",
    name: "Playa de Arena de Kuri",
    japanese: "九里の砂浜 (Kuri Sands)",
    discipline: "Ginga rítmica y Calistenia Básica",
    description: "La arena suelta ofrece una resistencia natural perfecta para ejercitar el compás de Capoeira. El rumor de las olas ayuda a coordinar el flujo de aire y tus primeras flexiones.",
    bonus: "+10% de Exp en Ritmo y Ginga",
    visualVibe: "bg-teal-950/20 shadow-[inset_0_0_20px_rgba(20,184,166,0.15)]",
    unlockedAt: 1
  },
  {
    id: "scen_ringo",
    name: "Bosque Neblinoso de Ringo",
    japanese: "鈴後・常冬の森 (Ringo Winter Forest)",
    discipline: "Estáticos de Tensión y Equilibrio",
    description: "Soporta temperaturas bajo cero colgado de antiguos pórticos shinto cubiertos de nieve. El frío entrena tu resiliencia nerviosa para Front Levers sostenidos.",
    bonus: "+10% de Exp en Equilibrio Zen",
    visualVibe: "bg-blue-950/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.15)]",
    unlockedAt: 2
  },
  {
    id: "scen_udon",
    name: "Canteras de Hierro de Udon",
    japanese: "兎丼の採掘場 (Udon Iron Quarries)",
    discipline: "Fuerza Bruta y Fuerza de Tracción",
    description: "Entrena con pesados grilletes en los tobillos y jalando vigas rústicas de hierro. El peso aplastante desafía la tensión de tus dominadas arqueras y planchas.",
    bonus: "+15% de Exp en Fuerza Muscular",
    visualVibe: "bg-amber-950/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.15)]",
    unlockedAt: 3
  },
  {
    id: "scen_capital",
    name: "Dojo Imperial de la Capital de la Flor",
    japanese: "花の都・本丸道場 (Flower Capital Dojo)",
    discipline: "Roda Imperial de Capoeira y Planche",
    description: "El tatami supremo donde realizas acrobacias aéreas majestuosas frente a los Grandes Maestros. El sonido del gongo calibra la velocidad de tus patadas y de tu planche voladora.",
    bonus: "+15% de Exp en Acrobacia y Agilidad",
    visualVibe: "bg-wano-crimson/10 shadow-[inset_0_0_20px_rgba(158,27,32,0.15)]",
    unlockedAt: 4
  },
  {
    id: "scen_onigashima",
    name: "Pinnáculo del Cráneo de Onigashima",
    japanese: "鬼ヶ島・天空の崖 (Onigashima Sky Cliff)",
    discipline: "Fusión Suprema Calis-Capoeira (Ryuo Flow)",
    description: "Al borde de un abismo que toca las tormentas celestiales. Uniendo la fuerza inamovible de la plancha con la patada mística del dragón, el samurai toca el Ryuo supremo en calistenia.",
    bonus: "+20% de Exp Global (Máximo Vínculo)",
    visualVibe: "bg-purple-950/20 shadow-[inset_0_0_20px_rgba(168,85,247,0.15)]",
    unlockedAt: 5
  }
];

export default function WanoMapLore({
  currentLevel,
  activeScenarioId,
  onSelectScenario,
}: WanoMapLoreProps) {
  return (
    <div className="w-full flex flex-col gap-6 wood-panel p-6 rounded-xl border border-wano-gold/15" id="wano-scenarios-shrine">
      
      {/* Scroll Header */}
      <div className="border-b border-wano-gold/15 pb-4">
        <h3 className="font-japanese text-lg text-wano-parchment tracking-widest uppercase flex items-center gap-2">
          <Map className="w-5 h-5 text-wano-gold" />
          CARTOGRAFÍA DE ESCENARIOS DE WANO
        </h3>
        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
          Evoluciona tu paisaje de entrenamiento marcial. Cambiar tu escenario otorga bonificaciones místicas a tipos específicos de calistenia o capoeira.
        </p>
      </div>

      {/* Scenarios Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {SCENARIOS.map((scen) => {
          const isUnlocked = currentLevel >= scen.unlockedAt;
          const isActive = activeScenarioId === scen.id;

          return (
            <div
              key={scen.id}
              onClick={() => isUnlocked && onSelectScenario(scen.id)}
              className={`p-3.5 rounded-lg border transition-all duration-300 flex flex-col justify-between h-56 select-none ${
                isUnlocked
                  ? isActive
                    ? "border-wano-gold bg-wano-ink/90 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.2)] scale-[1.02]"
                    : "border-zinc-800 hover:border-wano-gold/50 bg-[#141010]/95 cursor-pointer hover:translate-y-[-2px]"
                  : "border-zinc-900 bg-black/50 opacity-55 cursor-not-allowed"
              } ${isUnlocked && isActive ? scen.visualVibe : ""}`}
              id={`scenario-card-${scen.id}`}
            >
              {/* Scenario Top Info */}
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-mono text-zinc-500">REQ: LVL {scen.unlockedAt}</span>
                  {isUnlocked && (
                    <span className={`text-[8px] font-japanese tracking-wider px-1.5 py-0.2 rounded border ${
                      isActive
                        ? "bg-wano-crimson border-wano-gold/50 text-wano-gold font-bold"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300"
                    }`}>
                      {isActive ? "ACTIVO" : "DISPONIBLE"}
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <span className="font-japanese text-[9px] text-wano-gold block tracking-wider leading-none">
                    {scen.japanese}
                  </span>
                  <h4 className="font-japanese text-sm text-[#f6ecd7] font-extrabold mt-1 tracking-wide leading-tight">
                    {scen.name}
                  </h4>
                </div>

                <p className="text-[10px] text-zinc-400 mt-2.5 line-clamp-4 leading-normal">
                  {scen.description}
                </p>
              </div>

              {/* Bonus / Footer Tag */}
              <div className="pt-2.5 border-t border-wano-gold/10 mt-2 font-sans flex flex-col gap-1">
                <span className="text-[8px] text-zinc-500 uppercase font-mono tracking-widest block">Disciplina Priorizada</span>
                <span className="text-[9px] text-[#ccc2ac] font-medium truncate">{scen.discipline}</span>
                <div className="flex items-center gap-1.5 mt-1 text-[9px] text-[#ffd56b] font-japanese font-semibold">
                  <Sparkles className="w-2.5 h-2.5 text-wano-gold shrink-0" />
                  <span className="truncate">{scen.bonus}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
