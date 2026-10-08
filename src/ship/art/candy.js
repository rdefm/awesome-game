import { Pixmap, bayer, fractalNoise, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { FLOOR_TOP, HOUSE_DOOR, HOUSE_WINDOW, W, H } from '../layout.js';

// Everything painted for planet Candy: the sugary land with its frosting
// hills, candy-floss clouds, the gingerbread house and the path up to it,
// the gummy bear, lollipops, gumdrops, a candy-floss bush and the sugar mouse
// that lives in it; and inside the house: the room, its door, the oven, the
// jellybean jar, Ginger who lives there, and her cupcakes.

export const CA = {
  skyTop: '#ff9fd2',
  sky: '#ffc4e4',
  skyLow: '#ffe6f4',
  hill: '#c9b6ff',
  hillDark: '#9a7cf0',
  mint: '#8ff0c8',
  mintDark: '#3fb08a',
  frosting: '#fff6fb',
  ground: '#ffd6ec',
  groundShade: '#f7b0d6',
  groundDeep: '#e88abc',
  pink: '#ff8fc8',
  pinkDark: '#c04f9a',
  lemon: '#ffe066',
  ginger: '#c8803e',
  gingerDark: '#8a5226',
  gingerLight: '#e0a060',
  choc: '#7a4a33',
  chocDark: '#55311f',
  biscuit: '#f0c890',
  biscuitDark: '#d09a5a',
  cloud: '#fff0f8',
  cloudShade: '#ffc4e4',
};

// The colours sprinkles come in.
const SPRINKLES = ['#ff5a8a', '#ffe066', '#7cf28a', '#6fb2ff', '#ffffff', '#c9b6ff'];

function ridge(x, base, amp, scale, seed) {
  return Math.round(base - fractalNoise(x / scale, 0.5, seed, 3) * amp);
}

// A little lollipop tree standing on (x, y): a stick and a swirly round top.
function lollipopTree(pm, x, y, h, colors) {
  pm.rect(x, y - h, 1, h + 1, '#ffffff');
  const r = 3 + (h > 9 ? 1 : 0);
  const cy = y - h - r + 1;
  pm.circle(x, cy, r, colors[0]);
  for (let a = 0; a < 6; a++) {
    const t = a * 1.1;
    pm.set(x + Math.round(Math.cos(t) * a * 0.6), cy + Math.round(Math.sin(t) * a * 0.6), colors[1]);
  }
}

// A candy cane hooked over at the top, standing on (x, y).
function candyCane(pm, x, y, h) {
  for (let i = 0; i < h; i++) {
    pm.set(x, y - i, (i >> 1) % 2 ? '#ff5a5a' : '#ffffff');
  }
  pm.set(x + 1, y - h, '#ffffff');
  pm.set(x + 2, y - h, '#ff5a5a');
  pm.set(x + 3, y - h + 1, '#ffffff');
  pm.set(x + 3, y - h + 2, '#ff5a5a');
}

// The sugary land, with its horizon at `horizon`. Like the meadow, used
// full-screen on the planet and (with a higher horizon) out of the ship's
// windows once it has landed there.
export function drawCandyland({ horizon = 100, seed = 8 } = {}) {
  const pm = new Pixmap(W, H);
  const rand = seededRandom(seed);
  // Sky: candy pinks, palest down at the horizon.
  for (let y = 0; y < H; y++) {
    const t = y / Math.max(1, horizon);
    for (let x = 0; x < W; x++) {
      const k = t + (bayer(x, y) - 0.5) * 0.18;
      pm.set(x, y, k < 0.35 ? CA.skyTop : k < 0.75 ? CA.sky : CA.skyLow);
    }
  }
  // Far lilac hills with frosting dripping off the tops.
  for (let x = 0; x < W; x++) {
    const top = ridge(x, horizon - 4, horizon * 0.42, 30, seed);
    const drip = 2 + (fractalNoise(x / 3, 1.5, seed + 9, 1) > 0.55 ? 2 : 0);
    for (let y = top; y < horizon; y++) {
      pm.set(x, y, y - top < drip ? CA.frosting : bayer(x, y) < 0.3 ? CA.hillDark : CA.hill);
    }
  }
  // Nearer mint hills.
  for (let x = 0; x < W; x++) {
    const near = ridge(x, horizon + 3, horizon * 0.14, 22, seed + 2);
    for (let y = near; y < horizon + 6; y++) {
      pm.set(x, y, y - near < 1 ? CA.frosting : bayer(x, y) < 0.25 ? CA.mintDark : CA.mint);
    }
  }
  // Lollipop trees and candy canes along the hills.
  const trees = [[10, 0], [24, 1], [36, 2], [140, 1], [226, 0], [242, 2]];
  const pops = [[CA.pink, '#ffffff'], [CA.lemon, '#ff9d3c'], ['#9a7cf0', '#ffffff']];
  for (const [x, c] of trees) {
    lollipopTree(pm, x, ridge(x, horizon + 3, horizon * 0.14, 22, seed + 2) + 2, 6 + (x % 5), pops[c]);
  }
  for (const x of [48, 128, 214]) {
    candyCane(pm, x, ridge(x, horizon + 3, horizon * 0.14, 22, seed + 2) + 2, 7);
  }
  // The ground: pink icing, shaded deeper towards the back.
  for (let y = horizon + 4; y < H; y++) {
    const depth = (y - horizon) / (H - horizon);
    for (let x = 0; x < W; x++) {
      pm.set(x, y, CA.ground);
    }
    pm.dither(0, y, W, 1, CA.groundShade, 0.5 - depth * 0.7);
  }
  // Soft swirls in the icing.
  for (let i = 0; i < 9; i++) {
    const cx = Math.floor(rand() * W);
    const cy = horizon + 12 + Math.floor(rand() * (H - horizon - 16));
    const rx = 5 + Math.floor(rand() * 9);
    for (let x = cx - rx; x <= cx + rx; x++) {
      const k = 1 - Math.abs(x - cx) / rx;
      if (bayer(x, cy) < k) {
        pm.set(x, cy, CA.groundShade);
      }
      if (k > 0.5) {
        pm.set(x, cy + 1, CA.groundDeep);
      }
    }
  }
  // Sprinkles, more of them nearer (little dashes, some upright).
  const n = Math.round((H - horizon) * 1.4);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand() * W);
    const y = horizon + 8 + Math.floor(rand() * (H - horizon - 8));
    const color = SPRINKLES[Math.floor(rand() * SPRINKLES.length)];
    pm.set(x, y, color);
    if (y > horizon + 24) {
      pm.set(x + (rand() < 0.5 ? 1 : 0), y + (rand() < 0.5 ? 1 : 0), color);
    }
  }
  return pm;
}

