// Every sound in the ship, as a synth recipe. `t` is the audio-clock start time.
export function defineSfx(audio) {
  audio.define('tap', (s, t) => s.tone({ at: t, freq: 880, to: 1250, dur: 0.06, vol: 0.08 }));
  audio.define('pickup', (s, t) => s.tone({ at: t, freq: 380, to: 900, dur: 0.14, type: 'sine', vol: 0.25 }));
  audio.define('land', (s, t) => {
    s.noise({ at: t, dur: 0.15, freq: 500, to: 150, vol: 0.25 });
    s.tone({ at: t, freq: 140, to: 60, dur: 0.12, type: 'sine', vol: 0.3 });
  });
  audio.define('giggle', (s, t) => {
    [1000, 1200, 1100, 1400].forEach((f, i) => s.tone({ at: t + i * 0.07, freq: f, to: f * 1.1, dur: 0.06, type: 'triangle', vol: 0.15 }));
  });
  audio.define('beep', (s, t) => s.tone({ at: t, freq: 660, dur: 0.18, vol: 0.12 }));
  audio.define('go', (s, t) => s.tone({ at: t, freq: 990, dur: 0.35, vol: 0.12 }));
  audio.define('blast', (s, t) => {
    s.noise({ at: t, dur: 2.6, freq: 150, to: 1400, vol: 0.4, attack: 0.3 });
    s.tone({ at: t, freq: 50, to: 140, dur: 2.6, type: 'sawtooth', vol: 0.12, attack: 0.3 });
  });
  audio.define('settle', (s, t) => s.noise({ at: t, dur: 1.4, freq: 1200, to: 120, vol: 0.2 }));
  audio.define('warp', (s, t) => {
    s.tone({ at: t, freq: 180, to: 1800, dur: 1.1, type: 'sine', vol: 0.18, attack: 0.2 });
    s.noise({ at: t, dur: 1.1, filter: 'bandpass', freq: 300, to: 4000, vol: 0.25, q: 3, attack: 0.2 });
  });
  audio.define('arrive', (s, t) => {
    s.tone({ at: t, freq: 1800, to: 260, dur: 0.9, type: 'sine', vol: 0.15 });
    [523, 659, 784, 1046].forEach((f, i) => s.tone({ at: t + 0.6 + i * 0.09, freq: f, dur: 0.15, type: 'triangle', vol: 0.12 }));
  });
  audio.define('boop', (s, t) => {
    s.tone({ at: t, freq: 520, to: 820, dur: 0.12, type: 'sine', vol: 0.25 });
    s.tone({ at: t + 0.16, freq: 820, to: 420, dur: 0.14, type: 'sine', vol: 0.25 });
    s.tone({ at: t + 0.34, freq: 640, to: 1100, dur: 0.1, type: 'sine', vol: 0.2 });
  });
  // The local cheering over a present.
  audio.define('cheer', (s, t) => {
    [659, 784, 988, 1318].forEach((f, i) => s.tone({ at: t + i * 0.07, freq: f, to: f * 1.05, dur: 0.12, type: 'triangle', vol: 0.14 }));
    [1200, 1500, 1350, 1700].forEach((f, i) => s.tone({ at: t + 0.32 + i * 0.07, freq: f, to: f * 1.1, dur: 0.06, type: 'triangle', vol: 0.12 }));
  });
  // The space plant shooting up a size.
  audio.define('grow', (s, t) => {
    [392, 494, 587, 784, 988].forEach((f, i) => s.tone({ at: t + i * 0.09, freq: f, to: f * 1.02, dur: 0.16, type: 'sine', vol: 0.18 }));
  });
  audio.define('peek', (s, t) => s.tone({ at: t, freq: 300, to: 700, dur: 0.18, type: 'triangle', vol: 0.15 }));
  audio.define('hide', (s, t) => s.tone({ at: t, freq: 700, to: 250, dur: 0.2, type: 'triangle', vol: 0.15 }));
  audio.define('wheee', (s, t) => {
    s.tone({ at: t, freq: 500, to: 1300, dur: 0.7, type: 'triangle', vol: 0.15 });
    s.tone({ at: t + 0.7, freq: 1300, to: 350, dur: 1.0, type: 'triangle', vol: 0.12 });
    s.noise({ at: t, dur: 1.6, filter: 'bandpass', freq: 800, to: 300, vol: 0.12, q: 2 });
  });
  audio.define('boing', (s, t) => {
    s.tone({ at: t, freq: 180, to: 620, dur: 0.15, type: 'sine', vol: 0.3 });
    s.tone({ at: t + 0.15, freq: 620, to: 300, dur: 0.25, type: 'sine', vol: 0.2 });
  });
  audio.define('chime', (s, t) => {
    [1318, 1568, 2093].forEach((f, i) => s.tone({ at: t + i * 0.08, freq: f, dur: 0.3, type: 'sine', vol: 0.1 }));
  });
  audio.define('open', (s, t) => {
    [523, 659, 784].forEach((f, i) => s.tone({ at: t + i * 0.06, freq: f, dur: 0.08, vol: 0.08 }));
  });
  audio.define('close', (s, t) => {
    [784, 523].forEach((f, i) => s.tone({ at: t + i * 0.06, freq: f, dur: 0.08, vol: 0.08 }));
  });
  audio.define('select', (s, t) => {
    s.tone({ at: t, freq: 1046, dur: 0.08, vol: 0.1 });
    s.tone({ at: t + 0.08, freq: 1568, dur: 0.12, vol: 0.1 });
  });
  audio.define('denied', (s, t) => {
    s.tone({ at: t, freq: 160, dur: 0.12, type: 'sawtooth', vol: 0.12 });
    s.tone({ at: t + 0.15, freq: 120, dur: 0.18, type: 'sawtooth', vol: 0.12 });
  });
  audio.define('door', (s, t) => {
    s.noise({ at: t, dur: 0.4, filter: 'bandpass', freq: 2400, to: 900, vol: 0.18, q: 1.5 });
    s.tone({ at: t + 0.3, freq: 220, to: 160, dur: 0.08, type: 'sine', vol: 0.2 });
  });
  audio.define('dive', (s, t) => {
    s.tone({ at: t, freq: 900, to: 160, dur: 2.2, type: 'triangle', vol: 0.12, attack: 0.3 });
    s.noise({ at: t, dur: 2.4, freq: 400, to: 2400, vol: 0.2, attack: 0.6 });
  });
  audio.define('descend', (s, t) => {
    s.noise({ at: t, dur: 2.7, freq: 900, to: 250, vol: 0.25, attack: 0.2 });
    s.tone({ at: t, freq: 90, to: 55, dur: 2.7, type: 'sawtooth', vol: 0.06, attack: 0.2 });
  });
  audio.define('thud', (s, t) => {
    s.tone({ at: t, freq: 120, to: 40, dur: 0.35, type: 'sine', vol: 0.4 });
    s.noise({ at: t, dur: 0.5, freq: 700, to: 100, vol: 0.3 });
  });
  // Giant bluebells: each one rings its own note of a pentatonic scale.
  [784, 880, 1046, 1175, 1318].forEach((f, i) => {
    audio.define(`bell${i}`, (s, t) => {
      s.tone({ at: t, freq: f, dur: 0.9, type: 'sine', vol: 0.18 });
      s.tone({ at: t, freq: f * 2.01, dur: 0.4, type: 'sine', vol: 0.05 });
      s.tone({ at: t + 0.12, freq: f, dur: 0.6, type: 'triangle', vol: 0.05 });
    });
  });
  // The bag: a gulp as something goes in, a pop as it comes out.
  audio.define('stash', (s, t) => {
    s.tone({ at: t, freq: 900, to: 220, dur: 0.18, type: 'sine', vol: 0.25 });
    s.tone({ at: t + 0.16, freq: 300, to: 180, dur: 0.1, type: 'triangle', vol: 0.15 });
  });
  audio.define('unpack', (s, t) => {
    s.tone({ at: t, freq: 300, to: 1200, dur: 0.12, type: 'sine', vol: 0.22 });
    s.tone({ at: t + 0.1, freq: 1568, dur: 0.1, type: 'triangle', vol: 0.08 });
  });
  audio.define('squeak', (s, t) => {
    s.tone({ at: t, freq: 1400, to: 2200, dur: 0.08, type: 'sine', vol: 0.15 });
    s.tone({ at: t + 0.1, freq: 1800, to: 2600, dur: 0.07, type: 'sine', vol: 0.12 });
  });
  // The meadow's secrets: a rock heaved over, a rustling bush and the bird
  // inside it, and a mole popping up out of its hole.
  audio.define('scrape', (s, t) => {
    s.noise({ at: t, dur: 0.25, filter: 'bandpass', freq: 600, to: 300, vol: 0.2, q: 2 });
    s.tone({ at: t + 0.22, freq: 150, to: 80, dur: 0.12, type: 'sine', vol: 0.3 });
  });
  audio.define('wriggle', (s, t) => {
    [0, 0.09, 0.18].forEach((d, i) => s.tone({ at: t + d, freq: 900 + i * 150, to: 1300 + i * 150, dur: 0.06, type: 'triangle', vol: 0.12 }));
  });
  audio.define('rustle', (s, t) => {
    for (let i = 0; i < 6; i++) {
      s.noise({ at: t + i * 0.06, dur: 0.07, filter: 'bandpass', freq: 1800 + (i % 2) * 900, vol: 0.12, q: 1.5 });
    }
  });
  audio.define('tweet', (s, t) => {
    [0, 0.14, 0.24].forEach((d) => s.tone({ at: t + d, freq: 2200, to: 3200, dur: 0.07, type: 'sine', vol: 0.12 }));
    s.tone({ at: t + 0.36, freq: 3000, to: 2000, dur: 0.15, type: 'sine', vol: 0.1 });
  });
  audio.define('pop', (s, t) => {
    s.tone({ at: t, freq: 200, to: 900, dur: 0.1, type: 'sine', vol: 0.28 });
    s.noise({ at: t, dur: 0.12, freq: 900, to: 200, vol: 0.12 });
  });
  audio.define('sniff', (s, t) => {
    [0, 0.12].forEach((d) => s.noise({ at: t + d, dur: 0.06, filter: 'bandpass', freq: 3500, vol: 0.1, q: 3 }));
  });
  audio.define('flutter', (s, t) => {
    for (let i = 0; i < 5; i++) {
      s.noise({ at: t + i * 0.05, dur: 0.04, filter: 'bandpass', freq: 3000, vol: 0.08, q: 2 });
    }
  });
}
