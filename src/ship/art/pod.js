import { Pixmap, bayer, fractalNoise, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { BB, LOCAL_COLORS } from './bluebell.js';
import { FLOOR_TOP, HOUSE_DOOR, SEED_TRAY, STAR_WINDOW, W, H } from '../layout.js';

// Everything painted for the pink alien's pod on Bluebell: the round pod far
// off in the meadow and the stepping-stone path up to it; and inside: the
// cosy round room, its round-topped door, the telescope and the window it
// looks out of, the seed tray, and the bubble bath.

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
};

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
  const rand = seededRandom(52);
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
    const y = Math.round(16 + Math.abs(Math.sin(((x - 30) / (W - 60)) * Math.PI * 3)) * 8);
    pm.set(x, y, PD.shellDeep);
    if ((x - 30) % 10 === 5) {
      pm.circle(x, y + 2, 1.5, rand() < 0.5 ? PD.glow : BB.bellLight);
    }
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