// A puffy candy-floss cloud.
export function drawCandyCloud(variant = 0) {
  const pm = new Pixmap(44, 17);
  const puffs = variant
    ? [[9, 10, 6], [19, 7, 7], [29, 9, 6], [36, 11, 5]]
    : [[7, 11, 5], [16, 8, 7], [26, 7, 7], [35, 11, 5]];
  for (const [x, y, r] of puffs) {
    pm.circle(x, y, r, CA.cloud);
  }
  pm.rect(4, 11, 36, 5, CA.cloud);
  for (let y = 9; y < 17; y++) {
    pm.dither(0, y, 44, 1, CA.cloudShade, 0.25 + (y - 9) * 0.1);
  }
  return pm;
}

// ------------------------------------------------------- gingerbread house
// The house as seen from far off, bottom-centre on its doorstep: gingerbread
// walls, a thick icing roof dotted with gumdrops, sweetie windows, a chimney,
// and a chocolate door (shut, or `open` onto the warm glow inside).
export const HOUSE_SIZE = { w: 46, h: 44, door: { w: 8, h: 11 } };

export function drawGingerbreadHouse({ open = false } = {}) {
  const { w, h, door } = HOUSE_SIZE;
  const pm = new Pixmap(w, h);
  const cx = Math.floor(w / 2);
  const wallTop = 22;
  // Chimney (behind the roof).
  pm.rect(31, 6, 6, 12, CA.ginger);
  pm.rect(30, 5, 8, 2, CA.frosting);
  // Walls, with a gingerbread texture and a darker base.
  pm.rect(5, wallTop, w - 10, h - wallTop, CA.ginger);
  pm.dither(5, wallTop, w - 10, h - wallTop, CA.gingerLight, 0.12);
  pm.rect(5, h - 3, w - 10, 3, CA.gingerDark);
  // Icing squiggle along the bottom.
  for (let x = 5; x < w - 5; x++) {
    pm.set(x, h - 4 + (x % 3 === 0 ? 1 : 0), CA.frosting);
  }
  // Roof: a thick icing triangle with drips over the walls.
  for (let y = 4; y <= wallTop + 1; y++) {
    const half = Math.round((y - 4) * 1.32) + 1;
    pm.hline(cx - half, cx + half, y, y > wallTop - 2 ? CA.frosting : CA.pink);
  }
  for (let y = 6; y <= wallTop; y += 3) {
    const half = Math.round((y - 4) * 1.32) + 1;
    pm.hline(cx - half + 1, cx + half - 1, y, CA.pinkDark);
  }
  for (let x = cx - 23; x <= cx + 23; x += 4) {
    pm.vline(x, wallTop + 1, wallTop + 2 + (x % 8 === 0 ? 2 : 0), CA.frosting);
  }
  // Gumdrops along the roof edges and a cherry on top.
  for (let i = 1; i < 6; i++) {
    const y = 4 + i * 3;
    const half = Math.round((y - 4) * 1.32) + 1;
    pm.set(cx - half, y - 1, SPRINKLES[i % SPRINKLES.length]);
    pm.set(cx + half, y - 1, SPRINKLES[(i + 2) % SPRINKLES.length]);
  }
  pm.circle(cx, 2, 1.5, '#ff5a5a');
  // Candy-cane corners.
  for (const x of [5, w - 6]) {
    for (let y = wallTop + 2; y < h; y++) {
      pm.set(x, y, (y >> 1) % 2 ? '#ff5a5a' : '#ffffff');
    }
  }
  // Two windows: mint glass in icing frames.
  for (const wx of [10, w - 17]) {
    pm.rect(wx, wallTop + 6, 7, 7, CA.frosting);
    pm.rect(wx + 1, wallTop + 7, 5, 5, open ? CA.lemon : CA.mint);
    pm.vline(wx + 3, wallTop + 7, wallTop + 11, CA.frosting);
    pm.hline(wx + 1, wx + 5, wallTop + 9, CA.frosting);
  }
  // The door, arched, in an icing frame.
  const dx = cx - door.w / 2;
  const dy = h - door.h;
  pm.rect(dx - 1, dy, door.w + 2, door.h, CA.frosting);
  pm.rect(dx + 1, dy - 1, door.w - 2, 1, CA.frosting);
  pm.rect(dx, dy + 1, door.w, door.h - 1, open ? '#ffd08a' : CA.choc);
  pm.rect(dx + 1, dy, door.w - 2, 1, open ? '#ffd08a' : CA.choc);
  if (open) {
    pm.dither(dx, dy + 1, door.w, door.h - 1, CA.lemon, 0.5);
  } else {
    pm.vline(cx, dy + 1, h - 1, CA.chocDark);
    pm.set(cx + 2, dy + 6, CA.lemon);
  }
  return pm.outline(C.outline);
}

