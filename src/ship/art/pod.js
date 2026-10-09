import { Pixmap, bayer, fractalNoise, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { BB, LOCAL_COLORS } from './bluebell.js';
import { BED_NOOK, FLOOR_TOP, HOUSE_DOOR, SEED_TRAY, STAR_WINDOW, W, H } from '../layout.js';

// Everything painted for the pink alien's pod on Bluebell: the round pod far
// off in the meadow and the stepping-stone path up to it; and inside: the
// cosy round room, its round-topped door, the telescope and the window it
// looks out of, the seed tray, the bubble bath, the bed nook, the pantry
// cupboard, and the kettle on its stove.

// The pod's soft pink shell, and the cosy things inside.
export const PD = {
  shell: '#ff9fd0',
  shellLight: '#ffc8e6',
  shellDark: '#d86aa8',
  shellDeep: '#a84a86',
  glow: '#fff0a0',
  glowDeep: '#ffc85a',
  rug: '#b48ae8',
  rugLight: '#d2b4f6',
  rugDark: '#8a62c8',
  stone: '#d8c8f0',
  stoneDark: '#a898cc',
  wood: '#c08a5a',
  woodDark: '#8a5a36',
  soil: '#6a4a32',
  soilDark: '#4a3426',
  brass: '#ffc85a',
  brassDark: '#c8902a',
  tub: '#cfe6f8',
  tubShade: '#9cc0e0',
  water: '#8fd0ff',
  foam: '#f4f8ff',
  night: '#1a2050',
  nightLow: '#2a3070',
  lens: '#bfe3ff',
  bubble: '#e8f4ff',
  nook: '#7a3468',
  curtain: '#8adcc8',
  curtainDark: '#58a894',
  dimmed: '#2a1040',
  iron: '#5a4a72',
  ironLight: '#7e6c9c',
  ironDark: '#3a2e4c',
  flame: '#ff6a2a',
  kettleHot: '#ff7f9f',
};

// How far down the string of little lights swagged across the top of the
// room hangs at x.
function lightString(x) {
  return Math.round(16 + Math.abs(Math.sin(((x - 30) / (W - 60)) * Math.PI * 3)) * 8);
}

// Where each bulb on the string hangs, and its colour (picked with `rand`).
function podLights(rand) {
  const lights = [];
  for (let x = 35; x < W - 30; x += 10) {
    lights.push({ x, y: lightString(x) + 2, color: rand() < 0.5 ? PD.glow : BB.bellLight });
  }
  return lights;
}

const ROOM_SEED = 52;
export const POD_LIGHTS = podLights(seededRandom(ROOM_SEED));

// ---------------------------------------------------------------- the house
// The pod as seen from far off, bottom-centre on its doorstep: a round pink
// dome with a glowing round window and an antenna with a bulb on top, its
// round-topped door shut (or `open` onto the warm light inside).
export function drawPod({ open = false } = {}) {
  const w = 46;
  const h = 40;
  const cx = 23;
  const cy = h - 14;
  const pm = new Pixmap(w, h);
  // The antenna, with its bulb.
  pm.vline(cx, 1, cy - 14, PD.shellDeep);
  pm.circle(cx, 2, 2, PD.glow);
  // The dome, shaded round its right and its foot, with a shine on the left.
  pm.ellipse(cx, cy, 21, 16, PD.shell);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pm.isSet(x, y) && y > 6 && bayer(x, y) < (x > cx + 12 ? 0.5 : 0) + (y > cy + 8 ? 0.4 : 0)) {
        pm.set(x, y, PD.shellDark);
      }
    }
  }
  pm.ellipse(cx - 10, cy - 8, 4, 3, PD.shellLight);
  // A band round its middle, dotted with lights.
  pm.hline(cx - 21, cx + 21, cy + 2, PD.shellDeep);
  for (let x = cx - 18; x <= cx + 18; x += 6) {
    pm.set(x, cy + 2, PD.glow);
  }
  // The round window, glowing.
  pm.circle(cx + 10, cy - 5, 4, PD.shellDeep);
  pm.circle(cx + 10, cy - 5, 3, PD.glow);
  pm.set(cx + 9, cy - 6, '#ffffff');
  // The door, round at the top.
  const top = h - 12;
  pm.circle(cx, top, 6, PD.shellDeep);
  pm.rect(cx - 6, top, 13, 12, PD.shellDeep);
  const inside = open ? PD.glow : LOCAL_COLORS.dark;
  pm.circle(cx, top, 5, inside);
  pm.rect(cx - 5, top, 11, 12, inside);
  if (open) {
    pm.rect(cx - 5, h - 3, 11, 2, PD.glowDeep);
  } else {
    pm.circle(cx, top, 2, PD.glow);
    pm.set(cx + 3, h - 6, PD.glow);
  }
  // Stubby little feet, and the doorstep: a round lilac stone.
  for (const dx of [-15, 15]) {
    pm.rect(cx + dx - 2, h - 3, 5, 3, PD.shellDeep);
  }
  pm.ellipse(cx, h - 1, 7, 1.5, PD.stone);
  return pm.outline(C.outline);
}

