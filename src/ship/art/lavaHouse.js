import { Pixmap, bayer, seededRandom } from '../../engine/pixmap.js';
import { EM } from './ember.js';
import { C } from './palette.js';
import { CRADLE, FLOOR_TOP, HEARTH, HOUSE_DOOR, LAVA_LAMP, LAVA_WINDOW, W, H } from '../layout.js';

// Everything painted for the lava family's house on Ember: the house dug
// into the foot of the volcano and the stepping-stone path up to it; the
// family (dad, mum and baby); and inside: the room, its door, the hearth
// with its pot, the lava lamp, the baby's cradle, and the lava cakes the pot
// cooks.

// The room's warm stone.
const LH = {
  wall: '#8a4a3e',
  wallDark: '#6a3432',
  wallLight: '#a8604a',
  mortar: '#4a2228',
  basalt: '#3a2630',
  basaltLight: '#5a3a40',
  floor: '#6a4048',
  floorLight: '#84525a',
  floorDark: '#3a2630',
  wood: '#7a3e2a',
  woodDark: '#552a1c',
  gold: '#ffcf4a',
  goldDark: '#c8902a',
};

// ---------------------------------------------------------------- the house
// The house as seen from far off, bottom-centre on its doorstep: a rounded
// stone front bulging out of the foot of the volcano, with a chimney poking
// out of the slope, round glowing windows with fire flowers in boxes, a
// lantern, and a round-topped door in a stone arch (shut, or `open` onto the
// warm glow inside).
export function drawLavaHouse({ open = false } = {}) {
  const w = 52;
  const h = 38;
  const cx = 26;
  const pm = new Pixmap(w, h);
  // Chimney, poking out of the slope behind.
  pm.rect(35, 2, 5, 12, EM.rockDark);
  pm.rect(34, 1, 7, 2, EM.rockLight);
  // The rounded front, with lumpy stones on it.
  pm.ellipse(cx, h + 3, 26, 34, EM.ash);
  pm.dither(0, h - 12, w, 12, EM.ashDark, 0.4);
  for (const [x, y] of [[8, 22], [14, 14], [40, 18], [44, 26], [20, 10], [33, 11], [5, 31], [47, 33]]) {
    pm.hline(x - 1, x + 1, y, EM.ashLight);
    pm.set(x, y + 1, EM.ashDark);
  }
  // Round windows, glowing warm (brighter with the door open).
  for (const wx of [cx - 16, cx + 16]) {
    const wy = h - 18;
    pm.circle(wx, wy, 5, EM.rockLight);
    pm.circle(wx, wy, 3.5, open ? EM.lavaHi : EM.lavaLight);
    pm.dither(wx - 3, wy + 1, 7, 3, EM.lava, 0.35);
    pm.vline(wx, wy - 3, wy + 3, EM.rockDark);
    pm.hline(wx - 3, wx + 3, wy, EM.rockDark);
    // A box of fire flowers underneath.
    pm.rect(wx - 4, wy + 6, 9, 2, EM.rockDark);
    for (const [dx, col] of [[-3, EM.lava], [-1, '#ff5a8a'], [1, EM.lavaLight], [3, EM.lava]]) {
      pm.set(wx + dx, wy + 5, col);
    }
  }
  // The stone arch round the door.
  const top = h - 12; // where the door's round top begins
  pm.circle(cx, top, 9, EM.rockLight);
  pm.rect(cx - 9, top, 19, 12, EM.rockLight);
  for (let a = 0; a < 7; a++) {
    const t = Math.PI + (a / 6) * Math.PI;
    pm.set(Math.round(cx + Math.cos(t) * 8), Math.round(top + Math.sin(t) * 8), EM.rock);
  }
  for (let y = top + 2; y < h; y += 3) {
    pm.set(cx - 8, y, EM.rock);
    pm.set(cx + 8, y, EM.rock);
  }
  // The door: dark wood with a glowing knob, or open onto the glow inside.
  const inside = open ? '#ffd08a' : LH.wood;
  pm.circle(cx, top, 6, inside);
  pm.rect(cx - 6, top, 13, 12, inside);
  if (open) {
    pm.dither(cx - 6, top - 6, 13, 18, EM.lavaLight, 0.5);
  } else {
    for (const x of [cx - 3, cx, cx + 3]) {
      pm.vline(x, top - 5, h - 1, LH.woodDark);
    }
    pm.set(cx + 4, top + 5, EM.lavaHi);
  }
  // A lantern hanging by the door.
  pm.set(cx + 12, top - 2, EM.rockDark);
  pm.rect(cx + 11, top - 1, 3, 3, EM.lavaHi);
  pm.set(cx + 12, top, '#ffffff');
  // The doorstep.
  pm.rect(cx - 8, h - 2, 17, 2, EM.rockLight);
  return pm.outline(C.outline);
}