// The winding biscuit path up to the house, as a full-screen overlay for the
// ground. It narrows into the distance: `scaleAt(y)` gives how big things are
// at height y. Stepping-stone gumdrops line its edges.
export function drawCandyPath(path, scaleAt) {
  const pm = new Pixmap(W, H);
  const edges = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
    for (let s = 0; s <= steps; s++) {
      const x = a.x + ((b.x - a.x) * s) / steps;
      const y = a.y + ((b.y - a.y) * s) / steps;
      const k = scaleAt(y);
      pm.ellipse(x, y, 9 * k, Math.max(1, 3 * k), CA.biscuit);
      if (s % 4 === 0) {
        edges.push([x, y, k]);
      }
    }
  }
  // Shading and crumbs on the biscuit.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (pm.isSet(x, y) && bayer(x, y) < 0.2) {
        pm.set(x, y, CA.biscuitDark);
      }
    }
  }
  edges.forEach(([x, y, k], i) => {
    if (k > 0.45) {
      pm.set(x + (i % 2 ? 1 : -1) * Math.round(10 * k), y, SPRINKLES[i % SPRINKLES.length]);
    }
  });
  return pm;
}

// ------------------------------------------------------------- gummy bear
// A jelly-soft gummy bear (see-through red, with a shine), facing right.
// frame: 'idle' | 'blink' | 'wave1' | 'wave2' | 'hop' | 'walk'
export const GUMMY = { body: '#ff5a6a', shade: '#d0304a', light: '#ffa0aa', shine: '#ffe0e4' };

