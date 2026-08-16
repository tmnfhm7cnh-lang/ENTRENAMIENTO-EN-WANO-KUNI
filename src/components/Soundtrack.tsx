/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";
import { BEAT_SEC, eventsInWindow, SCALE_HZ, type Voice } from "../audio/score";

/**
 * WanoSynth — the instruments and the clock. The composition lives in ../audio/score.ts.
 *
 * Everything here is synthesised: no audio files, so nothing to license and nothing to download.
 * That is a real constraint, not a preference — this repository is public, so shipping a recording
 * would be publishing it. If Daniel picks a track with a licence that allows it, swapping this for
 * an <audio> loop is a smaller job than this file; see the README.
 *
 * Two structural fixes over the previous version, both audible:
 *
 * 1. There is a pulse. Notes are placed on a beat grid at a fixed tempo instead of being spaced by
 *    randomised setTimeout gaps.
 * 2. Notes are scheduled against `ctx.currentTime`, ahead of when they sound, so timing does not
 *    depend on a JS timer firing punctually. A 25 ms timer that slips — which on a phone it does,
 *    constantly — no longer turns into a note arriving late.
 */

const LOOKAHEAD_SEC = 0.35; // how far ahead notes are handed to the audio clock
const TICK_MS = 60; // how often the scheduler wakes up to top it up

class WanoSynth {
  private ctx: AudioContext | null = null;
  private reverb: ConvolverNode | null = null;
  private dry: GainNode | null = null;
  private master: GainNode | null = null;

  init() {
    if (this.ctx) {
      // Safari suspends the context when the page is backgrounded and does not resume it on its
      // own. Without this, everything below schedules into a clock that is not advancing, which
      // looks exactly like "the music is broken".
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    this.dry = this.ctx.createGain();
    this.dry.gain.value = 1;
    this.dry.connect(this.master);
    this.buildReverb();
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  /**
   * A wooden room, faked with a decaying-noise impulse response.
   * Shortened from 1.9 s to 0.8 s on 2026-08-14: a two-second tail on every note is a cavern, and a
   * cavern is half of why this sounded like a horror soundtrack. A small room is what a shamisen
   * played indoors actually sounds like.
   */
  private buildReverb() {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * 0.8);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = buf;
    const wet = ctx.createGain();
    wet.gain.value = 0.1;
    this.reverb.connect(wet);
    wet.connect(this.master!);
  }

  private noiseBurst(dur: number): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  private send(node: AudioNode, wetAmount: number) {
    node.connect(this.dry!);
    if (this.reverb && wetAmount > 0) {
      const tap = this.ctx!.createGain();
      tap.gain.value = wetAmount;
      node.connect(tap);
      tap.connect(this.reverb);
    }
  }

  /**
   * Shamisen. What separates it from the koto is the attack: a hard, buzzing snap — the sawari —
   * and a much faster decay. Built as a detuned saw pair through a lowpass, plus a filtered noise
   * click on top of the onset.
   */
  playShamisen(freq: number, t: number, dur = 0.5, gain = 0.7) {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.22 * gain, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.06 * gain, t + Math.min(0.09, dur * 0.3));
    env.gain.exponentialRampToValueAtTime(0.0008, t + dur);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(freq * 7, t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, freq * 2.2), t + dur);
    lp.Q.value = 0.9;

