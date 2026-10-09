import { Pixmap, bayer, fractalNoise, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { CANOPY, W, H } from '../layout.js';

// Everything painted for planet Mr Monkey: a deep forest of tall, tall trees
// under a leafy canopy, the fluffy seeds drifting through it, the tree
// family's house (a great big tree with a door in it) and the path of log
// slices up to it, and the two climbing trees on the far stretch (one with a
// ladder, one with a vine) with the branch their swinging rope hangs from.

export const FO = {
  sky: ['#d8f4d0', '#bfe8c8', '#a8dcc0'],
  haze: '#8fc4a8',
  hazeLight: '#a8d4b4',
  far: '#6f9e86',
  farDark: '#5a8a74',
  bark: '#7a5236',
  barkDark: '#4e321f',
  barkLight: '#a07048',
  leaf: '#3f9a48',
  leafDark: '#2a6a36',
  leafLight: '#7cc85a',
  moss: '#5fae4a',
  mossLight: '#8fd06a',
  mossDark: '#3a7a3a',
  litter: '#b0743a',
  wood: '#c08850',
  woodLight: '#e0b070',
  woodDark: '#7a5030',
  rope: '#e0c080',
  ropeDark: '#a8844a',
  glow: '#ffe6a0',
  cap: '#e8584a',
};

// A clump of leaves round (x, y): dark underneath, lit on top.
export function leafClump(pm, x, y, rx, ry) {
  pm.ellipse(x, y + 1, rx, ry, FO.leafDark);
  pm.ellipse(x - 1, y, rx - 1, ry - 1, FO.leaf);
  pm.ellipse(x - rx * 0.3, y - ry * 0.35, rx * 0.45, ry * 0.4, FO.leafLight);
}

// The forest, with its horizon at `horizon`, `width` wide. Used full-width
// on the planet and (one screen wide, with a higher horizon) out of the
// ship's windows once it has landed there.
export function drawForest({ horizon = 100, width = W, seed = 13 } = {}) {
  const pm = new Pixmap(width, H);
  const rand = seededRandom(seed);
  const k = horizon / 100; // how tall things are, for the window's view
  // Sky glimpsed between the trees: pale green, lighter lower down.
  for (let y = 0; y < horizon; y++) {
    const band = Math.min(2, Math.floor((y / horizon) * 3 + (bayer(0, y) - 0.5) * 0.4));
    pm.hline(0, width - 1, y, FO.sky[2 - Math.max(0, band)]);
  }
  // Sunbeams slanting down through the leaves.
  for (let x0 = 20; x0 < width; x0 += 90) {
    for (let y = 0; y < horizon; y++) {
      pm.dither(x0 + Math.round(y * 0.4), y, 12, 1, '#f4fce0', 0.35);
    }
  }
  // Far-off trunks in the haze, thin and pale...
  for (let x = 4; x < width; x += 14 + Math.floor(rand() * 10)) {
    const half = 2 + Math.floor(rand() * 2);
    pm.rect(x - half, 0, half * 2, horizon, FO.haze);
    pm.vline(x + half - 1, 0, horizon - 1, FO.hazeLight);
  }
  // ...a hazy hedge of bushes along the back...
  for (let x = 0; x < width; x++) {
    const top = Math.round(horizon - 4 - fractalNoise(x / 12, 0.3, seed, 3) * 14 * k);
    for (let y = top; y < horizon; y++) {
      pm.set(x, y, y - top < 1 ? FO.hazeLight : FO.haze);
    }
  }
  // ...then nearer trunks, darker, with bark lines and roots spreading at
  // their feet.
  for (let x = 30; x < width; x += 54 + Math.floor(rand() * 30)) {
    const half = Math.round((5 + rand() * 3) * Math.max(0.6, k));
    for (let y = 0; y < horizon + 2; y++) {
      const flare = y > horizon - 6 * k ? Math.round((y - (horizon - 6 * k)) * 0.8) : 0;
      for (let dx = -half - flare; dx <= half + flare; dx++) {
        const lit = dx < -half + 2;
        const shade = dx > half - 2 || (dx + y * 7) % 5 === 0;
        pm.set(x + dx, y, lit ? '#7f9f86' : shade ? FO.farDark : FO.far);
      }
    }
  }
  // The leafy canopy all along the top, hanging down in clumps.
  for (let x = -10; x < width + 10; x += 14) {
    const drop = (8 + rand() * 12) * k;
    leafClump(pm, x + rand() * 6, drop, 12, 7 + rand() * 3);
  }
  for (let x = 0; x < width; x++) {
    pm.vline(x, 0, Math.round(3 * k), FO.leafDark);
  }
  // A few vines dangling down out of it.
  for (let x = 40; x < width; x += 70 + Math.floor(rand() * 40)) {
    const len = (24 + rand() * 30) * k;
    for (let y = 10; y < len; y++) {
      const vx = x + Math.round(Math.sin(y / 6) * 1.5);
      pm.set(vx, y, FO.leafDark);
      if (y % 6 === 0) {
        pm.set(vx + 1, y, FO.leafLight);
      }
    }
  }
  // The ground: soft moss, dappled, with fallen leaves.
  for (let y = horizon; y < H; y++) {
    for (let x = 0; x < width; x++) {
      const n = fractalNoise(x / 18, y / 6, seed + 5, 3);
      pm.set(x, y, n > 0.62 ? FO.mossLight : n < 0.38 ? FO.mossDark : FO.moss);
    }
    pm.dither(0, y, width, 1, FO.mossDark, 0.3 - (y - horizon) * 0.01);
  }
  // Ferns along the back of the floor, in front of the hedge.
  for (let x = 6; x < width; x += 18 + Math.floor(rand() * 16)) {
    const y = horizon + 2 + Math.floor(rand() * 4);
    const s = (4 + rand() * 3) * Math.max(0.6, k);
    for (let i = -2; i <= 2; i++) {
      pm.line(x, y, x + i * s * 0.6, y - s + Math.abs(i) * 1.5, i % 2 ? FO.leaf : FO.leafDark);
    }
  }
  // Fallen leaves and little red toadstools.
  const n = Math.round(width * (H - horizon) * 0.006);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand() * width);
    const y = horizon + 4 + Math.floor(rand() * (H - horizon - 4));
    pm.set(x, y, FO.litter);
    pm.set(x + 1, y, rand() < 0.5 ? FO.litter : '#d89a4a');
  }
  for (let i = 0; i < width / 40; i++) {
    const x = Math.floor(rand() * width);
    const y = horizon + 8 + Math.floor(rand() * (H - horizon - 10));
    pm.vline(x, y - 2, y, '#f4f1ea');
    pm.hline(x - 2, x + 2, y - 3, FO.cap);
    pm.hline(x - 1, x + 1, y - 4, FO.cap);
    pm.set(x - 1, y - 3, '#ffffff');
  }
  return pm;
}