// The stepping-stone path up to the house, as a full-screen overlay for the
// ground: a trail of pale ash with flat stones set in it, narrowing into the
// distance (`scaleAt(y)` gives how big things are at height y), and glowing
// pebbles along its edges.
export function drawEmberPath(path, scaleAt) {
  const pm = new Pixmap(W, H);
  const stones = [];
  const edges = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
    for (let s = 0; s <= steps; s++) {
      const x = a.x + ((b.x - a.x) * s) / steps;
      const y = a.y + ((b.y - a.y) * s) / steps;
      const k = scaleAt(y);
      pm.ellipse(x, y, 9 * k, Math.max(1, 3 * k), EM.ashLight);
      if (s % 6 === 3) {
        stones.push([x, y, k]);
      }
      if (s % 4 === 0) {
        edges.push([x, y, k]);
      }
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (pm.isSet(x, y) && bayer(x, y) < 0.25) {
        pm.set(x, y, EM.ash);
      }
    }
  }
  for (const [x, y, k] of stones) {
    pm.ellipse(x, y, Math.max(1, 5 * k), Math.max(0.5, 1.6 * k), EM.rockLight);
    if (k > 0.6) {
      pm.hline(Math.round(x - 3 * k), Math.round(x + 2 * k), Math.round(y - 1), '#7a5a5e');
    }
  }
  edges.forEach(([x, y, k], i) => {
    if (k > 0.45) {
      pm.set(x + (i % 2 ? 1 : -1) * Math.round(10 * k), y, i % 3 ? EM.lavaLight : EM.lava);
    }
  });
  return pm;
}

// ------------------------------------------------------------- the family
// Lava folk: round and molten, darker underneath with a white-hot tummy and
// patches of rocky crust. Dad has a rocky bald head and a big bushy
// moustache; mum has flickering flame hair in a bun; the baby has one
// little flame curl. Facing right.
// frame: 'idle' | 'blink' | 'wave1' | 'wave2' | 'hop' | 'walk'
export const FOLK = {
  body: '#ff7a2a',
  shade: EM.lavaDark,
  light: EM.lavaLight,
  hot: EM.lavaHi,
  crust: '#4a2a32',
  crustLight: EM.rockLight,
  stache: '#2a1418',
  cheek: '#ff4a6a',
};

const FOLK_SIZES = {
  // body: [cx, rx, ry]; head: [cx, dy from body centre, rx, ry]; eyes: [x, x];
  // arms: [back x, front x]; legs: [x, x, width].
  dad: {
    w: 24, h: 30, by: 20, body: [11, 8, 8], head: [13, -11, 7, 6], eyes: [13, 17],
    arms: [3, 18], armW: 3, armLen: 7, legs: [7, 13, 3],
  },
  mum: {
    w: 22, h: 28, by: 19, body: [10, 7, 7], head: [12, -10, 6, 5.5], eyes: [12, 16],
    arms: [3, 16], armW: 2, armLen: 6, legs: [6, 12, 3],
  },
  baby: {
    w: 15, h: 17, by: 12, body: [7, 4.5, 4], head: [8, -6, 4.5, 4], eyes: [8, 11],
    arms: [2, 11], armW: 2, armLen: 3, legs: [4, 8, 2],
  },
};

const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

// A little flame licking up from (x, y), `h` tall, leaning `lean` px.
function flame(pm, x, y, h, lean = 0) {
  for (let i = 0; i < h; i++) {
    const k = i / h;
    const fx = Math.round(x + lean * k);
    pm.set(fx, y - i, k > 0.6 ? EM.lavaHi : k > 0.3 ? EM.lavaLight : EM.lava);
    if (k < 0.5) {
      pm.set(fx + 1, y - i, EM.lava);
    }
  }
}