export function drawGummy(frame = 'idle') {
  const k = GUMMY;
  const pm = new Pixmap(16, 19);
  const hop = frame === 'hop';
  const by = hop ? 11 : 12;
  // Legs: little round stubs.
  const step = frame === 'walk' ? 1 : 0;
  const legY = by + 4;
  for (const [x, dir] of [[5, -1], [10, 1]]) {
    pm.ellipse(x + dir * step, hop ? legY - 1 : legY + 1, 1.5, 1.5, k.shade);
  }
  // Body: a jelly bean of a tummy, shaded underneath.
  pm.ellipse(8, by, 5, 5, k.body);
  pm.ellipse(8, by + 1, 2.5, 3, k.light);
  pm.dither(3, by + 2, 11, 4, k.shade, 0.4);
  // Back arm.
  pm.ellipse(3, by - 1, 1.5, 2, k.shade);
  // Head with round ears.
  const hy = by - 7;
  pm.circle(4, hy - 3, 1.5, k.body);
  pm.circle(12, hy - 3, 1.5, k.body);
  pm.ellipse(8, hy, 5, 4, k.body);
  pm.ellipse(9, hy + 2, 2, 1, k.light); // snout
  pm.set(4, hy - 2, k.shine);
  // Face.
  if (frame === 'blink') {
    pm.hline(6, 7, hy, k.shade);
    pm.hline(10, 11, hy, k.shade);
  } else {
    pm.set(7, hy - 1, C.outline);
    pm.set(7, hy, C.outline);
    pm.set(11, hy - 1, C.outline);
    pm.set(11, hy, C.outline);
  }
  pm.set(9, hy + 1, C.outline); // nose
  pm.hline(8, 10, hy + 3, C.outline);
  // Front arm: down, or up to wave.
  if (frame === 'wave1' || frame === 'wave2') {
    const up = frame === 'wave1' ? 0 : 1;
    pm.line(12, by - 1, 14, by - 5 - up, k.body, 2);
  } else {
    pm.ellipse(13, by, 1.5, 2, k.body);
  }
  // The jelly shine.
  pm.set(5, by - 2, k.shine);
  pm.set(5, by - 1, k.shine);
  return pm.outline(C.outline);
}