// A fluffy seed drifting through the trees (what drifts across this sky).
export function drawForestFluff(variant = 0) {
  const pm = new Pixmap(9, 7);
  pm.circle(4, 3, variant ? 2 : 3, '#fffbe8');
  pm.set(4, 3, '#ffe6a0');
  pm.dither(0, 0, 9, 7, '#fffbe8', 0.15);
  return pm;
}

// ------------------------------------------------------------ the tree house
// The tree family's house as seen from far off, bottom-centre on its
// doorstep: a great big tree, taller than anything near it, with a round
// door in its roots (shut, or `open` onto the glow inside), round windows
// glowing up its trunk, a lantern on a branch and a leafy crown on top.
export function drawTreeHouse({ open = false } = {}) {
  const w = 60;
  const h = 80;
  const cx = 30;
  const pm = new Pixmap(w, h);
  // The trunk, flaring out into roots at the bottom.
  for (let y = 18; y < h; y++) {
    const flare = y > h - 14 ? (y - (h - 14)) * 0.9 : 0;
    const half = Math.round(9 + flare);
    for (let x = cx - half; x <= cx + half; x++) {
      const grain = (x + Math.floor(y / 4)) % 4 === 0;
      pm.set(x, y, x < cx - half + 2 ? FO.barkLight : x > cx + half - 3 || grain ? FO.barkDark : FO.bark);
    }
  }
  // A branch out to the side, with a lantern hanging off it.
  pm.line(cx + 8, 34, cx + 20, 28, FO.bark, 2);
  pm.vline(cx + 18, 30, 33, FO.barkDark);
  pm.rect(cx + 17, 34, 3, 4, FO.glow);
  pm.set(cx + 18, 35, '#ffffff');
  // The leafy crown.
  leafClump(pm, cx, 14, 22, 12);
  leafClump(pm, cx - 15, 22, 11, 7);
  leafClump(pm, cx + 16, 21, 11, 7);
  leafClump(pm, cx + 2, 6, 13, 6);
  // Round windows up the trunk, glowing warm.
  for (const [wx, wy] of [[cx - 3, 36], [cx + 3, 52]]) {
    pm.circle(wx, wy, 3, FO.woodDark);
    pm.circle(wx, wy, 2, open ? '#ffffff' : FO.glow);
    pm.set(wx - 1, wy - 1, '#ffffff');
  }
  // The door: round-topped, in among the roots.
  const top = h - 11;
  pm.circle(cx, top, 6, FO.woodDark);
  pm.rect(cx - 6, top, 13, 11, FO.woodDark);
  const inside = open ? FO.glow : FO.wood;
  pm.circle(cx, top, 4.5, inside);
  pm.rect(cx - 4, top, 9, 10, inside);
  if (!open) {
    pm.vline(cx, top - 4, h - 2, FO.woodDark);
    pm.set(cx + 2, top + 4, '#ffe066');
  }
  pm.rect(cx - 6, h - 2, 13, 2, FO.woodLight);
  return pm.outline(C.outline);
}

