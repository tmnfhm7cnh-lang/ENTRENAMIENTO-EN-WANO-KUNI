/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SamuraiCharacter } from "../types";
import { Swords, Trophy, Shield } from "lucide-react";
import Soundtrack from "./Soundtrack";

interface HeaderProps {
  character: SamuraiCharacter;
}

export default function Header({ character }: HeaderProps) {
  const xpPercent = Math.min(100, Math.floor((character.xp / character.xpNeeded) * 100));

  return (
    <header className="relative w-full py-6 md:py-8 px-4 border-b border-wano-gold/20 overflow-hidden bg-gradient-to-b from-wano-ink to-black">
      {/* Decorative Wano Red Sun Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-wano-crimson/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Wano Crest & Title */}
        <div className="flex items-center gap-4 text-center md:text-left self-stretch justify-center md:justify-start">
          <div className="relative w-16 h-16 rounded-full border-2 border-wano-gold/40 flex items-center justify-center bg-wano-crimson/20 shadow-[0_0_15px_rgba(158,27,32,0.4)] block shrink-0">
            <Swords className="w-8 h-8 text-wano-gold" />
            <span className="absolute -bottom-1 -right-1 text-[10px] px-1 bg-wano-gold text-wano-ink font-mono font-bold rounded">
              Lvl {character.level}
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <span className="font-japanese text-3xl md:text-4xl text-wano-parchment tracking-widest uppercase font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                武士道
              </span>
            </div>
            <h1 className="text-sm font-sans tracking-widest text-[#d1c5ab] font-light mt-1 flex items-center gap-1.5 justify-center md:justify-start">
              <Trophy className="w-3.5 h-3.5 text-wano-gold" />
              Calistenia y Capoeira
            </h1>
          </div>
        </div>

        {/* Level Stats Bar */}
        <div className="flex flex-col gap-2 w-full max-w-sm">
          <div className="flex items-center justify-between text-xs text-wano-parchment font-semibold">
            <span className="font-japanese text-xs tracking-wider flex items-center gap-1 text-wano-gold">
              <Shield className="w-3.5 h-3.5" />
              DISCIPLINA DEL SAMURÁI
            </span>
            <span className="font-mono text-[11px] text-[#dac8ac]">
              {character.xp} / {character.xpNeeded} XP
            </span>
          </div>
          
          {/* XP Progress Gate */}
          <div className="relative w-full h-3 bg-gray-900/90 border border-wano-gold/20 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-wano-crimson via-wano-crimson-light to-wano-gold transition-all duration-500 rounded-full"
              style={{ width: `${xpPercent}%` }}
            />
          </div>

          <p className="text-[10px] text-zinc-400 text-right italic font-mono">
            Falta {character.xpNeeded - character.xp} XP para ascender al siguiente nivel
          </p>
        </div>

        {/* Soundtrack & Audio Controls */}
        <Soundtrack />

      </div>
    </header>
  );
}