// The path up to the pod, as a full-screen overlay for the ground: a trodden
// trail through the grass narrowing into the distance (`scaleAt(y)` gives how
// big things are at height y), with round lilac stepping stones up it.
export function drawPodPath(path, scaleAt) {
  const pm = new Pixmap(W, H);
  const stones = [];
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];
    const q = path[i + 1];
    const steps = Math.ceil(Math.hypot(q.x - p.x, q.y - p.y));
    for (let s = 0; s <= steps; s++) {
      const x = p.x + ((q.x - p.x) * s) / steps;
      const y = p.y + ((q.y - p.y) * s) / steps;
      const k = scaleAt(y);
      pm.ellipse(x, y, 8 * k, Math.max(1, 3 * k), BB.grassDark);
      if (s % 7 === 0) {
        stones.push([x, y, k]);
      }
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (pm.isSet(x, y) && bayer(x, y) < 0.3) {
        pm.set(x, y, BB.grassLight);
      }
    }
  }
  for (const [x, y, k] of stones) {
    pm.ellipse(x, y, Math.max(1, 4 * k), Math.max(0.5, 1.5 * k), PD.stone);
    if (k > 0.6) {
      pm.hline(Math.round(x - 3 * k), Math.round(x + 3 * k), Math.round(y + 1), PD.stoneDark);
    }
  }
  return pm;
}

