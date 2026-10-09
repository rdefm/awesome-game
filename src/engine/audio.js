import { Cursor } from './sequencer.js';

// Tiny Web Audio synthesizer: every sound effect is generated from oscillators
// and noise at play time, so there are no audio files to load.
export class Synth {
  constructor() {
    this.ctx = null;
    this.sounds = {};
    this.muted = false;
  }

  // Browsers (iOS especially) only allow audio after a user gesture.
  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return;
      }
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  define(name, recipe) {
    this.sounds[name] = recipe;
  }

  play(name, opts = {}) {
    if (!this.ctx || this.muted || !this.sounds[name]) {
      return;
    }
    this.sounds[name](this, this.ctx.currentTime, opts);
  }

  // A pitched blip with optional slide from `freq` to `to`.
  tone({ at, freq, to = freq, dur = 0.1, type = 'square', vol = 0.2, attack = 0.005, out = this.master }) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), at + dur);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(vol, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  // Filtered white noise, for whooshes, rumbles and puffs.
  noise({ at, dur = 0.3, vol = 0.2, filter = 'lowpass', freq = 1000, to = freq, attack = 0.01, q = 1 }) {
    if (!this.noiseBuffer) {
      const len = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const biquad = this.ctx.createBiquadFilter();
    biquad.type = filter;
    biquad.Q.value = q;
    biquad.frequency.setValueAtTime(freq, at);
    biquad.frequency.exponentialRampToValueAtTime(Math.max(to, 1), at + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(vol, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(biquad).connect(gain).connect(this.master);
    src.start(at);
    src.stop(at + dur + 0.02);
  }
}

const AHEAD = 0.6; // seconds of notes handed to the audio clock at a time
const TICK_MS = 150;
const MUSIC_LEVEL = 0.6; // the music bus, kept under the sound effects
const FADE = 0.6; // seconds to fade a tune in or out

// Background music: plays one named tune at a time, looping, through its own
// volume bus under the sound effects. Asking for a tune before the first tap
// is fine: it waits for the browser to allow sound, then starts.
// Each tune has its own bus, so a later change can fade one out while the
// next fades in.
export class Music {
  constructor(synth) {
    this.synth = synth;
    this.tunes = {}; // name -> tune data (see sequencer.js)
    this.enabled = true;
    this.wanted = null; // name of the tune that should be playing
    this.current = null; // { name, cursor, startAt, bus }
    this.timer = null;
  }

  // Which tune should be playing (null for none). Same tune again is a no-op.
  setTune(name) {
    if (name === this.wanted) {
      return;
    }
    this.wanted = name;
    this.changeTune();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.changeTune();
  }

  changeTune() {
    const playing = this.enabled ? this.wanted : null;
    if (this.current && this.current.name !== playing) {
      this.fadeOut(this.current);
      this.current = null;
    }
    if (playing && !this.current && this.tunes[playing]) {
      this.begin(playing);
    }
    this.tick();
  }

  begin(name) {
    this.current = { name, cursor: new Cursor(this.tunes[name]), bus: null, startAt: 0 };
    if (!this.timer) {
      this.timer = setInterval(() => this.tick(), TICK_MS);
    }
  }

  fadeOut(player) {
    if (!player.bus) {
      return;
    }
    const now = this.synth.ctx.currentTime;
    player.bus.gain.cancelScheduledValues(now);
    player.bus.gain.setValueAtTime(player.bus.gain.value, now);
    player.bus.gain.linearRampToValueAtTime(0, now + FADE);
    setTimeout(() => player.bus.disconnect(), (FADE + 0.2) * 1000);
  }

  // Hands the next little stretch of notes to the audio clock.
  tick() {
    const { ctx } = this.synth;
    const player = this.current;
    if (!ctx || !player) {
      return; // no tap yet, or nothing to play
    }
    if (!player.bus) {
      player.bus = ctx.createGain();
      player.bus.gain.setValueAtTime(0.0001, ctx.currentTime);
      player.bus.gain.linearRampToValueAtTime(MUSIC_LEVEL, ctx.currentTime + FADE);
      player.bus.connect(this.synth.master);
      player.startAt = ctx.currentTime + 0.05;
    }
    for (const e of player.cursor.take(ctx.currentTime - player.startAt, AHEAD)) {
      this.synth.tone({ at: player.startAt + e.time, freq: e.freq, dur: e.dur, out: player.bus, ...e.instrument });
    }
  }
}
