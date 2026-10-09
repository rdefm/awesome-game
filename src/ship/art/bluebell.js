import { Pixmap, bayer, fractalNoise, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { drawAlien } from './props.js';
import { W, H } from '../layout.js';

// Everything painted for planet Bluebell: the meadow, the parked ship seen
// from outside, and the locals.

export const BB = {
  skyTop: '#4f8fe6',
  sky: '#7fb8f5',
  skyLow: '#bfe3ff',
  haze: '#9cc6ee',
  hazeDark: '#7aa8dc',
  hillDark: '#2f8f4a',
  hill: '#3fae55',
  grass: '#5ccf63',
  grassLight: '#8ee87a',
  grassDark: '#3f9e45',
  bellDark: '#1e3f8a',
  bell: '#2f6fd0',
  bellLight: '#6fb2ff',
  bellHi: '#a9d6f2',
  stem: '#2b7a3d',
};

// A ridge line: noise-driven height in pixels for each column.
function ridge(x, base, amp, scale, seed) {
  return Math.round(base - fractalNoise(x / scale, 0.5, seed, 3) * amp);
}

// The meadow, with its horizon at `horizon`. Used both as the full-screen
// backdrop on the planet and (with a higher horizon) as the view out of the
// ship's windows once it has landed. `width`: wider than the screen for the
// landing site, which the view pans along.
export function drawMeadow({ horizon = 100, seed = 4, width = W } = {}) {
  const pm = new Pixmap(width, H);
  const rand = seededRandom(seed);
  // Sky: dithered bands from deep blue to pale at the horizon.
  for (let y = 0; y < H; y++) {
    const t = y / Math.max(1, horizon);
    for (let x = 0; x < width; x++) {
      const k = t + (bayer(x, y) - 0.5) * 0.18;
      pm.set(x, y, k < 0.3 ? BB.skyTop : k < 0.7 ? BB.sky : BB.skyLow);
    }
  }
  // A pale sun with a soft halo.
  const sx = 214;
  const sy = Math.round(horizon * 0.22);
  for (let i = 0; i < 4; i++) {
    for (let y = sy - 14; y <= sy + 14; y++) {
      for (let x = sx - 14; x <= sx + 14; x++) {
        const d = Math.hypot(x - sx, y - sy);
        if (d < 14 - i * 3 && bayer(x, y) < 0.35 + i * 0.2) {
          pm.set(x, y, i < 3 ? '#d8eeff' : '#fff6c8');
        }
      }
    }
  }
  pm.circle(sx, sy, 4, '#fffbe6');
  // Far misty mountains, then rolling green hills.
  for (let x = 0; x < width; x++) {
    const far = ridge(x, horizon - 4, horizon * 0.32, 40, seed + 1);
    for (let y = far; y < horizon; y++) {
      pm.set(x, y, y - far < 2 ? BB.haze : BB.hazeDark);
    }
    const near = ridge(x, horizon + 2, horizon * 0.14, 26, seed + 2);
    for (let y = near; y < horizon + 6; y++) {
      pm.set(x, y, y - near < 1 ? BB.hill : y - near < 3 && bayer(x, y) < 0.5 ? BB.hill : BB.hillDark);
    }
  }
  // The meadow floor: lighter at the back, darker toward the viewer.
  for (let y = horizon + 4; y < H; y++) {
    const depth = (y - horizon) / (H - horizon);
    for (let x = 0; x < width; x++) {
      pm.set(x, y, BB.grass);
    }
    pm.dither(0, y, width, 1, BB.grassLight, 0.35 - depth * 0.6);
    pm.dither(0, y, width, 1, BB.grassDark, depth * 0.55 - 0.15);
  }
  // Distant drifts of bluebells on the hills.
  for (let i = 0; i < Math.round((160 * width) / W); i++) {
    const x = Math.floor(rand() * width);
    const y = horizon + 2 + Math.floor(rand() * 8);
    if (pm.get(x, y)[1] > 120) {
      pm.set(x, y, rand() < 0.5 ? BB.bell : BB.bellLight);
    }
  }
  // Grass tufts and little bluebells, bigger the closer they are.
  const n = Math.round(((H - horizon) * 3.2 * width) / W);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand() * width);
    const y = horizon + 8 + Math.floor(rand() * (H - horizon - 8));
    const near = (y - horizon) / (H - horizon);
    if (rand() < 0.55) {
      pm.set(x, y, BB.grassDark);
      pm.set(x - 1, y - 1, BB.grassLight);
      if (near > 0.5) {
        pm.set(x + 1, y - 2, BB.grassLight);
      }
    } else {
      pm.set(x, y, BB.stem);
      pm.set(x, y - 1, BB.bell);
      if (near > 0.45) {
        pm.set(x + 1, y - 1, BB.bellLight);
        pm.set(x, y - 2, BB.bell);
        pm.set(x, y + 1, BB.stem);
      }
    }
  }
  return pm;
}