// ------------------------------------------------------------ inside house
// The room: round and cosy, its pink walls curving up into a domed ceiling
// ribbed like the inside of a seed pod, strung with little lights; the
// doorway in a round-topped frame on the left; the round window onto the sky
// (just the day sky: the stars come out as she looks); the little table the
// seed tray sits on; and a soft lilac rug of a floor.
export function drawPodRoom() {
  const pm = new Pixmap(W, H);
  const rand = seededRandom(ROOM_SEED);
  // The walls, darker up into the dome and out to the sides.
  for (let y = 0; y < FLOOR_TOP; y++) {
    for (let x = 0; x < W; x++) {
      const dome = ((x - W / 2) / (W * 0.62)) ** 2 + ((y - FLOOR_TOP) / (FLOOR_TOP + 10)) ** 2;
      const k = dome + (bayer(x, y) - 0.5) * 0.12;
      pm.set(x, y, k > 1 ? PD.shellDeep : k > 0.8 ? PD.shellDark : k < 0.35 ? PD.shellLight : PD.shell);
    }
  }
  // Ribs curving up the walls into the top of the dome.
  for (let i = -5; i <= 5; i++) {
    const foot = W / 2 + i * 26;
    for (let y = 0; y < FLOOR_TOP; y++) {
      const k = 1 - y / FLOOR_TOP;
      const x = Math.round(W / 2 + (foot - W / 2) * Math.sqrt(1 - k * k * 0.9));
      pm.set(x, y, PD.shellDark);
      pm.set(x + 1, y, PD.shellLight);
    }
  }
  // A string of little lights swagged across the top.
  for (let x = 30; x < W - 30; x++) {
    pm.set(x, lightString(x), PD.shellDeep);
  }
  for (const { x, y, color } of podLights(rand)) {
    pm.circle(x, y, 1.5, color);
  }
  // The round window onto the sky, in a thick frame.
  const { x: wx, y: wy, r } = STAR_WINDOW;
  pm.circle(wx, wy, r + 4, PD.shellDeep);
  pm.ring(wx, wy, r + 3, r + 1, PD.brass);
  for (let y = wy - r; y <= wy + r; y++) {
    for (let x = wx - r; x <= wx + r; x++) {
      if (Math.hypot(x - wx, y - wy) <= r) {
        const k = (y - (wy - r)) / (2 * r) + (bayer(x, y) - 0.5) * 0.15;
        pm.set(x, y, k < 0.4 ? BB.skyTop : k < 0.75 ? BB.sky : BB.skyLow);
      }
    }
  }
  pm.ellipse(wx - 6, wy - 4, 6, 2, '#ffffff');
  pm.ellipse(wx + 7, wy + 6, 5, 1.5, '#ffffff');
  // The little table for the seed tray.
  const { x: tx, y: ty } = SEED_TRAY;
  pm.rect(tx - 20, ty, 41, 3, PD.wood);
  pm.hline(tx - 20, tx + 20, ty + 3, PD.woodDark);
  for (const dx of [-17, 16]) {
    pm.rect(tx + dx, ty + 4, 2, FLOOR_TOP - ty - 2, PD.woodDark);
  }
  // The doorway: a round-topped frame.
  const d = HOUSE_DOOR;
  pm.circle(d.x + d.w / 2, d.y + d.w / 2, d.w / 2 + 4, PD.shellDeep);
  pm.rect(d.x - 4, d.y + d.w / 2, d.w + 8, d.h - d.w / 2, PD.shellDeep);
  pm.circle(d.x + d.w / 2, d.y + d.w / 2, d.w / 2, LOCAL_COLORS.dark);
  pm.rect(d.x, d.y + d.w / 2, d.w, d.h - d.w / 2, LOCAL_COLORS.dark);
  // The floor: a soft lilac rug, fluffy along its edge, curving up into the
  // walls at the sides.
  for (let y = FLOOR_TOP; y < H; y++) {
    pm.hline(0, W - 1, y, PD.rug);
    pm.dither(0, y, W, 1, PD.rugDark, 0.5 - (y - FLOOR_TOP) * 0.025);
  }
  for (let x = 0; x < W; x++) {
    const lip = Math.round(2 + fractalNoise(x / 5, 0, 3, 2) * 2);
    pm.vline(x, FLOOR_TOP - lip, FLOOR_TOP, PD.rugLight);
  }
  for (let i = 0; i < 60; i++) {
    pm.set(Math.floor(rand() * W), FLOOR_TOP + 4 + Math.floor(rand() * (H - FLOOR_TOP - 4)), rand() < 0.5 ? PD.rugLight : PD.rugDark);
  }
  return pm;
}

// The window at night: the sky gone deep blue (laid over the day sky as the
// stars come out; the stars twinkle on top).
export function drawNightSky() {
  const { r } = STAR_WINDOW;
  const pm = new Pixmap(2 * r + 1, 2 * r + 1);
  pm.circle(r, r, r, PD.night);
  for (let y = r; y <= 2 * r; y++) {
    for (let x = 0; x <= 2 * r; x++) {
      if (pm.isSet(x, y) && bayer(x, y) < 0.4) {
        pm.set(x, y, PD.nightLow);
      }
    }
  }
  return pm;
}

