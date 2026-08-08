/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import {
  INITIAL_CHARACTER,
  INITIAL_SKILLS,
  INITIAL_LOGS,
  INITIAL_QUESTS,
  AVATAR_LEVEL1,
  AVATAR_LEVEL2,
  AVATAR_LEVEL3
} from "./data/initialData";
import {
  SamuraiCharacter,
  TrainingSkill,
  TrainingLogEntry,
  MeritQuest,
  PhysicalCapacityType,
} from "./types";
import { getMuzenzaGraduation } from "./utils/muzenza";
import { loadState, saveState, LoadResult } from "./utils/storage";
import Header from "./components/Header";
import SakuraEffect from "./components/SakuraEffect";
import CharacterEvolutionSession from "./components/CharacterEvolutionSession";
import SkillsTree from "./components/SkillsTree";
import TrainingLogger from "./components/TrainingLogger";
import MeritQuests from "./components/MeritQuests";
import BackupPanel from "./components/BackupPanel";
import WanoMapLore, { SCENARIOS } from "./components/WanoMapLore";
import { synthManager } from "./components/Soundtrack";
import { MapPin, Sparkles, BookOpen, Clock } from "lucide-react";

// Read localStorage once, before the first render, so the app never flashes the
// starting character over saved data.
const RESTORED: LoadResult = loadState();

