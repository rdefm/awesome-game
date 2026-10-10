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
  // The snack locker: a creaky swing open, a clunk shut.
  audio.define('lockerOpen', (s, t) => {
    s.noise({ at: t, dur: 0.06, freq: 900, to: 300, vol: 0.2 });
    s.tone({ at: t + 0.04, freq: 300, to: 520, dur: 0.3, type: 'triangle', vol: 0.08 });
  });
  audio.define('lockerShut', (s, t) => {
    s.tone({ at: t, freq: 420, to: 260, dur: 0.2, type: 'triangle', vol: 0.08 });
    s.noise({ at: t + 0.22, dur: 0.1, freq: 600, to: 150, vol: 0.3 });
    s.tone({ at: t + 0.22, freq: 120, to: 70, dur: 0.1, type: 'sine', vol: 0.25 });
  });
  // A friend chomping a snack.
  audio.define('munch', (s, t) => {
    s.noise({ at: t, dur: 0.06, filter: 'bandpass', freq: 1800, to: 900, vol: 0.25, q: 2 });
    s.noise({ at: t + 0.09, dur: 0.05, filter: 'bandpass', freq: 1500, to: 700, vol: 0.2, q: 2 });
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
  // Chatter blips, one per line said in a chat: the pink alien warbles high,
  // she babbles a little lower.
  audio.define('chatAlien', (s, t) => {
    [1100, 1500, 1250].forEach((f, i) => s.tone({ at: t + i * 0.06, freq: f, to: f * 1.15, dur: 0.05, type: 'sine', vol: 0.12 }));
  });
  audio.define('chatGirl', (s, t) => {
    [620, 760, 680].forEach((f, i) => s.tone({ at: t + i * 0.06, freq: f, to: f * 0.95, dur: 0.05, type: 'triangle', vol: 0.12 }));
  });
  // Every other friend's chatter: the puffball squeaks, the newt drawls
  // (it's too hot to hurry), the yetis hoot (baby higher), the gummy bear
  // wobbles, Ginger jingles, Zig buzzes, and the lava family rumble, hum and
  // gurgle, biggest to smallest.
  const chatter = (name, freqs, { gap = 0.06, dur = 0.05, bend = 1, type = 'sine', vol = 0.12 } = {}) => {
    audio.define(name, (s, t) => {
      freqs.forEach((f, i) => s.tone({ at: t + i * gap, freq: f, to: f * bend, dur, type, vol }));
    });
  };
  chatter('chatPuff', [1600, 2000, 1800], { gap: 0.05, dur: 0.04, bend: 1.3, vol: 0.1 });
  chatter('chatNewt', [380, 340, 300], { gap: 0.11, dur: 0.1, bend: 0.85, type: 'triangle' });
  chatter('chatMumYeti', [220, 262, 220], { gap: 0.1, dur: 0.09, bend: 1.1, vol: 0.2 });
  chatter('chatBabyYeti', [520, 620, 560], { gap: 0.07, dur: 0.06, bend: 1.15, vol: 0.16 });
  chatter('chatGummy', [300, 380, 320], { gap: 0.07, dur: 0.07, bend: 0.8, vol: 0.18 });
  chatter('chatGinger', [1320, 1568, 1397], { gap: 0.06, dur: 0.06, type: 'triangle', vol: 0.08 });
  chatter('chatZig', [800, 1000, 900], { gap: 0.05, dur: 0.05, bend: 1.2, type: 'square', vol: 0.04 });
  chatter('chatLavaDad', [150, 175, 140], { gap: 0.1, dur: 0.09, bend: 0.9, type: 'triangle', vol: 0.2 });
  chatter('chatLavaMum', [392, 440, 392], { gap: 0.09, dur: 0.08, bend: 1.05, vol: 0.14 });
  chatter('chatCrew', [980, 1180, 1050], { gap: 0.06, dur: 0.05, bend: 1.1, type: 'triangle', vol: 0.12 });
  chatter('chatMonkey', [880, 1175, 880, 1175], { gap: 0.06, dur: 0.05, bend: 1.25, vol: 0.12 });
  chatter('chatGonzo', [440, 330, 494], { gap: 0.08, dur: 0.07, bend: 0.7, type: 'square', vol: 0.05 });
  chatter('chatLavaBaby', [700, 840, 760], { gap: 0.06, dur: 0.05, bend: 1.2, vol: 0.14 });
  chatter('chatTreeDad', [110, 98, 123], { gap: 0.14, dur: 0.12, bend: 0.92, type: 'triangle', vol: 0.22 });
  chatter('chatTreeMum', [523, 587, 494], { gap: 0.09, dur: 0.09, bend: 1.04, type: 'triangle', vol: 0.12 });
  chatter('chatTreeKid', [900, 1100, 1000], { gap: 0.05, dur: 0.05, bend: 1.15, type: 'triangle', vol: 0.12 });
  chatter('chatShroom', [1240, 1100, 1320], { gap: 0.09, dur: 0.035, bend: 0.9, vol: 0.05 });
  // Monkey or Gonzo smacking into a tree trunk off the rope swing: a big
  // thwack, and a wobbly boinggg.
  audio.define('smack', (s, t) => {
    s.noise({ at: t, dur: 0.12, freq: 2400, to: 300, vol: 0.45 });
    s.tone({ at: t, freq: 160, to: 50, dur: 0.2, type: 'sine', vol: 0.45 });
    s.tone({ at: t + 0.12, freq: 300, to: 180, dur: 0.5, type: 'triangle', vol: 0.12 });
    s.tone({ at: t + 0.12, freq: 306, to: 186, dur: 0.5, type: 'triangle', vol: 0.12 });
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
  // The fairy ring in the grove: a twinkle down to tiny, and tiny squeaky steps.
  audio.define('shrink', (s, t) => {
    [2637, 2349, 2093, 1760, 1568].forEach((f, i) => s.tone({ at: t + i * 0.05, freq: f, to: f * 0.9, dur: 0.1, type: 'triangle', vol: 0.07 }));
  });
  // The glow pond in the grove: a deep watery bloop, and a lily opening with a
  // soft rising shimmer.
  audio.define('bloop', (s, t) => {
    s.tone({ at: t, freq: 320, to: 140, dur: 0.18, type: 'sine', vol: 0.22 });
    s.tone({ at: t + 0.12, freq: 1320, to: 1760, dur: 0.3, type: 'sine', vol: 0.05, attack: 0.04 });
    s.tone({ at: t + 0.2, freq: 1760, to: 2093, dur: 0.3, type: 'sine', vol: 0.04, attack: 0.04 });
  });
  audio.define('bloom', (s, t) => {
    [1047, 1319, 1568, 2093].forEach((f, i) => s.tone({ at: t + i * 0.07, freq: f, dur: 0.35, type: 'sine', vol: 0.06, attack: 0.03 }));
  });
  audio.define('tinystep', (s, t) => s.tone({ at: t, freq: 2600, to: 3400, dur: 0.04, type: 'sine', vol: 0.06 }));
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
  // Ember: a fire flower flaring, the newt's hiss of steam, a geode cracking,
  // the vent rumbling then whooshing, and the lava pool going blorp.
  audio.define('flare', (s, t) => {
    s.noise({ at: t, dur: 0.35, filter: 'bandpass', freq: 500, to: 1600, vol: 0.18, q: 1 });
    s.tone({ at: t, freq: 220, to: 660, dur: 0.25, type: 'triangle', vol: 0.08 });
  });
  audio.define('sizzle', (s, t) => {
    s.noise({ at: t, dur: 0.7, filter: 'highpass', freq: 4000, to: 2500, vol: 0.12 });
    s.tone({ at: t + 0.5, freq: 520, to: 380, dur: 0.3, type: 'sine', vol: 0.1 });
  });
  audio.define('crack', (s, t) => {
    s.noise({ at: t, dur: 0.12, filter: 'bandpass', freq: 2500, to: 800, vol: 0.3, q: 1.5 });
    s.tone({ at: t, freq: 180, to: 70, dur: 0.15, type: 'sine', vol: 0.3 });
  });
  audio.define('rumble', (s, t) => {
    s.noise({ at: t, dur: 0.8, filter: 'lowpass', freq: 200, to: 400, vol: 0.35 });
    s.tone({ at: t, freq: 50, to: 70, dur: 0.8, type: 'sine', vol: 0.25 });
  });
  audio.define('whoosh', (s, t) => s.noise({ at: t, dur: 1.2, filter: 'bandpass', freq: 800, to: 3000, vol: 0.25, q: 0.7 }));
  audio.define('blorp', (s, t) => {
    s.tone({ at: t, freq: 140, to: 420, dur: 0.12, type: 'sine', vol: 0.3 });
    s.tone({ at: t + 0.1, freq: 260, to: 120, dur: 0.1, type: 'sine', vol: 0.15 });
  });
  // Frosty: mum yeti's soft friendly hoot, a puff of snow, and a frost
  // flower's tinkle.
  audio.define('hoo', (s, t) => {
    s.tone({ at: t, freq: 196, to: 247, dur: 0.22, type: 'sine', vol: 0.3 });
    s.tone({ at: t + 0.28, freq: 247, to: 196, dur: 0.3, type: 'sine', vol: 0.28 });
  });
  audio.define('poof', (s, t) => s.noise({ at: t, dur: 0.25, filter: 'lowpass', freq: 1800, to: 400, vol: 0.22 }));
  audio.define('tinkle', (s, t) => {
    [2093, 2637, 3136, 2637].forEach((f, i) => s.tone({ at: t + i * 0.06, freq: f, dur: 0.12, type: 'triangle', vol: 0.07 }));
  });
  // Candy: Ginger's jingly dance, the oven's ding, the gummy bear's jelly
  // wobble and its lick, and the gingerbread house's door.
  audio.define('jingle', (s, t) => {
    [1568, 2093, 1760, 2349, 2093].forEach((f, i) => s.tone({ at: t + i * 0.09, freq: f, dur: 0.1, type: 'triangle', vol: 0.08 }));
  });
  audio.define('ding', (s, t) => {
    s.tone({ at: t, freq: 1760, dur: 0.8, type: 'sine', vol: 0.18 });
    s.tone({ at: t, freq: 3520, dur: 0.3, type: 'sine', vol: 0.05 });
  });
  audio.define('wobble', (s, t) => {
    s.tone({ at: t, freq: 220, to: 330, dur: 0.1, type: 'sine', vol: 0.25 });
    s.tone({ at: t + 0.1, freq: 330, to: 200, dur: 0.1, type: 'sine', vol: 0.22 });
    s.tone({ at: t + 0.2, freq: 260, to: 300, dur: 0.12, type: 'sine', vol: 0.18 });
  });
  audio.define('lick', (s, t) => {
    s.noise({ at: t, dur: 0.18, filter: 'bandpass', freq: 1200, to: 2400, vol: 0.15, q: 2 });
    s.tone({ at: t + 0.05, freq: 600, to: 900, dur: 0.12, type: 'sine', vol: 0.1 });
  });
  // On the ship: Monkey's "ooh ooh!", Gonzo's drumroll and his ta-da.
  audio.define('oohooh', (s, t) => {
    [0, 0.18].forEach((at) => s.tone({ at: t + at, freq: 500, to: 900, dur: 0.14, type: 'sine', vol: 0.2 }));
  });
  audio.define('drumroll', (s, t) => {
    for (let i = 0; i < 8; i++) {
      s.noise({ at: t + i * 0.055, dur: 0.05, filter: 'lowpass', freq: 600, to: 300, vol: 0.12 + i * 0.015 });
    }
  });
  audio.define('tada', (s, t) => {
    s.tone({ at: t, freq: 784, dur: 0.12, type: 'triangle', vol: 0.12 });
    s.tone({ at: t + 0.12, freq: 1047, dur: 0.4, type: 'triangle', vol: 0.12 });
    s.tone({ at: t + 0.12, freq: 1319, dur: 0.4, type: 'triangle', vol: 0.08 });
  });
  // The pink alien sniffing a posy: a little "ah... ah..." and a happy "CHOO!".
  audio.define('sneeze', (s, t) => {
    s.tone({ at: t, freq: 600, to: 760, dur: 0.18, type: 'sine', vol: 0.12 });
    s.tone({ at: t + 0.28, freq: 700, to: 900, dur: 0.2, type: 'sine', vol: 0.14 });
    s.noise({ at: t + 0.55, dur: 0.22, filter: 'bandpass', freq: 3000, to: 900, vol: 0.3, q: 1 });
    s.tone({ at: t + 0.55, freq: 1100, to: 500, dur: 0.16, type: 'triangle', vol: 0.12 });
  });
  audio.define('creak', (s, t) => {
    s.tone({ at: t, freq: 300, to: 480, dur: 0.25, type: 'triangle', vol: 0.08 });
    s.tone({ at: t + 0.22, freq: 420, to: 340, dur: 0.15, type: 'triangle', vol: 0.06 });
  });
  // Stripey: a stripe stone's plink (opts.note picks how high, up a happy
  // scale), Zig's wobbly "zig-zig!", and a cactus slurping juice.
  audio.define('plink', (s, t, { note = 0 } = {}) => {
    const scale = [523, 587, 659, 784, 880, 1047, 1175, 1319];
    const f = scale[Math.max(0, Math.min(scale.length - 1, note))];
    s.tone({ at: t, freq: f, dur: 0.25, type: 'sine', vol: 0.2 });
    s.tone({ at: t, freq: f * 4, dur: 0.05, type: 'sine', vol: 0.05 });
  });
  audio.define('zig', (s, t) => {
    [0, 0.14].forEach((d) => s.tone({ at: t + d, freq: 700, to: 1100, dur: 0.1, type: 'square', vol: 0.06 }));
    s.tone({ at: t + 0.3, freq: 1100, to: 500, dur: 0.2, type: 'triangle', vol: 0.1 });
  });
  audio.define('slurp', (s, t) => {
    s.noise({ at: t, dur: 0.25, filter: 'bandpass', freq: 600, to: 1400, vol: 0.2, q: 3 });
    s.tone({ at: t + 0.05, freq: 300, to: 200, dur: 0.15, type: 'sine', vol: 0.1 });
  });
  // The lava family: dad's big belly laugh, mum humming a little tune, and
  // the cradle's lullaby.
  audio.define('hoho', (s, t) => {
    [0, 0.2, 0.4].forEach((d, i) => s.tone({ at: t + d, freq: 220 - i * 15, to: 160 - i * 15, dur: 0.16, type: 'triangle', vol: 0.2 }));
  });
  audio.define('hum', (s, t) => {
    [392, 440, 523, 440, 392].forEach((f, i) => s.tone({ at: t + i * 0.22, freq: f, dur: 0.2, type: 'sine', vol: 0.14, attack: 0.04 }));
  });
  audio.define('lullaby', (s, t) => {
    [659, 523, 587, 392, 523, 587, 659, 523].forEach((f, i) => s.tone({ at: t + i * 0.35, freq: f, dur: 0.32, type: 'sine', vol: 0.12, attack: 0.05 }));
  });
  // A star sticker found: a twinkly run up to a held chord.
  audio.define('fanfare', (s, t) => {
    [784, 988, 1175, 1568].forEach((f, i) => s.tone({ at: t + i * 0.08, freq: f, dur: 0.1, type: 'triangle', vol: 0.13 }));
    [1047, 1319, 1568].forEach((f) => s.tone({ at: t + 0.36, freq: f, dur: 0.5, type: 'triangle', vol: 0.09 }));
    [2600, 3100, 2800].forEach((f, i) => s.tone({ at: t + 0.4 + i * 0.1, freq: f, to: f * 1.2, dur: 0.05, type: 'sine', vol: 0.06 }));
  });
  // The hoverbike humming up off the ground and settling back down, and the
  // soft bloop of a place on its town map bouncing to say "come here!".
  audio.define('hoverUp', (s, t) => {
    s.tone({ at: t, freq: 110, to: 330, dur: 0.5, type: 'sawtooth', vol: 0.06, attack: 0.05 });
    s.tone({ at: t, freq: 660, to: 990, dur: 0.5, type: 'sine', vol: 0.08, attack: 0.05 });
  });
  audio.define('hoverDown', (s, t) => {
    s.tone({ at: t, freq: 330, to: 100, dur: 0.4, type: 'sawtooth', vol: 0.05 });
    s.tone({ at: t, freq: 990, to: 520, dur: 0.4, type: 'sine', vol: 0.07 });
  });
  audio.define('mapPop', (s, t) => s.tone({ at: t, freq: 520, to: 1040, dur: 0.12, type: 'sine', vol: 0.07 }));
  // The milkshake lake: a cherry bobbing under with a plop, and the wafer boat's toot.
  audio.define('plop', (s, t) => {
    s.tone({ at: t, freq: 900, to: 220, dur: 0.12, type: 'sine', vol: 0.25 });
    s.noise({ at: t + 0.05, dur: 0.15, filter: 'bandpass', freq: 1200, to: 500, vol: 0.12, q: 2 });
  });
  audio.define('toot', (s, t) => {
    s.tone({ at: t, freq: 392, dur: 0.18, type: 'triangle', vol: 0.15 });
    s.tone({ at: t + 0.22, freq: 392, dur: 0.35, type: 'triangle', vol: 0.15 });
  });
  // The oasis: the stripy frog's croak, and its dive into the pool.
  audio.define('ribbit', (s, t) => {
    s.tone({ at: t, freq: 160, to: 260, dur: 0.09, type: 'square', vol: 0.08 });
    s.tone({ at: t + 0.13, freq: 180, to: 300, dur: 0.12, type: 'square', vol: 0.08 });
  });
  audio.define('splash', (s, t) => {
    s.tone({ at: t, freq: 700, to: 180, dur: 0.15, type: 'sine', vol: 0.22 });
    s.noise({ at: t, dur: 0.5, filter: 'bandpass', freq: 2200, to: 600, vol: 0.2, q: 1 });
  });
  // Bluebell's stream: a friend shaking itself dry, brrrr.
  audio.define('shake', (s, t) => {
    [0, 0.07, 0.14, 0.21, 0.28].forEach((d) => s.noise({ at: t + d, dur: 0.06, filter: 'bandpass', freq: 2600, to: 1600, vol: 0.14, q: 1 }));
  });
  // Bluebell's dandelion clock: her big breathy blow, the seeds scattering.
  audio.define('blow', (s, t) => {
    s.noise({ at: t, dur: 0.7, filter: 'bandpass', freq: 1200, to: 500, vol: 0.2, q: 0.6, attack: 0.08 });
    [1760, 2093, 2349, 2637].forEach((f, i) => s.tone({ at: t + 0.25 + i * 0.07, freq: f, dur: 0.18, type: 'sine', vol: 0.05 }));
  });
  // Bluebell's kite: a gust of wind catching it, swooping it up into the sky.
  audio.define('swoop', (s, t) => {
    s.noise({ at: t, dur: 0.9, filter: 'bandpass', freq: 400, to: 1800, vol: 0.18, q: 0.8, attack: 0.15 });
    s.tone({ at: t + 0.1, freq: 330, to: 990, dur: 0.6, type: 'sine', vol: 0.08 });
  });
  // Bluebell's rain cloud: a shower pattering down, and the rainbow after it.
  audio.define('rain', (s, t) => {
    s.noise({ at: t, dur: 4, filter: 'bandpass', freq: 2600, to: 1800, vol: 0.12, q: 0.7, attack: 0.4 });
    for (let i = 0; i < 24; i++) {
      s.tone({ at: t + 0.2 + i * 0.15 + Math.random() * 0.1, freq: 1400 + Math.random() * 1200, to: 600, dur: 0.05, type: 'sine', vol: 0.04 });
    }
  });
  audio.define('rainbow', (s, t) => {
    [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => s.tone({ at: t + i * 0.1, freq: f, dur: 0.5, type: 'sine', vol: 0.07 }));
  });
  // Decor: the printer whirring away, and a lamp's switch.
  audio.define('whirr', (s, t) => {
    s.tone({ at: t, freq: 220, to: 330, dur: 0.9, type: 'square', vol: 0.05, attack: 0.1 });
    s.noise({ at: t, dur: 0.9, filter: 'bandpass', freq: 1200, to: 1800, vol: 0.12, q: 4, attack: 0.1 });
    [0.2, 0.45, 0.7].forEach((d) => s.tone({ at: t + d, freq: 660, to: 880, dur: 0.05, type: 'triangle', vol: 0.08 }));
  });
  audio.define('click', (s, t) => {
    s.noise({ at: t, dur: 0.03, filter: 'highpass', freq: 3000, vol: 0.2 });
    s.tone({ at: t, freq: 1400, to: 900, dur: 0.03, type: 'square', vol: 0.06 });
  });
  // The lift: its doors sliding, and a gentle hum on the way up or down.
  audio.define('liftDoors', (s, t) => s.noise({ at: t, dur: 0.45, filter: 'bandpass', freq: 900, to: 1400, vol: 0.12, q: 2, attack: 0.05 }));
  audio.define('liftHum', (s, t) => {
    s.tone({ at: t, freq: 110, to: 165, dur: 1, type: 'triangle', vol: 0.1, attack: 0.2 });
    s.noise({ at: t, dur: 1, filter: 'lowpass', freq: 500, to: 700, vol: 0.08, attack: 0.2 });
  });
  // The bunk room: a soft snore (in, then a whistly out), and a big yawn.
  audio.define('snore', (s, t) => {
    s.noise({ at: t, dur: 0.6, filter: 'lowpass', freq: 300, to: 500, vol: 0.12, attack: 0.25 });
    s.tone({ at: t + 0.75, freq: 900, to: 700, dur: 0.35, type: 'sine', vol: 0.03, attack: 0.1 });
  });
  audio.define('yawn', (s, t) => {
    s.tone({ at: t, freq: 330, to: 520, dur: 0.35, type: 'triangle', vol: 0.1, attack: 0.08 });
    s.tone({ at: t + 0.35, freq: 520, to: 220, dur: 0.6, type: 'triangle', vol: 0.1 });
  });
  // The galley's mixing pot: a big happy burp when a recipe works, and a
  // sad little fizzle when it doesn't.
  audio.define('burp', (s, t) => {
    s.tone({ at: t, freq: 95, to: 70, dur: 0.35, type: 'sawtooth', vol: 0.14, attack: 0.03 });
    s.noise({ at: t, dur: 0.3, filter: 'lowpass', freq: 400, to: 200, vol: 0.15 });
  });
  // The pod's kettle: its lid rattling as it heats up, then a cheerful
  // whistled tune.
  audio.define('rattle', (s, t) => {
    [0, 0.05, 0.1].forEach((d) => s.noise({ at: t + d, dur: 0.04, filter: 'bandpass', freq: 2400, vol: 0.1, q: 4 }));
  });
  audio.define('whistle', (s, t) => {
    s.tone({ at: t, freq: 1200, to: 1760, dur: 0.3, type: 'sine', vol: 0.08, attack: 0.1 });
    [1760, 1976, 2217, 1976, 2349, 2217, 1760].forEach((f, i) => s.tone({ at: t + 0.3 + i * 0.16, freq: f, dur: 0.15, type: 'sine', vol: 0.08 }));
    s.noise({ at: t, dur: 1.5, filter: 'highpass', freq: 4000, vol: 0.05, attack: 0.1 });
  });
  // A drawer in the pod's dresser sliding open.
  audio.define('drawer', (s, t) => {
    s.noise({ at: t, dur: 0.25, filter: 'lowpass', freq: 700, to: 1400, vol: 0.18, attack: 0.02 });
    s.tone({ at: t + 0.22, freq: 180, to: 140, dur: 0.06, type: 'triangle', vol: 0.1 });
  });
  // The pod's light cord tugged (a click, and a little rising ding as the
  // lights change), and its photo frame's camera: a shutter click-clack.
  audio.define('pullcord', (s, t) => {
    s.noise({ at: t, dur: 0.03, filter: 'highpass', freq: 2500, vol: 0.15 });
    s.tone({ at: t + 0.04, freq: 880, to: 1320, dur: 0.18, type: 'triangle', vol: 0.1 });
  });
  audio.define('shutter', (s, t) => {
    s.noise({ at: t, dur: 0.025, filter: 'highpass', freq: 3500, vol: 0.22 });
    s.noise({ at: t + 0.07, dur: 0.035, filter: 'bandpass', freq: 1800, vol: 0.18, q: 2 });
    s.tone({ at: t, freq: 2000, to: 1200, dur: 0.02, type: 'square', vol: 0.05 });
  });
  audio.define('fizzle', (s, t) => {
    s.noise({ at: t, dur: 0.7, filter: 'highpass', freq: 2500, to: 5000, vol: 0.12 });
    s.tone({ at: t + 0.1, freq: 600, to: 180, dur: 0.6, type: 'square', vol: 0.05 });
  });
}