// The front door from inside: a round-topped pink door with a porthole, or
// `open` onto the meadow outside.
export function drawPodDoor(open = false) {
  const { w, h } = HOUSE_DOOR;
  const pm = new Pixmap(w, h);
  const r = w / 2;
  const inArch = (x, y) => y >= r || Math.hypot(x + 0.5 - r, y + 0.5 - r) <= r;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inArch(x, y)) {
        continue;
      }
      if (open) {
        const k = y / (h - 14);
        pm.set(x, y, y >= h - 14 ? (bayer(x, y) < 0.3 ? BB.grassLight : BB.grass) : k < 0.4 ? BB.skyTop : k < 0.8 ? BB.sky : BB.skyLow);
      } else {
        pm.set(x, y, x < 2 || x > w - 3 ? PD.shellDark : (x + y) % 9 === 0 ? PD.shellLight : PD.shell);
      }
    }
  }
  if (open) {
    for (let x = 0; x < w; x++) {
      const hill = Math.round(h - 18 - Math.sin(x * 0.3) * 2);
      pm.vline(x, hill, h - 15, BB.hill);
    }
    // A giant bluebell nodding out in the meadow.
    pm.vline(15, h - 30, h - 14, BB.stem);
    pm.ellipse(13, h - 28, 2.5, 3, BB.bell);
    return pm;
  }
  // The porthole, and a round handle.
  pm.circle(r, 14, 6, PD.shellDeep);
  pm.circle(r, 14, 4, PD.glow);
  pm.set(r - 1, 12, '#ffffff');
  pm.circle(w - 5, h / 2 + 4, 1.5, PD.brass);
  pm.hline(2, w - 3, h - 1, PD.shellDeep);
  return pm;
}

// The telescope, bottom-centre: a brass tube on a wooden tripod, pointing up
// and right at the window.
export const SCOPE = { w: 30, h: 38 };
export function drawTelescope() {
  const { w, h } = SCOPE;
  const pm = new Pixmap(w, h);
  const hx = 12;
  const hy = 18;
  // The tripod.
  pm.line(hx, hy, 3, h - 1, PD.woodDark, 2);
  pm.line(hx, hy, hx + 10, h - 1, PD.woodDark, 2);
  pm.line(hx, hy, hx + 2, h - 1, PD.wood, 2);
  // The tube, wider at the far end, banded.
  for (let i = 0; i <= 20; i++) {
    const x = Math.round(hx - 6 + i * 0.9);
    const y = Math.round(hy + 4 - i * 0.85);
    pm.circle(x, y, 2 + i / 10, i % 7 === 6 ? PD.brassDark : PD.brass);
  }
  pm.circle(hx - 7, hy + 5, 1.5, PD.brassDark); // the eyepiece
  pm.circle(hx + 13, hy - 13, 2, PD.lens);
  return pm.outline(C.outline);
}

// The seed tray, bottom-centre on its table: a little wooden tray of soil
// planted at `stage` 0 (just seeds), 1 (shoots poking up), 2 (leafy) or 3
// (in flower, with tiny bluebells). `heights`: how tall the plants are at
// each stage; `plants`: where they're planted, from the middle.
const HEIGHTS = [0, 3, 7, 10];
export const TRAY = { w: 34, h: 22, heights: HEIGHTS, stages: HEIGHTS.length, plants: [-12, -6, 0, 6, 12] };
export function drawSeedTray(stage = 0) {
  const { w, h, plants } = TRAY;
  const cx = Math.floor(w / 2);
  const pm = new Pixmap(w, h);
  const base = h - 6;
  plants.forEach((dx, i) => {
    if (stage === 0) {
      return;
    }
    const x = cx + dx;
    const tall = TRAY.heights[stage] + (i % 2);
    pm.vline(x, base - tall, base, BB.stem);
    if (stage >= 2) {
      pm.hline(x - 2, x - 1, base - Math.floor(tall / 2), BB.grass);
      pm.hline(x + 1, x + 2, base - Math.floor(tall / 2) - 1, BB.grassLight);
    } else {
      pm.set(x + 1, base - tall, BB.grassLight);
    }
    if (stage === 3) {
      pm.ellipse(x, base - tall + 1, 2, 2, i % 2 ? BB.bellLight : BB.bell);
      pm.set(x, base - tall + 3, BB.bellDark);
    }
  });
  // The tray of soil (seeds dotted in it).
  pm.rect(2, base, w - 4, 6, PD.wood);
  pm.hline(2, w - 3, h - 1, PD.woodDark);
  pm.hline(3, w - 4, base, PD.soil);
  pm.hline(3, w - 4, base + 1, PD.soilDark);
  if (stage === 0) {
    for (const dx of plants) {
      pm.set(cx + dx, base, PD.stone);
    }
  }
  return pm.outline(C.outline);
}

