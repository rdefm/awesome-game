import { Pixmap, bayer } from '../../engine/pixmap.js';
import { drawText } from '../../engine/font.js';
import { C } from './palette.js';

// ---------------------------------------------------------------- pilot chair
// The chair is split into layers so the girl can sit *in* it:
// back (behind her) and front (armrests/seat lip in front of her).
export const CHAIR_W = 28;
export const CHAIR_H = 36;

function chairBase(pm) {
  pm.rect(12, 24, 4, 7, C.metal);
  pm.vline(12, 24, 30, C.metalLight);
  pm.hline(3, 24, 31, C.metalDark);
  pm.hline(5, 22, 30, C.metal);
  for (const wx of [3, 13, 23]) {
    pm.rect(wx, 32, 3, 3, C.outline);
    pm.set(wx + 1, 32, C.metalDark);
  }
}

export function chairBackLayer() {
  const pm = new Pixmap(CHAIR_W, CHAIR_H);
  chairBase(pm);
  // Headrest and padded backrest.
  pm.rect(9, 0, 10, 4, C.tealDark);
  pm.rect(10, 0, 8, 3, C.teal);
  pm.rect(6, 4, 16, 16, C.tealDark);
  pm.rect(7, 5, 14, 14, C.teal);
  pm.vline(14, 6, 17, C.tealDark);
  pm.vline(8, 6, 17, '#7ee8e2');
  // Seat cushion.
  pm.rect(5, 19, 18, 5, C.tealDark);
  pm.rect(6, 19, 16, 3, C.teal);
  return pm.outline(C.outline);
}

export function chairFrontLayer() {
  const pm = new Pixmap(CHAIR_W, CHAIR_H);
  for (const ax of [1, 23]) {
    pm.rect(ax, 14, 4, 3, C.metalLight);
    pm.rect(ax + 1, 17, 2, 6, C.metal);
  }
  pm.rect(5, 23, 18, 2, C.tealDark);
  return pm.outline(C.outline);
}

