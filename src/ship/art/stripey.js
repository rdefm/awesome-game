import { Pixmap, bayer, fractalNoise, parseColor, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { W, H } from '../layout.js';

// Everything painted for planet Stripey: the striped canyon land with its
// banded mesas under a sunset-striped sky, its long thin clouds, Zig the
// stripey alien who lives there, stripe stones, stripe cacti, and the sand
// mound with a stripy worm living in it.

export const ST = {
  sky: ['#7a4a8a', '#a8567e', '#d0687a', '#f08a6a', '#ffb070', '#ffd890'],
  far: '#c98a8a',
  farLight: '#e0a890',
  // The rock layers in the mesas, top to bottom, over and over.
  strata: ['#c07a3e', '#e8d2a0', '#d0603a', '#a8682e', '#f0dcb0', '#8a3a2a'],
  rockShade: '#6a3424',
  sand: '#ecc890',
  sandLight: '#f8e2b4',
  sandDark: '#d4a46a',
  sandDeep: '#b8844e',
  cloud: '#ffe8d0',
  cloudStripe: '#ffc8a8',
  green: '#6ac05a',
  greenLight: '#a8e070',
  greenDark: '#2f7a3a',
};

// The flat-topped mesas standing at the back: [left, right, height as a share
// of the horizon].
const MESAS = [[2, 44, 0.42], [128, 176, 0.58], [196, 216, 0.36], [232, 262, 0.48]];

// The striped canyon land, with its horizon at `horizon`. Like the meadow,
// used full-screen on the planet and (with a higher horizon) out of the
// ship's windows once it has landed there.
export function drawStripeyCanyon({ horizon = 100, seed = 21 } = {}) {
  const pm = new Pixmap(W, H);
  const rand = seededRandom(seed);
  // Sky: sunset stripes, plum overhead down to gold at the horizon, each
  // band's edge dithered softly into the next.
  const bands = ST.sky.length;
  for (let y = 0; y < H; y++) {
    const k = Math.min(0.999, y / Math.max(1, horizon)) * bands;
    for (let x = 0; x < W; x++) {
      const i = Math.floor(k + (bayer(x, y) - 0.5) * 0.3);
      pm.set(x, y, ST.sky[Math.max(0, Math.min(bands - 1, i))]);
    }
  }
  // A big low sun, half down behind the land, ringed in stripes of its own.
  const sx = 96;
  const sy = horizon - 4;
  const sr = Math.round(horizon * 0.16);
  for (let y = sy - sr; y <= sy; y++) {
    for (let x = sx - sr; x <= sx + sr; x++) {
      const d = Math.hypot(x - sx, y - sy);
      if (d <= sr) {
        pm.set(x, y, (sy - y) % 3 === 2 ? '#ffd890' : '#fff4c8');
      }
    }
  }
  // Pale far-off hills.
  for (let x = 0; x < W; x++) {
    const top = Math.round(horizon - 3 - fractalNoise(x / 30, 0.5, seed, 3) * horizon * 0.14);
    for (let y = top; y < horizon; y++) {
      pm.set(x, y, y - top < 1 ? ST.farLight : ST.far);
    }
  }
  // The mesas, banded in rock layers that line up from one to the next, shaded
  // on their right-hand sides.
  for (const [l, r, share] of MESAS) {
    const top = Math.round(horizon - horizon * share);
    for (let y = top; y < horizon + 2; y++) {
      for (let x = l; x <= r; x++) {
        const layer = Math.floor(y / Math.max(2, Math.round(horizon / 30)));
        pm.set(x, y, ST.strata[((layer % ST.strata.length) + ST.strata.length) % ST.strata.length]);
      }
      pm.dither(r - 3, y, 4, 1, ST.rockShade, 0.6);
    }
    pm.hline(l, r, top, ST.strata[4]); // sunlit lip on top
  }
  // The ground: sand in wavy stripes, getting wider the nearer they are.
  for (let y = horizon; y < H; y++) {
    const d = y - horizon;
    for (let x = 0; x < W; x++) {
      const phase = Math.sqrt(d) * 2.4 + Math.sin(x / 19 + d * 0.13) * 0.5 + fractalNoise(x / 40, y / 10, seed + 3, 2) * 0.5;
      const band = Math.floor(phase) % 3;
      pm.set(x, y, band === 0 ? ST.sandDark : band === 1 ? ST.sand : ST.sandLight);
    }
    pm.dither(0, y, W, 1, ST.sandDeep, 0.25 - d * 0.02);
  }
  // Pebbles, bigger the closer they are.
  const n = Math.round((H - horizon) * 1.2);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand() * W);
    const y = horizon + 6 + Math.floor(rand() * (H - horizon - 6));
    const near = (y - horizon) / (H - horizon);
    pm.set(x, y, ST.sandDeep);
    pm.set(x, y - 1, ST.strata[i % 3 === 0 ? 2 : 0]);
    if (near > 0.5) {
      pm.set(x + 1, y, ST.sandDeep);
      pm.set(x + 1, y - 1, ST.strata[1]);
    }
  }
  return pm;
}