    for (const detune of [0, 8]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(lp);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
    lp.connect(env);

    const click = this.noiseBurst(0.03);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq * 4;
    bp.Q.value = 1.1;
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.1 * gain, t);
    clickGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.035);
    click.connect(bp);
    bp.connect(clickGain);
    click.start(t);
    click.stop(t + 0.04);

    this.send(env, 0.5);
    this.send(clickGain, 0.2);
  }

  /** Koto: a cleaner pluck than the shamisen, with a long tail and a slightly sharp partial. */
  playKoto(freq: number, t?: number, dur = 1.2, gain = 0.8) {
    this.init();
    const ctx = this.ctx!;
    t = t ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.988, t + 0.07);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.26 * gain, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(env);
    osc.start(t);
    osc.stop(t + dur + 0.05);

    const partial = ctx.createOscillator();
    const pg = ctx.createGain();
    partial.type = "sine";
    partial.frequency.value = freq * 2.007; // inharmonic, like a real string
    pg.gain.setValueAtTime(0, t);
    pg.gain.linearRampToValueAtTime(0.08 * gain, t + 0.005);
    pg.gain.exponentialRampToValueAtTime(0.001, t + Math.min(0.4, dur));
    partial.connect(pg);
    partial.start(t);
    partial.stop(t + Math.min(0.45, dur) + 0.05);

    const pluck = this.noiseBurst(0.04);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq * 3;
    bp.Q.value = 1.5;
    const pluckGain = ctx.createGain();
    pluckGain.gain.setValueAtTime(0.1 * gain, t);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    pluck.connect(bp);
    bp.connect(pluckGain);
    pluck.start(t);
    pluck.stop(t + 0.05);

    this.send(env, 0.6);
    this.send(pg, 0.6);
    this.send(pluckGain, 0.2);
  }

  /**
   * A flute tone. Deliberately steadier and much less breathy than before.
   * The old one drifted up 0.6% and back down over a two-and-a-half second note, over a bed of
   * bandpassed noise — a wavering, airy, unsteady pitch, which is the single most reliable way to
   * make anything sound haunted. It now holds its pitch, and the breath is a quarter of what it was.
   */
  playFlute(freq: number, t: number, dur = 2.5, gain = 0.45) {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.1 * gain, t + 0.1);
    env.gain.setValueAtTime(0.1 * gain, t + dur * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0008, t + dur);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(env);
    osc.start(t);
    osc.stop(t + dur + 0.05);

    // A soft octave above, which brightens the tone without the noise doing the work.
    const shimmer = ctx.createOscillator();
    const sg = ctx.createGain();
    shimmer.type = "sine";
    shimmer.frequency.value = freq * 2;
    sg.gain.setValueAtTime(0, t);
    sg.gain.linearRampToValueAtTime(0.025 * gain, t + 0.12);
    sg.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    shimmer.connect(sg);
    shimmer.start(t);
    shimmer.stop(t + dur + 0.05);

    const breath = this.noiseBurst(0.16);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq * 2.4;
    bp.Q.value = 3;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.012 * gain, t);
    bg.gain.exponentialRampToValueAtTime(0.0004, t + 0.16);
    breath.connect(bp);
    bp.connect(bg);
    breath.start(t);
    breath.stop(t + 0.17);

    this.send(env, 0.35);
    this.send(sg, 0.35);
    this.send(bg, 0.2);
  }

  /**
   * Taiko: a struck drum, not a subwoofer.
   * It used to sweep 72 Hz down to 28 and ring for half a second, which is the sound design of a
   * trailer for something bad happening. A real taiko has a pitched, woody centre and stops. Raised
   * to 130 → 70 Hz and cut to a third of the length on 2026-08-14.
   */
  playTaiko(t?: number, gain = 1) {
    this.init();
    const ctx = this.ctx!;
    t = t ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.1);
    env.gain.setValueAtTime(0.42 * gain, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(env);
    osc.start(t);
    osc.stop(t + 0.2);

    // The wooden crack of the stick, which is what makes it read as "struck" rather than "boomed".
    const memb = this.noiseBurst(0.09);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 0.8;
    const mg = ctx.createGain();
    mg.gain.setValueAtTime(0.16 * gain, t);
    mg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    memb.connect(bp);
    bp.connect(mg);
    memb.start(t);
    memb.stop(t + 0.1);

    this.send(env, 0.2);
    this.send(mg, 0.15);
  }

  /** Tsuzumi: the small hand drum. Short, high, dry — it marks time where the taiko marks weight. */
  playTsuzumi(t: number, gain = 0.7) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(190, t + 0.09);
    env.gain.setValueAtTime(0.16 * gain, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(env);
    osc.start(t);
    osc.stop(t + 0.15);

    const skin = this.noiseBurst(0.05);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1500;
    bp.Q.value = 1.4;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.11 * gain, t);
    sg.gain.exponentialRampToValueAtTime(0.0006, t + 0.05);
    skin.connect(bp);
    bp.connect(sg);
    skin.start(t);
    skin.stop(t + 0.06);

    this.send(env, 0.3);
    this.send(sg, 0.2);
  }

  playLevelUp() {
    this.init();
    const t0 = this.ctx!.currentTime;
    [0, 1, 2, 3, 5, 7].forEach((deg, i) => this.playKoto(SCALE_HZ[deg], t0 + i * 0.15));
    this.playTaiko(t0);
  }

  private voice(v: Voice, freq: number, t: number, dur: number, gain: number) {
    if (v === "shamisen") this.playShamisen(freq, t, dur, gain);
    else if (v === "koto") this.playKoto(freq, t, dur, gain);
    else if (v === "flute") this.playFlute(freq, t, dur, gain);
    else if (v === "taiko") this.playTaiko(t, gain);
    else this.playTsuzumi(t, gain);
  }

  private timer: any = null;
  private playing = false;
  private startTime = 0;
  /** Beats already handed to the audio clock. The scheduler never looks back. */
  private scheduledTo = 0;

  startMelody(muted: boolean) {
    if (this.playing || muted) return;
    this.init();
    this.playing = true;
    // A beat of headroom so the first downbeat is not late on a cold context.
    this.startTime = this.ctx!.currentTime + 0.15;
    this.scheduledTo = 0;

    const tick = () => {
      if (!this.playing || !this.ctx) return;
      const ahead = (this.ctx.currentTime - this.startTime + LOOKAHEAD_SEC) / BEAT_SEC;
      if (ahead > this.scheduledTo) {
        for (const e of eventsInWindow(this.scheduledTo, ahead)) {
          const t = this.startTime + e.absBeat * BEAT_SEC;
          if (t < this.ctx.currentTime) continue; // context was suspended; let it go rather than pile up
          const freq = e.degree === undefined ? 0 : SCALE_HZ[e.degree];
          this.voice(e.voice, freq, t, e.dur ?? 0.9, e.gain ?? 0.7);
        }
        this.scheduledTo = ahead;
      }
      this.timer = setTimeout(tick, TICK_MS);
    };
    tick();
  }

  stopMelody() {
    this.playing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const synthManager = new WanoSynth();

export default function Soundtrack() {
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!muted) synthManager.startMelody(false);
    else synthManager.stopMelody();
    return () => synthManager.stopMelody();
  }, [muted]);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    if (!next) synthManager.init();
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
            MÚSICA
          </h4>
          <p className="text-[10px] text-gray-400 font-mono">{muted ? "Silencio" : "Sonando"}</p>
        </div>
      </div>

      <button
        id="btn-toggle-sound"
        onClick={toggle}
        className={`p-2 rounded-full transition-colors border ${
          muted
            ? "bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700"
            : "bg-wano-crimson text-wano-parchment border-wano-gold/50 hover:bg-wano-crimson-light"
        }`}
        title={muted ? "Activar sonido" : "Silenciar"}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