export function drawLavaFolk(frame = 'idle', who = 'dad') {
  const s = FOLK_SIZES[who];
  const k = FOLK;
  const pm = new Pixmap(s.w, s.h);
  const hop = frame === 'hop';
  const by = s.by - (hop ? 1 : 0);
  const [bx, brx, bry] = s.body;
  const step = frame === 'walk' ? 1 : 0;
  // Legs: stubby, with rocky feet; tucked up mid-hop.
  const [l0, l1, lw] = s.legs;
  const legTop = Math.round(by + bry - 2);
  const legH = hop ? 2 : s.h - 1 - legTop;
  pm.rect(l0 - step, legTop, lw, legH, k.shade);
  pm.rect(l1 + step, legTop, lw, legH, k.shade);
  pm.hline(l0 - step, l0 - step + lw - 1, legTop + legH - 1, k.crust);
  pm.hline(l1 + step, l1 + step + lw - 1, legTop + legH - 1, k.crust);
  // The back arm, hanging.
  const [ab, af] = s.arms;
  const shoulder = by - bry * 0.4;
  pm.line(ab, shoulder, ab - 1, shoulder + s.armLen * 0.7, k.shade, s.armW);
  // Body: darker underneath, a glowing tummy, a patch of crust on the back.
  pm.ellipse(bx, by, brx, bry, k.body);
  pm.dither(bx - brx, by + 2, brx * 2 + 1, bry, k.shade, 0.35);
  pm.ellipse(bx + 1, by + 1, brx * 0.5, bry * 0.55, k.light);
  pm.ellipse(bx + 1, by + 1, Math.max(1, brx * 0.22), Math.max(1, bry * 0.25), k.hot);
  pm.ellipse(bx - brx * 0.55, by - bry * 0.25, Math.max(1, brx * 0.3), Math.max(1, bry * 0.25), k.crust);
  pm.set(Math.round(bx - brx * 0.6), Math.round(by - bry * 0.35), k.crustLight);
  // Head, warm on top.
  const [hx, hdy, hrx, hry] = s.head;
  const hy = by + hdy;
  pm.ellipse(hx, hy, hrx, hry, k.body);
  if (who === 'dad') {
    // A rocky bald head: crust over the top, a shine on it.
    for (let y = Math.floor(hy - hry); y < hy - hry * 0.55; y++) {
      for (let x = Math.floor(hx - hrx); x <= hx + hrx; x++) {
        if (inEllipse(x, y, hx, hy, hrx, hry)) {
          pm.set(x, y, k.crust);
        }
      }
    }
    pm.hline(hx - 3, hx - 1, Math.round(hy - hry + 1), k.crustLight);
  } else if (who === 'mum') {
    // Flame hair, swept up into a flickering bun.
    for (let x = Math.floor(hx - hrx); x <= hx + hrx - 2; x++) {
      pm.set(x, Math.round(hy - hry + 1), k.light);
    }
    flame(pm, hx - 4, Math.round(hy - hry + 2), 4, -2);
    flame(pm, hx - 2, Math.round(hy - hry + 1), 6, -1);
    flame(pm, hx, Math.round(hy - hry), 7, 0);
    flame(pm, hx + 2, Math.round(hy - hry + 1), 5, 1);
  } else {
    flame(pm, hx - 1, Math.round(hy - hry), 3, 1);
  }
  // Face: eyes (or a blink), rosy cheeks and a smile.
  const [e0, e1] = s.eyes;
  const big = who !== 'baby';
  const ey = Math.round(hy - (big ? 1 : 0));
  if (frame === 'blink') {
    pm.hline(e0, e0 + (big ? 1 : 0), ey + 1, k.shade);
    pm.hline(e1, e1 + (big ? 1 : 0), ey + 1, k.shade);
  } else {
    pm.set(e0, ey, C.outline);
    pm.set(e1, ey, C.outline);
    if (big) {
      pm.set(e0, ey + 1, C.outline);
      pm.set(e1, ey + 1, C.outline);
    }
  }
  if (who === 'mum') {
    // Eyelashes.
    pm.set(e0 + 1, ey - 1, C.outline);
    pm.set(e1 + 1, ey - 1, C.outline);
  }
  pm.set(e0 - 1, ey + 2, k.cheek);
  pm.set(e1 + 1, ey + 2, k.cheek);
  const my = ey + (big ? 3 : 2);
  if (who === 'dad') {
    // The moustache: big and bushy, curling up at both ends.
    pm.hline(e0 + 1, e1, my - 1, k.stache);
    pm.hline(e0 - 1, e1 + 2, my, k.stache);
    pm.hline(e0 - 2, e0, my + 1, k.stache);
    pm.hline(e1 + 1, e1 + 3, my + 1, k.stache);
    pm.set(e0 - 3, my, k.stache);
    pm.set(e1 + 3, my, k.stache);
    pm.set(e0 - 3, my - 1, k.stache);
    pm.set(e1 + 3, my - 1, k.stache);
    pm.hline(e0 + 1, e1, my + 2, C.outline); // a smile peeping out underneath
  } else {
    pm.set(e0, my - 1, C.outline);
    pm.hline(e0 + 1, e1 - 1, my, C.outline);
    pm.set(e1, my - 1, C.outline);
  }
  // The front arm: hanging down, or raised to wave.
  if (frame === 'wave1' || frame === 'wave2') {
    const up = frame === 'wave1' ? 0 : 1;
    pm.line(af - 1, shoulder, af + 2, shoulder - s.armLen - up, k.body, s.armW);
  } else {
    pm.line(af, shoulder, af + 1, shoulder + s.armLen, k.body, s.armW);
  }
  return pm.outline(C.outline);
}

