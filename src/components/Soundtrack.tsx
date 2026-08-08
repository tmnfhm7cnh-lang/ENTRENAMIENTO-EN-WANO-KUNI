/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Volume2, VolumeX, Music, Bell } from "lucide-react";

/**
 * WanoSynth — Sintetizador de música tradicional japonesa mejorado.
 *
 * Mejoras respecto a la versión anterior:
 * 1. Koto con ruido de ataque (pluck físico real de la cuerda)
 * 2. Inharmonicidad artificial — parciales ligeramente desafinados como una cuerda real
 * 3. Reverb convolution simulado con delay + feedback para espacio de sala
 * 4. Taiko con cuerpo de membrana (ruido bandpass) + golpe tonal
 * 5. Escala Hirajoshi auténtica (Do, Re, Mi♭, Sol, La♭) en lugar de Insen
 * 6. Fraseo musical con pausas y grupos de notas, no notas aleatorias sueltas
 */
class WanoSynth {
  private ctx: AudioContext | null = null;
  private reverbNode: ConvolverNode | null = null;
  private masterGain: GainNode | null = null;

  init() {
    if (this.ctx) {
      // Safari on iOS suspends the context when the page is backgrounded and
      // does not resume it on its own. Without this, everything below runs and
      // schedules notes into a context that is never advancing, which looks
      // exactly like "the music is broken".
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    this._buildReverb();
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  // Reverb sintético: delay + feedback simula una sala de madera tradicional
  private _buildReverb() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 1.8; // 1.8s de cola de reverb
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < bufferSize; i++) {
        // Decaimiento exponencial con ruido — simula reflexiones de madera
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2.5);
      }
    }
    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = buffer;
    // El reverb tiene su propio gain bajo para que no tape la melodía
    const reverbGain = ctx.createGain();
    reverbGain.gain.setValueAtTime(0.18, ctx.currentTime);
    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain);
  }

  private _getOutput(): AudioNode {
    return this.masterGain!;
  }

  // Pluck de koto con ataque físico y parciales inarmónicos
  playKoto(freq: number, time?: number) {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const t = time ?? ctx.currentTime;

    // --- Cuerda principal ---
    const osc = ctx.createOscillator();
    const envGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    // Ligero pitch bend descendente al inicio — cuerda que cede bajo tensión
    osc.frequency.exponentialRampToValueAtTime(freq * 0.985, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 1.1);

    envGain.gain.setValueAtTime(0, t);
    envGain.gain.linearRampToValueAtTime(0.28, t + 0.008); // ataque muy rápido
    envGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    // --- Parcial inarmónico (ligeramente desafinado +7 cents) ---
    const partial = ctx.createOscillator();
    const partialGain = ctx.createGain();
    partial.type = "sine";
    partial.frequency.setValueAtTime(freq * 2.007, t); // 2x + inharmonicidad
    partialGain.gain.setValueAtTime(0, t);
    partialGain.gain.linearRampToValueAtTime(0.09, t + 0.005);
    partialGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    // --- Ruido de ataque (pick/pluck) ---
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(freq * 3, t);
    noiseFilter.Q.setValueAtTime(1.5, t);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    // Conexiones
    osc.connect(envGain); envGain.connect(this._getOutput());
    partial.connect(partialGain); partialGain.connect(this._getOutput());
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(this._getOutput());

    // Mandar también al reverb
    if (this.reverbNode) {
      envGain.connect(this.reverbNode);
      partialGain.connect(this.reverbNode);
    }

    osc.start(t); osc.stop(t + 1.3);
    partial.start(t); partial.stop(t + 0.4);
    noise.start(t); noise.stop(t + 0.05);
  }

  // Taiko mejorado: cuerpo de membrana + golpe tonal
  playTaiko(time?: number) {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const t = time ?? ctx.currentTime;

    // Golpe tonal (cuerpo bajo del tambor)
    const toneOsc = ctx.createOscillator();
    const toneGain = ctx.createGain();
    toneOsc.type = "sine";
    toneOsc.frequency.setValueAtTime(68, t);
    toneOsc.frequency.exponentialRampToValueAtTime(28, t + 0.4);
    toneGain.gain.setValueAtTime(0.55, t);
    toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    // Membrana (ruido filtrado bajo)
    const membBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
    const membData = membBuffer.getChannelData(0);
    for (let i = 0; i < membData.length; i++) membData[i] = Math.random() * 2 - 1;
    const memb = ctx.createBufferSource();
    memb.buffer = membBuffer;
    const membFilter = ctx.createBiquadFilter();
    membFilter.type = "lowpass";
    membFilter.frequency.setValueAtTime(160, t);
    const membGain = ctx.createGain();
    membGain.gain.setValueAtTime(0.35, t);
    membGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    toneOsc.connect(toneGain); toneGain.connect(this._getOutput());
    memb.connect(membFilter); membFilter.connect(membGain); membGain.connect(this._getOutput());

    toneOsc.start(t); toneOsc.stop(t + 0.55);
    memb.start(t); memb.stop(t + 0.2);
  }

  playLevelUp() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Escala Hirajoshi ascendente: Do, Re, Mi♭, Sol, La♭
    const notes = [261.63, 293.66, 311.13, 392.00, 415.30, 523.25];
    notes.forEach((freq, idx) => {
      this.playKoto(freq, now + idx * 0.16);
    });
  }

  private melodyTimeout: any = null;
  private isMelodyPlaying = false;

  startMelody(muted: boolean) {
    if (this.isMelodyPlaying || muted) return;
    this.isMelodyPlaying = true;

    /**
     * Escala Hirajoshi auténtica (en La): A, B, C, E, F
     * Sonido claramente japonés, melancólico y limpio.
     * Las notas se agrupan en frases de 3-5 notas con pausas entre frases,
     * imitando la forma de tocar el koto tradicional.
     */
    const hirajoshi = [
      220.00,  // A3
      246.94,  // B3
      261.63,  // C4
      329.63,  // E4
      349.23,  // F4
      440.00,  // A4
      493.88,  // B4
      523.25,  // C5
      659.25,  // E5
    ];

    // Frases predefinidas: índices en la escala que forman motivos musicales coherentes
    const phrases = [
      [4, 3, 1, 0],           // descendente lento — apertura
      [0, 1, 3, 4, 3],        // ascenso y vuelta
      [5, 4, 3, 1],           // frase media
      [3, 4, 5, 8, 5],        // ascenso al agudo
      [8, 5, 4, 3, 1, 0],     // cascada descendente
      [0, 3, 1, 0],           // cierre mínimo
    ];

    let phraseIndex = 0;
    let noteIndex = 0;
    let pauseAfterPhrase = false;

    const playNext = () => {
      if (!this.isMelodyPlaying) return;
      this.init();

      if (pauseAfterPhrase) {
        pauseAfterPhrase = false;
        // Pausa entre frases: 1.2s - 2.5s (respiración musical)
        const pause = 1200 + Math.random() * 1300;
        this.melodyTimeout = setTimeout(playNext, pause);
        return;
      }

      const currentPhrase = phrases[phraseIndex % phrases.length];
      const noteIdx = currentPhrase[noteIndex];
      const freq = hirajoshi[noteIdx];
      this.playKoto(freq);

      noteIndex++;
      if (noteIndex >= currentPhrase.length) {
        noteIndex = 0;
        phraseIndex++;
        pauseAfterPhrase = true;
        // Nota final de frase suena más larga
        this.melodyTimeout = setTimeout(playNext, 900 + Math.random() * 400);
      } else {
        // Timing interno de frase: notas más rápidas o lentas según posición
        const noteDurations = [550, 400, 700, 350, 600];
        const dur = noteDurations[noteIndex % noteDurations.length] + Math.random() * 150;
        this.melodyTimeout = setTimeout(playNext, dur);
      }
    };

    // Pequeño delay inicial para que el audio context se estabilice
    this.melodyTimeout = setTimeout(playNext, 600);
  }

  stopMelody() {
    this.isMelodyPlaying = false;
    if (this.melodyTimeout) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }
  }
}

