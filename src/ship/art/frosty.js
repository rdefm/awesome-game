import { Pixmap, bayer, fractalNoise, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { W, H } from '../layout.js';

// Everything painted for planet Frosty: the snowy valley, its snow clouds,
// the mum and baby yetis who live there, snowballs, frost flowers, a snow
// drift and the snow hare hiding behind it.

export const FR = {
  skyTop: '#7fb0d8',
  sky: '#a9d6f2',
  skyLow: '#dff2fc',
  peakDark: '#5d8fc0',
  peak: '#8fb8dc',
  peakSnow: '#f4f8ff',
  pine: '#2f6a6a',
  pineDark: '#1f4a50',
  snow: '#f4f8ff',
  snowShade: '#cddff2',
  snowDeep: '#a9c4e4',
  ice: '#8fd8f0',
  iceLight: '#d8f6ff',
  cloud: '#eef4fb',
  cloudShade: '#c9d8ee',
};

function ridge(x, base, amp, scale, seed) {
  return Math.round(base - fractalNoise(x / scale, 0.5, seed, 3) * amp);
}

// A little snowy pine tree standing on (x, y).
function pine(pm, x, y, h) {
  pm.rect(x, y - 2, 1, 3, '#4a3a3a');
  for (let i = 0; i < h; i++) {
    const half = Math.floor((h - i) / 2.2);
    const row = y - 2 - i;
    pm.hline(x - half, x + half, row, i % 3 === 0 ? FR.pineDark : FR.pine);
    if (i % 3 === 2) {
      pm.set(x - half, row, FR.snow); // snow caught on the branch tips
      pm.set(x + half, row, FR.snow);
    }
  }
  pm.set(x, y - 2 - h, FR.snow);
}

// The snowy valley, with its horizon at `horizon`. Like the meadow, used
// full-screen on the planet and (with a higher horizon) out of the ship's
// windows once it has landed there.
export function drawSnowfield({ horizon = 100, seed = 5 } = {}) {
  const pm = new Pixmap(W, H);
  const rand = seededRandom(seed);
  // Sky: soft wintry blues, palest down at the horizon.
  for (let y = 0; y < H; y++) {
    const t = y / Math.max(1, horizon);
    for (let x = 0; x < W; x++) {
      const k = t + (bayer(x, y) - 0.5) * 0.18;
      pm.set(x, y, k < 0.35 ? FR.skyTop : k < 0.75 ? FR.sky : FR.skyLow);
    }
  }
  // Far mountains with snowy caps.
  for (let x = 0; x < W; x++) {
    const top = ridge(x, horizon - 6, horizon * 0.5, 34, seed);
    for (let y = top; y < horizon; y++) {
      const cap = y - top < 4 + (x % 5 === 0 ? 1 : 0);
      pm.set(x, y, cap ? FR.peakSnow : bayer(x, y) < 0.3 ? FR.peakDark : FR.peak);
    }
  }
  // Nearer snowy hills.
  for (let x = 0; x < W; x++) {
    const near = ridge(x, horizon + 3, horizon * 0.14, 24, seed + 2);
    for (let y = near; y < horizon + 6; y++) {
      pm.set(x, y, y - near < 1 ? '#ffffff' : FR.snowShade);
    }
  }
  // A row of little pines along the hills.
  for (const x of [8, 18, 30, 150, 162, 214, 228, 246]) {
    pine(pm, x, ridge(x, horizon + 3, horizon * 0.14, 24, seed + 2) + 2, 7 + (x % 4));
  }
  // The ground: deep snow, shaded blue towards the back.
  for (let y = horizon + 4; y < H; y++) {
    const depth = (y - horizon) / (H - horizon);
    for (let x = 0; x < W; x++) {
      pm.set(x, y, FR.snow);
    }
    pm.dither(0, y, W, 1, FR.snowShade, 0.45 - depth * 0.7);
  }
  // Soft blue hollows in the snow.
  for (let i = 0; i < 10; i++) {
    const cx = Math.floor(rand() * W);
    const cy = horizon + 12 + Math.floor(rand() * (H - horizon - 16));
    const rx = 6 + Math.floor(rand() * 10);
    for (let x = cx - rx; x <= cx + rx; x++) {
      const k = 1 - Math.abs(x - cx) / rx;
      pm.set(x, cy, bayer(x, cy) < k ? FR.snowShade : FR.snow);
      if (k > 0.5) {
        pm.set(x, cy + 1, FR.snowDeep);
      }
    }
  }
  // Glittery bits, more of them nearer.
  const n = Math.round((H - horizon) * 1.5);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand() * W);
    const y = horizon + 8 + Math.floor(rand() * (H - horizon - 8));
    pm.set(x, y, rand() < 0.5 ? '#ffffff' : FR.iceLight);
  }
  return pm;
}