// A long, thin cloud with a stripe along it.
export function drawStripeyCloud(variant = 0) {
  const len = variant ? 40 : 52;
  const pm = new Pixmap(len + 4, 9);
  pm.ellipse(len / 2 + 2, 4, len / 2, 3, ST.cloud);
  pm.ellipse(len / 2 + (variant ? 6 : -4), 3, len / 4, 3, ST.cloud);
  pm.hline(6, len - 4, 5, ST.cloudStripe);
  pm.hline(10, len - 8, 7, ST.cloudStripe);
  return pm;
}

// Recolours every pixel of `from` into stripes of `a` and `b`, `band` rows
// each, counting from row `y0`.
export function stripe(pm, from, a, b, band = 2, y0 = 0) {
  const [fr, fg, fb] = parseColor(from);
  for (let y = 0; y < pm.height; y++) {
    for (let x = 0; x < pm.width; x++) {
      const [r, g, bl, al] = pm.get(x, y);
      if (al && r === fr && g === fg && bl === fb) {
        pm.set(x, y, Math.floor((y - y0) / band) % 2 === 0 ? a : b);
      }
    }
  }
}

// --------------------------------------------------------------------- Zig
// Zig, the stripey alien: a tall jelly bean in stripes from head to toe, with
// two goggly eyes up on stalks and long bendy arms. Facing right. Its
// stripes come in every planet's colours (see ZIG_STRIPES): it lives in
// orange and cream, but bring it something from another planet and its
// stripes change to match.
// frame: 'idle' | 'blink' | 'wave1' | 'wave2' | 'hop' | 'walk'
export const ZIG_STRIPES = [
  { a: '#ff9d3c', b: '#fff4d8', dark: '#c0602a' }, // Stripey's own
  { a: '#2f6fd0', b: '#9be37a', dark: '#1e3f8a' }, // Bluebell
  { a: '#ff5a2a', b: '#ffe066', dark: '#a8301e' }, // Ember
  { a: '#6fb8e8', b: '#ffffff', dark: '#3f78b0' }, // Frosty
  { a: '#ff7ab8', b: '#ffffff', dark: '#c04f9a' }, // Candy
];

const BODY = '#ff00ff'; // stand-in colour, striped once the body's drawn

export function drawZig(frame = 'idle', way = 0) {
  const s = ZIG_STRIPES[way];
  const pm = new Pixmap(20, 30);
  const hop = frame === 'hop';
  const by = hop ? 17 : 18; // body centre
  const cx = 9;
  // Legs: two stubby striped feet.
  const step = frame === 'walk' ? 1 : 0;
  const legTop = by + 7;
  const legH = hop ? 2 : 29 - legTop;
  pm.rect(cx - 4 - step, legTop, 3, legH, BODY);
  pm.rect(cx + 2 + step, legTop, 3, legH, BODY);
  // The back arm, hanging long and bendy.
  pm.line(cx - 5, by - 3, cx - 7, by + 4, s.dark, 2);
  // The body: a tall bean.
  pm.ellipse(cx, by, 6, 9, BODY);
  // Eye stalks and goggly eyes.
  const ey = by - 15;
  pm.line(cx - 2, by - 8, cx - 3, ey + 1, s.dark, 1);
  pm.line(cx + 3, by - 8, cx + 4, ey + 1, s.dark, 1);
  stripe(pm, BODY, s.a, s.b, 2, by - 9);
  for (const ex of [cx - 3, cx + 4]) {
    pm.circle(ex, ey, 2, C.white);
    if (frame === 'blink') {
      pm.hline(ex - 1, ex + 1, ey, s.dark);
    } else {
      pm.set(ex + 1, ey, C.outline);
      pm.set(ex + 1, ey + 1, C.outline);
    }
  }
  // A face on the top stripe: a wide smile and rosy cheeks.
  const my = by - 4;
  pm.set(cx - 1, my - 1, C.outline);
  pm.hline(cx, cx + 3, my, C.outline);
  pm.set(cx + 4, my - 1, C.outline);
  pm.set(cx - 2, my - 2, C.cheek);
  pm.set(cx + 5, my - 2, C.cheek);
  // The front arm: hanging down, or flung up to wave.
  if (frame === 'wave1' || frame === 'wave2') {
    const up = frame === 'wave1' ? 0 : 2;
    pm.line(cx + 5, by - 2, cx + 9, by - 9 - up, s.a, 2);
    pm.set(cx + 10, by - 10 - up, s.b);
  } else {
    pm.line(cx + 5, by - 2, cx + 7, by + 5, s.a, 2);
    pm.set(cx + 7, by + 6, s.b);
  }
  return pm.outline(C.outline);
}

