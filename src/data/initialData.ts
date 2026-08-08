/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhysicalCapacityType, SkillCategory, TrainingSkill, SamuraiCharacter, MeritQuest, TrainingLogEntry } from "../types";

// Avatars must be imported, not referenced by path: `/src/assets/...` only
// resolves under the dev server, so a production build shipped three 404s.
// Importing makes Vite fingerprint them and emit them into dist/.
import avatarLevel1 from "../assets/images/samurai_level1_1779988255099.png";
import avatarLevel2 from "../assets/images/samurai_level2_1779988275843.png";
import avatarLevel3 from "../assets/images/samurai_level3_1779988294153.png";

export const AVATAR_LEVEL1 = avatarLevel1;
export const AVATAR_LEVEL2 = avatarLevel2;
export const AVATAR_LEVEL3 = avatarLevel3;

export const INITIAL_CHARACTER: SamuraiCharacter = {
  name: "Samurai",
  title: "Batizado - Corda Cinza",
  level: 1,
  xp: 40,
  xpNeeded: 120,
  avatarUrl: AVATAR_LEVEL1,
  phase: 1,
  phaseName: "Camino del Maestro: Batizado",
  phaseRank: "Corda Muzenza: Corda Cinza",
  cordaName: "Corda Cinza",
  cordaColors: ["#9ca3af"],
  rankCategory: "Batizado",
  stats: {
    strength: 15,
    agility: 12,
    balance: 10,
    rhythm: 8,
    mentalEnergy: 80,
  },
};

export const INITIAL_SKILLS: TrainingSkill[] = [
  // CALISTHENICS PATH
  {
    id: "calis_pushups",
    name: "Flexiones de Madera de Wano",
    japaneseName: "木製腕立て伏せ (Wanokuni Pushups)",
    category: SkillCategory.Calisthenics,
    capacityType: PhysicalCapacityType.Strength,
    levelRequired: 1,
    unlocked: true,
    progress: 40,
    maxProgress: 100,
    description: "La base de toda fuerza de empuje. Fortalece el pecho y los brazos para sostener la postura samurai.",
    rewardStats: { strength: 4 }
  },
  {
    id: "calis_pullups",
    name: "Dominada en Viga del Templo",
    japaneseName: "寺院の懸垂 (Pull-up of the Temple Beam)",
    category: SkillCategory.Calisthenics,
    capacityType: PhysicalCapacityType.Strength,
    levelRequired: 1,
    unlocked: true,
    progress: 25,
    maxProgress: 100,
    description: "Sostenerse en las alturas y jalar con fuerza letal. Esencial para la tracción samurai y agarre de espada.",
    rewardStats: { strength: 6 }
  },
  {
    id: "calis_lsit",
    name: "Escuadra de Hierro de Oden",
    japaneseName: "おでんの鉄の字 (Oden's L-Sit)",
    category: SkillCategory.Calisthenics,
    capacityType: PhysicalCapacityType.Balance,
    levelRequired: 2,
    unlocked: false,
    progress: 0,
    maxProgress: 150,
    description: "Suspensión que une fuerza abdominal y control mental agudo para elevar las piernas y resistir inmóvil.",
    rewardStats: { strength: 8, balance: 10 }
  },
  {
    id: "calis_handstand",
    name: "Parada de Manos del Monte Fuji",
    japaneseName: "富士山の逆立ち (Mount Fuji Handstand)",
    category: SkillCategory.Calisthenics,
    capacityType: PhysicalCapacityType.Balance,
    levelRequired: 3,
    unlocked: false,
    progress: 0,
    maxProgress: 200,
    description: "Invertir la perspectiva del mundo y sostenerse solo con las palmas sobre la roca sagrada. Control absoluto de hombros.",
    rewardStats: { balance: 15, strength: 5 }
  },
  {
    id: "calis_frontlever",
    name: "Suspensión Horizontal de Enma",
    japaneseName: "閻魔の水平ぶら下がり (Enma's Front Lever)",
    category: SkillCategory.Calisthenics,
    capacityType: PhysicalCapacityType.Strength,
    levelRequired: 4,
    unlocked: false,
    progress: 0,
    maxProgress: 300,
    description: "Alinear la espina dorsal como una katana suspendida horizontalmente del cielo. Fuerza dorsal divina.",
    rewardStats: { strength: 25, balance: 10 }
  },
  {
    id: "calis_planche",
    name: "Plancha de Vuelo del Dragón Kaido",
    japaneseName: "カイドウの龍プランシェ (Kaido's Dragon Planche)",
    category: SkillCategory.Calisthenics,
    capacityType: PhysicalCapacityType.Strength,
    levelRequired: 5,
    unlocked: false,
    progress: 0,
    maxProgress: 500,
    description: "Levitar sin sostener las piernas del suelo, empujando los cielos con los hombros de bronce. El ápice de la calistenia.",
    rewardStats: { strength: 40, balance: 20 }
  },

  // CAPOEIRA PATH
  {
    id: "capo_ginga",
    name: "Paso de Flujo Ginga-Katana",
    japaneseName: "流るるジンガの型 (Ginga Katana Rhythm)",
    category: SkillCategory.Capoeira,
    capacityType: PhysicalCapacityType.Rhythm,
    levelRequired: 1,
    unlocked: true,
    progress: 50,
    maxProgress: 100,
    description: "El flujo constante que imita las olas de Kuri. El movimiento pendular básico de la capoeira cruzado con balance samurai.",
    rewardStats: { rhythm: 5, agility: 3 }
  },
  {
    id: "capo_esquiva",
    name: "Evasión de Caña del Cañaveral",
    japaneseName: "竹林の回避 (Bamboo Forest Esquiva)",
    category: SkillCategory.Capoeira,
    capacityType: PhysicalCapacityType.Agility,
    levelRequired: 1,
    unlocked: true,
    progress: 30,
    maxProgress: 100,
    description: "Agacharse doblando el torso de lado como el bambú ante el viento, esquivando un ataque directo.",
    rewardStats: { agility: 5, rhythm: 2 }
  },
  {
    id: "capo_meialua",
    name: "Luna Creciente de Kuri",
    japaneseName: "九里の半月蹴り (Kuri's Meia Lua de Compasso)",
    category: SkillCategory.Capoeira,
    capacityType: PhysicalCapacityType.Agility,
    levelRequired: 2,
    unlocked: false,
    progress: 0,
    maxProgress: 150,
    description: "Una patada semicircular apoyando la mano en el tatami, girando la cadera como el curso de las lunas de Wano.",
    rewardStats: { agility: 10, rhythm: 6 }
  },
  {
    id: "capo_au",
    name: "Vuelta de Rueda del Gato de Fuego",
    japaneseName: "火の猫の空中回転 (Aú Sem Mão)",
    category: SkillCategory.Capoeira,
    capacityType: PhysicalCapacityType.Agility,
    levelRequired: 3,
    unlocked: false,
    progress: 0,
    maxProgress: 200,
    description: "Lanzarse de lado con ligereza total, sin apoyar las manos en el aire. La perfecta unión de acrobacia y valentía guerrera.",
    rewardStats: { agility: 15, balance: 8 }
  },
  {
    id: "capo_macaco",
    name: "Asalto del Mono de las Sombras",
    japaneseName: "猿人のバックターン (Macaco Shadow Assault)",
    category: SkillCategory.Capoeira,
    capacityType: PhysicalCapacityType.Balance,
    levelRequired: 4,
    unlocked: false,
    progress: 0,
    maxProgress: 250,
    description: "Giro trasero apoyando una mano que salta con fuerza resurgente. Simula la agilidad inaudita del simio místico de Wano.",
    rewardStats: { agility: 20, balance: 12 }
  },
  {
    id: "capo_envergado",
    name: "Giro Súper Cósmico Ryuo",
    japaneseName: "流桜・暴風回転 (Ryuo Strom Kick / Envergado)",
    category: SkillCategory.Capoeira,
    capacityType: PhysicalCapacityType.Rhythm,
    levelRequired: 5,
    unlocked: false,
    progress: 0,
    maxProgress: 400,
    description: "La patada aérea acrobática suprema imbuida con flujo de energía Ryuo. Gira el cuerpo con saltos que cortan el viento.",
    rewardStats: { rhythm: 30, agility: 25 }
  }
];