export function drawCloud(variant = 0) {
  const pm = new Pixmap(40, 16);
  const puffs = variant
    ? [[8, 10, 6], [17, 7, 7], [27, 9, 6], [33, 11, 4]]
    : [[7, 10, 5], [15, 8, 6], [24, 6, 7], [32, 10, 5]];
  for (const [x, y, r] of puffs) {
    pm.circle(x, y, r, '#ffffff');
  }
  pm.rect(4, 11, 32, 4, '#ffffff');
  for (let y = 11; y < 16; y++) {
    pm.dither(0, y, 40, 1, '#dfeaf8', 0.4 + (y - 11) * 0.15);
  }
  return pm;
}

// --------------------------------------------------------------- ship outside
export const SHIP_W = 64;
export const SHIP_H = 46;
// Where things sit inside the exterior sprite.
export const SHIP_DOOR = { x: 24, y: 14, w: 10, h: 17 };

function fillTriangle(pm, a, b, c, color) {
  const minY = Math.floor(Math.min(a[1], b[1], c[1]));
  const maxY = Math.ceil(Math.max(a[1], b[1], c[1]));
  const minX = Math.floor(Math.min(a[0], b[0], c[0]));
  const maxX = Math.ceil(Math.max(a[0], b[0], c[0]));
  const side = (p, q, x, y) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const s1 = side(a, b, x, y);
      const s2 = side(b, c, x, y);
      const s3 = side(c, a, x, y);
      if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) {
        pm.set(x, y, color);
      }
    }
  }
}

// Our ship seen from outside, nose to the right (the cockpit windshield is on
// the right inside, too). `open` shows the door open with its ramp down.
export function drawShipExterior({ open = false } = {}) {
  const pm = new Pixmap(SHIP_W, SHIP_H);
  // Landing legs behind the hull.
  for (const [x0, x1] of [[18, 12], [46, 52]]) {
    pm.line(x0, 28, x1, 40, C.metalDark, 2);
    pm.rect(x1 - 2, 41, 6, 2, C.metal);
  }
  // Tail fins.
  fillTriangle(pm, [4, 1], [18, 12], [7, 13], C.redDark);
  fillTriangle(pm, [5, 2], [16, 12], [8, 12], C.red);
  fillTriangle(pm, [4, 37], [18, 26], [7, 25], C.redDark);
  // Hull: a fat capsule, shaded from a bright top to a cool belly.
  pm.ellipse(32, 20, 27, 12, C.white);
  for (let y = 26; y <= 33; y++) {
    for (let x = 0; x < SHIP_W; x++) {
      if (pm.get(x, y)[0] === 0xf4) {
        const b = bayer(x, y);
        pm.set(x, y, y > 29 && b < (y - 29) * 0.2 ? C.metal : b < 0.6 + (y - 25) * 0.08 ? '#c7c3d6' : C.white);
      }
    }
  }
  for (let y = 0; y < SHIP_H; y++) {
    for (let x = 0; x < SHIP_W; x++) {
      if (pm.get(x, y)[0] === 0xf4 && !pm.isSet(x, y - 1)) {
        pm.set(x, y + 1, '#ffffff');
      }
    }
  }
  // Red nose cone and racing stripe.
  for (let y = 8; y <= 32; y++) {
    for (let x = 50; x < SHIP_W; x++) {
      if (pm.isSet(x, y) && (x - 50) * 1.2 + Math.abs(y - 20) * 0.3 > 3) {
        pm.set(x, y, x > 56 ? C.redDark : C.red);
      }
    }
  }
  pm.hline(8, 50, 21, C.red);
  pm.hline(8, 50, 22, C.redDark);
  // Cockpit glass and a round porthole.
  pm.ellipse(44, 14, 5, 3, C.tealDark);
  pm.ellipse(44, 13, 4, 2, C.teal);
  pm.hline(42, 44, 12, '#bff6f2');
  pm.circle(14, 17, 2, C.metalDark);
  pm.circle(14, 17, 1, C.teal);
  // Thruster bell under the belly.
  pm.rect(28, 31, 9, 3, C.metalDark);
  pm.rect(29, 31, 7, 1, C.metal);
  // Door.
  const d = SHIP_DOOR;
  pm.rect(d.x - 1, d.y - 1, d.w + 2, d.h + 2, C.metalDark);
  if (open) {
    pm.rect(d.x, d.y, d.w, d.h, '#2a1f3a');
    for (let y = d.y; y < d.y + d.h; y++) {
      pm.dither(d.x, y, d.w, 1, '#ffcf6a', 0.25 + ((y - d.y) / d.h) * 0.5);
    }
    // Ramp down to the grass.
    const top = d.y + d.h;
    for (let y = top; y < SHIP_H - 1; y++) {
      const k = (y - top) / (SHIP_H - 2 - top);
      const l = Math.round(d.x - k * 4);
      const r = Math.round(d.x + d.w - 1 + k * 4);
      pm.hline(l, r, y, (y - top) % 3 === 0 ? C.metalDark : C.metal);
      pm.set(l, y, C.metalLight);
    }
  } else {
    pm.rect(d.x, d.y, d.w, d.h, C.metal);
    pm.vline(d.x + d.w / 2, d.y, d.y + d.h - 1, C.metalDark);
    pm.vline(d.x, d.y, d.y + d.h - 1, C.metalLight);
    pm.rect(d.x + 2, d.y + 3, d.w - 4, 3, C.tealDark);
    pm.set(d.x + d.w - 2, d.y + 9, C.green);
  }
  return pm.outline(C.outline);
}