// ------------------------------------------------------------- stripe stone
// A smooth pebble banded in rock layers, like a little bit of mesa.
export const STONE_COLORS = [
  ['#ff9d3c', '#fff4d8'],
  ['#d0603a', '#f0dcb0'],
  ['#8a5ac0', '#ffd890'],
];

export function drawStripeStone(v = 0) {
  const [a, b] = STONE_COLORS[v % STONE_COLORS.length];
  const pm = new Pixmap(13, 11);
  pm.ellipse(6, 6, 5, 4, BODY);
  stripe(pm, BODY, a, b, 2, 2);
  pm.set(3, 4, '#ffffff');
  pm.set(4, 3, '#ffffff');
  return pm.outline(C.outline);
}

// ------------------------------------------------------------- stripe cactus
// A round-armed cactus in green stripes. `bloom`: a big pink flower on top.
export function drawStripeCactus(bloom = false) {
  const pm = new Pixmap(17, 26);
  const cx = 8;
  // The trunk and two arms, all striped.
  pm.ellipse(cx, 15, 3.5, 10, BODY);
  pm.rect(cx - 6, 12, 3, 6, BODY);
  pm.rect(cx - 6, 17, 4, 2, BODY);
  pm.rect(cx + 4, 9, 3, 7, BODY);
  pm.rect(cx + 3, 15, 4, 2, BODY);
  pm.rect(cx - 3, 22, 7, 4, BODY);
  stripe(pm, BODY, ST.green, ST.greenLight, 2, 5);
  // Little prickles.
  for (const [x, y] of [[cx - 4, 8], [cx + 4, 6], [cx - 7, 11], [cx + 7, 8], [cx - 4, 19], [cx + 4, 21]]) {
    pm.set(x, y, '#fff4d8');
  }
  if (bloom) {
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      pm.circle(cx + dx, 4 + dy, 1, '#ff7ab8');
    }
    pm.set(cx, 4, '#ffe066');
    pm.set(cx - 2, 3, '#ffd0ea');
  }
  return pm.outline(C.outline);
}

// ------------------------------------------------------------------- secret
// A low mound of sand, ringed in stripes, with a hole in the top.
export function drawMound() {
  const pm = new Pixmap(32, 11);
  pm.ellipse(16, 8, 15, 5, BODY);
  stripe(pm, BODY, ST.strata[2], ST.sandLight, 2, 3);
  pm.ellipse(16, 4, 3, 1, '#5a3424');
  pm.dither(1, 9, 30, 2, ST.sandDeep, 0.35);
  return pm.outline(C.outline);
}

// The stripy worm that lives in the mound, standing up tall: purple and
// yellow rings with a happy face on top. `blink`: eyes shut.
export function drawWorm(blink = false) {
  const pm = new Pixmap(9, 16);
  for (let y = 14; y >= 4; y -= 2) {
    pm.ellipse(4, y, 3, 1.5, BODY);
  }
  pm.circle(4, 3, 3, BODY);
  stripe(pm, BODY, '#a86ad8', '#ffe066', 2, 0);
  pm.rect(2, 1, 5, 4, '#a86ad8'); // its face is all purple
  pm.circle(4, 3, 3, '#a86ad8');
  if (blink) {
    pm.hline(2, 3, 3, C.outline);
    pm.hline(5, 6, 3, C.outline);
  } else {
    pm.set(3, 2, C.outline);
    pm.set(6, 2, C.outline);
  }
  pm.hline(3, 5, 5, C.outline);
  pm.set(1, 4, C.cheek);
  pm.set(7, 4, C.cheek);
  return pm.outline(C.outline);
}

// Stripey's butterflies (drawn like Bluebell's: see drawButterfly).
export const STRIPE_BUTTERFLY_COLORS = [
  ['#ff9d3c', '#fff4d8'],
  ['#d0603a', '#ffe066'],
  ['#fff4d8', '#8a5ac0'],
];