// ------------------------------------------------------------ inside house
// The room: walls of warm round stones under a craggy cave ceiling, a
// smooth basalt dado, an arched window onto the volcano, the stone doorway
// on the left, a little table for the lava lamp, a picture of the family on
// the wall, and a floor of flagstones with a stripy rug.
export function drawLavaRoom() {
  const pm = new Pixmap(W, H);
  const rand = seededRandom(17);
  // Walls: rows of round stones in dark mortar.
  pm.rect(0, 0, W, FLOOR_TOP, LH.mortar);
  for (let row = 0, y = 4; y < 92; row++, y += 10) {
    let x = row % 2 ? -8 : 0;
    while (x < W) {
      const sw = 14 + Math.floor(rand() * 9);
      const col = [LH.wall, LH.wall, LH.wallDark, LH.wallLight][Math.floor(rand() * 4)];
      pm.rect(x + 1, y + 1, sw - 2, 8, col);
      pm.hline(x + 2, x + sw - 3, y, col);
      pm.hline(x + 2, x + sw - 3, y + 9, col);
      pm.hline(x + 2, x + sw - 3, y + 1, LH.wallLight);
      pm.hline(x + 2, x + sw - 3, y + 8, LH.wallDark);
      x += sw;
    }
  }
  // Ceiling: craggy rock, with little glowing crystals in it.
  for (let x = 0; x < W; x++) {
    const bottom = 9 + Math.round(Math.sin(x * 0.21) * 2 + Math.sin(x * 0.07 + 1) * 3);
    pm.vline(x, 0, bottom, EM.rockDark);
    pm.set(x, bottom, EM.rock);
  }
  for (const [x, y] of [[30, 4], [70, 6], [131, 5], [171, 3], [226, 6]]) {
    pm.set(x, y, EM.geode);
    pm.set(x, y - 1, '#e0ccff');
  }
  // Smooth basalt dado, with a stone rail along the top.
  pm.rect(0, 92, W, FLOOR_TOP - 92, LH.basalt);
  pm.dither(0, 96, W, FLOOR_TOP - 96, LH.basaltLight, 0.12);
  pm.rect(0, 90, W, 3, EM.rockLight);
  pm.hline(0, W - 1, 93, EM.rockDark);
  // The window: the smouldering sky and the volcano outside, in a stone arch.
  const { x: wx, y: wy, w: ww, h: wh } = LAVA_WINDOW;
  const r = ww / 2;
  const cx = wx + r;
  const inArch = (x, y) => y >= wy + r || Math.hypot(x - cx + 0.5, y - wy - r) <= r;
  for (let y = wy - 4; y < wy + wh + 4; y++) {
    for (let x = wx - 4; x < wx + ww + 4; x++) {
      if (y < wy + wh + 4 && (y >= wy + r || Math.hypot(x - cx + 0.5, y - wy - r) <= r + 4)) {
        pm.set(x, y, (x + y) % 5 ? EM.rockLight : EM.rock);
      }
    }
  }
  for (let y = wy; y < wy + wh; y++) {
    for (let x = wx; x < wx + ww; x++) {
      if (inArch(x, y)) {
        const k = (y - wy) / wh + (bayer(x, y) - 0.5) * 0.2;
        pm.set(x, y, k < 0.4 ? EM.sky : k < 0.75 ? EM.skyLow : EM.glow);
      }
    }
  }
  for (let x = wx; x < wx + ww; x++) {
    const peak = wy + 12 + Math.abs(x - (cx + 6)) * 1.1;
    for (let y = Math.round(peak); y < wy + wh; y++) {
      pm.set(x, y, bayer(x, y) < 0.3 ? EM.ash : EM.ashDark);
    }
  }
  for (let y = wy + 13; y < wy + wh; y++) {
    pm.set(Math.round(cx + 7 + (y - wy - 13) * 0.3), y, EM.lava);
  }
  pm.hline(cx + 3, cx + 9, wy + 12, EM.lavaLight);
  pm.vline(cx, wy, wy + wh - 1, EM.rockDark);
  pm.hline(wx, wx + ww - 1, wy + 24, EM.rockDark);
  pm.rect(wx - 5, wy + wh, ww + 10, 3, EM.rockLight); // the sill
  // The family picture: dad, mum and baby, in a gold frame.
  pm.rect(132, 24, 30, 22, LH.gold);
  pm.rect(134, 26, 26, 18, '#ffe6c4');
  pm.hline(132, 161, 45, LH.goldDark);
  for (const [x, y, rr] of [[140, 37, 4], [151, 37, 3.5], [146, 40, 2.5]]) {
    pm.circle(x, y, rr, FOLK.body);
    pm.circle(x, y + 5, rr + 1, FOLK.body);
  }
  pm.hline(138, 142, 37, FOLK.stache);
  for (let i = 0; i < 3; i++) {
    pm.set(150 + i, 33 - (i % 2), EM.lavaLight);
  }
  pm.rect(134, 42, 26, 2, '#ffe6c4');
  // The doorway: a stone surround.
  const d = HOUSE_DOOR;
  pm.rect(d.x - 4, d.y - 4, d.w + 8, d.h + 4, EM.rockLight);
  for (let y = d.y - 3; y < d.y + d.h; y += 4) {
    pm.hline(d.x - 4, d.x - 1, y, EM.rock);
    pm.hline(d.x + d.w, d.x + d.w + 3, y + 2, EM.rock);
  }
  pm.rect(d.x, d.y, d.w, d.h, EM.rockDark);
  // The little stone table the lava lamp stands on.
  const t = LAVA_LAMP;
  pm.rect(t.x - 11, t.y, 22, 3, EM.rockLight);
  pm.hline(t.x - 11, t.x + 10, t.y + 3, EM.rockDark);
  pm.rect(t.x - 3, t.y + 4, 6, FLOOR_TOP - t.y - 4, EM.rock);
  pm.rect(t.x - 7, FLOOR_TOP - 2, 14, 2, EM.rockLight);
  // The floor: flagstones, darker towards the back.
  for (let y = FLOOR_TOP; y < H; y++) {
    const row = Math.floor((y - FLOOR_TOP) / 8);
    const inRow = (y - FLOOR_TOP) % 8;
    for (let x = 0; x < W; x++) {
      const along = (x + row * 11) % 24;
      const gap = inRow === 7 || along === 0;
      pm.set(x, y, gap ? LH.floorDark : (Math.floor((x + row * 11) / 24) + row) % 3 ? LH.floor : LH.floorLight);
    }
    pm.dither(0, y, W, 1, LH.floorDark, 0.45 - (y - FLOOR_TOP) * 0.02);
  }
  pm.hline(0, W - 1, FLOOR_TOP, EM.rockDark);
  // A round stripy rug.
  const rugs = [EM.lava, EM.lavaLight, '#ff5a8a', EM.lavaLight, EM.lava];
  rugs.forEach((col, i) => pm.ellipse(112, 140, 42 - i * 7, 9 - i * 1.6, col));
  return pm;
}