// The path of log slices up to the tree house, as a full-screen overlay for
// the ground (`scaleAt(y)` gives how big things are at height y).
export function drawLogPath(path, scaleAt) {
  const pm = new Pixmap(W, H);
  let gap = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];
    const q = path[i + 1];
    const steps = Math.ceil(Math.hypot(q.x - p.x, q.y - p.y));
    for (let s = 0; s <= steps; s++) {
      const x = p.x + ((q.x - p.x) * s) / steps;
      const y = p.y + ((q.y - p.y) * s) / steps;
      const k = scaleAt(y);
      gap -= 1;
      if (gap > 0) {
        continue;
      }
      gap = Math.max(3, Math.round(11 * k));
      const rx = Math.max(1, 6 * k);
      const ry = Math.max(1, 2.5 * k);
      pm.ellipse(x, y + 1, rx, ry, FO.woodDark);
      pm.ellipse(x, y, rx, ry, FO.woodLight);
      if (k > 0.5) {
        pm.ellipse(x, y, rx * 0.5, ry * 0.5, FO.wood);
        pm.set(x, y, FO.woodDark);
      }
    }
  }
  return pm;
}

// ------------------------------------------------------- the climbing trees
// A tall climbing tree, from above the top of the screen down to its roots
// (bottom-centre on its foot): its platform reaching out on its `side`
// (toward the other tree), and its way up: a wooden ladder, or a leafy vine.
export const CLIMB_TREE = { w: 80, h: CANOPY.foot + 2 };