// What you see when the chair has spun round: the plain back panel.
export function chairRearView() {
  const pm = new Pixmap(CHAIR_W, CHAIR_H);
  chairBase(pm);
  pm.rect(9, 0, 10, 4, C.metalDark);
  pm.rect(6, 4, 16, 18, C.metalDark);
  pm.rect(7, 5, 14, 16, C.metal);
  for (let i = 0; i < 4; i++) {
    pm.hline(10, 17, 8 + i * 3, C.metalDark);
  }
  pm.rect(5, 21, 18, 3, C.tealDark);
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------------- poster
export function drawPoster(flame = 0) {
  const pm = new Pixmap(24, 32);
  pm.rect(0, 0, 24, 32, C.white);
  pm.rect(1, 1, 22, 30, '#1c2350');
  for (let y = 1; y < 31; y++) {
    pm.dither(1, y, 22, 1, '#2d2f6e', y / 40);
  }
  for (const [sx, sy] of [[4, 4], [18, 6], [6, 14], [19, 17], [3, 22]]) {
    pm.set(sx, sy, C.yellow);
  }
  // Rocket: nose, body with porthole, fins.
  const cx = 12;
  pm.rect(cx - 2, 6, 4, 13, C.white);
  pm.rect(cx - 1, 4, 2, 2, C.red);
  pm.hline(cx - 1, cx, 6, C.red);
  pm.circle(cx - 0.5, 10.5, 1, C.teal);
  pm.vline(cx + 1, 7, 18, '#c7c3d6');
  pm.rect(cx - 4, 15, 2, 5, C.red);
  pm.rect(cx + 2, 15, 2, 5, C.red);
  pm.hline(cx - 2, cx + 1, 19, C.metalDark);
  // Flame flickers between two frames.
  const flameLen = flame ? 6 : 4;
  pm.rect(cx - 1, 20, 2, flameLen, C.orange);
  pm.set(cx - 2, 20, C.yellow);
  pm.set(cx + 1, 20, C.yellow);
  pm.rect(cx - 1, 20, 2, 2, C.yellow);
  if (flame) {
    pm.set(cx - 2, 22, C.orange);
    pm.set(cx + 1, 23, C.orange);
  }
  pm.rect(1, 25, 22, 6, C.red);
  drawText(pm, 'GO!', 7, 26, C.white);
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------------- plant
// It grows when given a giant bluebell: taller with more bulbs, then flowering.
export const PLANT_STAGES = 3;

export function drawPlant(glow = 0, stage = 0) {
  // Each stage is a little wider and taller; the stage-0 plant sits in the
  // bottom-centre, shifted by (dx, dy), with new growth above it.
  const dx = stage * 2;
  const dy = stage * 5;
  const pm = new Pixmap(18 + dx * 2, 28 + dy);
  const cx = 9 + dx;
  const leaf = C.greenDark;
  const bulb = glow ? C.yellow : C.pink;
  const bulbs = [[3, 8], [15, 6], [2, 14], [16, 12]].map(([x, y]) => [x + dx, y + dy]);
  // Curly stems.
  const full = stage === PLANT_STAGES - 1;
  pm.line(cx, 19 + dy, cx, stage ? 4 : 6, leaf);
  pm.line(cx, 14 + dy, 4 + dx, 9 + dy, leaf);
  pm.line(cx, 12 + dy, 14 + dx, 7 + dy, leaf);
  pm.line(cx, 17 + dy, 3 + dx, 15 + dy, leaf);
  pm.line(cx, 16 + dy, 15 + dx, 13 + dy, leaf);
  for (const [lx, ly] of [[6, 11], [12, 9], [5, 16], [13, 14], [10, 9]]) {
    pm.rect(lx + dx, ly + dy, 2, 1, C.green);
  }
  if (stage) {
    // New shoots curling out of the top.
    pm.line(cx, 10, cx - 6, 5, leaf);
    pm.line(cx, 8, cx + 6, 3, leaf);
    pm.rect(cx - 4, 8, 2, 1, C.green);
    pm.rect(cx + 2, 6, 2, 1, C.green);
    bulbs.push([cx - 7, 4], [cx + 7, 2]);
  }
  if (!full) {
    bulbs.push([cx, stage ? 3 : 4]);
  }
  // Glowing bulbs.
  for (const [bx, by] of bulbs) {
    pm.circle(bx, by, 1, bulb);
    if (glow) {
      pm.set(bx, by, C.white);
    }
  }
  if (full) {
    // A big flower on top.
    for (const [px, py] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) {
      pm.circle(cx + px, 4 + py, 1.5, bulb);
    }
    pm.circle(cx, 4, 1, glow ? C.white : C.yellow);
  }
  // Pot.
  pm.rect(4 + dx, 19 + dy, 10, 2, C.orange);
  pm.rect(5 + dx, 21 + dy, 8, 6, '#d06a2a');
  pm.vline(6 + dx, 21 + dy, 26 + dy, C.orange);
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------------- alien
const ALIEN = [
  '......A......',
  '.....AAA.....',
  '......g......',
  '...GGGGGGG...',
  '..GGGWWWGGG..',
  '.GGGWWWWWGGG.',
  '.GGGWWpWWGGG.',
  '.GGGWWpWWGGG.',
  '.GGGGWWWGGGG.',
  '.GcGGGGGGGcG.',
  '.GGGmGGGmGGG.',
  '.GGGGmmmGGGG.',
  '.GGGGGGGGGGG.',
  '.GGGGGGGGGGG.',
  '.GGGGGGGGGGG.',
  '.GGGGGGGGGGG.',
];

export const ALIEN_COLORS = [
  { body: '#7be06b', dark: '#3f9e45', cheek: '#ffb0c8' },
  { body: '#b58cff', dark: '#7650c9', cheek: '#ff9ad6' },
  { body: '#ffa65c', dark: '#c76a2b', cheek: '#ffe0a0' },
  { body: '#6fd8ff', dark: '#2f8fc0', cheek: '#ffc0e0' },
];

// frame: 'idle' | 'blink' | 'wave1' | 'wave2'
export function drawAlien(colors, frame = 'idle') {
  const pm = new Pixmap(19, 18);
  const rows = frame === 'blink'
    ? ALIEN.map((r, i) => (i >= 4 && i <= 8 ? r.replace(/[Wp]/g, i === 7 ? 'g' : 'G') : r))
    : ALIEN;
  pm.grid(rows, {
    A: C.yellow, g: colors.dark, G: colors.body, W: C.white, p: C.outline, c: colors.cheek, m: C.outline,
  }, 2, 1);
  pm.set(9, 6, C.white); // eye shine above pupil is the white itself; add a glint on the antenna
  pm.set(8, 1, C.white);
  if (frame === 'wave1' || frame === 'wave2') {
    const hand = frame === 'wave1' ? [17, 6] : [16, 4];
    pm.line(13, 12, hand[0], hand[1] + 2, colors.body, 2);
    pm.rect(hand[0] - 1, hand[1], 3, 2, colors.body);
    pm.set(hand[0] - 1, hand[1] - 1, colors.body);
    pm.set(hand[0] + 1, hand[1] - 1, colors.body);
  }
  return pm.outline(C.outline);
}

// --------------------------------------------------------------------- planets
const LIGHT = (() => {
  const v = [-0.55, -0.55, 0.63];
  const len = Math.hypot(...v);
  return v.map((c) => c / len);
})();

const mod3 = (n) => ((n % 3) + 3) % 3;

// Each planet "skin" returns a [dark, mid, light] colour triple for a surface point.
const SKINS = {
  bluebell: (u, v, n) => {
    if (Math.abs(v) > 0.8) {
      return ['#9fb8d8', '#dfeaf8', '#ffffff'];
    }
    return n > 0.56 ? ['#2b7a3d', '#4fbf5a', '#9be37a'] : ['#1e3f8a', '#2f6fd0', '#6fb2ff'];
  },
  ember: (u, v, n) => (Math.abs(n - 0.5) < 0.035 ? ['#e0603a', '#ffb347', '#fff2a0'] : ['#4a1520', '#9a2b2b', '#d4553a']),
  frosty: (u, v, n) => (n > 0.6 ? ['#5d8fc0', '#a9d6f2', '#e8f7ff'] : ['#7fb0d8', '#cdeaf8', '#ffffff']),
  candy: (u, v) => {
    const band = mod3(Math.floor((v + 0.25 * Math.sin(u * 5) + 1) * 4));
    return [['#c04f9a', '#ff8fc8', '#ffd0ea'], ['#c7bfe8', '#f4f0ff', '#ffffff'], ['#6b4fc0', '#9a7cf0', '#c9b6ff']][band];
  },
  stripey: (u, v, n) => {
    const band = mod3(Math.floor((v * 3.2 + n * 0.8 + 3) * 1.2));
    return [['#7a4a2a', '#c07a3e', '#e8b070'], ['#a88a5a', '#e8d2a0', '#fff4d8'], ['#8a3a2a', '#d0603a', '#f09a6a']][band];
  },
};

export const PLANETS = [
  { id: 'bluebell', name: 'BLUEBELL', skin: 'bluebell', seed: 3, ring: null, landable: true },
  { id: 'ember', name: 'EMBER', skin: 'ember', seed: 11, ring: null },
  { id: 'frosty', name: 'FROSTY', skin: 'frosty', seed: 5, ring: null },
  { id: 'candy', name: 'CANDY', skin: 'candy', seed: 8, ring: '#ffe066' },
  { id: 'stripey', name: 'STRIPEY', skin: 'stripey', seed: 21, ring: '#c9b6ff' },
];

export function drawPlanet(def, r) {
  const ringR = def.ring ? Math.round(r * 1.75) : 0;
  const size = Math.max(r * 2 + 3, ringR * 2 + 3);
  const pm = new Pixmap(size, size);
  const c = (size - 1) / 2;
  const ring = (front) => {
    if (!def.ring) {
      return;
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - c) / ringR;
        const dy = (y - c) / (ringR * 0.3);
        const d = dx * dx + dy * dy;
        const onRing = d <= 1 && d >= 0.62;
        if (onRing && (y >= c) === front) {
          pm.set(x, y, d > 0.82 ? def.ring : C.white);
        }
      }
    }
  };
  ring(false);
  const skin = SKINS[def.skin];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x - c) / (r + 0.5);
      const ny = (y - c) / (r + 0.5);
      const d2 = nx * nx + ny * ny;
      if (d2 > 1) {
        continue;
      }
      const nz = Math.sqrt(1 - d2);
      const light = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
      // Sample the surface on the sphere so features curve around it.
      const n = noise3(nx * 2.2, ny * 2.2, nz * 2.2, def.seed);
      const [dark, mid, lite] = skin(nx, ny, n);
      const t = light + (bayer(x, y) - 0.5) * 0.25;
      let col = t > 0.62 ? lite : t > 0.15 ? mid : dark;
      if (t < -0.25) {
        col = C.outline;
      }
      pm.set(x, y, col);
    }
  }
  ring(true);
  return pm.outline(C.outline);
}