// A soap bubble, floating: a pale ring with a glint.
export function drawBubble() {
  const pm = new Pixmap(7, 7);
  pm.ring(3, 3, 3.5, 2.5, PD.bubble);
  pm.set(2, 2, '#ffffff');
  pm.set(4, 5, PD.shellLight);
  return pm;
}

// The bubble bath: a round white tub on little feet, heaped with foam.
// Bottom-centre on the floor. `back` is just its far rim and the water (drawn
// behind whoever's splashing in it); the rest is its near side and the foam.
export const BATH = { w: 50, h: 26 };
export function drawBubbleBath(back = false) {
  const { w, h } = BATH;
  const cx = w / 2;
  const pm = new Pixmap(w, h);
  const rim = 10;
  if (back) {
    pm.ellipse(cx, rim, cx - 2, 5, PD.tubShade);
    pm.ellipse(cx, rim + 1, cx - 5, 3, PD.water);
    return pm.outline(C.outline);
  }
  // The near side of the tub, rounding off at the bottom.
  for (let y = rim; y < h - 3; y++) {
    const k = Math.max(0, (y - (h - 10)) / 7);
    const half = (cx - 2) * Math.sqrt(1 - k * k * 0.5);
    pm.hline(Math.round(cx - half), Math.round(cx + half), y, y > h - 8 ? PD.tubShade : PD.tub);
  }
  pm.hline(4, w - 5, rim + 4, LOCAL_COLORS.body);
  for (const dx of [-15, 15]) {
    pm.rect(cx + dx - 2, h - 4, 4, 4, PD.brass);
  }
  pm.hline(4, w - 5, rim, '#ffffff');
  // Foam heaped up in the middle.
  for (let i = 0; i < 7; i++) {
    const x = 11 + i * 4.6;
    pm.circle(x, rim - 2 - (i % 3), 2.5 + (i % 2), PD.foam);
  }
  return pm.outline(C.outline);
}

