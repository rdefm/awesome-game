import { Pixmap, bayer, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { FR, drawSnowfield } from './frosty.js';
import { FISHING_HOLE, FROZEN_LAKE } from '../layout.js';

// Everything painted for the frozen lake on Frosty: the snowy valley with a
// great sheet of ice in it and a fishing hole cut at the back; the curious
// fish that pokes its head up out of the hole; and the little snow critters
// waddling about.

export const FL = {
  ice: '#bfe6f6',
  iceLight: '#e4f7ff',
  iceDark: '#94c8e2',
  crack: '#7aaed0',
  water: '#2f6a9a',
  waterDeep: '#1c4270',
  fish: '#ff9d5c',
  fishDark: '#e8602a',
  fishFin: '#ffd27a',
  feet: '#ffa040', // the snow critters' feet and beaks
};

// The snowy valley (see drawSnowfield) with the lake frozen over in it: a
// snowbank round the edge, ice with a soft sheen across it, a few cracks
// and glints, and the round fishing hole with dark water in it.
export function drawFrozenLake({ horizon = 100 } = {}) {
  const pm = drawSnowfield({ horizon, seed: 9 });
  const rand = seededRandom(41);
  const { x: lx, y: ly, rx, ry } = FROZEN_LAKE;
  const inLake = (x, y, grow = 0) => ((x - lx) / (rx + grow)) ** 2 + ((y - ly) / (ry + grow)) ** 2 <= 1;
  for (let y = ly - ry - 4; y <= ly + ry + 4; y++) {
    for (let x = lx - rx - 4; x <= lx + rx + 4; x++) {
      if (inLake(x, y)) {
        // Diagonal bands of sheen, a little darker towards the back.
        const band = Math.floor((x - y * 2) / 9) % 4;
        let color = band === 0 ? FL.iceLight : FL.ice;
        if (y < ly - ry * 0.4 && bayer(x, y) < 0.4) {
          color = FL.iceDark;
        }
        pm.set(x, y, color);
      } else if (inLake(x, y, 3)) {
        pm.set(x, y, bayer(x, y) < 0.5 ? FR.snowShade : '#ffffff'); // the snowbank round it
      }
    }
  }
  // Cracks: little zigzags across the ice.
  for (let i = 0; i < 7; i++) {
    let x = lx - rx + 14 + rand() * (rx * 2 - 28);
    let y = ly - ry + 4 + rand() * (ry * 2 - 8);
    for (let s = 0; s < 6 + Math.floor(rand() * 6); s++) {
      if (inLake(Math.round(x), Math.round(y), -2)) {
        pm.set(Math.round(x), Math.round(y), FL.crack);
      }
      x += 1 + rand();
      y += rand() < 0.5 ? -0.6 : 0.6;
    }
  }
  // Glints.
  for (let i = 0; i < 18; i++) {
    const x = lx - rx + 6 + Math.floor(rand() * (rx * 2 - 12));
    const y = ly - ry + 2 + Math.floor(rand() * (ry * 2 - 4));
    if (inLake(x, y, -2)) {
      pm.set(x, y, '#ffffff');
    }
  }
  // The fishing hole: a rim of snowy ice round dark water, deeper at the back.
  const h = FISHING_HOLE;
  pm.ellipse(h.x, h.y, h.rx + 2, h.ry + 1.5, '#ffffff');
  pm.ellipse(h.x, h.y + 0.5, h.rx + 2, h.ry + 1, FR.snowShade);
  pm.ellipse(h.x, h.y, h.rx, h.ry, FL.water);
  pm.ellipse(h.x, h.y - 1, h.rx - 1, h.ry - 1.5, FL.waterDeep);
  pm.hline(h.x + 2, h.x + 4, h.y + 1, FL.iceLight); // a glint on the water
  return pm;
}

// The curious fish, poking up out of the hole to see who's there: an orange
// head with big round eyes, looking right. frame: 'look' | 'blink' | 'oh'
// (mouth open, blowing a bubble).
export function drawLakeFish(frame = 'look') {
  const pm = new Pixmap(18, 16);
  pm.ellipse(9, 10, 5.5, 6, FL.fish);
  pm.dither(4, 11, 11, 5, FL.fishDark, 0.5);
  pm.line(3, 10, 1, 7, FL.fishFin, 2); // fins out at the sides
  pm.line(14, 10, 16, 7, FL.fishFin, 2);
  pm.rect(8, 2, 2, 2, FL.fishFin); // a little fin on top
  for (const ex of [7, 12]) {
    pm.circle(ex, 8, 2, C.white);
    if (frame === 'blink') {
      pm.hline(ex - 1, ex + 1, 8, FL.fishDark);
    } else {
      pm.set(ex + 1, 8, C.outline);
      pm.set(ex + 1, 9, C.outline);
    }
  }
  if (frame === 'oh') {
    pm.circle(10, 13, 1.5, '#9a2a1a');
  } else {
    pm.hline(9, 11, 13, '#9a2a1a');
  }
  return pm.outline(C.outline);
}

// A snow critter: a round little puff of fluff with a beak and orange
// feet, waddling, facing right. Each `variant` has its own colours, from
// SNOW_CRITTER_COLORS. frame: 'stand' | 'step' | 'blink' | 'belly' (flat
// out on its tummy, tobogganing).
export const SNOW_CRITTER_COLORS = [
  { fluff: '#ffffff', shade: '#cddff2', cap: '#8fc4e8' },
  { fluff: '#eaf4ff', shade: '#b8d0ea', cap: '#ff8fc8' },
  { fluff: '#f8f4ff', shade: '#d4c8ee', cap: '#9a7cf0' },
];

export function drawSnowCritter(frame = 'stand', variant = 0) {
  const k = SNOW_CRITTER_COLORS[variant];
  const pm = new Pixmap(17, 14);
  if (frame === 'belly') {
    pm.ellipse(8, 9, 6.5, 3.5, k.fluff);
    pm.dither(2, 10, 13, 3, k.shade, 0.5);
    pm.ellipse(6, 6.5, 3, 1.5, k.cap);
    pm.set(13, 8, C.outline);
    pm.rect(15, 9, 1, 1, FL.feet); // its beak, out in front
    pm.set(1, 8, FL.feet); // feet kicked up behind
    pm.set(1, 10, FL.feet);
    return pm.outline(C.outline);
  }
  const step = frame === 'step' ? 1 : 0;
  pm.rect(4 - step, 11, 3, 2, FL.feet);
  pm.rect(8 + step, 11, 3, 2, FL.feet);
  pm.ellipse(7, 7, 5.5, 5, k.fluff);
  pm.dither(2, 8, 11, 4, k.shade, 0.45);
  pm.ellipse(7, 2.5, 3.5, 1.5, k.cap); // a tuft of coloured fluff on top
  pm.set(4, 5, '#ffffff');
  if (frame === 'blink') {
    pm.hline(8, 9, 6, k.shade);
  } else {
    pm.set(9, 5, C.outline);
    pm.set(9, 6, C.outline);
  }
  pm.rect(12, 7, 2, 1, FL.feet);
  pm.set(10, 8, C.cheek);
  return pm.outline(C.outline);
}