// A fat grey-white snow cloud.
export function drawSnowCloud(variant = 0) {
  const pm = new Pixmap(44, 17);
  const puffs = variant
    ? [[9, 10, 6], [19, 7, 7], [29, 9, 6], [36, 11, 5]]
    : [[7, 11, 5], [16, 8, 7], [26, 7, 7], [35, 11, 5]];
  for (const [x, y, r] of puffs) {
    pm.circle(x, y, r, FR.cloud);
  }
  pm.rect(4, 11, 36, 5, FR.cloud);
  for (let y = 10; y < 17; y++) {
    pm.dither(0, y, 44, 1, FR.cloudShade, 0.3 + (y - 10) * 0.12);
  }
  return pm;
}

// -------------------------------------------------------------------- yetis
// A shaggy white yeti with a soft blue face, facing right. Mum is a bit
// taller than the girl; the baby is a little round bundle with a big head.
// frame: 'idle' | 'blink' | 'wave1' | 'wave2' | 'hop' | 'walk'
export const YETI_COLORS = {
  fur: '#f4f8ff', shade: '#c9d8ee', dark: '#9fb4d4', face: '#9fd0f0', faceDark: '#5d8fc0',
};

const YETI_SIZES = {
  // body: [cx, cy, rx, ry]; head/face: [cx, dy from body centre, rx, ry];
  // eyes: [x, x]; arms: [back x, front x]; legs: [x, x, width].
  mum: {
    w: 28, h: 32, by: 19, body: [13, 9, 9], head: [15, -9, 7, 6.5], face: [17, -8, 4.5, 3.5],
    eyes: [15, 19], arms: [5, 21], armW: 3, armLen: 8, legs: [8, 15, 4],
  },
  baby: {
    w: 17, h: 19, by: 12, body: [8, 5, 5], head: [9, -5, 5, 4.5], face: [10.5, -4.5, 3, 2.5],
    eyes: [9, 12], arms: [3, 13], armW: 2, armLen: 3, legs: [5, 9, 2],
  },
};

export function drawYeti(frame = 'idle', size = 'mum') {
  const s = YETI_SIZES[size];
  const k = YETI_COLORS;
  const pm = new Pixmap(s.w, s.h);
  const hop = frame === 'hop';
  const by = s.by - (hop ? 1 : 0);
  const [bx, brx, bry] = s.body;
  const big = size === 'mum';
  // Legs: tucked up mid-hop, or stepping.
  const [l0, l1, lw] = s.legs;
  const legTop = by + bry - 2;
  const step = frame === 'walk' ? 1 : 0;
  const legH = hop ? 2 : s.h - 1 - legTop;
  pm.rect(l0 - step, legTop, lw, legH, k.shade);
  pm.rect(l1 + step, legTop, lw, legH, k.shade);
  pm.hline(l0 - step, l0 - step + lw - 1, legTop + legH - 1, k.faceDark);
  pm.hline(l1 + step, l1 + step + lw - 1, legTop + legH - 1, k.faceDark);
  // The back arm, hanging.
  const [ab, af] = s.arms;
  pm.line(ab, by - bry * 0.4, ab - 1, by + s.armLen * 0.6, k.shade, s.armW);
  // Shaggy body, shaded underneath, with a soft tummy.
  pm.ellipse(bx, by, brx, bry, k.fur);
  pm.dither(bx - brx, by + 1, brx * 2 + 1, bry, k.shade, 0.35);
  pm.ellipse(bx + 1, by + 1, brx * 0.5, bry * 0.55, k.shade);
  // Head with a tuft on top, and a soft blue face.
  const [hx, hdy, hrx, hry] = s.head;
  const hy = by + hdy;
  pm.ellipse(hx, hy, hrx, hry, k.fur);
  for (const dx of big ? [-2, 0, 2] : [-1, 1]) {
    pm.set(hx + dx, Math.floor(hy - hry - 1), k.fur);
  }
  const [fx, fdy, frx, fry] = s.face;
  const fy = by + fdy;
  pm.ellipse(fx, fy, frx, fry, k.face);
  // Face: eyes (or a blink), rosy cheeks and a big smile.
  const [e0, e1] = s.eyes;
  const ey = Math.round(fy - (big ? 1 : 0.5));
  if (frame === 'blink') {
    pm.set(e0, ey + 1, k.faceDark);
    pm.set(e1, ey + 1, k.faceDark);
  } else {
    pm.set(e0, ey, C.outline);
    pm.set(e1, ey, C.outline);
    if (big) {
      pm.set(e0, ey + 1, C.outline);
      pm.set(e1, ey + 1, C.outline);
    }
  }
  const my = Math.round(fy + (big ? 2 : 1));
  if (big) {
    pm.set(e0 + 1, my - 1, C.outline);
    pm.hline(e0 + 2, e1 - 1, my, C.outline);
    pm.set(e1, my - 1, C.outline);
    pm.set(e0 - 1, my - 1, C.cheek);
    pm.set(e1 + 1, my - 1, C.cheek);
  } else {
    pm.hline(e0 + 1, e1 - 1, my, C.outline);
    pm.set(e0 - 1, my, C.cheek);
    pm.set(e1 + 1, my, C.cheek);
  }
  // The front arm: hanging down, or raised to wave.
  const shoulder = by - bry * 0.4;
  if (frame === 'wave1' || frame === 'wave2') {
    const up = frame === 'wave1' ? 0 : 1;
    pm.line(af - 1, shoulder, af + (big ? 3 : 2), shoulder - s.armLen - up, k.fur, s.armW);
    pm.set(af + (big ? 3 : 2), shoulder - s.armLen - up - 1, k.faceDark);
  } else {
    pm.line(af, shoulder, af + 1, shoulder + s.armLen, k.fur, s.armW);
    pm.set(af + 1, Math.round(shoulder + s.armLen + 1), k.faceDark);
  }
  return pm.outline(C.outline);
}