// The front door from inside: a round-topped wooden door with iron studs, or
// `open` onto Ember outside.
export function drawLavaDoor(open = false) {
  const { w, h } = HOUSE_DOOR;
  const pm = new Pixmap(w, h);
  if (open) {
    for (let y = 0; y < h; y++) {
      const k = y / h + (bayer(0, y) - 0.5) * 0.1;
      pm.hline(0, w - 1, y, k < 0.35 ? EM.sky : k < 0.7 ? EM.skyLow : EM.glow);
    }
    pm.rect(0, h - 14, w, 14, EM.rock);
    pm.dither(0, h - 14, w, 14, EM.rockLight, 0.3);
    for (let y = h - 14; y < h; y++) {
      pm.hline(9 - Math.floor((y - h + 14) / 3), 12 + Math.floor((y - h + 14) / 3), y, EM.ashLight);
    }
    return pm;
  }
  pm.rect(0, 0, w, h, LH.wood);
  for (const x of [5, 11, 16]) {
    pm.vline(x, 0, h - 1, LH.woodDark);
  }
  for (const y of [8, h - 10]) {
    pm.rect(0, y, w, 2, EM.rockDark);
    for (let x = 2; x < w; x += 5) {
      pm.set(x, y, EM.rockLight);
    }
  }
  // A little round window with a warm glow, and the knob.
  pm.circle(w / 2, 18, 4, EM.rockDark);
  pm.circle(w / 2, 18, 3, EM.lavaLight);
  pm.set(w / 2 - 1, 17, EM.lavaHi);
  pm.circle(w - 5, 26, 1.5, LH.gold);
  return pm;
}