export function drawFlame(frame = 0) {
  const pm = new Pixmap(13, 16);
  const len = frame ? 15 : 11;
  for (let y = 0; y < len; y++) {
    const k = y / len;
    const half = Math.max(0, Math.round((1 - k) * 5));
    pm.hline(6 - half, 6 + half, y, k < 0.35 ? C.yellow : k < 0.7 ? C.orange : C.red);
    if (half > 1) {
      pm.hline(6 - Math.floor(half / 2), 6 + Math.floor(half / 2), y, k < 0.5 ? C.white : C.yellow);
    }
  }
  return pm;
}

// -------------------------------------------------------------- giant bluebells
const BELL = [
  '....s....',
  '...bBb...',
  '..bBhBb..',
  '.bBhBBBb.',
  '.bBhBBBb.',
  '.bBBBBBb.',
  'bBBBBBBBb',
  'LbLbLbLbL',
];

export function drawBell() {
  return Pixmap.fromGrid(BELL, { s: BB.stem, b: BB.bellDark, B: BB.bell, h: BB.bellHi, L: BB.bellLight }).outline(C.outline);
}

// A tall stem that arches over at the top like a shepherd's crook. Returns the
// stem pixmap plus where each bell hangs (relative to the bottom-centre anchor
// at (8, height)), so the bells can swing independently.
export function drawBluebellStem(height, bells = 3) {
  const w = 30;
  const pm = new Pixmap(w, height + 1);
  const bx = 8;
  const archTop = 1;
  pm.rect(bx, archTop + 6, 2, height - archTop - 6, BB.stem);
  // The arch: a quarter ellipse from the top of the stem over to the right,
  // drooping at the tip under the weight of the bells.
  const pts = [];
  for (let i = 0; i <= 30; i++) {
    const a = Math.PI - (i / 30) * (Math.PI * 0.7);
    const x = bx + 12 + Math.cos(a) * 12;
    const y = archTop + 6 - Math.sin(a) * 5 + (i / 30) * 7;
    pts.push([x, y]);
    pm.rect(Math.round(x), Math.round(y), 2, 2, BB.stem);
  }
  // Strappy leaves splaying out low at the base.
  pm.line(bx, height - 1, bx - 7, height - 6, BB.grassDark, 2);
  pm.line(bx + 1, height - 1, bx + 9, height - 5, BB.grassDark, 2);
  pm.line(bx, height - 3, bx - 4, height - 9, BB.grassLight);
  pm.outline(C.outline);
  const hang = [];
  for (let i = 0; i < bells; i++) {
    const [x, y] = pts[Math.round(12 + (i / Math.max(1, bells - 1)) * 18)];
    hang.push({ x: Math.round(x) + 1 - bx, y: Math.round(y) + 3 - height });
  }
  return { img: pm, hang };
}

