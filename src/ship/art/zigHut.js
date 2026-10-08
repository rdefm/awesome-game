import { Pixmap, bayer, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { ST, ZIG_STRIPES, stripe } from './stripey.js';
import { FLOOR_TOP, GOGGLE_SHELF, HAMMOCK, HOUSE_DOOR, HUT_WINDOW, SAND_TIMER, W, H } from '../layout.js';

// Everything painted for Zig's hut on Stripey: the stripy dome out among the
// mesas and the sandy path up to it; and inside: the room (its walls painted
// in any planet's stripes), its door, the stripe-painting easel, the sand
// timer, the goggles on their shelf, and the hammock.

const BODY = '#ff00ff'; // stand-in colour, striped once the shape's drawn

// The hut's woodwork and its insides.
const ZH = {
  wood: '#a8682e',
  woodDark: '#6a3424',
  woodLight: '#d0904a',
  roof: '#5a2e24',
  glow: '#ffe6a0',
  weave: '#e0b070',
  weaveDark: '#b8844e',
  glass: '#d8f0ff',
};

// ---------------------------------------------------------------- the house
// The hut as seen from far off, bottom-centre on its doorstep: a dome in
// Zig's own orange and cream stripes, with two little eye-stalk aerials on
// top (just like Zig's), round windows glowing warm, and a round-topped door
// (shut, or `open` onto the glow inside).
export function drawZigHut({ open = false } = {}) {
  const w = 48;
  const h = 40;
  const cx = 24;
  const { a, b, dark } = ZIG_STRIPES[0];
  const pm = new Pixmap(w, h);
  // The eye-stalk aerials.
  for (const [x, lean] of [[cx - 6, -2], [cx + 6, 2]]) {
    pm.line(x, 12, x + lean, 4, ZH.woodDark);
    pm.circle(x + lean, 3, 2.5, '#ffffff');
    pm.set(x + lean + (lean > 0 ? 1 : 0), 3, C.outline);
  }
  // The dome, striped, shaded on its right and round its foot.
  pm.ellipse(cx, h, 23, 29, BODY);
  stripe(pm, BODY, a, b, 3, 1);
  for (let y = 11; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pm.isSet(x, y) && bayer(x, y) < (x > cx + 10 ? 0.45 : 0) + (y >= h - 6 ? 0.3 : 0)) {
        pm.set(x, y, dark);
      }
    }
  }
  // Round windows, glowing warm (brighter with the door open).
  for (const wx of [cx - 14, cx + 14]) {
    const wy = h - 15;
    pm.circle(wx, wy, 4, ZH.woodDark);
    pm.circle(wx, wy, 2.5, open ? '#ffffff' : ZH.glow);
    pm.set(wx - 1, wy - 1, '#ffffff');
  }
  // The door, round-topped in a wooden frame.
  const top = h - 12;
  pm.circle(cx, top, 8, ZH.wood);
  pm.rect(cx - 8, top, 17, 12, ZH.wood);
  const inside = open ? ZH.glow : ZH.woodLight;
  pm.circle(cx, top, 6, inside);
  pm.rect(cx - 6, top, 13, 12, inside);
  if (open) {
    pm.dither(cx - 6, top - 6, 13, 18, '#ffb070', 0.4);
  } else {
    for (const x of [cx - 3, cx + 3]) {
      pm.vline(x, top - 5, h - 1, ZH.wood);
    }
    pm.set(cx + 4, top + 5, '#ffe066');
  }
  // The doorstep.
  pm.rect(cx - 8, h - 2, 17, 2, ST.strata[1]);
  return pm.outline(C.outline);
}

// The sandy path up to the hut, as a full-screen overlay for the ground: a
// pale trail narrowing into the distance (`scaleAt(y)` gives how big things
// are at height y), edged with little stripy pebbles.
export function drawZigPath(path, scaleAt) {
  const pm = new Pixmap(W, H);
  const edges = [];
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];
    const q = path[i + 1];
    const steps = Math.ceil(Math.hypot(q.x - p.x, q.y - p.y));
    for (let s = 0; s <= steps; s++) {
      const x = p.x + ((q.x - p.x) * s) / steps;
      const y = p.y + ((q.y - p.y) * s) / steps;
      const k = scaleAt(y);
      pm.ellipse(x, y, 9 * k, Math.max(1, 3 * k), ST.sandLight);
      if (s % 5 === 0) {
        edges.push([x, y, k]);
      }
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (pm.isSet(x, y) && bayer(x, y) < 0.2) {
        pm.set(x, y, ST.sand);
      }
    }
  }
  edges.forEach(([x, y, k], i) => {
    if (k > 0.45) {
      const px = x + (i % 2 ? 1 : -1) * Math.round(10 * k);
      pm.set(px, y, ST.strata[(i * 2) % ST.strata.length]);
      if (k > 0.75) {
        pm.set(px + 1, y, ST.strata[(i * 2 + 1) % ST.strata.length]);
      }
    }
  });
  return pm;
}