// The bed nook: a round-topped hollow in the wall, lined with cushions, with
// a soft mattress at the bottom (BED_NOOK.deck up) and a pillow at its
// left-hand end. Bottom-centre on the floor, with NOOK.floor rows below its
// floor. `curtain` is just its little curtain, drawn in front of whoever's in
// it: a scalloped valance across the top, and the rest gathered up at the
// right, tied back with a brass band.
export const NOOK = { w: BED_NOOK.w + 12, h: 46, floor: 2 };
export function drawBedNook({ curtain = false } = {}) {
  const { w, h } = NOOK;
  const pm = new Pixmap(w, h);
  const cx = (w - 1) / 2;
  const floor = h - 1 - NOOK.floor;
  const top = floor - BED_NOOK.deck;
  const rx = cx - 3;
  const ry = 16;
  const archY = ry + 3;
  const inArch = (x, y, pad) =>
    y <= floor && (y >= archY ? Math.abs(x - cx) <= rx + pad : ((x - cx) / (rx + pad)) ** 2 + ((y - archY) / (ry + pad)) ** 2 <= 1);
  if (curtain) {
    // The valance, scalloped along its bottom, round the top of the arch.
    for (let y = 0; y < archY; y++) {
      for (let x = 0; x < w; x++) {
        const scallop = archY - 5 + Math.round(Math.abs(Math.sin((x * Math.PI) / 7)) * 3);
        if (inArch(x, y, 0) && !inArch(x, y, -5) && y <= scallop) {
          pm.set(x, y, (x + y) % 5 === 0 ? PD.curtainDark : PD.curtain);
        }
      }
    }
    // The drape at the right, gathered in its tie-back, flaring to the floor.
    const tie = archY + 8;
    for (let y = archY - 4; y <= floor; y++) {
      const flare = y < tie ? (tie - y) / 3 : (y - tie) / 4;
      const left = Math.round(w - 9 - flare);
      for (let x = left; x <= w - 4; x++) {
        if (inArch(x, y, 0)) {
          pm.set(x, y, (x - left) % 3 === 1 ? PD.curtainDark : PD.curtain);
        }
      }
    }
    pm.rect(w - 10, tie, 7, 2, PD.brass);
    pm.set(w - 9, tie, PD.glow);
    return pm.outline(C.outline);
  }
  // The thick pink rim, and the deep hollow inside it (shadowed at the top).
  for (let y = 0; y <= floor; y++) {
    for (let x = 0; x < w; x++) {
      if (inArch(x, y, 0)) {
        pm.set(x, y, y < archY - 6 && bayer(x, y) < 0.5 ? PD.shellDeep : PD.nook);
      } else if (inArch(x, y, 2)) {
        pm.set(x, y, PD.shellDeep);
      }
    }
  }
  // Round cushions all along the back.
  for (let x = 6, i = 0; x < w - 5; x += 8, i++) {
    pm.circle(x, top - 4, 4.5, i % 2 ? PD.rugLight : PD.shellLight);
    pm.set(x - 1, top - 6, '#ffffff');
  }
  // The mattress: plump and buttoned, its front rounded off.
  const left = Math.round(cx - BED_NOOK.w / 2);
  pm.rect(left, top, BED_NOOK.w, floor - top + 1 + NOOK.floor, PD.rug);
  pm.hline(left, left + BED_NOOK.w - 1, top, PD.rugLight);
  pm.hline(left, left + BED_NOOK.w - 1, h - 1, PD.rugDark);
  for (let x = left + 5; x < left + BED_NOOK.w - 3; x += 7) {
    pm.set(x, top + 4, PD.rugDark);
  }
  // A pillow at the left-hand end.
  pm.ellipse(left + 9, top - 1, 6, 2, '#ffffff');
  pm.hline(left + 5, left + 12, top + 1, PD.rugLight);
  return pm.outline(C.outline);
}

// The quilt over whoever's in the nook (see drawBlanket).
export const NOOK_QUILT = { face: '#ff7fbf', light: '#ffb8dc', dark: '#c8508e' };

