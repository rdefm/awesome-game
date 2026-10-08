import { Pixmap, bayer, fractalNoise, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { W, H } from '../layout.js';

// Everything painted for planet Ember: the volcanic plain, its smoke, the
// newt who lives there, fire flowers, geodes, a steam vent and a lava pool.

export const EM = {
  skyTop: '#2a0f24',
  sky: '#5a1a2a',
  skyLow: '#a83a2a',
  glow: '#ff7a3a',
  ashDark: '#3a2030',
  ash: '#5a3040',
  ashLight: '#7a4a52',
  rockDark: '#24161f',
  rock: '#3a2630',
  rockLight: '#5a3a40',
  lavaDark: '#c0301e',
  lava: '#ff6a2a',
  lavaLight: '#ffb347',
  lavaHi: '#fff2a0',
  smoke: '#6a4a5a',
  smokeLight: '#8a6a74',
  steam: '#efe4ea',
  steamShade: '#c9b8c4',
  geode: '#9a6cf0', // the purple inside
};

function ridge(x, base, amp, scale, seed) {
  return Math.round(base - fractalNoise(x / scale, 0.5, seed, 3) * amp);
}

// The volcanic plain, with its horizon at `horizon`. Like the meadow, used
// full-screen on the planet and (with a higher horizon) out of the ship's
// windows once it has landed there.
export function drawEmberPlain({ horizon = 100, seed = 11 } = {}) {
  const pm = new Pixmap(W, H);
  const rand = seededRandom(seed);
  // Sky: smouldering bands, darkest overhead, glowing at the horizon.
  for (let y = 0; y < H; y++) {
    const t = y / Math.max(1, horizon);
    for (let x = 0; x < W; x++) {
      const k = t + (bayer(x, y) - 0.5) * 0.18;
      pm.set(x, y, k < 0.35 ? EM.skyTop : k < 0.75 ? EM.sky : EM.skyLow);
    }
  }
  // A few faint stars still showing through the haze up top.
  for (let i = 0; i < 18; i++) {
    pm.set(Math.floor(rand() * W), Math.floor(rand() * horizon * 0.3), '#ffd0a0');
  }
  // The big volcano, off to the right, glowing at the top with a lava streak.
  const vx = 186;
  const peak = Math.round(horizon * 0.34);
  for (let x = 0; x < W; x++) {
    const slope = Math.abs(x - vx);
    const top = Math.max(peak + (slope < 9 ? 0 : (slope - 9) * 0.9), peak);
    for (let y = Math.round(top); y < horizon; y++) {
      pm.set(x, y, bayer(x, y) < 0.25 + (y - top) * 0.01 ? EM.ash : EM.ashDark);
    }
  }
  for (let x = vx - 7; x <= vx + 7; x++) {
    pm.set(x, peak, EM.lavaLight);
    pm.set(x, peak + 1, EM.lava);
  }
  for (let y = peak + 1; y < horizon - 2; y++) {
    const x = Math.round(vx + 3 + Math.sin(y * 0.3) * 1.5 + (y - peak) * 0.25);
    pm.set(x, y, EM.lava);
    if ((y - peak) % 3 === 0) {
      pm.set(x + 1, y, EM.lavaDark);
    }
  }
  // A glow hanging over the crater.
  for (let y = peak - 10; y < peak; y++) {
    for (let x = vx - 14; x <= vx + 14; x++) {
      const d = Math.hypot((x - vx) / 14, (y - peak) / 10);
      if (d < 1 && bayer(x, y) < (1 - d) * 0.6) {
        pm.set(x, y, EM.glow);
      }
    }
  }
  // Nearer dark crags.
  for (let x = 0; x < W; x++) {
    const near = ridge(x, horizon + 2, horizon * 0.16, 20, seed + 2);
    for (let y = near; y < horizon + 6; y++) {
      pm.set(x, y, y - near < 1 ? EM.rockLight : EM.rockDark);
    }
  }
  // The ground: dark rock, lighter at the back.
  for (let y = horizon + 4; y < H; y++) {
    const depth = (y - horizon) / (H - horizon);
    for (let x = 0; x < W; x++) {
      pm.set(x, y, EM.rock);
    }
    pm.dither(0, y, W, 1, EM.rockLight, 0.3 - depth * 0.6);
    pm.dither(0, y, W, 1, EM.rockDark, depth * 0.5 - 0.1);
  }
  // Glowing cracks wandering across the ground.
  for (let i = 0; i < 9; i++) {
    let x = rand() * W;
    let y = horizon + 10 + rand() * (H - horizon - 14);
    const len = 6 + Math.floor(rand() * 14);
    for (let s = 0; s < len; s++) {
      pm.set(Math.round(x), Math.round(y), s % 4 === 0 ? EM.lavaLight : EM.lava);
      x += rand() < 0.5 ? 1 : -1 + rand() * 3;
      y += (rand() - 0.5) * 1.4;
    }
  }
  // Pebbles, bigger the closer they are.
  const n = Math.round((H - horizon) * 2);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand() * W);
    const y = horizon + 8 + Math.floor(rand() * (H - horizon - 8));
    const near = (y - horizon) / (H - horizon);
    pm.set(x, y, EM.rockDark);
    pm.set(x, y - 1, EM.rockLight);
    if (near > 0.5) {
      pm.set(x + 1, y, EM.rockDark);
      pm.set(x + 1, y - 1, EM.ashLight);
    }
  }
  return pm;
}