// ------------------------------------------------------------------ Ginger
// Ginger, the gingerbread girl who lives in the house: icing squiggles on
// her wrists and ankles, gumdrop buttons, a big smile. Facing right.
// frame: 'idle' | 'blink' | 'wave1' | 'wave2' | 'hop' | 'walk'
export function drawGinger(frame = 'idle') {
  const pm = new Pixmap(19, 25);
  const hop = frame === 'hop';
  const cx = 9;
  const by = hop ? 15 : 16; // body centre
  const step = frame === 'walk' ? 1 : 0;
  // Legs, apart, with icing at the ankles.
  const legTop = by + 3;
  const legBottom = hop ? 22 : 23;
  for (const [x, dir] of [[cx - 3, -1], [cx + 2, 1]]) {
    const fx = x + dir * step;
    pm.line(x, legTop, fx, legBottom, CA.ginger, 2);
    pm.hline(fx, fx + 1, legBottom - 2, CA.frosting);
  }
  // Body.
  pm.ellipse(cx, by, 4, 5, CA.ginger);
  pm.dither(cx - 4, by + 1, 9, 5, CA.gingerDark, 0.25);
  // Gumdrop buttons.
  pm.set(cx, by - 2, '#ff5a8a');
  pm.set(cx, by + 1, '#7cf28a');
  // Arms: out to the sides, the front one up to wave.
  const shoulderY = by - 3;
  pm.line(cx - 3, shoulderY, cx - 7, shoulderY + 3, CA.ginger, 2);
  pm.hline(cx - 8, cx - 7, shoulderY + 3, CA.frosting);
  if (frame === 'wave1' || frame === 'wave2') {
    const up = frame === 'wave1' ? 0 : 1;
    pm.line(cx + 3, shoulderY, cx + 7, shoulderY - 4 - up, CA.ginger, 2);
    pm.hline(cx + 7, cx + 8, shoulderY - 4 - up, CA.frosting);
  } else {
    pm.line(cx + 3, shoulderY, cx + 7, shoulderY + 3, CA.ginger, 2);
    pm.hline(cx + 7, cx + 8, shoulderY + 3, CA.frosting);
  }
  // Head, with an icing bow on top.
  const hy = by - 9;
  pm.circle(cx, hy, 5, CA.ginger);
  pm.dither(cx - 5, hy + 2, 11, 3, CA.gingerDark, 0.2);
  pm.set(cx - 2, hy - 6, CA.pink);
  pm.set(cx - 1, hy - 5, CA.pink);
  pm.set(cx + 1, hy - 5, CA.pink);
  pm.set(cx + 2, hy - 6, CA.pink);
  pm.set(cx, hy - 5, '#ff5a8a');
  // Face: icing eyes (or a blink), cheeks and a big icing smile.
  if (frame === 'blink') {
    pm.hline(cx - 2, cx - 1, hy - 1, CA.gingerDark);
    pm.hline(cx + 2, cx + 3, hy - 1, CA.gingerDark);
  } else {
    pm.set(cx - 1, hy - 1, C.outline);
    pm.set(cx + 2, hy - 1, C.outline);
    pm.set(cx - 1, hy - 2, '#ffffff');
    pm.set(cx + 2, hy - 2, '#ffffff');
  }
  pm.set(cx - 3, hy + 1, C.cheek);
  pm.set(cx + 4, hy + 1, C.cheek);
  pm.set(cx - 2, hy + 1, CA.frosting);
  pm.hline(cx - 1, cx + 2, hy + 2, CA.frosting);
  pm.set(cx + 3, hy + 1, CA.frosting);
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- lollipop
// A swirly lollipop on a stick. `v` picks its colours; `frame` turns the
// swirl, so a tap can set it spinning.
export const LOLLIPOP_COLORS = [[CA.pink, '#ffffff'], [CA.lemon, '#7cf28a'], ['#9a7cf0', '#ffe066']];

export function drawLollipop(v = 0, frame = 0) {
  const [a, b] = LOLLIPOP_COLORS[v % LOLLIPOP_COLORS.length];
  const pm = new Pixmap(15, 25);
  const cx = 7;
  const cy = 7;
  pm.rect(cx, cy + 4, 1, 24 - cy - 4, '#ffffff');
  pm.circle(cx, cy, 6, a);
  // A spiral of the second colour, turned a quarter each frame.
  for (let s = 0; s < 40; s++) {
    const t = s * 0.32 + frame * (Math.PI / 2);
    const r = s * 0.15;
    pm.set(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), b);
  }
  pm.set(cx - 3, cy - 3, '#ffffff');
  pm.hline(cx - 1, cx + 1, cy + 7, CA.pink); // a little ribbon
  return pm.outline(C.outline);
}

// ----------------------------------------------------------------- gumdrop
// A sugar-dusted gumdrop. `v` picks its colour.
export const GUMDROP_COLORS = [['#ff5a5a', '#ffa0a0'], ['#7cf28a', '#c8ffd0'], ['#9a7cf0', '#d0c0ff']];

export function drawGumdrop(v = 0) {
  const [body, light] = GUMDROP_COLORS[v % GUMDROP_COLORS.length];
  const pm = new Pixmap(12, 10);
  pm.ellipse(6, 8, 5, 6, body);
  for (let x = 0; x < 12; x++) {
    pm.clear(x, 9);
  }
  pm.set(4, 4, light);
  pm.set(3, 5, light);
  for (const [x, y] of [[6, 3], [8, 6], [5, 7], [9, 4], [2, 7]]) {
    pm.set(x, y, '#ffffff'); // sugar crystals
  }
  return pm.outline(C.outline);
}