// The hearth: a big stone fireplace with a mantel shelf, lava glowing in the
// grate and a round black pot hanging over it. `glow`: cooking, the lava
// bright and the pot's stew bubbling.
export function drawHearth(glow = false) {
  const { w, h } = HEARTH;
  const pm = new Pixmap(w, h);
  // The chimney breast, in big stones.
  pm.rect(5, 0, w - 10, h, EM.rock);
  for (let y = 0; y < h; y += 8) {
    const off = (y / 8) % 2 ? 6 : 0;
    pm.hline(5, w - 6, y, EM.rockDark);
    for (let x = 5 + off; x < w - 5; x += 12) {
      pm.vline(x, y, y + 7, EM.rockDark);
      pm.hline(x + 1, x + 4, y + 1, EM.rockLight);
    }
  }
  // The mantel shelf, with a candle and a geode on it.
  pm.rect(0, 30, w, 5, EM.rockLight);
  pm.hline(0, w - 1, 35, EM.rockDark);
  pm.rect(9, 24, 3, 6, '#fff2e0');
  pm.set(10, 22, EM.lavaHi);
  pm.set(10, 23, EM.lava);
  pm.ellipse(46, 28, 3.5, 2.5, '#6a4a3a');
  pm.ellipse(46, 28, 2, 1.5, EM.geode);
  pm.set(45, 27, '#e0ccff');
  // The opening: a dark arch with lava in the grate.
  const cx = w / 2;
  pm.ellipse(cx, 46, 17, 8, '#1a0e14');
  pm.rect(cx - 17, 46, 35, h - 46, '#1a0e14');
  if (glow) {
    for (let y = 40; y < h; y++) {
      pm.dither(cx - 16, y, 33, 1, EM.lavaDark, (y - 40) / (h - 40) * 0.6);
    }
  }
  pm.ellipse(cx, h - 4, 15, 3, EM.lavaDark);
  pm.ellipse(cx, h - 4, 13, 2, glow ? EM.lavaLight : EM.lava);
  for (const x of [cx - 8, cx - 2, cx + 5, cx + 10]) {
    pm.set(x, h - 4, glow ? '#ffffff' : EM.lavaHi);
  }
  // The pot, hanging from a hook on a chain.
  pm.vline(cx, 39, 50, EM.rockLight);
  for (let y = 40; y < 50; y += 2) {
    pm.set(cx, y, EM.rockDark);
  }
  pm.ellipse(cx, 58, 9, 7, '#2a2433');
  pm.dither(cx - 9, 55, 19, 9, '#45405a', 0.25);
  pm.rect(cx - 10, 51, 21, 2, '#4a4a5a');
  pm.hline(cx - 8, cx + 8, 50, glow ? EM.lavaHi : EM.lavaLight);
  pm.line(cx - 9, 51, cx, 46, '#4a4a5a');
  pm.line(cx + 9, 51, cx, 46, '#4a4a5a');
  pm.set(cx - 5, 56, '#6a6a7a');
  // Its feet: a flat hearthstone in front.
  pm.rect(0, h - 2, w, 2, EM.rockLight);
  return pm.outline(C.outline);
}