export const INITIAL_LOGS: TrainingLogEntry[] = [
  {
    id: "log_1",
    date: "2026-05-28",
    activity: "Práctica de Ginga rítmica en la arena de Kuri",
    category: SkillCategory.Capoeira,
    repsOrMinutes: "15 min",
    xpGained: 15,
    capacityBoosted: PhysicalCapacityType.Rhythm
  },
  {
    id: "log_2",
    date: "2026-05-28",
    activity: "Flexiones de Madera en barra baja rústica",
    category: SkillCategory.Calisthenics,
    repsOrMinutes: "3 series de 15 reps",
    xpGained: 20,
    capacityBoosted: PhysicalCapacityType.Strength
  }
];

export const INITIAL_QUESTS: MeritQuest[] = [
  {
    id: "quest_path_cherry",
    title: "El Sendero del Cerezo Floreciente",
    japaneseName: "桜の散歩道 (Path of cherry blooms)",
    description: "Completa tus primeras sesiones de calistenia para forjar el físico de un samurái.",
    category: SkillCategory.Calisthenics,
    difficulty: "Fácil",
    requiredStatValue: { stat: "strength", value: 18 },
    rewardXp: 30,
    rewardItem: "Pergamino de Madera Antiguo",
    completed: false
  },
  {
    id: "quest_ginga_stream",
    title: "Fluidez como el Mar de Wano",
    japaneseName: "ワノ国の潮の流れ (Flow of Wano tides)",
    description: "Consigue una agilidad fluida que imite al maestro del compás de capoeira.",
    category: SkillCategory.Capoeira,
    difficulty: "Medio",
    requiredStatValue: { stat: "agility", value: 20 },
    rewardXp: 50,
    rewardItem: "Bota de Loto Tradicional",
    completed: false
  },
  {
    id: "quest_oden_resolve",
    title: "La Voluntad de Hierro de Oden",
    japaneseName: "おでんの不屈の志 (Unbending Will of Oden)",
    description: "Lleva tu fuerza corporal a límites increíbles (Fuerza 30) para sostener el peso de dos espadas gigantes.",
    category: SkillCategory.Calisthenics,
    difficulty: "Difícil",
    requiredStatValue: { stat: "strength", value: 30 },
    rewardXp: 100,
    rewardItem: "Emblema del León Corpóreo",
    completed: false
  },
  {
    id: "quest_roda_capital",
    title: "La Roda Sagrada en la Capital de la Flor",
    japaneseName: "花都の聖なる輪 (Holy Roda of Flower Capital)",
    description: "Desbloquea el nivel mítico del ritmo y agilidad aérea para maravillar a la capital del Shogun.",
    category: SkillCategory.Capoeira,
    difficulty: "Supremo",
    requiredStatValue: { stat: "rhythm", value: 30 },
    rewardXp: 200,
    rewardItem: "Kimono de Hilos de Dragón Kin'emon",
    completed: false
  }
];