// ----------------------------------------------------------------- cupcake
// A cupcake fresh from Ginger's oven: a striped paper case, a swirl of pink
// frosting, sprinkles and a cherry on top.
export function drawCupcake() {
  const pm = new Pixmap(11, 12);
  for (let y = 7; y < 12; y++) {
    const inset = Math.floor((y - 7) / 2);
    for (let x = 1 + inset; x < 10 - inset; x++) {
      pm.set(x, y, x % 2 ? '#6fb2ff' : '#ffffff');
    }
  }
  pm.ellipse(5, 6, 4.5, 2, CA.pink);
  pm.ellipse(5, 4, 3, 1.5, CA.pink);
  pm.set(3, 5, '#ffffff');
  pm.set(7, 6, CA.lemon);
  pm.set(4, 7, '#7cf28a');
  pm.circle(5, 1.5, 1, '#ff3a4a');
  return pm.outline(C.outline);
}

// ------------------------------------------------------------------ secret
// A big fluffy candy-floss bush.
export function drawFlossBush(rustle = false) {
  const pm = new Pixmap(36, 18);
  const puffs = [[8, 11, 6], [16, 8, 7], [25, 9, 7], [30, 12, 5], [13, 13, 5], [22, 13, 5]];
  for (const [x, y, r] of puffs) {
    pm.circle(x + (rustle ? (y % 2 ? 1 : -1) : 0), y, r, '#ffb0dc');
  }
  for (let y = 10; y < 18; y++) {
    pm.dither(0, y, 36, 1, '#f080c0', 0.15 + (y - 10) * 0.07);
  }
  for (const [x, y] of [[12, 5], [20, 4], [27, 6], [8, 8]]) {
    pm.set(x, y, '#ffffff');
  }
  return pm.outline(C.outline);
}

// A little white sugar mouse with a string tail, facing right. `blink`: eyes shut.
export function drawSugarMouse(blink = false) {
  const pm = new Pixmap(15, 10);
  pm.line(0, 5, 3, 7, '#ff8fc8', 1); // string tail
  pm.ellipse(7, 7, 4, 2.5, '#ffffff');
  pm.circle(11, 6, 2.5, '#ffffff');
  pm.circle(9, 3, 1.5, '#ffd0ea'); // ear
  pm.set(9, 3, CA.pink);
  pm.set(14, 6, CA.pink); // nose
  pm.set(12, 5, blink ? '#e0d0d8' : C.outline);
  return pm.outline(C.outline);
}

// Candy's butterflies, coloured like wrapped sweets (drawn like Bluebell's:
// see drawButterfly).
export const CANDY_BUTTERFLY_COLORS = [
  ['#ff8fc8', '#ffffff'],
  ['#8ff0c8', '#ffe066'],
  ['#c9b6ff', '#ff5a8a'],
];