// --------------------------------------------------------------------- locals
// A round, floppy-eared puffball that hops about the meadow.
export function drawCritter(frame = 'idle') {
  const pm = new Pixmap(16, 15);
  const squash = frame === 'squish';
  const stretch = frame === 'jump';
  const cy = squash ? 10 : stretch ? 8 : 9;
  const rx = squash ? 6 : stretch ? 4 : 5;
  const ry = squash ? 3 : stretch ? 5 : 4;
  const body = '#c9b6ff';
  const dark = '#9a7cf0';
  // Ears.
  const earTop = cy - ry - (stretch ? 5 : 4);
  pm.line(5, cy - ry + 1, 4, earTop, dark, 2);
  pm.line(10, cy - ry + 1, 11, earTop, dark, 2);
  pm.set(4, earTop + 1, '#ffd0ea');
  pm.set(11, earTop + 1, '#ffd0ea');
  pm.ellipse(7.5, cy, rx, ry, body);
  for (let y = cy - ry; y <= cy + ry; y++) {
    if (y > cy + 1) {
      pm.dither(0, y, 16, 1, dark, 0.5);
    }
  }
  pm.hline(6, 8, cy - ry, '#efe6ff');
  // Face.
  pm.set(6, cy - 1, C.outline);
  pm.set(9, cy - 1, C.outline);
  pm.set(5, cy + 1, C.cheek);
  pm.set(10, cy + 1, C.cheek);
  pm.set(7, cy + 1, C.outline);
  pm.set(8, cy + 1, C.outline);
  // Feet.
  if (!stretch) {
    pm.rect(4, cy + ry, 2, 1, dark);
    pm.rect(10, cy + ry, 2, 1, dark);
  }
  return pm.outline(C.outline);
}

// --------------------------------------------------------------------- secrets
// Bits of scenery that hide a surprise (see entities/secret.js).

export const STONE = { dark: '#6f6a80', mid: '#9a96aa', light: '#c9c6d6', moss: '#5f9e4a', under: '#5a4a46', soil: '#4a3426', damp: '#6a4a32', dirt: '#7a5636', hole: '#1e140e' };

// A smooth grey rock. `under` shows its damp, mossy underside (rolled over).
export function drawRock(under = false) {
  const pm = new Pixmap(18, 10);
  pm.ellipse(9, 6, 8, 4, under ? STONE.under : STONE.mid);
  if (under) {
    for (const [x, y] of [[4, 5], [7, 7], [11, 4], [13, 7], [9, 5]]) {
      pm.set(x, y, STONE.moss);
    }
    pm.hline(5, 12, 9, STONE.soil);
  } else {
    pm.dither(1, 7, 16, 3, STONE.dark, 0.6);
    pm.hline(6, 10, 3, STONE.light);
    pm.set(5, 4, STONE.light);
    pm.set(13, 4, STONE.moss);
    pm.set(14, 5, STONE.moss);
  }
  return pm.outline(C.outline);
}

// The damp dark patch of soil a rock was hiding.
export function drawSoilPatch() {
  const pm = new Pixmap(16, 5);
  pm.ellipse(8, 2, 7, 2, STONE.soil);
  pm.dither(0, 0, 16, 2, STONE.damp, 0.4);
  return pm;
}

export const BUG_KINDS = ['worm', 'ladybird', 'beetle'];

