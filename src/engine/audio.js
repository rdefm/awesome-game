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
  tone({ at, freq, to = freq, dur = 0.1, type = 'square', vol = 0.2, attack = 0.005 }) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), at + dur);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(vol, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(this.master);
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