// ------------------------------------------------------------ inside house
// The room inside the gingerbread house: gingerbread walls under an icing
// ceiling, candy-stripe panelling, a window onto Candy's pink sky, the door
// frame on the left, a shelf for the jellybean jar, and a checked floor.
export function drawHouseRoom() {
  const pm = new Pixmap(W, H);
  const rand = seededRandom(4);
  // Walls: gingerbread, with little dents baked in.
  pm.rect(0, 0, W, FLOOR_TOP, CA.ginger);
  for (let i = 0; i < 160; i++) {
    pm.set(Math.floor(rand() * W), 10 + Math.floor(rand() * (FLOOR_TOP - 30)), rand() < 0.5 ? CA.gingerDark : CA.gingerLight);
  }
  // Ceiling: thick white icing with drips.
  pm.rect(0, 0, W, 8, CA.frosting);
  for (let x = 0; x < W; x++) {
    const drip = Math.max(0, Math.round(Math.sin(x * 0.45) * 3 + Math.sin(x * 0.17) * 2));
    pm.vline(x, 8, 8 + drip, CA.frosting);
  }
  for (let x = 4; x < W; x += 11) {
    pm.set(x, 3, SPRINKLES[(x >> 2) % SPRINKLES.length]);
  }
  // Candy-stripe panelling, topped with an icing rail.
  for (let y = 88; y < FLOOR_TOP; y++) {
    for (let x = 0; x < W; x++) {
      pm.set(x, y, (x + y) % 10 < 5 ? CA.pink : '#ffffff');
    }
  }
  pm.rect(0, 86, W, 3, CA.frosting);
  pm.hline(0, W - 1, 89, CA.pinkDark);
  pm.hline(0, W - 1, FLOOR_TOP - 1, CA.pinkDark);
  // The window: Candy's sky and a lollipop tree, in an icing frame.
  const { x: wx, y: wy, w: ww, h: wh } = HOUSE_WINDOW;
  pm.rect(wx - 3, wy - 3, ww + 6, wh + 6, CA.frosting);
  for (let y = wy; y < wy + wh; y++) {
    const k = (y - wy) / wh;
    for (let x = wx; x < wx + ww; x++) {
      pm.set(x, y, k + (bayer(x, y) - 0.5) * 0.2 < 0.6 ? CA.skyTop : CA.sky);
    }
  }
  for (let x = wx; x < wx + ww; x++) {
    const top = wy + wh - 8 + Math.round(Math.sin(x * 0.15) * 2);
    for (let y = top; y < wy + wh; y++) {
      pm.set(x, y, y === top ? CA.frosting : CA.mint);
    }
  }
  lollipopTree(pm, wx + 34, wy + wh - 7, 12, [CA.lemon, '#ff9d3c']);
  pm.circle(wx + 12, wy + 10, 4, CA.cloud);
  pm.circle(wx + 17, wy + 9, 5, CA.cloud);
  // Candy-cane window bars.
  for (let y = wy; y < wy + wh; y++) {
    pm.set(wx + ww / 2, y, (y >> 1) % 2 ? '#ff5a5a' : '#ffffff');
  }
  for (let x = wx; x < wx + ww; x++) {
    pm.set(x, wy + wh / 2, (x >> 1) % 2 ? '#ff5a5a' : '#ffffff');
  }
  // Frilly curtains.
  for (const side of [0, 1]) {
    const cx = side ? wx + ww + 2 : wx - 8;
    for (let y = wy - 4; y < wy + wh + 4; y++) {
      const sway = Math.round(Math.sin(y * 0.4) * 1);
      pm.hline(cx + sway, cx + sway + 5, y, y % 4 < 2 ? '#7cf28a' : '#c8ffd0');
    }
  }
  // The door frame: icing round the doorway.
  const d = HOUSE_DOOR;
  pm.rect(d.x - 3, d.y - 3, d.w + 6, d.h + 3, CA.frosting);
  pm.rect(d.x, d.y, d.w, d.h, CA.chocDark);
  for (let x = d.x - 3; x < d.x + d.w + 3; x += 3) {
    pm.set(x, d.y - 2, SPRINKLES[(x >> 1) % SPRINKLES.length]);
  }
  // The shelf (a long chocolate wafer) for the jellybean jar.
  pm.rect(48, 56, 46, 4, CA.choc);
  pm.hline(48, 93, 56, CA.biscuit);
  pm.hline(48, 93, 59, CA.chocDark);
  for (const x of [54, 86]) {
    pm.rect(x, 60, 2, 5, CA.chocDark);
  }
  // A little picture of a gingerbread house on the wall.
  pm.rect(164, 28, 18, 16, CA.frosting);
  pm.rect(166, 30, 14, 12, CA.sky);
  pm.rect(169, 36, 8, 6, CA.gingerDark);
  for (let i = 0; i < 4; i++) {
    pm.hline(169 - i + 3, 176 + i - 3, 32 + i, CA.pink);
  }
  // The floor: a checkerboard of cream and pink candy tiles, darker at the back.
  for (let y = FLOOR_TOP; y < H; y++) {
    const row = Math.floor((y - FLOOR_TOP) / 8);
    for (let x = 0; x < W; x++) {
      const col = Math.floor((x + row * 4) / 16);
      pm.set(x, y, (col + row) % 2 ? '#fff0d8' : '#ffc4e4');
    }
    pm.dither(0, y, W, 1, CA.groundDeep, 0.45 - (y - FLOOR_TOP) * 0.02);
  }
  pm.hline(0, W - 1, FLOOR_TOP, CA.chocDark);
  // A round rug in the middle.
  pm.ellipse(128, 140, 40, 9, CA.mint);
  pm.ellipse(128, 140, 34, 7, '#c8ffd0');
  pm.ellipse(128, 140, 26, 5, CA.mint);
  return pm;
}

