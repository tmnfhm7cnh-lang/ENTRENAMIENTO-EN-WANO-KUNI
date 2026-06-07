/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MuzenzaGraduation {
  levelRange: [number, number]; // [minLevel, maxLevel]
  cordaName: string;
  cordaColors: string[]; // hex or tailwind compatible gradient colors
  rankCategory: "Batizado" | "Graduado" | "Monitor" | "Instructor" | "Contramestre" | "Mestre" | "Professor";
  title: string;
}

export const MUZENZA_CORDAS: MuzenzaGraduation[] = [
  {
    levelRange: [1, 3],
    cordaName: "Corda Cinza",
    cordaColors: ["#9ca3af"],
    rankCategory: "Batizado",
    title: "Batizado - Corda Cinza"
  },
  {
    levelRange: [4, 4],
    cordaName: "Corda Amarela (Batizado)",
    cordaColors: ["#fbbf24"],
    rankCategory: "Batizado",
    title: "Batizado - Corda Amarela"
  },
  {
    levelRange: [5, 5],
    cordaName: "Corda Amarela/Laranja",
    cordaColors: ["#fbbf24", "#f97316"],
    rankCategory: "Batizado",
    title: "Alumno Sobresaliente"
  },
  {
    levelRange: [6, 6],
    cordaName: "Corda Laranja",
    cordaColors: ["#f97316"],
    rankCategory: "Batizado",
    title: "Alumno de Ritmo"
  },
  {
    levelRange: [7, 7],
    cordaName: "Corda Laranja/Verde",
    cordaColors: ["#f97316", "#10b981"],
    rankCategory: "Batizado",
    title: "Alumno Forjado"
  },
  {
    levelRange: [8, 8],
    cordaName: "Corda Verde",
    cordaColors: ["#10b981"],
    rankCategory: "Batizado",
    title: "Alumno Verde de Wano"
  },
  {
    levelRange: [9, 10],
    cordaName: "Corda Verde/Amarela",
    cordaColors: ["#10b981", "#fbbf24"],
    rankCategory: "Batizado",
    title: "Guerrero de la Roda"
  },
  {
    levelRange: [11, 12],
    cordaName: "Corda Verde/Laranja",
    cordaColors: ["#10b981", "#f97316"],
    rankCategory: "Batizado",
    title: "Guerrero Aventajado"
  },
  {
    levelRange: [13, 14],
    cordaName: "Corda Verde/Azul",
    cordaColors: ["#10b981", "#3b82f6"],
    rankCategory: "Batizado",
    title: "Pre-Graduado"
  },
  {
    levelRange: [15, 16],
    cordaName: "Corda Azul (Graduado)",
    cordaColors: ["#3b82f6"],
    rankCategory: "Graduado",
    title: "Graduado - Corda Azul"
  },
  {
    levelRange: [17, 18],
    cordaName: "Corda Azul/Verde",
    cordaColors: ["#3b82f6", "#10b981"],
    rankCategory: "Graduado",
    title: "Graduado Consagrado"
  },
  {
    levelRange: [19, 20],
    cordaName: "Corda Azul/Amarela",
    cordaColors: ["#3b82f6", "#fbbf24"],
    rankCategory: "Graduado",
    title: "Graduado de Armas de Wano"
  },
  {
    levelRange: [21, 22],
    cordaName: "Corda Azul/Laranja",
    cordaColors: ["#3b82f6", "#f97316"],
    rankCategory: "Graduado",
    title: "Segundo de la Roda"
  },
  {
    levelRange: [23, 24],
    cordaName: "Corda Azul/Vermelha (Monitor)",
    cordaColors: ["#3b82f6", "#ef4444"],
    rankCategory: "Monitor",
    title: "Monitor - Corda Azul e Vermelha"
  },
  {
    levelRange: [25, 27],
    cordaName: "Corda Vermelha (Instructor)",
    cordaColors: ["#ef4444"],
    rankCategory: "Instructor",
    title: "Instructor - Corda Vermelha"
  },
  {
    levelRange: [28, 30],
    cordaName: "Corda Vermelha/Laranja",
    cordaColors: ["#ef4444", "#f97316"],
    rankCategory: "Instructor",
    title: "Instructor Avanzado"
  },
  {
    levelRange: [31, 33],
    cordaName: "Corda Vermelha/Azul",
    cordaColors: ["#ef4444", "#3b82f6"],
    rankCategory: "Instructor",
    title: "Instructor Celestial"
  },
  {
    levelRange: [34, 36],
    cordaName: "Corda Vermelha/Marrom (Professor)",
    cordaColors: ["#ef4444", "#78350f"],
    rankCategory: "Professor",
    title: "Professor de Ginga"
  },
  {
    levelRange: [37, 40],
    cordaName: "Corda Marrom (Contramestre)",
    cordaColors: ["#78350f"],
    rankCategory: "Contramestre",
    title: "Contramestre de Capoeira"
  },
  {
    levelRange: [41, 45],
    cordaName: "Corda Vermelha/Preta (Mestre)",
    cordaColors: ["#ef4444", "#000000"],
    rankCategory: "Mestre",
    title: "Mestre de Wano (Fuego del Ryuo)"
  },
  {
    levelRange: [46, 120],
    cordaName: "Corda Preta (Grão Mestre)",
    cordaColors: ["#000000"],
    rankCategory: "Mestre",
    title: "Grão Mestre - Corda Preta"
  }
];

export function getMuzenzaGraduation(level: number): MuzenzaGraduation {
  const match = MUZENZA_CORDAS.find(
    (c) => level >= c.levelRange[0] && level <= c.levelRange[1]
  );
  return match || MUZENZA_CORDAS[0];
}