// ------------------------------------------------------------ inside house
// The walls' stripes: one set for each planet's, as Zig's own stripes come
// (see ZIG_STRIPES). The easel paints the walls from one to the next.
export const HUT_WALLS = ZIG_STRIPES;

// The room: walls striped in HUT_WALLS[v], the stripes arching like the
// inside of a dome, under a dark roof curving down at the corners; a woven
// dado; a round window onto the canyon; the doorway on the left, a little
// table for the sand timer, the goggle shelf, the hammock's hooks, and a
// sandy floor of woven mats with a round stripy rug.
export function drawZigRoom(v = 0) {
  const { a, b } = HUT_WALLS[v];
  const pm = new Pixmap(W, H);
  const rand = seededRandom(23);
  // Walls: arching stripes.
  for (let y = 0; y < FLOOR_TOP; y++) {
    for (let x = 0; x < W; x++) {
      const arch = ((x - W / 2) / (W / 2)) ** 2 * 16;
      const band = Math.floor((y - arch + 64) / 7) % 2;
      pm.set(x, y, band ? b : a);
    }
  }
  // The roof: dark, curving down into the corners, with wooden ribs.
  for (let x = 0; x < W; x++) {
    const bottom = Math.round(6 + ((x - W / 2) / (W / 2)) ** 2 * 34);
    pm.vline(x, 0, bottom, ZH.roof);
    pm.set(x, bottom, ZH.woodDark);
  }
  for (const x of [40, 128, 216]) {
    const bottom = Math.round(6 + ((x - W / 2) / (W / 2)) ** 2 * 34);
    pm.rect(x - 1, 0, 3, bottom, ZH.wood);
    pm.vline(x - 1, 0, bottom, ZH.woodLight);
  }
  // A woven dado, with a wooden rail along the top.
  for (let y = 92; y < FLOOR_TOP; y++) {
    for (let x = 0; x < W; x++) {
      pm.set(x, y, (Math.floor((x + y) / 3) + Math.floor((x - y + 300) / 3)) % 2 ? ZH.weave : ZH.weaveDark);
    }
  }
  pm.rect(0, 90, W, 3, ZH.wood);
  pm.hline(0, W - 1, 90, ZH.woodLight);
  pm.hline(0, W - 1, 93, ZH.woodDark);
  // The round window: the sunset canyon outside, in a thick wooden ring.
  const { x: wx, y: wy, r } = HUT_WINDOW;
  pm.circle(wx, wy, r + 3, ZH.wood);
  for (let y = wy - r; y <= wy + r; y++) {
    for (let x = wx - r; x <= wx + r; x++) {
      if (Math.hypot(x - wx, y - wy) <= r) {
        const k = (y - (wy - r)) / (2 * r) + (bayer(x, y) - 0.5) * 0.15;
        pm.set(x, y, ST.sky[Math.min(ST.sky.length - 1, Math.floor(k * ST.sky.length))]);
      }
    }
  }
  // ...a striped mesa and the sand, in the bottom of it.
  for (let y = wy + 2; y <= wy + r; y++) {
    for (let x = wx - 2; x <= wx + 10; x++) {
      if (Math.hypot(x - wx, y - wy) <= r) {
        pm.set(x, y, ST.strata[Math.floor((y - wy) / 2) % ST.strata.length]);
      }
    }
  }
  for (let y = wy + 9; y <= wy + r; y++) {
    for (let x = wx - r; x <= wx + r; x++) {
      if (Math.hypot(x - wx, y - wy) <= r) {
        pm.set(x, y, (x + y) % 4 ? ST.sand : ST.sandLight);
      }
    }
  }
  pm.vline(wx, wy - r, wy + r, ZH.woodDark);
  pm.hline(wx - r, wx + r, wy, ZH.woodDark);
  pm.ring(wx, wy, r + 3, r + 2, ZH.woodDark);
  // The doorway: a wooden surround.
  const d = HOUSE_DOOR;
  pm.rect(d.x - 4, d.y - 4, d.w + 8, d.h + 4, ZH.wood);
  pm.hline(d.x - 4, d.x + d.w + 3, d.y - 4, ZH.woodLight);
  pm.rect(d.x, d.y, d.w, d.h, ZH.woodDark);
  // The little table the sand timer stands on.
  const t = SAND_TIMER;
  pm.rect(t.x - 10, t.y, 20, 3, ZH.wood);
  pm.hline(t.x - 10, t.x + 9, t.y, ZH.woodLight);
  pm.hline(t.x - 10, t.x + 9, t.y + 3, ZH.woodDark);
  for (const lx of [t.x - 8, t.x + 7]) {
    pm.rect(lx, t.y + 4, 2, FLOOR_TOP - t.y - 4, ZH.woodDark);
  }
  // The goggle shelf: a plank on two brackets.
  const s = GOGGLE_SHELF;
  pm.rect(s.x, s.y, s.w, 3, ZH.wood);
  pm.hline(s.x, s.x + s.w - 1, s.y, ZH.woodLight);
  for (const bx of [s.x + 4, s.x + s.w - 6]) {
    pm.line(bx, s.y + 3, bx + 2, s.y + 9, ZH.woodDark, 2);
  }
  // The hammock's hooks.
  for (const hx of [HAMMOCK.x1, HAMMOCK.x2]) {
    pm.rect(hx - 1, HAMMOCK.top - 2, 3, 3, '#5a5a6a');
    pm.set(hx, HAMMOCK.top - 2, '#9a9aaa');
  }
  // The floor: woven sandy mats, darker towards the back.
  for (let y = FLOOR_TOP; y < H; y++) {
    const row = Math.floor((y - FLOOR_TOP) / 8);
    for (let x = 0; x < W; x++) {
      const mat = Math.floor((x + row * 13) / 32);
      const edge = (y - FLOOR_TOP) % 8 === 7 || (x + row * 13) % 32 === 0;
      pm.set(x, y, edge ? ST.sandDeep : (mat + row) % 2 ? ST.sand : ST.sandLight);
    }
    pm.dither(0, y, W, 1, ST.sandDeep, 0.4 - (y - FLOOR_TOP) * 0.02);
  }
  for (let i = 0; i < 60; i++) {
    pm.set(Math.floor(rand() * W), FLOOR_TOP + 2 + Math.floor(rand() * (H - FLOOR_TOP - 2)), ST.sandDark);
  }
  pm.hline(0, W - 1, FLOOR_TOP, ZH.woodDark);
  // A round stripy rug, in the walls' stripes.
  [a, b, a, b, a].forEach((col, i) => pm.ellipse(128, 141, 40 - i * 7, 8.5 - i * 1.5, col));
  return pm;
}