// The front door from inside: a gingerbread door with an icing heart, shut,
// or `open` onto the bright pink day outside.
export function drawHouseDoor(open = false) {
  const { w, h } = HOUSE_DOOR;
  const pm = new Pixmap(w, h);
  if (open) {
    pm.rect(0, 0, w, h, CA.skyLow);
    pm.rect(0, h - 14, w, 14, CA.ground);
    pm.dither(0, 0, w, h - 14, CA.sky, 0.4);
    for (let y = h - 14; y < h; y++) {
      pm.hline(9 - Math.floor((y - h + 14) / 3), 12 + Math.floor((y - h + 14) / 3), y, CA.biscuit);
    }
    return pm;
  }
  pm.rect(0, 0, w, h, CA.ginger);
  pm.dither(0, 0, w, h, CA.gingerLight, 0.12);
  pm.rect(2, 3, w - 4, 18, CA.gingerDark);
  pm.rect(3, 4, w - 6, 16, CA.ginger);
  pm.rect(2, 25, w - 4, 19, CA.gingerDark);
  pm.rect(3, 26, w - 6, 17, CA.ginger);
  // An icing heart.
  pm.grid(['.ww.ww.', 'wwwwwww', '.wwwww.', '..www..', '...w...'], { w: CA.pink }, 7, 9);
  pm.circle(w - 5, 24, 1.5, CA.lemon); // knob
  return pm;
}

// Ginger's oven: a round-topped cream stove with pink trim, a porthole door
// (glowing when it's baking), knobs, and a chimney pipe going up.
export function drawOven(glow = false) {
  const pm = new Pixmap(50, 56);
  // Chimney pipe.
  pm.rect(20, 0, 10, 14, '#c9b6ff');
  pm.vline(22, 0, 13, '#ffffff');
  pm.rect(18, 12, 14, 3, '#9a7cf0');
  // Body.
  pm.rect(3, 18, 44, 36, '#fff0d8');
  pm.ellipse(25, 19, 22, 5, '#fff0d8');
  pm.dither(3, 40, 44, 14, '#f0d0b0', 0.4);
  pm.rect(3, 26, 44, 2, CA.pink);
  pm.rect(1, 52, 48, 4, CA.pinkDark);
  // Knobs.
  for (const x of [10, 18, 32, 40]) {
    pm.circle(x, 22, 1.5, x % 4 ? CA.mint : CA.lemon);
  }
  // Porthole door with a handle.
  pm.circle(25, 39, 9, '#c9b6ff');
  pm.circle(25, 39, 7, glow ? '#ff9d3c' : '#5a3a4a');
  if (glow) {
    pm.circle(25, 40, 5, '#ffe066');
    pm.circle(25, 41, 3, '#ffffff');
  } else {
    pm.set(22, 35, '#ffffff');
    pm.set(23, 34, '#ffffff');
  }
  pm.rect(17, 50, 16, 2, '#9a7cf0');
  // Little feet.
  pm.rect(5, 54, 4, 2, CA.chocDark);
  pm.rect(41, 54, 4, 2, CA.chocDark);
  return pm.outline(C.outline);
}

// A glass jar of jellybeans with a pink lid (popped up, when `open`).
export function drawJar(open = false) {
  const pm = new Pixmap(14, 20);
  const lid = open ? 0 : 3;
  pm.rect(2, 6, 10, 13, '#e8f4ff');
  pm.rect(3, 5, 8, 1, '#e8f4ff');
  const beans = ['#ff5a5a', '#ffe066', '#7cf28a', '#6fb2ff', '#ff8fc8', '#9a7cf0'];
  for (let y = 9; y < 18; y += 2) {
    for (let x = 3; x < 11; x += 2) {
      pm.rect(x, y, 2, 1, beans[(x * 3 + y) % beans.length]);
    }
  }
  pm.vline(3, 7, 17, '#ffffff');
  pm.rect(2, lid, 10, 3, CA.pink);
  pm.hline(3, 10, lid, '#ffb0dc');
  return pm.outline(C.outline);
}