export const synthManager = new WanoSynth();

export default function Soundtrack() {
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!muted) {
      synthManager.startMelody(false);
    } else {
      synthManager.stopMelody();
    }
    return () => {
      synthManager.stopMelody();
    };
  }, [muted]);

  // These two used to be `disabled={muted}` AND to bail out on `muted`, so on a
  // fresh load the only two labelled buttons in the panel did nothing at all —
  // which is what made the whole feature look dead. Now they play on demand and
  // turn the sound on if it was off.
  const testPluck = () => {
    if (muted) setMuted(false);
    synthManager.init();
    const kotoNotes = [220.00, 246.94, 261.63, 329.63, 349.23, 440.00];
    const randomNote = kotoNotes[Math.floor(Math.random() * kotoNotes.length)];
    synthManager.playKoto(randomNote);
  };

  const testDrum = () => {
    if (muted) setMuted(false);
    synthManager.init();
    synthManager.playTaiko();
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (!nextMuted) {
      synthManager.init();
      setTimeout(() => synthManager.playKoto(329.63), 200);
    }
  };

  return (
    <div
      id="wano-synth-music"
      className="p-3 bg-wano-ink/90 border border-wano-gold/30 rounded-lg flex items-center justify-between gap-4 max-w-sm ml-auto z-20 shadow-lg"
    >
      <div className="flex items-center gap-2">
        <span className="p-1.5 bg-wano-crimson/20 rounded-full border border-wano-crimson/40 text-wano-gold-dark">
          <Music className="w-4 h-4" />
        </span>
        <div>
          <h4 className="font-japanese text-xs tracking-wider text-wano-parchment font-semibold">
            INSTRUMENTOS DE WANO
          </h4>
          <p className="text-[10px] text-gray-400 font-mono">
            {muted ? "Silencio" : "Melodía sonando"}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          id="btn-test-pluck"

          onClick={testPluck}
          className={`px-2 py-1 flex items-center gap-1 text-[10px] font-japanese tracking-wide rounded border transition-colors ${
            muted
              ? "bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed"
              : "bg-wano-crimson/20 text-wano-gold border-wano-gold/40 hover:bg-wano-crimson/40"
          }`}
          title="Tocar Koto de Sakura"
        >
          <Bell className="w-3 h-3" /> Koto
        </button>

        <button
          id="btn-test-drum"

          onClick={testDrum}
          className={`px-2 py-1 flex items-center gap-1 text-[10px] font-japanese tracking-wide rounded border transition-colors ${
            muted
              ? "bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed"
              : "bg-wano-crimson/20 text-wano-gold border-wano-gold/40 hover:bg-wano-crimson/40"
          }`}
          title="Tocar Tambor Taiko"
        >
          Tambor
        </button>

        <button
          id="btn-toggle-sound"
          onClick={toggleMute}
          className={`p-2 rounded-full transition-colors border ${
            muted
              ? "bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700"
              : "bg-wano-crimson text-wano-parchment border-wano-gold/50 hover:bg-wano-crimson-light"
          }`}
          title={muted ? "Activar Sonido" : "Silenciar"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