// A drifting puff of volcanic smoke.
export function drawSmoke(variant = 0) {
  const pm = new Pixmap(40, 16);
  const puffs = variant
    ? [[9, 10, 5], [18, 8, 6], [27, 10, 5]]
    : [[7, 11, 4], [15, 8, 6], [25, 7, 6], [33, 11, 4]];
  for (const [x, y, r] of puffs) {
    pm.circle(x, y, r, EM.smoke);
  }
  pm.rect(4, 11, 32, 4, EM.smoke);
  for (let y = 0; y < 9; y++) {
    pm.dither(0, y, 40, 1, EM.smokeLight, 0.5 - y * 0.05);
  }
  return pm;
}

// --------------------------------------------------------------------- newt
// A little orange newt with a yellow spotty back, facing right.
// frame: 'idle' | 'blink' | 'wave1' | 'wave2' | 'hop' | 'walk'
export const NEWT_COLORS = { body: '#ff8a3a', dark: '#c0501e', spot: '#ffe066', belly: '#ffd0a0' };

export function drawNewt(frame = 'idle') {
  const pm = new Pixmap(19, 13);
  const k = NEWT_COLORS;
  const hop = frame === 'hop';
  const by = hop ? 6 : 7; // body centre row
  // Tail curling up behind.
  pm.line(1, by - 3, 3, by, k.dark, 2);
  pm.line(3, by + 1, 6, by + 1, k.body, 2);
  pm.set(1, by - 4, k.body);
  // Body and head.
  pm.ellipse(9, by, 5, 3, k.body);
  pm.ellipse(14.5, by - 1, 3.5, 3, k.body);
  pm.hline(6, 12, by + 2, k.belly);
  for (const [x, y] of [[7, by - 2], [10, by - 2], [12, by - 3]]) {
    pm.set(x, y, k.spot);
  }
  // Face: eye, cheek and a smile.
  if (frame === 'blink') {
    pm.hline(15, 16, by - 2, C.outline);
  } else {
    pm.set(15, by - 2, C.outline);
    pm.set(16, by - 3, C.white);
  }
  pm.set(17, by, C.outline);
  pm.set(15, by, C.cheek);
  // Legs: tucked up mid-hop, one paw raised to wave, or stepping.
  const legY = by + 3;
  if (hop) {
    pm.rect(6, legY, 2, 1, k.dark);
    pm.rect(11, legY, 2, 1, k.dark);
  } else {
    const step = frame === 'walk' ? 1 : 0;
    pm.rect(6 + step, legY, 2, 2, k.dark);
    if (frame === 'wave1' || frame === 'wave2') {
      const up = frame === 'wave1' ? 0 : 1;
      pm.line(12, by + 1, 14, by - 3 - up, k.dark, 1);
      pm.rect(14, by - 5 - up, 2, 2, k.body);
    } else {
      pm.rect(11 - step, legY, 2, 2, k.dark);
    }
  }
  return pm.outline(C.outline);
}

// -------------------------------------------------------------- fire flower
export const FIREBLOOM_COLORS = [
  { petal: EM.lava, tip: EM.lavaLight, heart: EM.lavaHi },
  { petal: '#ff5a8a', tip: '#ffb0c8', heart: '#fff2a0' },
];