// The pantry cupboard, bottom-centre on the floor: a little mint-green
// cupboard with a scalloped top and two doors with brass knobs. `open`, its
// doors are swung out either side onto two shelves inside: golden pots of
// nectar on the top one, a glass jar of seed cookies and a couple more pots
// on the bottom.
export const CUPBOARD = { w: 34, h: 36, body: 24 };
export function drawPantry(open = false) {
  const { w, h, body } = CUPBOARD;
  const pm = new Pixmap(w, h);
  const left = (w - body) / 2;
  const right = left + body - 1;
  const top = 6;
  // The scalloped top, and the body on its little feet.
  for (let x = left; x <= right; x++) {
    const bump = Math.round(Math.abs(Math.sin(((x - left) * Math.PI) / 8)) * 3);
    pm.vline(x, top - bump, top, PD.curtainDark);
  }
  pm.rect(left, top + 1, body, h - top - 4, PD.curtain);
  pm.hline(left, right, h - 4, PD.curtainDark);
  for (const x of [left + 1, right - 2]) {
    pm.rect(x, h - 3, 2, 3, PD.woodDark);
  }
  const dTop = top + 3;
  const dBottom = h - 6;
  const mid = left + body / 2;
  if (!open) {
    // Two doors, a heart cut in each, knobs by the middle.
    for (const [d0, d1] of [[left + 2, mid - 1], [mid, right - 2]]) {
      pm.rect(d0, dTop, d1 - d0 + 1, dBottom - dTop + 1, PD.curtain);
      pm.hline(d0, d1, dTop, PD.curtainDark);
      pm.hline(d0, d1, dBottom, PD.curtainDark);
      pm.vline(d0, dTop, dBottom, PD.curtainDark);
      pm.vline(d1, dTop, dBottom, PD.curtainDark);
      const hx = Math.round((d0 + d1) / 2);
      pm.set(hx - 1, dTop + 4, PD.shellDark);
      pm.set(hx + 1, dTop + 4, PD.shellDark);
      pm.hline(hx - 1, hx + 1, dTop + 5, PD.shellDark);
      pm.set(hx, dTop + 6, PD.shellDark);
    }
    pm.set(mid - 3, dTop + 11, PD.brass);
    pm.set(mid + 2, dTop + 11, PD.brass);
    return pm.outline(C.outline);
  }
  // Inside: dark wood, with two shelves.
  pm.rect(left + 2, dTop, body - 4, dBottom - dTop + 1, PD.woodDark);
  const shelves = [dTop + 9, dBottom];
  for (const y of shelves) {
    pm.hline(left + 2, right - 2, y, PD.wood);
  }
  // Pots of nectar on the top shelf.
  for (const x of [left + 5, left + 11, left + 17]) {
    pm.rect(x - 2, shelves[0] - 5, 5, 5, PD.brass);
    pm.hline(x - 2, x + 2, shelves[0] - 6, PD.glow);
    pm.set(x - 1, shelves[0] - 3, PD.glow);
  }
  // A glass jar of seed cookies on the bottom, and another pot of nectar.
  const jx = left + 7;
  pm.rect(jx - 4, shelves[1] - 9, 9, 9, PD.lens);
  pm.hline(jx - 3, jx + 3, shelves[1] - 10, PD.shellDeep);
  for (const [dx, dy] of [[-2, -2], [1, -3], [-1, -5], [2, -6]]) {
    pm.circle(jx + dx, shelves[1] + dy, 1.5, PD.wood);
  }
  pm.rect(left + 15, shelves[1] - 5, 5, 5, PD.brass);
  pm.hline(left + 15, left + 19, shelves[1] - 6, PD.glow);
  // The doors swung out either side, edge on, knobs showing.
  for (const [x0, knob] of [[0, 4], [right + 1, right + 1]]) {
    pm.rect(x0, dTop - 1, left, dBottom - dTop + 3, PD.curtainDark);
    pm.vline(knob, dTop + 1, dBottom - 1, PD.curtain);
    pm.set(knob, dTop + 11, PD.brass);
  }
  return pm.outline(C.outline);
}

// The little stove the kettle sits on, bottom-centre on the floor: a round
// iron pot-belly on stubby legs, its hob on top, and a grate that glows when
// it's `hot`.
export const STOVE = { w: 22, h: 18 };
export function drawStove(hot = false) {
  const { w, h } = STOVE;
  const pm = new Pixmap(w, h);
  const cx = (w - 1) / 2;
  pm.rect(2, 0, w - 4, 3, PD.iron); // the hob
  pm.hline(2, w - 3, 0, PD.ironLight);
  pm.ellipse(cx, 9, 9, 6, PD.iron);
  pm.ellipse(cx - 3, 7, 3, 2, PD.ironLight);
  // The grate.
  pm.rect(cx - 4, 9, 9, 4, hot ? PD.glowDeep : PD.ironDark);
  for (const dx of [-2, 0, 2]) {
    pm.vline(Math.round(cx + dx), 9, 12, hot ? PD.flame : PD.iron);
  }
  for (const dx of [-7, 6]) {
    pm.rect(Math.round(cx + dx), h - 3, 2, 3, PD.ironDark);
  }
  return pm.outline(C.outline);
}