function noise3(x, y, z, seed) {
  // Cheap 3D-ish noise from two 2D samples, plenty for tiny planets.
  const a = Math.sin(x * 3.1 + seed) * Math.cos(y * 2.7 - seed * 0.5);
  const b = Math.sin(y * 4.3 + z * 2.1 + seed * 1.3) * Math.cos(z * 3.7 + x * 1.9);
  const c = Math.sin((x + y + z) * 5.3 + seed * 2.1);
  return 0.5 + (a * 0.5 + b * 0.35 + c * 0.15) * 0.5;
}

// ---------------------------------------------------------------------- emotes
const EMOTE_ICONS = {
  heart: ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'],
  bang: ['..k..', '..k..', '..k..', '.....', '..k..'],
  note: ['..kk.', '..k.k', '..k..', 'kkk..', 'kk...'],
  question: ['.kkk.', '...k.', '..k..', '.....', '..k..'],
  star: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'],
};

export function drawEmote(kind) {
  const pm = new Pixmap(11, 12);
  pm.rect(1, 0, 9, 9, C.white);
  pm.rect(0, 1, 11, 7, C.white);
  pm.set(4, 9, C.white);
  pm.set(5, 9, C.white);
  pm.set(5, 10, C.white);
  pm.grid(EMOTE_ICONS[kind], { r: C.red, k: C.outline, y: C.orange }, 3, 2);
  return pm.outline(C.outline);
}

// --------------------------------------------------------------------- misc
export function drawShipIcon() {
  return Pixmap.fromGrid(['.ww..', 'wwwwr', 'wcwww', 'wwwwr', '.ww..'], { w: C.white, r: C.red, c: C.teal }).outline(C.outline);
}

export function drawSparkle() {
  return Pixmap.fromGrid(['..y..', '..w..', 'ywwwy', '..w..', '..y..'], { y: C.yellow, w: C.white });
}

const STAR = ['...s...', '..sss..', 'sssssss', '.sssss.', '..sss..', '.ss.ss.', '.s...s.'];

// A star sticker in `color` (with a shine), or, without a colour, the faint
// dotted outline of one still to find.
export function drawStarSticker(color) {
  const pm = new Pixmap(STAR.length + 2, STAR.length + 2); // room for the outline
  if (!color) {
    pm.grid(STAR, { s: C.wallDark }, 1, 1);
    return pm.outline(C.wallLight);
  }
  pm.grid(STAR, { s: color }, 1, 1);
  pm.set(4, 2, C.white);
  pm.set(3, 3, C.white);
  return pm.outline(C.outline);
}