export function drawClimbTree(side = 1, climb = 'ladder') {
  const { w, h } = CLIMB_TREE;
  const pm = new Pixmap(w, h);
  const cx = w / 2;
  const sx = (dx) => Math.round(cx + side * dx);
  const row = (worldY) => worldY - (CANOPY.foot + 1 - h); // a height on screen, in the picture
  const deck = row(CANOPY.ground - CANOPY.deck);
  // The trunk, flaring into roots at its foot.
  for (let y = 0; y < h; y++) {
    const flare = y > h - 12 ? Math.round((y - (h - 12)) * 0.9) : 0;
    const half = CANOPY.trunk + flare;
    for (let x = cx - half; x <= cx + half; x++) {
      const grain = (x * 3 + Math.floor(y / 5)) % 7 === 0;
      pm.set(x, y, x < cx - half + 3 ? FO.barkLight : x > cx + half - 3 || grain ? FO.barkDark : FO.bark);
    }
  }
  // A knot hole.
  pm.ellipse(sx(-2), row(30), 2, 3, FO.barkDark);
  pm.set(sx(-2), row(31), '#2a1a10');
  // The platform: planks out from the trunk, with a brace under it.
  pm.line(sx(4), deck + 16, sx(28), deck + 3, FO.woodDark, 2);
  for (let x = Math.min(sx(-12), sx(34)); x <= Math.max(sx(-12), sx(34)); x++) {
    const seam = (x - sx(-12)) % 6 === 0;
    pm.set(x, deck, FO.woodLight);
    pm.set(x, deck + 1, seam ? FO.woodDark : FO.wood);
    pm.set(x, deck + 2, seam ? FO.woodDark : FO.wood);
    pm.set(x, deck + 3, FO.woodDark);
  }
  // A little rail post at the far end.
  pm.vline(sx(34), deck - 7, deck, FO.woodDark);
  pm.set(sx(34), deck - 8, FO.woodLight);
  // The way up.
  const up = sx(-3);
  if (climb === 'ladder') {
    for (const x of [up - 4, up + 4]) {
      pm.vline(x, deck - 2, h - 1, FO.woodLight);
      pm.vline(x + 1, deck - 2, h - 1, FO.woodDark);
    }
    for (let y = deck + 4; y < h - 1; y += 6) {
      pm.hline(up - 3, up + 3, y, FO.woodLight);
      pm.hline(up - 3, up + 3, y + 1, FO.woodDark);
    }
  } else {
    for (let y = deck - 4; y < h; y++) {
      const vx = up + Math.round(Math.sin(y / 5) * 2);
      pm.rect(vx - 1, y, 2, 1, FO.leafDark);
      pm.set(vx, y, FO.leaf);
      if (y % 7 === 0) {
        pm.rect(vx + 1, y - 1, 3, 2, FO.leafLight);
        pm.set(vx + 3, y, FO.leaf);
      }
      if (y % 7 === 3) {
        pm.rect(vx - 4, y - 1, 3, 2, FO.leaf);
      }
    }
  }
  // Leaves up at the top, round the trunk.
  leafClump(pm, cx, 6, 20, 9);
  leafClump(pm, sx(-14), 14, 10, 6);
  leafClump(pm, sx(16), 12, 12, 6);
  return pm.outline(C.outline);
}

// The big branch reaching across between the two climbing trees (the rope
// hangs from the middle of it), with leaves sprouting along it. Its middle
// is over the rope's knot, its bottom edge just below it.
export const BRANCH = { w: CANOPY.trees[1].x - CANOPY.trees[0].x + 10, h: 14 };

export function drawBranch() {
  const { w, h } = BRANCH;
  const pm = new Pixmap(w, h);
  for (let x = 0; x < w; x++) {
    const sag = Math.round(Math.sin((x / (w - 1)) * Math.PI) * 3);
    pm.vline(x, 3 + sag, 6 + sag, FO.bark);
    pm.set(x, 3 + sag, FO.barkLight);
    pm.set(x, 7 + sag, FO.barkDark);
  }
  for (let x = 8; x < w - 8; x += 13) {
    leafClump(pm, x, 3, 5, 3);
  }
  // The rope's knot round it.
  const mid = Math.round(w / 2);
  pm.rect(mid - 1, 5, 3, 5, FO.rope);
  pm.vline(mid + 1, 5, 9, FO.ropeDark);
  return pm.outline(C.outline);
}

// Mr Monkey's butterflies (drawn like Bluebell's: see drawButterfly).
export const FOREST_BUTTERFLY_COLORS = [
  ['#ffe066', '#ff9d3c'],
  ['#8fd3ff', '#3f6fd0'],
  ['#ff8fc8', '#ffffff'],
];