// ----------------------------------------------------------------- snowball
export function drawSnowball() {
  const pm = new Pixmap(11, 10);
  pm.circle(5, 5, 4, FR.snow);
  pm.dither(1, 5, 9, 4, FR.snowShade, 0.5);
  pm.set(3, 3, '#ffffff');
  pm.set(4, 2, '#ffffff');
  return pm.outline(C.outline);
}

// --------------------------------------------------------------- frost flower
// An icy-stemmed flower whose petals are a six-pointed ice crystal. Two
// frames, so it twinkles; `glow` lights it up bright.
export function drawFrostFlower(frame = 0, glow = false) {
  const pm = new Pixmap(15, 24);
  const cx = 7;
  const hy = 7;
  pm.rect(cx, hy + 1, 1, 23 - hy, '#5d9fb0');
  pm.line(cx, 19, cx - 3, 16, '#7fc0d0', 1);
  pm.line(cx + 1, 17, cx + 4, 14, '#7fc0d0', 1);
  const petal = glow ? FR.iceLight : FR.ice;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 2;
    const r = glow ? 6 : 5;
    pm.line(cx, hy, cx + Math.cos(a) * r, hy - Math.sin(a) * r, petal, 1);
    pm.set(Math.round(cx + Math.cos(a) * r), Math.round(hy - Math.sin(a) * r), '#ffffff');
  }
  pm.circle(cx, hy, 1, FR.iceLight);
  pm.set(cx, hy, '#ffffff');
  if (frame) {
    pm.set(cx - 2, hy - 2, '#ffffff');
    pm.set(cx + 2, hy + 1, '#ffffff');
  }
  return pm.outline(C.outline);
}

// ------------------------------------------------------------------- secret
// A big soft drift of snow, shaded blue underneath so it stands out.
export function drawDrift() {
  const pm = new Pixmap(36, 14);
  pm.ellipse(13, 9, 11, 5, FR.snow);
  pm.ellipse(23, 8, 12, 6, FR.snow);
  pm.dither(1, 7, 34, 7, FR.snowShade, 0.6);
  pm.dither(1, 11, 34, 3, FR.snowDeep, 0.5);
  pm.hline(17, 26, 3, '#ffffff');
  pm.hline(6, 12, 5, '#ffffff');
  return pm.outline(C.outline);
}

// A little white snow hare (long ears up), facing right, that lives behind
// the drift. `blink`: eyes shut.
export function drawHare(blink = false) {
  const pm = new Pixmap(13, 14);
  for (const x of [6, 8]) {
    pm.rect(x, 1, 2, 5, FR.snow);
    pm.rect(x, 2, 1, 3, '#ffc0d0');
  }
  pm.ellipse(5, 10, 4, 3, FR.snow);
  pm.circle(8, 7, 3, FR.snow);
  pm.dither(1, 11, 9, 2, FR.snowShade, 0.5);
  pm.circle(1, 9, 1, '#ffffff'); // fluffy tail
  pm.set(9, 6, blink ? FR.snowShade : C.outline);
  pm.set(11, 7, '#ff8fc8');
  pm.set(9, 8, C.cheek);
  return pm.outline(C.outline);
}

// Frosty's little snowbirds (drawn like Bluebell's birds: see drawBird).
export const SNOWBIRD_COLORS = [
  ['#f4f8ff', '#8fc4e8'],
  ['#cdeaf8', '#5d8fc0'],
  ['#ffffff', '#ff8fc8'],
];