// Something wriggly from under the rock, in two wriggle frames.
export function drawBug(kind, frame = 0) {
  const pm = new Pixmap(12, 7);
  if (kind === 'worm') {
    const ys = frame ? [4, 3, 3, 4, 5, 5, 4] : [3, 4, 5, 5, 4, 3, 3];
    ys.forEach((y, i) => pm.rect(2 + i, y, 1, 2, i % 2 ? '#ff9fb8' : '#ffb8cc'));
    pm.set(8, ys[6], C.outline);
  } else {
    const shell = kind === 'ladybird' ? '#e8403a' : '#4bbfa0';
    const spot = kind === 'ladybird' ? C.outline : '#bff6e0';
    // Legs scurrying.
    for (const x of [4, 6, 8]) {
      pm.set(x + (frame ? 1 : 0), 6, C.outline);
    }
    pm.ellipse(6, 4, 3, 2, shell);
    pm.vline(6, 2, 5, C.outline);
    pm.set(5, 3, spot);
    pm.set(7, 4, spot);
    pm.rect(9, 3, 2, 2, C.outline); // head
  }
  return pm.outline(C.outline);
}

// A round leafy bush dotted with tiny bluebells. `rustle` ruffles its leaves.
export function drawBush(rustle = false) {
  const pm = new Pixmap(28, 18);
  for (const [x, y, r] of [[8, 11, 6], [14, 8, 7], [21, 11, 6]]) {
    pm.circle(x, y, r, BB.grassDark);
  }
  pm.rect(3, 12, 23, 5, BB.grassDark);
  const rand = seededRandom(rustle ? 9 : 7);
  for (let i = 0; i < 34; i++) {
    const x = 3 + Math.floor(rand() * 22);
    const y = 3 + Math.floor(rand() * 12);
    if (pm.isSet(x, y)) {
      pm.set(x, y, rand() < 0.6 ? BB.grass : BB.grassLight);
    }
  }
  for (const [x, y] of [[7, 8], [16, 5], [20, 10], [11, 12]]) {
    pm.set(x, y, BB.bellLight);
  }
  return pm.outline(C.outline);
}

export const BIRD_COLORS = [
  ['#ffe066', '#ff9d3c'],
  ['#ff8fc8', '#c04f9a'],
  ['#6fb2ff', '#2f6fd0'],
];

// A little round bird, wings up or down, facing right.
export function drawBird(colors, frame = 0) {
  const rows = frame
    ? ['.ww....', '..ww.k.', '.bbbbbo', 'bbbbbb.', '.bbbb..']
    : ['.......', '.....k.', '.bbbbbo', 'bwwwbb.', '.bbbb..'];
  return Pixmap.fromGrid(rows, { b: colors[0], w: colors[1], k: C.outline, o: C.orange }).outline(C.outline);
}

// A molehill-rimmed hole: the dark back (drawn behind the mole) and the dirt
// rim in front (drawn over it, so the mole seems to rise out of the ground).
export function drawHole() {
  const back = new Pixmap(18, 7);
  back.ellipse(9, 4, 8, 3, STONE.soil);
  back.ellipse(9, 4, 6, 2, STONE.hole);
  // The front lip: the near half of a ring of dug-up earth.
  const front = new Pixmap(18, 7);
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 18; x++) {
      const outer = ((x - 9) / 8.5) ** 2 + ((y - 4.5) / 2.5) ** 2 <= 1;
      const inner = ((x - 9) / 6.5) ** 2 + ((y - 3.5) / 2) ** 2 <= 1;
      if (outer && !inner) {
        front.set(x, y, y > 5 && bayer(x, y) < 0.5 ? STONE.soil : STONE.dirt);
      }
    }
  }
  return { back, front: front.outline(C.outline) };
}