// The front door from inside: a round-windowed door of striped planks, or
// `open` onto the canyon outside.
export function drawZigDoor(open = false) {
  const { w, h } = HOUSE_DOOR;
  const pm = new Pixmap(w, h);
  if (open) {
    for (let y = 0; y < h; y++) {
      const k = Math.min(0.999, y / (h - 14) + (bayer(0, y) - 0.5) * 0.1);
      pm.hline(0, w - 1, y, ST.sky[Math.max(0, Math.floor(k * ST.sky.length))]);
    }
    for (let y = h - 26; y < h - 14; y++) {
      pm.hline(12, w - 1, y, ST.strata[Math.floor(y / 2) % ST.strata.length]);
    }
    for (let y = h - 14; y < h; y++) {
      pm.hline(0, w - 1, y, (y % 3) ? ST.sand : ST.sandLight);
    }
    return pm;
  }
  for (let x = 0; x < w; x++) {
    pm.vline(x, 0, h - 1, Math.floor(x / 4) % 2 ? ZH.wood : ZH.woodLight);
  }
  for (const y of [6, h - 8]) {
    pm.rect(0, y, w, 2, ZH.woodDark);
  }
  // A little round window, and the knob.
  pm.circle(w / 2, 18, 4, ZH.woodDark);
  pm.circle(w / 2, 18, 3, ZH.glow);
  pm.set(w / 2 - 1, 17, '#ffffff');
  pm.circle(w - 5, 27, 1.5, '#ffe066');
  return pm;
}