export default function App() {
  const restored = RESTORED.status === "ok" ? RESTORED.state : null;

  const [character, setCharacter] = useState<SamuraiCharacter>(restored?.character ?? INITIAL_CHARACTER);
  const [skills, setSkills] = useState<TrainingSkill[]>(restored?.skills ?? INITIAL_SKILLS);
  const [logs, setLogs] = useState<TrainingLogEntry[]>(restored?.logs ?? INITIAL_LOGS);
  const [quests, setQuests] = useState<MeritQuest[]>(restored?.quests ?? INITIAL_QUESTS);
  const [activeScenarioId, setActiveScenarioId] = useState(restored?.activeScenarioId ?? "scen_kuri");

  const [availablePoints, setAvailablePoints] = useState(restored?.availablePoints ?? 0);
  const [currentTab, setCurrentTab] = useState<"skills" | "logger" | "quests" | "scenarios">("skills");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTimer, setToastTimer] = useState<any>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  // Every state change is written back. The app is small enough that saving the
  // whole record on each change costs nothing measurable, and it removes any
  // chance of a change being lost because we forgot to persist that one path.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      // Nothing has changed yet on mount; skip the redundant write, but do not
      // skip it when we restored nothing, so a fresh install gets a record.
      if (restored) return;
    }
    const ok = saveState({ character, skills, logs, quests, availablePoints, activeScenarioId });
    setSaveFailed(!ok);
  }, [character, skills, logs, quests, availablePoints, activeScenarioId, restored]);

  const handleRestoreBackup = (state: {
    character: SamuraiCharacter;
    skills: TrainingSkill[];
    logs: TrainingLogEntry[];
    quests: MeritQuest[];
    availablePoints: number;
    activeScenarioId: string;
  }) => {
    setCharacter(state.character);
    setSkills(state.skills);
    setLogs(state.logs);
    setQuests(state.quests);
    setAvailablePoints(state.availablePoints);
    setActiveScenarioId(state.activeScenarioId);
    triggerToast("Copia restaurada. Tu diario y tu progreso vuelven a estar donde los dejaste.");
  };

  const handleResetAll = () => {
    setCharacter(INITIAL_CHARACTER);
    setSkills(INITIAL_SKILLS);
    setLogs(INITIAL_LOGS);
    setQuests(INITIAL_QUESTS);
    setAvailablePoints(0);
    setActiveScenarioId("scen_kuri");
    triggerToast("Diario vaciado. Empiezas de cero.");
  };

  // Trigger automated alerts/toasts
  const triggerToast = (msg: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
    setToastTimer(timer);
  };

  // Get active scenario details
  const currentScenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  // Helper code to handle leveling up
  const handleXpGain = (xpGained: number, currentCharacter: SamuraiCharacter) => {
    let newXp = currentCharacter.xp + xpGained;
    let newLevel = currentCharacter.level;
    let newXpNeeded = currentCharacter.xpNeeded;
    let earnedPoints = 0;
    let leveledUp = false;

    while (newXp >= newXpNeeded) {
      leveledUp = true;
      newLevel += 1;
      earnedPoints += 3; // 3 Stat points per level increment
      newXp -= newXpNeeded;
      newXpNeeded = Math.floor(newXpNeeded * 1.35 + 20); // Scale XP target
    }

    if (leveledUp) {
      setAvailablePoints((prev) => prev + earnedPoints);
      triggerToast(`Has ascendido al Nivel ${newLevel}. Tienes +${earnedPoints} Puntos de Entrenamiento.`);
      
      // Play a special Level Up tone
      synthManager.playLevelUp();
    }

    // Determine correct phase and titles as samurai grows in levels using Grupo Muzenza system
    const muzenza = getMuzenzaGraduation(newLevel);
    
    let nextPhase: 1 | 2 | 3 = 1;
    if (newLevel >= 37) {
      nextPhase = 3; // Contramestre and Mestre
    } else if (newLevel >= 15) {
      nextPhase = 2; // Graduado, Monitor, Instructor
    } else {
      nextPhase = 1; // Alumno Iniciante / Batizado
    }

    let nextPhaseName = `Camino del Maestro: ${muzenza.rankCategory}`;
    let nextPhaseRank = `Corda Muzenza: ${muzenza.cordaName}`;
    let nextTitle = `${muzenza.rankCategory} - ${muzenza.cordaName}`;
    let nextAvatar = currentCharacter.avatarUrl;

    if (nextPhase === 3) {
      nextAvatar = AVATAR_LEVEL3;
    } else if (nextPhase === 2) {
      nextAvatar = AVATAR_LEVEL2;
    } else {
      nextAvatar = AVATAR_LEVEL1;
    }

    return {
      ...currentCharacter,
      name: "Samurai", // Ensure name stays "Samurai"
      level: newLevel,
      xp: newXp,
      xpNeeded: newXpNeeded,
      phase: nextPhase,
      phaseName: nextPhaseName,
      phaseRank: nextPhaseRank,
      title: nextTitle,
      avatarUrl: nextAvatar,
      cordaName: muzenza.cordaName,
      cordaColors: muzenza.cordaColors,
      rankCategory: muzenza.rankCategory,
    };
  };

  // 1. Practicing/Training on SkillsTree
  const handlePracticeSkill = (skillId: string) => {
    const updatedSkills = skills.map((skill) => {
      if (skill.id === skillId) {
        const nextProgress = Math.min(skill.maxProgress, skill.progress + 20);
        
        // Calculate dynamic XP reward
        let xpGained = 25;
        // Check scenery dynamic multiplier bonuses
        if (activeScenarioId === "scen_kuri" && skill.capacityType === PhysicalCapacityType.Rhythm) {
          xpGained = Math.floor(xpGained * 1.1);
        } else if (activeScenarioId === "scen_ringo" && skill.capacityType === PhysicalCapacityType.Balance) {
          xpGained = Math.floor(xpGained * 1.1);
        } else if (activeScenarioId === "scen_udon" && skill.capacityType === PhysicalCapacityType.Strength) {
          xpGained = Math.floor(xpGained * 1.15);
        } else if (activeScenarioId === "scen_capital" && skill.capacityType === PhysicalCapacityType.Agility) {
          xpGained = Math.floor(xpGained * 1.15);
        } else if (activeScenarioId === "scen_onigashima") {
          xpGained = Math.floor(xpGained * 1.2);
        }

        // Apply attribute additions in stats upon training completion or increments
        const isCompletedNow = nextProgress >= skill.maxProgress && skill.progress < skill.maxProgress;
        if (isCompletedNow) {
          triggerToast(`Habilidad dominada: has completado el pergamino "${skill.name}".`);
          setCharacter((prevChar) => {
            const extraStats = { ...prevChar.stats };
            Object.entries(skill.rewardStats).forEach(([stat, val]) => {
              const statKey = stat as keyof typeof extraStats;
              extraStats[statKey] += val;
            });
            return handleXpGain(100, { ...prevChar, stats: extraStats }); // Master bonus XP
          });
        } else {
          // Normal training increments of specific skill capacity types
          setCharacter((prevChar) => {
            const boostedStats = { ...prevChar.stats };
            // Increment proportional stats under active training
            if (skill.capacityType === PhysicalCapacityType.Strength) boostedStats.strength += 0.5;
            if (skill.capacityType === PhysicalCapacityType.Agility) boostedStats.agility += 0.5;
            if (skill.capacityType === PhysicalCapacityType.Balance) boostedStats.balance += 0.5;
            if (skill.capacityType === PhysicalCapacityType.Rhythm) boostedStats.rhythm += 0.5;

            return handleXpGain(xpGained, { ...prevChar, stats: boostedStats });
          });
        }

        return {
          ...skill,
          progress: nextProgress,
        };
      }
      return skill;
    });

    setSkills(updatedSkills);
    
    // Automatically unlock next skills if level required matches
    const finalSkills = updatedSkills.map((s) => {
      if (!s.unlocked && character.level >= s.levelRequired) {
        return { ...s, unlocked: true };
      }
      return s;
    });
    setSkills(finalSkills);
  };

  // 2. Logging deep custom practice sessions manually
  const handleAddLog = (newLog: Omit<TrainingLogEntry, "id" | "date">) => {
    const freshLog: TrainingLogEntry = {
      ...newLog,
      id: `log_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
    };

    setLogs((prev) => [freshLog, ...prev]);

    // Apply specific capacity improvements directly inside character state
    setCharacter((prevChar) => {
      const stats = { ...prevChar.stats };
      
      switch (freshLog.capacityBoosted) {
        case PhysicalCapacityType.Strength:
          stats.strength += 1;
          break;
        case PhysicalCapacityType.Agility:
          stats.agility += 1;
          break;
        case PhysicalCapacityType.Balance:
          stats.balance += 1;
          break;
        case PhysicalCapacityType.Rhythm:
          stats.rhythm += 1;
          break;
        default:
          stats.mentalEnergy = Math.min(100, stats.mentalEnergy + 10);
      }

      // Compute general XP with scenario modifiers
      let finalXpReward = freshLog.xpGained;
      if (activeScenarioId === "scen_kuri" && freshLog.capacityBoosted === PhysicalCapacityType.Rhythm) {
        finalXpReward = Math.floor(finalXpReward * 1.1);
      } else if (activeScenarioId === "scen_ringo" && freshLog.capacityBoosted === PhysicalCapacityType.Balance) {
        finalXpReward = Math.floor(finalXpReward * 1.1);
      } else if (activeScenarioId === "scen_udon" && freshLog.capacityBoosted === PhysicalCapacityType.Strength) {
        finalXpReward = Math.floor(finalXpReward * 1.15);
      } else if (activeScenarioId === "scen_capital" && freshLog.capacityBoosted === PhysicalCapacityType.Agility) {
        finalXpReward = Math.floor(finalXpReward * 1.15);
      } else if (activeScenarioId === "scen_onigashima") {
        finalXpReward = Math.floor(finalXpReward * 1.2);
      }

      triggerToast(`Sesión registrada. Atributo de ${freshLog.capacityBoosted.split(" ")[0]} incrementado. +${finalXpReward} XP.`);
      return handleXpGain(finalXpReward, { ...prevChar, stats });
    });
  };

  // 3. Allocating Level Up statistics points to muscles/agility cards
  const handleAllocatePoint = (stat: "strength" | "agility" | "balance" | "rhythm") => {
    if (availablePoints <= 0) return;

    setAvailablePoints((prev) => prev - 1);
    setCharacter((prevChar) => {
      const nextStats = {
        ...prevChar.stats,
        [stat]: prevChar.stats[stat] + 3, // Each points gives +3 to that stat
      };
      return {
        ...prevChar,
        stats: nextStats,
      };
    });

    synthManager.playKoto(660); // Pluck feedback
  };

  // 4. Claiming rewards for completed samurai trials (Quest log)
  const handleClaimQuest = (questId: string) => {
    const updatedQuests = quests.map((q) => {
      if (q.id === questId) {
        triggerToast(`Mérito consagrado. Recompensa: [${q.rewardItem}] y +${q.rewardXp} XP.`);
        setCharacter((prevChar) => handleXpGain(q.rewardXp, prevChar));
        return { ...q, completed: true };
      }
      return q;
    });
    setQuests(updatedQuests);
  };

  // 5. Selecting dynamic training scenario
  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    const scen = SCENARIOS.find((s) => s.id === id);
    if (scen) {
      triggerToast(`Escenario establecido en: ${scen.name}. Se activan bonificaciones para ${scen.discipline}.`);
      synthManager.playTaiko();
    }
  };

  // Auto-Unlock locked items as levels update
  useEffect(() => {
    const modifiedSkills = skills.map((s) => {
      if (!s.unlocked && character.level >= s.levelRequired) {
        return { ...s, unlocked: true };
      }
      return s;
    });
    setSkills(modifiedSkills);
  }, [character.level]);

  return (
    <div className="min-h-screen bg-[#070505] text-wano-parchment relative flex flex-col font-sans select-none pb-12" id="wano-dashboard-app">
      
      {/* Absolute Falling Sakura elements */}
      <SakuraEffect />

      {/* Primary Header Banner */}
      <Header character={character} />

      {/* Warn once if the browser refused to persist. Silence here would mean
          losing a whole session's log without ever saying so. */}
      {(saveFailed || RESTORED.status === "unreadable") && (
        <div className="bg-wano-crimson/20 border-y border-wano-crimson/50 py-2 px-4 text-center text-xs text-wano-parchment relative z-20">
          {saveFailed
            ? "No se ha podido guardar en este navegador. Exporta una copia antes de cerrar."
            : `No se pudo leer lo guardado (${RESTORED.status === "unreadable" ? RESTORED.reason : ""}). Se ha empezado de cero; si tienes una copia, impórtala abajo.`}
        </div>
      )}

      {/* Floating active scenario banner indicator */}
      <div className="bg-[#110e0e] border-y border-wano-gold/15 py-2.5 px-4 text-center text-xs text-[#dac8ac] flex items-center justify-center gap-3 relative z-10 font-mono">
        <MapPin className="w-3.5 h-3.5 text-wano-crimson shrink-0" />
        <span>Escenario de Práctica:</span>
        <span className="font-japanese text-wano-gold font-bold bg-wano-crimson/15 px-2.5 py-0.5 rounded border border-wano-crimson/30">
          {currentScenario.japanese} ({currentScenario.name})
        </span>
        <span className="text-zinc-500 hidden md:inline">|</span>
        <span className="text-zinc-400 hidden md:inline flex items-center gap-1 font-sans">
          <Sparkles className="w-3 h-3 text-wano-gold" /> {currentScenario.bonus}
        </span>
      </div>

      {/* Dynamic Floating Toast Feedback Alerts */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-wano-ink border border-wano-gold/50 text-wano-parchment font-japanese text-xs rounded-xl shadow-lg flex items-center gap-3 w-80 max-w-full">
          <BookOpen className="w-5 h-5 text-wano-gold shrink-0" />
          <p className="leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Main Dashboard Sandbox container */}
      <main className="max-w-7xl w-full mx-auto px-4 mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 flex-1">
        
        {/* Left Column (Character, Level Up and stats) - Col Span 4 */}
        <section className="lg:col-span-4 flex flex-col gap-6" id="samurai-details-column">
          <CharacterEvolutionSession
            character={character}
            availablePoints={availablePoints}
            onAllocatePoint={handleAllocatePoint}
          />

          {/* Core Level Milestones Info Scroller */}
          <div className="bg-[#100c0c] p-4.5 border border-wano-gold/15 rounded-xl flex flex-col gap-3">
            <h4 className="font-japanese text-xs tracking-wider text-wano-gold uppercase font-bold border-b border-[#2d2525] pb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-wano-crimson" /> CRONOLOGÍA DE ESTÉTICA SAMURÁI
            </h4>
            
            <div className="flex flex-col gap-3 font-sans text-xs">
              
              <div className={`p-2 rounded border flex gap-3 items-center ${
                character.phase === 1 ? "bg-wano-crimson/15 border-wano-crimson/40 text-wano-parchment" : "bg-zinc-950/40 border-zinc-800 opacity-60"
              }`}>
                <span className="font-japanese text-base font-black px-1.5 py-1 bg-[#1a1515] text-[#d1c5bc] border border-[#d4af37]/20 rounded">壱</span>
                <div>
                  <h5 className="font-japanese font-bold text-wano-gold uppercase">Lv 1-2: Camino del Ronin</h5>
                  <p className="text-[10px] text-zinc-400">Ropas de monje ligeras, entrenamiento rústico en la costa de Kuri.</p>
                </div>
              </div>

              <div className={`p-2 rounded border flex gap-3 items-center ${
                character.phase === 2 ? "bg-wano-crimson/15 border-wano-crimson/40 text-wano-parchment" : "bg-zinc-950/40 border-zinc-800 opacity-60"
              }`}>
                <span className="font-japanese text-base font-black px-1.5 py-1 bg-[#1a1515] text-[#d1c5bc] border border-[#d4af37]/20 rounded">弐</span>
                <div>
                  <h5 className="font-japanese font-bold text-wano-gold uppercase">Lv 3-4: Armadura del Bosque</h5>
                  <p className="text-[10px] text-zinc-400">Placas rojas tradicionales, equilibrio en los portones shinto de Ringo.</p>
                </div>
              </div>

              <div className={`p-2 rounded border flex gap-3 items-center ${
                character.phase === 3 ? "bg-wano-crimson/15 border-wano-crimson/40 text-wano-parchment" : "bg-zinc-950/40 border-zinc-800 opacity-60"
              }`}>
                <span className="font-japanese text-base font-black px-1.5 py-1 bg-[#1a1515] text-[#d1c5bc] border border-[#d4af37]/20 rounded">参</span>
                <div>
                  <h5 className="font-japanese font-bold text-wano-gold uppercase">Lv 5+: Shogun del Ryuo Celestial</h5>
                  <p className="text-[10px] text-zinc-400">Kimonos magnánimos dorados, planchas en los riscos de Onigashima.</p>
                </div>
              </div>

            </div>
          </div>

          <BackupPanel
            state={{ character, skills, logs, quests, availablePoints, activeScenarioId }}
            onRestore={handleRestoreBackup}
            onReset={handleResetAll}
          />
        </section>

        {/* Right Column (Tab Navigation & Content) - Col Span 8 */}
        <section className="lg:col-span-8 flex flex-col gap-6" id="tabs-main-column">
          
          {/* Ancient Scroll style Tab Bar Navigation */}
          <div className="flex flex-wrap bg-[#141010] p-1 border border-[#302525] rounded-lg">
            
            <button
              id="tab-btn-skills"
              onClick={() => setCurrentTab("skills")}
              className={`flex-1 min-w-[100px] text-center py-2.5 font-japanese text-[11px] font-extrabold tracking-widest uppercase transition-all rounded cursor-pointer ${
                currentTab === "skills"
                  ? "bg-wano-crimson text-wano-parchment border border-wano-gold/30 shadow-md font-black"
                  : "text-[#ccc2ac] hover:bg-zinc-900"
              }`}
            >
              Habilidades
            </button>

            <button
              id="tab-btn-quests"
              onClick={() => setCurrentTab("quests")}
              className={`flex-1 min-w-[100px] text-center py-2.5 font-japanese text-[11px] font-extrabold tracking-widest uppercase transition-all rounded cursor-pointer ${
                currentTab === "quests"
                  ? "bg-wano-crimson text-wano-parchment border border-wano-gold/30 shadow-md font-black"
                  : "text-[#ccc2ac] hover:bg-zinc-900"
              }`}
            >
              Méritos del Dojo
            </button>

            <button
              id="tab-btn-logger"
              onClick={() => setCurrentTab("logger")}
              className={`flex-1 min-w-[100px] text-center py-2.5 font-japanese text-[11px] font-extrabold tracking-widest uppercase transition-all rounded cursor-pointer ${
                currentTab === "logger"
                  ? "bg-wano-crimson text-wano-parchment border border-wano-gold/30 shadow-md font-black"
                  : "text-[#ccc2ac] hover:bg-zinc-900"
              }`}
            >
              Diario Marcial
            </button>

            <button
              id="tab-btn-scenarios"
              onClick={() => setCurrentTab("scenarios")}
              className={`flex-1 min-w-[100px] text-center py-2.5 font-japanese text-[11px] font-extrabold tracking-widest uppercase transition-all rounded cursor-pointer ${
                currentTab === "scenarios"
                  ? "bg-wano-crimson text-wano-parchment border border-wano-gold/30 shadow-md font-black"
                  : "text-[#ccc2ac] hover:bg-zinc-900"
              }`}
            >
              Cartografía Wano
            </button>

          </div>

          {/* Render Active Tab Screen with motion transitions simulated by fluid class states */}
          <div className="relative w-full" id="tab-content-render-target">
            
            {currentTab === "skills" && (
              <SkillsTree
                skills={skills}
                currentLevel={character.level}
                onPracticeSkill={handlePracticeSkill}
                soundEnabled={true}
              />
            )}

            {currentTab === "quests" && (
              <MeritQuests
                quests={quests}
                character={character}
                onClaimQuest={handleClaimQuest}
                soundEnabled={true}
              />
            )}

            {currentTab === "logger" && (
              <TrainingLogger
                logs={logs}
                onAddLog={handleAddLog}
              />
            )}

            {currentTab === "scenarios" && (
              <WanoMapLore
                currentLevel={character.level}
                activeScenarioId={activeScenarioId}
                onSelectScenario={handleSelectScenario}
              />
            )}

          </div>

          {/* Interactive Legend / Lore guide card at bottom */}
          <div className="wood-panel p-4.5 rounded-xl border border-wano-gold/15 flex flex-col md:flex-row items-center gap-4">
            <span className="w-12 h-12 rounded-full bg-[#1b1515] border border-wano-gold/30 flex items-center justify-center text-wano-gold font-japanese text-lg font-black block shrink-0">
              意
            </span>
            <div className="text-center md:text-left">
              <h5 className="font-japanese text-xs text-wano-gold font-bold uppercase tracking-wider">
                FILOSOFÍA DEL COMPÁS DE COHESIÓN DEL RYUO FÍSICO
              </h5>
              <p className="text-[11px] text-[#dac8ac] mt-1 leading-relaxed">
                "La calistenia forja el peso inamovible de la katana en tus propias manos; la Capoeira libera la cadencia y el movimiento elíptico que elude cualquier golpe. El samurai maestro une ambas sendas en Wano."
              </p>
            </div>
          </div>

        </section>

      </main>

      {/* Aesthetic Footer watermark */}
      <footer className="w-full text-center py-8 text-[11px] text-zinc-650 mt-12 border-t border-wano-gold/5 font-mono select-none">
        <p className="text-zinc-500">Dojo feudal de Wano · Calistenia y capoeira</p>
        <p className="text-zinc-600 mt-1 uppercase text-[9px] tracking-widest font-japanese text-wano-gold/45">Fuerza · Resiliencia · Ginga · Honor</p>
      </footer>

    </div>
  );
}
