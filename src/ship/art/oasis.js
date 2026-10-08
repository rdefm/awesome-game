import { Pixmap, bayer, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { ST, drawStripeyCanyon, stripe } from './stripey.js';
import { DUNE, LILY_PADS, OASIS_POOL, W, duneTop } from '../layout.js';

// Everything painted for the oasis on Stripey: the canyon with a stripy pool
// in it among palms, lily pads, and a big sand dune at the back to slide
// down; a palm tree up close, its coconuts, and the stripy frog.

export const OA = {
  water: '#3fb8c8',
  waterLight: '#8ae6e0',
  waterDeep: '#2a7f9a',
  pad: '#4aa84a',
  padLight: '#7cd06a',
  trunk: '#a8683a',
  trunkLight: '#d09a5a',
  nut: '#8a5430',
  nutLight: '#b0763e',
  nutDark: '#4e2c18',
};

const BODY = '#ff00ff'; // stand-in colour, striped once the shape's drawn

// A little palm far off at the back, standing on (x, y), `h` tall.
function farPalm(pm, x, y, h, lean) {
  for (let i = 0; i <= h; i++) {
    const tx = Math.round(x + lean * (i / h) ** 2);
    pm.set(tx, y - i, i % 2 ? OA.trunk : OA.trunkLight);
  }
  const cx = x + lean;
  const cy = y - h;
  for (const [dx, dy] of [[-6, 3], [-4, -2], [0, -3], [5, -2], [7, 3], [3, 4], [-3, 4]]) {
    pm.line(cx, cy, cx + dx, cy + dy, ST.greenDark, 1);
    pm.set(cx + dx, cy + dy + 1, ST.green);
  }
}

// The canyon (see drawStripeyCanyon) with the oasis in it: a pool in
// turquoise stripes ringed with a damp sandy shore, lily pads, a few palms
// round the back, and the dune piled up on the right.
export function drawOasis({ horizon = 100 } = {}) {
  const pm = drawStripeyCanyon({ horizon, seed: 33 });
  const rand = seededRandom(37);
  farPalm(pm, 26, horizon + 6, 18, 4);
  farPalm(pm, 74, horizon + 2, 14, -3);
  farPalm(pm, 184, horizon + 3, 16, 5);
  // The dune: sand in stripes that follow its shape, shaded on the right,
  // with a sunlit crest along the top.
  for (let x = DUNE.foot.x - 2; x < W; x++) {
    const top = Math.round(duneTop(x));
    for (let y = top; y <= DUNE.foot.y; y++) {
      const band = Math.floor((y - top) / 3 + x / 40) % 3;
      let color = band === 0 ? ST.sandLight : band === 1 ? ST.sand : ST.sandDark;
      if (x > DUNE.peak.x && bayer(x, y) < 0.35) {
        color = ST.sandDeep;
      }
      pm.set(x, y, color);
    }
    pm.set(x, top, ST.sandLight);
    pm.dither(x, DUNE.foot.y - 2, 1, 3, ST.sandDeep, 0.4); // its shadow on the ground
  }
  // The pool: a damp shore, then stripy water that ripples across.
  const { x: px, y: py, rx, ry } = OASIS_POOL;
  const inPool = (x, y, grow = 0) => ((x - px) / (rx + grow)) ** 2 + ((y - py) / (ry + grow)) ** 2 <= 1;
  for (let y = py - ry - 4; y <= py + ry + 4; y++) {
    for (let x = px - rx - 4; x <= px + rx + 4; x++) {
      if (inPool(x, y)) {
        const wave = Math.floor((y + Math.sin(x / 7) * 1.2) / 2) % 2;
        pm.set(x, y, wave ? OA.water : OA.waterLight);
        if (y < py - ry + 2) {
          pm.set(x, y, OA.waterDeep);
        }
      } else if (inPool(x, y, 3)) {
        pm.set(x, y, bayer(x, y) < 0.5 ? ST.sandDeep : ST.sandDark);
      }
    }
  }
  // Glints on the water.
  for (let i = 0; i < 14; i++) {
    const x = px - rx + 8 + Math.floor(rand() * (rx * 2 - 16));
    const y = py - ry + 3 + Math.floor(rand() * (ry * 2 - 5));
    if (inPool(x - 2, y) && inPool(x + 2, y)) {
      pm.hline(x, x + 1 + Math.floor(rand() * 2), y, '#ffffff');
    }
  }
  // Lily pads, each with a notch cut out.
  for (const pad of LILY_PADS) {
    pm.ellipse(pad.x, pad.y, 8, 2.5, OA.pad);
    pm.ellipse(pad.x - 1, pad.y - 1, 5, 1.2, OA.padLight);
    pm.line(pad.x, pad.y, pad.x + 6, pad.y + 2, OA.water, 1);
  }
  return pm;
}

// The palm up close: a ringed trunk curving up to the right, and a crown of
// fronds in green stripes. Its trunk stands at x 16 on the bottom row (the
// crown, where the coconuts hang, at 30, 8).
export const PALM_ART = { w: 52, h: 70, base: 16, crown: { x: 30, y: 8 } };

export function drawPalm(sway = 0) {
  const { w, h, base, crown } = PALM_ART;
  const pm = new Pixmap(w, h);
  // The trunk: a stack of rings, thinning towards the top.
  for (let i = 0; i < h - crown.y; i++) {
    const k = i / (h - crown.y);
    const x = base + (crown.x - base) * k * k + sway * k;
    const y = h - 1 - i;
    const r = 3.5 - k * 1.2;
    pm.rect(Math.round(x - r), y, Math.round(r * 2), 1, Math.floor(i / 3) % 2 ? OA.trunk : OA.trunkLight);
  }
  // Fronds: long drooping leaves fanning out from the crown.
  const cx = crown.x + sway;
  const cy = crown.y;
  for (const [ang, len] of [[-2.9, 20], [-2.3, 18], [-1.7, 14], [-1.2, 16], [-0.6, 19], [-0.1, 21], [0.4, 17], [3.4, 17]]) {
    let x = cx;
    let y = cy;
    for (let s = 0; s < len; s++) {
      const droop = (s / len) ** 2 * 7;
      x = cx + Math.cos(ang) * s;
      y = cy + Math.sin(ang) * s * 0.6 + droop;
      pm.rect(Math.round(x), Math.round(y), 2, 2, BODY);
    }
  }
  stripe(pm, BODY, ST.green, ST.greenLight, 2, 0);
  pm.circle(cx, cy + 1, 3, ST.greenDark);
  return pm.outline(C.outline);
}

// A coconut, in brown stripes with its three dark eyes, turned a quarter
// round for each `turn` (0..3) so it can roll.
export function drawCoconut(turn = 0) {
  const pm = new Pixmap(11, 11);
  pm.circle(5, 5, 4.5, BODY);
  stripe(pm, BODY, OA.nut, OA.nutLight, 2, 0);
  const a = (turn * Math.PI) / 2;
  for (const off of [-0.6, 0, 0.6]) {
    pm.set(Math.round(5 + Math.cos(a + off) * 2.5), Math.round(5 + Math.sin(a + off) * 2.5), OA.nutDark);
  }
  pm.set(3, 3, '#e8c08a');
  return pm.outline(C.outline);
}

// The stripy frog, sitting facing right, in green and yellow stripes with
// big eyes on top. frame: 'sit' | 'blink' | 'puff' (throat blown up to
// croak) | 'leap' (stretched out mid-jump).
export function drawFrog(frame = 'sit') {
  const pm = new Pixmap(20, 15);
  if (frame === 'leap') {
    pm.ellipse(10, 8, 6, 3.5, BODY);
    pm.line(4, 9, 0, 12, BODY, 2); // back legs kicked out
    pm.line(4, 7, 0, 5, BODY, 2);
    pm.line(15, 9, 18, 12, BODY, 1); // front legs reaching
  } else {
    pm.ellipse(9, 10, 6, 4, BODY);
    pm.ellipse(4, 12, 3, 2, BODY); // the back leg folded up
    pm.rect(13, 11, 2, 3, BODY); // the front leg
  }
  stripe(pm, BODY, ST.green, '#ffe066', 2, 1);
  const ey = frame === 'leap' ? 4 : 5;
  for (const ex of frame === 'leap' ? [11, 15] : [8, 13]) {
    pm.circle(ex, ey, 2, ST.green);
    pm.circle(ex, ey, 1.2, C.white);
    if (frame === 'blink') {
      pm.hline(ex - 1, ex + 1, ey, ST.greenDark);
    } else {
      pm.set(ex + 1, ey, C.outline);
    }
  }
  if (frame === 'puff') {
    pm.ellipse(14, 12, 3, 2.2, '#fff4c8'); // the throat, blown up like a balloon
    pm.set(13, 11, '#ffffff');
  } else if (frame !== 'leap') {
    pm.hline(11, 15, 10, ST.greenDark); // a wide smile
    pm.set(15, 9, C.cheek);
  }
  return pm.outline(C.outline);
}