// The easel: a wooden A-frame holding a canvas painted in HUT_WALLS[v]'s
// stripes, with a pot of paint and a brush at its foot. Bottom-centre on
// the floor.
const EASEL_CANVAS = { x: 4, y: 4, w: 22, h: 18 }; // in the picture
export function drawEasel(v = 0) {
  const { a, b } = HUT_WALLS[v];
  const pm = new Pixmap(30, 44);
  pm.line(6, 43, 13, 2, ZH.wood, 2);
  pm.line(23, 43, 16, 2, ZH.wood, 2);
  pm.line(15, 10, 15, 41, ZH.woodDark);
  const c = EASEL_CANVAS;
  pm.rect(c.x - 1, c.y + c.h, c.w + 2, 2, ZH.woodDark); // the ledge
  pm.rect(c.x, c.y, c.w, c.h, BODY);
  stripe(pm, BODY, a, b, 3, c.y);
  pm.rect(c.x, c.y, c.w, 1, '#fff8ec');
  // The paint pot and brush.
  pm.rect(23, 38, 6, 6, '#8a8a9a');
  pm.hline(23, 28, 38, a);
  pm.line(26, 37, 29, 31, ZH.woodLight);
  pm.set(29, 30, b);
  return pm.outline(C.outline);
}

// The sand timer: a glass of two bulbs between wooden caps, joined by turned
// posts. Empty here; the sand in it is drawn as it runs (see TIMER_GLASS).
// Bottom-centre on its table.
// The top bulb's sand fills rows `top` to `neck - 1`, the bottom's `neck` to
// `bottom`.
export const TIMER_GLASS = { w: 13, h: 20, top: 3, neck: 10, bottom: 16 }; // rows in the picture

// How wide the glass is (each side of its centre) at row y.
const glassHalf = (y) => 4.5 * Math.abs(y - 9.5) / 7.5 + 0.6;

// ...and how wide the sand inside it is.
export const sandHalf = (y) => Math.max(0, glassHalf(y) - 1.2);

export function drawSandTimer() {
  const { w, h } = TIMER_GLASS;
  const pm = new Pixmap(w, h);
  const cx = (w - 1) / 2;
  for (let y = 2; y < h - 2; y++) {
    const half = glassHalf(y);
    pm.hline(Math.round(cx - half), Math.round(cx + half), y, ZH.glass);
  }
  pm.dither(0, 2, w, h - 4, '#ffffff', 0.15);
  for (const y of [0, h - 2]) {
    pm.rect(0, y, w, 2, ZH.wood);
    pm.hline(0, w - 1, y, ZH.woodLight);
  }
  pm.vline(0, 2, h - 3, ZH.woodDark);
  pm.vline(w - 1, 2, h - 3, ZH.woodDark);
  return pm.outline(C.outline);
}

export const TIMER_SAND = '#ffb070';

// A pair of goggles: a strap with two round lenses (`lens`) in coloured rims.
export const GOGGLE_COLORS = [
  { lens: '#6fb8e8', rim: '#ff9d3c' },
  { lens: '#9be37a', rim: '#8a5ac0' },
  { lens: '#ff7ab8', rim: '#ffe066' },
];
export function drawGoggles(v = 0) {
  const { lens, rim } = GOGGLE_COLORS[v];
  const pm = new Pixmap(12, 5);
  pm.hline(0, 11, 2, '#4a3a4a');
  for (const x of [3, 8]) {
    pm.circle(x, 2, 2.4, rim);
    pm.circle(x, 2, 1.4, lens);
    pm.set(x - 1, 1, '#ffffff');
  }
  return pm;
}

// The hammock's sling: a striped cloth sagging between its two ends (the
// top corners), which the ropes up to the hooks tie onto. Bottom-centre.
export const SLING = { w: 34, h: 12 };
export function drawSling() {
  const { w, h } = SLING;
  const pm = new Pixmap(w, h);
  for (let x = 0; x < w; x++) {
    const sag = Math.sin((x / (w - 1)) * Math.PI);
    const top = Math.round(sag * 5);
    const bottom = Math.round(2 + sag * (h - 3));
    pm.vline(x, top, bottom, BODY);
  }
  stripe(pm, BODY, '#ff7ab8', '#fff4d8', 2, 0);
  for (let x = 0; x < w; x++) {
    const sag = Math.sin((x / (w - 1)) * Math.PI);
    pm.set(x, Math.round(sag * 5), '#c04f9a'); // its near edge
  }
  return pm.outline(C.outline);
}
