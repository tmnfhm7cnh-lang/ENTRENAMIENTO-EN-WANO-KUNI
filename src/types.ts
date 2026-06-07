/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PhysicalCapacityType {
  Strength = "Fuerza (Calistenia)",
  Flexibility = "Flexibilidad & Elasticidad",
  Agility = "Agilidad & Reflejos (Capoeira)",
  Endurance = "Resistencia & Cardio",
  Balance = "Equilibrio & Control",
  Rhythm = "Ritmo & Ginga (Musicalidad)"
}

export enum SkillCategory {
  Calisthenics = "Calistenia",
  Capoeira = "Capoeira"
}

export interface TrainingSkill {
  id: string;
  name: string;
  japaneseName: string; // Dojo style
  category: SkillCategory;
  capacityType: PhysicalCapacityType;
  levelRequired: number;
  unlocked: boolean;
  progress: number; // 0 to 100
  maxProgress: number; // e.g. 100, 500
  description: string;
  rewardStats: {
    strength?: number;
    agility?: number;
    balance?: number;
    rhythm?: number;
  };
}

export interface SamuraiCharacter {
  name: string;
  title: string;
  level: number;
  xp: number;
  xpNeeded: number;
  avatarUrl: string;
  phase: 1 | 2 | 3;
  phaseName: string;
  phaseRank: string;
  cordaName: string;         // Grupo Muzenza Active Corda Name
  cordaColors: string[];     // Array of CSS color classes or hex codes representing the Corda threads
  rankCategory: string;      // Batizado, Graduado, Monitor, Instructor, Contramestre, Mestre, etc.
  stats: {
    strength: number;     // Fuerza explosiva/estática (Pull-ups, planches)
    agility: number;      // Acrobacia, patadas, esquivas (Capoeira Ginga)
    balance: number;      // Parada de manos, L-sit, equilibrios
    rhythm: number;       // Sincronía, fluidez, musicalidad, resistencia
    mentalEnergy: number; // Aliento samurái / Stamina
  };
}

export interface TrainingLogEntry {
  id: string;
  date: string;
  activity: string;
  category: SkillCategory;
  repsOrMinutes: string;
  xpGained: number;
  capacityBoosted: PhysicalCapacityType;
}

export interface MeritQuest {
  id: string;
  title: string;
  japaneseName: string;
  description: string;
  category: SkillCategory;
  difficulty: "Fácil" | "Medio" | "Difícil" | "Supremo";
  requiredStatValue: {
    stat: "strength" | "agility" | "balance" | "rhythm";
    value: number;
  };
  rewardXp: number;
  rewardItem: string;
  completed: boolean;
}
