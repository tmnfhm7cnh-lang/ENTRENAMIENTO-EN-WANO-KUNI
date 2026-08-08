/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { SamuraiCharacter } from "../types";
import { Dumbbell, Shield, Swords, Sparkles, Heart, ChevronDown, ChevronUp, Award } from "lucide-react";
import { MUZENZA_CORDAS } from "../utils/muzenza";

interface CharacterEvolutionSessionProps {
  character: SamuraiCharacter;
  availablePoints: number;
  onAllocatePoint: (stat: "strength" | "agility" | "balance" | "rhythm") => void;
}

export default function CharacterEvolutionSession({
  character,
  availablePoints,
  onAllocatePoint,
}: CharacterEvolutionSessionProps) {
  const [showCordaChronology, setShowCordaChronology] = useState(false);

  // Fallback defaults for Cordas
  const cordaColors = character.cordaColors || ["#e5e7eb"];
  const cordaName = character.cordaName || "Corda Crua (Natural)";
  const rankCategory = character.rankCategory || "Iniciante";

  // Description based on current phase and capoeira path
  const getPhaseDescription = (phase: number) => {
    switch (phase) {
      case 1:
        return "Un Samurai de Wano iniciando su viaje en el arte del Ginga, el equilibrio del Handstand y la fuerza de tracción. Sus entrenamientos son puros, descalzo en las playas de Kuri.";
      case 2:
        return "Guerrero consagrado con graduación intermedia. Combina la fuerza sobrehumana del Ryuo con saltos acrobáticos perfectos en los tejados de la Capital de la Flor.";
      case 3:
        return "Mestre Supremo y Shogun del Ritmo. Domina la sincronía del berimbau con la fuerza estática de la plancha. Es la máxima expresión de la capoeira y el código de honor samurai.";
      default:
        return "";
    }
  };

  const currentAvatar = character.avatarUrl;

  const formattedPhaseName = character.phaseName
    .replace(/shogun/gi, "maestro")
    .replace(/iniciante/gi, "batizado")
    .replace(/Shogunado/gi, "Dojo del Maestro");

  // This panel always stacks. It used to be `lg:flex-row`, which reads the
  // VIEWPORT width — but the panel lives inside the 4-of-12 left column, so at
  // the lg breakpoint it tried to lay out two columns inside ~312px and needed
  // 527px. That is the overlap seen on an iPad in landscape. The column is
  // never wide enough for a side-by-side split at any viewport.
  return (
    <div className="flex flex-col gap-6 p-6 wood-panel rounded-xl border border-wano-gold/20 shadow-2xl relative overflow-hidden" id="character-evolution-panel">

      {/* Dynamic Background Fog & Crimson light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-wano-crimson/5 rounded-full blur-3xl pointer-events-none" />

      {/* Core Avatar Frame with Scenario Background and Momonosuke Colors */}
      <div className="flex flex-col items-center justify-between gap-4 py-4 pb-6 border-b border-wano-gold/10">
        
        {/* Canvas / Scene Header */}
        <div className="text-center w-full">
          <span className="font-japanese text-[10px] tracking-widest text-wano-gold bg-wano-crimson/30 px-2.5 py-0.5 border border-wano-gold/30 rounded uppercase">
            REGIMIENTO DE AVATAR: {formattedPhaseName}
          </span>
          <h2 className="font-japanese text-2xl text-wano-parchment font-bold mt-1 tracking-wider uppercase">
            {character.name}
          </h2>
          <p className="text-xs text-wano-gold/80 italic font-medium">「 {character.title} 」</p>

          {/* Braided Corda de Capoeira visualization */}
          <div className="mt-3 flex flex-col items-center justify-center gap-1 bg-black/40 border border-wano-purple/20 p-2 rounded-lg max-w-[260px] mx-auto shadow-md">
            <span className="text-[9px] text-[#fca5a5] font-mono tracking-widest uppercase">CORDA GRUPO MUZENZA</span>
            <div className="flex items-center gap-2">
              {/* Traditional braided belt look */}
              <div className="flex h-4 items-center justify-center px-2 bg-zinc-950/80 rounded-full border border-zinc-800 gap-0.5 relative shadow-inner">
                {Array.from({ length: 6 }).map((_, i) => {
                  const color = cordaColors[i % cordaColors.length];
                  return (
                    <div 
                      key={i} 
                      className="w-1.5 h-3 rounded-full rotate-[15deg] transition-all duration-500 shadow-sm"
                      style={{ 
                        backgroundColor: color, 
                        boxShadow: `0 0 4px ${color}` 
                      }} 
                    />
                  );
                })}
              </div>
              <span className="text-xs text-[#fff0f3] font-mono font-bold truncate max-w-[140px]" title={cordaName}>
                {cordaName}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Canvas containing the Samurai Art */}
        {/* Sized against the container, not the viewport: a fixed md:w-72 (288px)
            overflowed the 264px of usable width the left column has on an iPad. */}
        <div className="w-full max-w-[288px] aspect-square rounded-full border-4 border-wano-purple/40 bg-wano-ink overflow-hidden shadow-[0_0_20px_rgba(192,132,252,0.15)] relative group block shrink-0">
          
          {/* Glowing Aura centered on Momonosuke Pink/Lavender Dragon theme */}
          <div className="absolute inset-0 transition-opacity duration-1000 bg-gradient-to-t from-wano-purple/30 via-transparent to-transparent opacity-100" />

          {/* Actual Samurai Art */}
          <img
            src={currentAvatar}
            alt={character.phaseName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              // Fail-safe fallback if the generated image path is offline
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/samurai_wano_phase_${character.phase}/600/600`;
            }}
          />

          {/* Stage Badge overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-wano-ink/90 border border-wano-gold/50 px-3 py-1 rounded-full flex items-center justify-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-wano-crimson" />
            <span className="text-[10px] font-japanese tracking-widest text-[#dac8ac] font-bold uppercase">
              ETAPA {character.phase}
            </span>
          </div>
        </div>

        {/* Level Ascension Info Box */}
        <div className="text-center border border-wano-crimson/30 rounded-lg p-3 bg-wano-crimson/10 max-w-sm w-full">
          <h4 className="font-japanese text-[11px] text-wano-gold tracking-wide uppercase font-bold">
            ENTORNO DE ENTRENAMIENTO
          </h4>
          <p className="text-xs text-[#dac8ac] mt-1 line-clamp-2">
            {getPhaseDescription(character.phase)}
          </p>
        </div>
      </div>

      {/* Attributes & Sovereign Skills Allocate Panel */}
      <div className="flex-1 flex flex-col justify-between gap-6">
        
        {/* Title and sovereign points */}
        <div>
          <h3 className="font-japanese text-sm text-wano-gold flex items-center gap-1.5 tracking-wider uppercase font-extrabold pb-2 border-b border-wano-gold/10">
            <Dumbbell className="w-4 h-4 text-wano-crimson" />
            APARATO DE CONSTITUCIÓN FÍSICA
          </h3>
          
          {availablePoints > 0 ? (
            <div className="mt-3 p-2 bg-wano-crimson/20 border border-wano-gold/50 rounded flex items-center justify-between">
              <span className="text-xs text-wano-parchment font-medium font-japanese tracking-wide flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-wano-gold" />
                ¡TIENES {availablePoints} PUNTOS DE ENTRENAMIENTO!
              </span>
              <span className="text-[10px] bg-wano-gold text-wano-ink px-2 py-0.5 rounded font-mono font-bold uppercase">
                Asignar abajo
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-400 mt-2 font-mono">
              Registra actividades en el diario o completa méritos de Wano para obtener XP, subir de nivel y desbloquear puntos de constitución.
            </p>
          )}
        </div>

        {/* Interactive Stats Columns */}
        <div className="flex flex-col gap-4">
          
          {/* STAT 1: STRENGTH */}
          <div className="flex flex-col gap-1.5 bg-[#171313] p-3 rounded-lg border border-wano-gold/5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-wano-crimson/25 rounded border border-wano-crimson/50 text-wano-crimson-light">
                  <Swords className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="font-japanese font-semibold tracking-wide text-[#f5ebd6]">
                    FUERZA MUSCULAR
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-sans">Pull-ups, planches y estabilidad estática</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-wano-gold">{character.stats.strength} PT</span>
                {availablePoints > 0 && (
                  <button
                    id="btn-allocate-strength"
                    onClick={() => onAllocatePoint("strength")}
                    className="px-2 py-0.5 bg-wano-crimson hover:bg-wano-crimson-light text-wano-parchment border border-wano-gold/30 rounded text-xs font-bold transition-all"
                  >
                    +1
                  </button>
                )}
              </div>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-wano-crimson"
                style={{ width: `${Math.min(100, (character.stats.strength / 100) * 100)}%` }}
              />
            </div>
          </div>

          {/* STAT 2: AGILITY */}
          <div className="flex flex-col gap-1.5 bg-[#171313] p-3 rounded-lg border border-wano-gold/5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-teal-950/40 rounded border border-teal-800 text-teal-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="font-japanese font-semibold tracking-wide text-[#f5ebd6]">
                    AGILIDAD & ACROBACIA
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-sans">Kicks de Capoeira, aú sem mão, giros rápidos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-teal-400">{character.stats.agility} PT</span>
                {availablePoints > 0 && (
                  <button
                    id="btn-allocate-agility"
                    onClick={() => onAllocatePoint("agility")}
                    className="px-2 py-0.5 bg-teal-700 hover:bg-teal-600 border border-teal-500 rounded text-xs font-bold transition-all"
                    title="Aumentar Agilidad"
                  >
                    +1
                  </button>
                )}
              </div>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600"
                style={{ width: `${Math.min(100, (character.stats.agility / 100) * 100)}%` }}
              />
            </div>
          </div>

          {/* STAT 3: BALANCE */}
          <div className="flex flex-col gap-1.5 bg-[#171313] p-3 rounded-lg border border-wano-gold/5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-amber-950/40 rounded border border-amber-800 text-amber-500">
                  <Shield className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="font-japanese font-semibold tracking-wide text-[#f5ebd6]">
                    EQUILIBRIO ZEN
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-sans">Handstand, L-sit, balance e inversión</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-amber-500">{character.stats.balance} PT</span>
                {availablePoints > 0 && (
                  <button
                    id="btn-allocate-balance"
                    onClick={() => onAllocatePoint("balance")}
                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 border border-amber-400   rounded text-xs font-bold transition-all"
                  >
                    +1
                  </button>
                )}
              </div>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500"
                style={{ width: `${Math.min(100, (character.stats.balance / 100) * 100)}%` }}
              />
            </div>
          </div>

          {/* STAT 4: RHYTHM */}
          <div className="flex flex-col gap-1.5 bg-[#171313] p-3 rounded-lg border border-wano-gold/5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-purple-950/40 rounded border border-purple-800 text-purple-400">
                  <Heart className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="font-japanese font-semibold tracking-wide text-[#f5ebd6]">
                    RITMO & FLUIDEZ DEL GINGA
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-sans">Cadencia musical, resistencia y sincronía</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-purple-400">{character.stats.rhythm} PT</span>
                {availablePoints > 0 && (
                  <button
                    id="btn-allocate-rhythm"
                    onClick={() => onAllocatePoint("rhythm")}
                    className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 border border-purple-400 rounded text-xs font-bold transition-all"
                  >
                    +1
                  </button>
                )}
              </div>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500"
                style={{ width: `${Math.min(100, (character.stats.rhythm / 100) * 100)}%` }}
              />
            </div>
          </div>

        </div>

        {/* Accordion list of all Muzenza CordAS with timeline tracker */}
        <div className="border-t border-wano-gold/10 pt-4">
          <button
            onClick={() => setShowCordaChronology(!showCordaChronology)}
            className="flex items-center justify-between w-full text-left text-xs font-japanese font-semibold text-[#dac8ac] hover:text-wano-gold transition-colors py-2 bg-black/40 px-3 rounded border border-zinc-900 shadow-md"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-widest text-[#fca5a5]">
              <Award className="w-4 h-4 text-wano-purple" />
              Rango Muzenza ({MUZENZA_CORDAS.length} Cordas)
            </span>
            {showCordaChronology ? <ChevronUp className="w-4 h-4 text-wano-gold" /> : <ChevronDown className="w-4 h-4 text-wano-gold" />}
          </button>

          {showCordaChronology && (
            <div className="mt-2 bg-[#120712] border border-wano-purple/20 rounded-lg p-3 max-h-52 overflow-y-auto space-y-2 text-xs scrollbar-thin">
              <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed">
                El Grupo Muzenza de Capoeira posee una orden estricta de graduaciones tradicionales (Batizado, Graduado, Monitor, Instructor, Contramestre y Mestre). Tu nivel en el Dojo determina tu corda activa:
              </p>
              <div className="divide-y divide-zinc-900/60">
                {MUZENZA_CORDAS.map((c, index) => {
                  const isActive = character.level >= c.levelRange[0] && character.level <= c.levelRange[1];
                  const colors = c.cordaColors;
                  return (
                    <div 
                      key={index} 
                      className={`py-2 px-1.5 flex items-center justify-between gap-2 transition-all ${
                        isActive 
                          ? "bg-wano-purple/25 border border-wano-gold/40 rounded shadow-[inset_0_0_10px_rgba(192,132,252,0.2)]" 
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 font-sans">
                        {/* Two-stripe colored ribbon representer */}
                        <div className="flex h-3 px-1 rounded-full border border-zinc-800 bg-zinc-950 gap-0.5 shrink-0">
                          {Array.from({ length: 4 }).map((_, rIdx) => {
                            const stripeColor = colors[rIdx % colors.length];
                            return (
                              <div
                                key={rIdx}
                                className="w-1 h-2 rounded-full rotate-12"
                                style={{ backgroundColor: stripeColor }}
                              />
                            );
                          })}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-semibold ${isActive ? "text-wano-gold" : "text-[#eae3ea]"}`}>
                            {c.title} {isActive && "(actual)"}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono">
                            Niveles {c.levelRange[0]} - {c.levelRange[1] === 120 ? "99+" : c.levelRange[1]}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        isActive 
                          ? "bg-wano-gold text-wano-ink font-bold" 
                          : "bg-zinc-900 text-zinc-500"
                      }`}>
                        {c.rankCategory}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* The "Siguiente Etapa" button used to live here. It called
            handleForceAdvanceSimulator, which handed out 100 XP and +5 to every
            stat on each click — a debug shortcut that shipped. Removed: the
            level has to come from training. */}
        <div className="flex items-center justify-between pt-4 border-t border-wano-gold/10">
          <div className="flex flex-col">
            <span className="text-[9px] text-[#ccc2ac] font-mono">ENERGÍA ESPIRITUAL RESURGENTE</span>
            <span className="text-xs text-wano-parchment font-semibold">{character.stats.mentalEnergy}/100 ALIENTO</span>
          </div>
        </div>

      </div>
    </div>
  );
}