// The kettle, bottom-centre on the stove's hob: round and pink with a curly
// spout to the right, a hooped handle over the top, and a lid with a knob.
// `hot`, it's flushed rosy and its spout's whistle is up. `hob`: how far
// right of the stove's middle it sits; `spout`: where its whistle is, from
// its bottom-centre.
export const KETTLE_ART = { w: 18, h: 15, hob: 2, spout: { x: 7, y: -12 } };
export function drawKettle(hot = false) {
  const { w, h } = KETTLE_ART;
  const pm = new Pixmap(w, h);
  const cx = 7;
  pm.ring(cx, 6, 5, 4, PD.brassDark); // the handle
  pm.ellipse(cx, h - 5, 6, 4.5, hot ? PD.kettleHot : PD.shell);
  pm.hline(cx - 5, cx + 5, h - 1, PD.shellDeep);
  pm.ellipse(cx - 2, h - 7, 2, 1, PD.shellLight);
  pm.hline(cx - 3, cx + 3, h - 9, PD.shellDark); // the lid
  pm.set(cx, h - 10, PD.brass);
  // The spout, curling up and out, with its whistle on the end.
  pm.line(cx + 5, h - 4, w - 3, h - 9, PD.shellDark, 2);
  pm.rect(w - 3, h - (hot ? 12 : 11), 2, 2, PD.brass);
  if (hot) {
    pm.set(cx - 3, h - 4, PD.shellDark);
    pm.set(cx + 3, h - 4, PD.shellDark);
  }
  return pm.outline(C.outline);
}

// The chest of drawers, bottom-centre on the floor: a little lilac dresser
// with a wavy top board, three drawers with a brass knob each, and stubby
// feet. `open`: which drawer is pulled out (-1 = all shut): it slides down
// and out at you, its dark inside showing above it. `drawers`: the middle
// of each drawer's front (from the top of the picture), shut.
export const CHEST = { w: 30, h: 36, body: 24, drawers: [11, 19, 27] };
export function drawDresser(open = -1) {
  const { w, h, body, drawers } = CHEST;
  const pm = new Pixmap(w, h);
  const left = (w - body) / 2;
  const right = left + body - 1;
  // The top board, a little wider, with a wavy edge.
  pm.rect(left - 1, 4, body + 2, 2, PD.rugDark);
  for (let x = left; x <= right; x += 4) {
    pm.set(x + 1, 3, PD.rugDark);
    pm.set(x + 2, 3, PD.rugDark);
  }
  pm.rect(left, 6, body, h - 9, PD.rugLight);
  pm.hline(left, right, h - 4, PD.rugDark);
  for (const x of [left + 1, right - 2]) {
    pm.rect(x, h - 3, 2, 3, PD.woodDark);
  }
  drawers.forEach((mid, i) => {
    const d0 = left + 2;
    const d1 = right - 2;
    let top = mid - 3;
    if (i === open) {
      // The hole it's come out of, and the drawer slid down and wider.
      pm.rect(d0, top, d1 - d0 + 1, 7, PD.dimmed);
      top += 5;
      pm.rect(d0 - 1, top - 2, d1 - d0 + 3, 2, PD.wood); // its sides, seen from above
      pm.hline(d0, d1, top - 2, PD.woodDark);
      pm.rect(d0 - 2, top, d1 - d0 + 5, 7, PD.rug);
      pm.hline(d0 - 2, d1 + 2, top + 6, PD.rugDark);
    } else {
      pm.rect(d0, top, d1 - d0 + 1, 7, PD.rug);
      pm.hline(d0, d1, top + 6, PD.rugDark);
      pm.hline(d0, d1, top, PD.rugLight);
    }
    const cx = Math.round((d0 + d1) / 2);
    pm.rect(cx - 1, top + 2, 2, 2, PD.brass);
    pm.set(cx - 1, top + 2, PD.glow);
  });
  return pm.outline(C.outline);
}