// The lava lamp: a gold base and cap round a tall glass of dark liquid (the
// glowing blobs are drawn bobbing about in it; see LavaLamp).
export const LAMP_GLASS = { top: 5, bottom: 17, h: 24 }; // rows in the picture

export function drawLavaLamp() {
  const pm = new Pixmap(12, 24);
  const cx = 6;
  // Glass: narrow at the top, wider at the bottom.
  for (let y = LAMP_GLASS.top; y <= LAMP_GLASS.bottom; y++) {
    const half = 2 + Math.round(((y - LAMP_GLASS.top) / (LAMP_GLASS.bottom - LAMP_GLASS.top)) * 2);
    pm.hline(cx - half, cx + half - 1, y, '#4a1a3a');
  }
  pm.vline(cx - 2, LAMP_GLASS.top + 1, LAMP_GLASS.bottom - 2, '#7a3a6a');
  // Cap.
  pm.rect(cx - 2, 2, 4, 3, LH.gold);
  pm.set(cx - 1, 2, '#fff2a0');
  // Base: a flared cone.
  for (let y = 18; y < 24; y++) {
    const half = 3 + Math.floor((y - 18) / 2);
    pm.hline(cx - half, cx + half - 1, y, y % 2 ? LH.gold : LH.goldDark);
  }
  return pm.outline(C.outline);
}

// The colours the lamp's blobs come in: [blob, highlight].
export const LAMP_COLORS = [
  [EM.lava, EM.lavaHi],
  ['#ff5a8a', '#ffd0e0'],
  [EM.geode, '#e0ccff'],
  ['#5ad08a', '#d0ffe0'],
];

// The baby's cradle: half a great geode, purple crystals inside, on rockers.
// `front` is just the part that goes in front of the baby tucked inside.
export function drawCradle(front = false) {
  const w = CRADLE.w;
  const pm = new Pixmap(w, 18);
  const cx = w / 2;
  const rim = 6;
  if (!front) {
    // The crystal-lined inside, seen over the far rim.
    pm.ellipse(cx, rim, 14, 3, '#4a2a6a');
    pm.ellipse(cx, rim + 1, 11, 2, EM.geode);
    for (const x of [cx - 8, cx - 3, cx + 4, cx + 9]) {
      pm.set(x, rim, '#e0ccff');
    }
  }
  // The shell: lumpy brown rock, a purple rim round the top.
  for (let y = rim; y < 16; y++) {
    for (let x = 0; x < w; x++) {
      if (inEllipse(x + 0.5, y, cx, rim, 14.5, 10) && (y > rim + 1 || !inEllipse(x + 0.5, y, cx, rim, 13, 2.5))) {
        pm.set(x, y, bayer(x, y) < 0.2 ? '#4a3028' : '#6a4a3a');
      }
    }
  }
  pm.hline(2, w - 3, rim + 2, EM.geode);
  for (const [x, y] of [[8, 11], [16, 13], [23, 10]]) {
    pm.set(x, y, '#8a6a52');
  }
  // A pink blanket over the edge.
  pm.rect(cx + 2, rim + 1, 7, 4, '#ff8fc8');
  pm.set(cx + 4, rim + 2, '#ffffff');
  pm.set(cx + 7, rim + 3, '#ffffff');
  // Rockers.
  for (let x = 1; x < w - 1; x++) {
    pm.set(x, Math.round(17 - ((x - cx) / cx) ** 2 * 3), LH.woodDark);
  }
  return pm.outline(C.outline);
}

// A lava cake: a chocolatey dome with hot orange lava oozing out of the top.
export function drawLavaCake() {
  const pm = new Pixmap(12, 10);
  pm.rect(1, 6, 10, 3, '#c8902a'); // a little plate
  pm.ellipse(6, 5, 4.5, 4, '#5a2e22');
  pm.dither(2, 6, 9, 3, '#3a1c14', 0.4);
  pm.ellipse(6, 2, 2.5, 1.5, EM.lava);
  pm.set(6, 1, EM.lavaHi);
  pm.vline(4, 3, 5, EM.lava);
  pm.vline(8, 3, 6, EM.lava);
  pm.set(3, 3, '#7a4a33');
  return pm.outline(C.outline);
}