// A dark stem topped with a flower whose petals are little flames. Two
// frames, so the flames flicker. `flare` makes them leap up tall.
export function drawFirebloom(v = 0, frame = 0, flare = false) {
  const col = FIREBLOOM_COLORS[v % FIREBLOOM_COLORS.length];
  const pm = new Pixmap(17, 32);
  const cx = 8;
  const hy = 15; // the flower's heart
  // Stem and two curling leaves.
  pm.rect(cx, hy + 1, 1, 31 - hy, '#2a1a24');
  pm.line(cx, 26, cx - 4, 22, '#4a2a3a', 1);
  pm.line(cx + 1, 23, cx + 5, 20, '#4a2a3a', 1);
  // Flame petals round a hot heart.
  const tall = flare ? 4 : 0;
  for (const [dx, h] of [[-4, 5], [-2, 8], [0, 10], [2, 8], [4, 5]]) {
    const top = hy - h - tall + (Math.abs(dx / 2 + frame) % 2);
    pm.line(cx + dx * 0.6, hy, cx + dx, top, col.petal, 2);
    pm.set(cx + dx, top, col.tip);
  }
  pm.circle(cx, hy, 2, col.tip);
  pm.set(cx, hy, col.heart);
  pm.set(cx + 1, hy - 1, col.heart);
  return pm.outline(C.outline);
}

// ------------------------------------------------------------------- geode
// A lumpy brown rock; `open`, it's cracked in two showing purple crystals.
export function drawGeode(open = false) {
  const pm = new Pixmap(22, 14);
  if (!open) {
    pm.ellipse(11, 8, 8, 5, '#6a4a3a');
    pm.dither(3, 9, 16, 4, '#4a3028', 0.6);
    for (const [x, y] of [[7, 5], [12, 4], [15, 7], [9, 9]]) {
      pm.set(x, y, '#8a6a52');
    }
    pm.hline(9, 12, 3, '#9a7a62');
    return pm.outline(C.outline);
  }
  // Two halves side by side, crystals glinting inside.
  for (const cx of [6, 16]) {
    pm.ellipse(cx, 8, 5, 5, '#6a4a3a');
    pm.ellipse(cx, 8, 4, 4, '#4a2a6a');
    pm.ellipse(cx, 8, 3, 3, EM.geode);
    for (const [dx, dy] of [[-1, -1], [1, 0], [0, 2], [-2, 1]]) {
      pm.set(cx + dx, 8 + dy, '#e0ccff');
    }
    pm.set(cx, 7, C.white);
  }
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- secrets
// A crusty mound with a steaming hole in the top: the geyser vent.
export function drawVent() {
  const pm = new Pixmap(24, 10);
  pm.ellipse(12, 7, 11, 4, EM.rockLight);
  pm.ellipse(12, 6, 8, 3, EM.ashLight);
  pm.dither(1, 7, 22, 3, EM.rockDark, 0.5);
  pm.ellipse(12, 4, 3, 1, '#1a0e14');
  pm.set(9, 5, '#e0d0b0');
  pm.set(15, 6, '#e0d0b0');
  return pm.outline(C.outline);
}

// One soft puff of steam, for the geyser's plume.
export function drawSteam() {
  const pm = new Pixmap(9, 9);
  pm.circle(4, 4, 4, EM.steam);
  pm.dither(0, 5, 9, 4, EM.steamShade, 0.5);
  pm.set(3, 2, '#ffffff');
  return pm;
}

// A bubbling pool of lava with a dark rocky rim. Two frames: the bubbles move.
export function drawLavaPool(frame = 0) {
  const pm = new Pixmap(36, 10);
  pm.ellipse(18, 5, 17, 4, EM.rockLight);
  pm.ellipse(18, 5, 14, 3, EM.lavaDark);
  pm.ellipse(18, 5, 12, 2, EM.lava);
  pm.dither(8, 4, 20, 2, EM.lavaLight, 0.35);
  for (const [x, y] of frame ? [[11, 5], [21, 4], [26, 6]] : [[14, 4], [19, 6], [24, 5]]) {
    pm.set(x, y, EM.lavaHi);
  }
  return pm.outline(C.outline);
}

// A little glowing fish that lives in the lava, facing right.
export function drawLavaFish(frame = 0) {
  const rows = frame
    ? ['...yy...', '.yyyyyk.', 'tyyyyyyo', '.yyyyy..', '...y....']
    : ['...yy...', 't.yyyyk.', '.tyyyyyo', 't.yyyy..', '........'];
  return Pixmap.fromGrid(rows, { y: EM.lavaLight, t: EM.lava, k: C.outline, o: EM.lavaHi }).outline(C.outline);
}

// Ember's glowing moths (drawn like Bluebell's butterflies: see drawButterfly).
export const MOTH_COLORS = [
  [EM.lavaLight, EM.lava],
  [EM.lavaHi, '#ff5a8a'],
  ['#ffd0a0', EM.lavaLight],
];