// A little mole, whole (eyes open or shut). Pass to moleRising to crop it.
export function drawMole(blink = false) {
  const pm = new Pixmap(14, 13);
  const fur = '#6a5a7a';
  pm.ellipse(7, 7, 5, 6, fur);
  pm.dither(2, 1, 10, 4, '#8a7aa0', 0.3);
  pm.rect(5, 8, 4, 3, '#a898b8'); // pale tummy
  if (blink) {
    pm.hline(4, 5, 5, C.outline);
    pm.hline(9, 10, 5, C.outline);
  } else {
    pm.set(5, 5, C.outline);
    pm.set(9, 5, C.outline);
  }
  pm.rect(6, 6, 3, 2, '#ff8fc8'); // nose
  pm.set(3, 7, C.cheek);
  pm.set(11, 7, C.cheek);
  // Big digging paws.
  pm.rect(1, 9, 3, 2, '#ffc0d0');
  pm.rect(10, 9, 3, 2, '#ffc0d0');
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------------- picnic
export const PICNIC_COLORS = { check: '#e2483d', checkDark: '#b8322b', white: '#fff6ea', fringe: '#f0d6c0', wicker: '#d9a45a', wickerDark: '#a8763a', wickerLight: '#f2c983' };

// The checked picnic blanket, lying flat: wider at the near edge than the
// far one, so it looks like it's lying back in the grass. `half` is half its
// near width, `h` how deep it is.
export function drawPicnicBlanket(half, h) {
  const w = half * 2;
  const pm = new Pixmap(w + 2, h + 2);
  const P = PICNIC_COLORS;
  for (let y = 0; y < h; y++) {
    const inset = Math.round(((h - 1 - y) / (h - 1)) * 4); // narrower further back
    for (let x = inset; x < w - inset; x++) {
      // Checks 6 wide and 3 deep, darker where two red stripes cross.
      const cx = Math.floor((x - w / 2 + 60) / 6) % 2;
      const cy = Math.floor(y / 3) % 2;
      const color = cx && cy ? P.checkDark : cx || cy ? P.check : P.white;
      pm.set(x + 1, y + 1, color);
    }
  }
  // A frayed fringe along the near edge.
  for (let x = 1; x < w; x += 2) {
    pm.set(x + 1, h, P.fringe);
  }
  return pm.outline(C.outline);
}

// The wicker picnic basket: `open` has its lid flipped up behind it.
export function drawPicnicBasket(open = false) {
  const P = PICNIC_COLORS;
  const pm = new Pixmap(20, 20);
  // The handle, an arch over the top.
  pm.ring(10, 9, 6, 5, P.wickerDark);
  for (let x = 0; x < 20; x++) { // (only the top half of the ring shows)
    for (let y = 9; y < 20; y++) {
      pm.clear(x, y);
    }
  }
  if (open) {
    // The lid stands up behind, its underside showing.
    pm.rect(3, 4, 14, 6, P.wickerDark);
    pm.hline(4, 15, 5, P.wicker);
    // Inside: a peek of a red-checked napkin.
    pm.rect(3, 10, 14, 2, P.check);
    pm.set(5, 10, P.white);
    pm.set(9, 10, P.white);
    pm.set(13, 10, P.white);
  } else {
    pm.rect(2, 9, 16, 3, P.wickerLight);
    pm.hline(2, 17, 11, P.wicker);
  }
  // The woven body.
  pm.rect(3, 12, 14, 7, P.wicker);
  for (let y = 12; y < 19; y++) {
    for (let x = 3; x < 17; x++) {
      if ((x + (y % 2) * 2) % 4 === 0) {
        pm.set(x, y, P.wickerDark);
      }
    }
  }
  pm.hline(3, 16, 12, P.wickerLight);
  return pm.outline(C.outline);
}

// --------------------------------------------------------------- posies
// A patch of little bluebells low in the grass (not the giant ones): where
// she picks posies.
export function drawPosyPatch() {
  const pm = new Pixmap(31, 10);
  pm.grid([
    '...b.......b.........b.......',
    '..bLb.....bLb...b...bLb......',
    '..bBb..b..bBb..bLb..bBb...b..',
    '...s..bLb..s...bBb...s...bLb.',
    '.g.s..bBb..s.g..s..g.s.g.bBb.',
    '.gGs.g.s.gGsGg..sg.gGs.gG.s..',
    'gGgGgGgsgGgGgGgGsGgGgGgGgGsgG',
    'GgGgGgGgGgGgGgGgGgGgGgGgGgGgG',
  ], { b: BB.bellDark, B: BB.bell, L: BB.bellLight, s: BB.stem, g: BB.grassDark, G: BB.grassLight }, 1, 1);
  return pm.outline(C.outline);
}

// A posy: three little bluebells, picked and tied with a pink ribbon.
export function drawPosy() {
  const pm = new Pixmap(11, 12);
  pm.grid([
    '..b.....b',
    '.bLb...bLb',
    '.bBb.b.bBb',
    '..s.bLb.s.',
    '...sbBbs..',
    '....sss...',
    '...PPsPP..',
    '....PsP...',
    '.....s....',
    '....s.s...',
  ], { b: BB.bellDark, B: BB.bell, L: BB.bellLight, s: BB.stem, P: C.pink }, 0, 1);
  return pm.outline(C.outline);
}

// --------------------------------------------------------- puffball burrow
// A round grassy bank with a burrow dug into its face (and, `asleep`, the
// puffball curled up snoozing in the doorway, eyes shut).
export const BURROW_W = 34;
export const BURROW_H = 18;
export function drawBurrow(asleep = false) {
  const pm = new Pixmap(BURROW_W, BURROW_H);
  pm.ellipse(17, 18, 16, 15, BB.grassLight);
  pm.dither(0, 9, BURROW_W, 9, BB.grassDark, 0.5);
  pm.dither(0, 14, BURROW_W, 4, BB.grassDark, 0.75);
  // Tufts along the top.
  for (const [x, h] of [[8, 3], [12, 2], [19, 3], [25, 2]]) {
    const top = x < 10 || x > 24 ? 7 : 4; // lower down the bank's shoulders
    pm.vline(x, top - h, top, BB.grassDark);
  }
  // The doorway, with a lip of dug-up earth.
  pm.ellipse(17, 14, 6, 4, STONE.soil);
  pm.ellipse(17, 14, 5, 3, STONE.hole);
  pm.rect(11, 15, 13, 3, STONE.hole);
  pm.hline(10, 24, 17, STONE.dirt);
  if (asleep) {
    pm.ellipse(17, 15, 4, 2.5, '#c9b6ff');
    pm.hline(15, 19, 13, '#efe6ff');
    pm.hline(14, 15, 15, C.outline); // eyes shut
    pm.hline(19, 20, 15, C.outline);
    pm.set(13, 16, C.cheek);
    pm.set(21, 16, C.cheek);
    pm.line(13, 12, 12, 10, '#9a7cf0'); // ears flopped back
    pm.line(21, 12, 22, 10, '#9a7cf0');
  }
  return pm.outline(C.outline);
}

// A baby puffball: a tiny round one with stubby ears (lilac or pink).
export const BABY_PUFF_COLORS = [{ body: '#d8caff', dark: '#a98cf2' }, { body: '#ffd0ea', dark: '#f29ac4' }];
export function drawBabyPuff({ body, dark }) {
  const pm = new Pixmap(10, 9);
  pm.set(3, 1, dark);
  pm.set(6, 1, dark);
  pm.ellipse(4.5, 5, 3.5, 3, body);
  pm.hline(1, 8, 7, dark);
  pm.hline(4, 5, 2, '#ffffff');
  pm.set(3, 4, C.outline);
  pm.set(6, 4, C.outline);
  pm.set(2, 5, C.cheek);
  pm.set(7, 5, C.cheek);
  return pm.outline(C.outline);
}

// The top `rows` rows of a sprite: how much of the mole shows above the hole.
export function cropTop(src, rows) {
  const pm = new Pixmap(src.width, Math.max(1, rows));
  pm.blit(src, 0, 0);
  return pm;
}

export function drawButterfly(colors, frame = 0) {
  const rows = frame ? ['.wkw.', '.wkw.', '..k..'] : ['ww.ww', 'wWkWw', '.wkw.', '..k..'];
  return Pixmap.fromGrid(rows, { w: colors[0], W: colors[1], k: C.outline });
}

export const BUTTERFLY_COLORS = [
  ['#ff8fc8', '#ffe066'],
  ['#ffe066', '#ff9d3c'],
  ['#ffffff', '#9a6cf0'],
];

// The friendly local: a pink cousin of the porthole alien, with legs.
export const LOCAL_COLORS = { body: '#ff8fc8', dark: '#c04f9a', cheek: '#ffe0a0' };

export function drawLocal(frame = 'idle', hop = false) {
  const head = drawAlien(LOCAL_COLORS, frame);
  const pm = new Pixmap(head.width, head.height + 4);
  pm.blit(head, 0, 0);
  if (hop) {
    pm.rect(6, 17, 2, 2, LOCAL_COLORS.dark);
    pm.rect(11, 17, 2, 2, LOCAL_COLORS.dark);
  } else {
    pm.rect(6, 17, 2, 4, LOCAL_COLORS.dark);
    pm.rect(11, 17, 2, 4, LOCAL_COLORS.dark);
    pm.rect(5, 20, 3, 1, LOCAL_COLORS.dark);
    pm.rect(11, 20, 3, 1, LOCAL_COLORS.dark);
  }
  return pm.outline(C.outline);
}
