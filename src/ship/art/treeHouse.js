import { Pixmap, bayer, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { FO, leafClump } from './mrMonkey.js';
import { FIREFLY_JAR, FLOOR_TOP, HOUSE_DOOR, TREE_WINDOW, W, H } from '../layout.js';

// Everything painted for inside the tree family's house on Mr Monkey: the
// hollow of a great big tree, its door, the family who live there (dad, mum
// and their little sapling), Sprout their pet leaf dragon, and a jar of
// fireflies.

// ------------------------------------------------------------------ the room
// The inside of the tree: walls of pale wood curving round like the inside
// of a trunk, with its rings showing at the sides; roots arching across the
// ceiling; a round window onto the forest; a branch for the firefly jar to
// hang from; the doorway on the left; a floor of smooth wood with a round
// mossy rug.
export function drawTreeRoom() {
  const pm = new Pixmap(W, H);
  const rand = seededRandom(31);
  // Walls: pale wood grain, darker towards the curving sides.
  for (let y = 0; y < FLOOR_TOP; y++) {
    for (let x = 0; x < W; x++) {
      const edge = Math.abs(x - W / 2) / (W / 2);
      const grain = Math.sin(x / 3 + Math.sin(y / 9) * 2) > 0.85;
      let col = grain ? FO.wood : FO.woodLight;
      if (bayer(x, y) < edge * edge * 0.9) {
        col = grain ? FO.woodDark : FO.wood;
      }
      pm.set(x, y, col);
    }
  }
  // Growth rings showing at the sides, where the wall curves away.
  for (const [rx, dir] of [[-20, 1], [W + 20, -1]]) {
    for (let ring = 30; ring < 70; ring += 7) {
      for (let y = 0; y < FLOOR_TOP; y++) {
        const x = Math.round(rx + dir * Math.sqrt(Math.max(0, ring * ring - ((y - 56) * 0.7) ** 2)));
        pm.set(x, y, FO.woodDark);
      }
    }
  }
  // Roots arching across the ceiling.
  for (let x = 0; x < W; x++) {
    const bottom = Math.round(4 + ((x - W / 2) / (W / 2)) ** 2 * 24);
    pm.vline(x, 0, bottom, FO.barkDark);
    pm.set(x, bottom, FO.bark);
  }
  for (const [x0, x1, sag] of [[20, 110, 10], [140, 236, 12], [80, 180, 6]]) {
    for (let x = x0; x <= x1; x++) {
      const k = (x - x0) / (x1 - x0);
      const y = Math.round(6 + Math.sin(k * Math.PI) * sag);
      pm.rect(x, y, 1, 3, FO.bark);
      pm.set(x, y, FO.barkLight);
    }
  }
  // The branch growing out of the wall that the firefly jar hangs from.
  const jar = FIREFLY_JAR;
  pm.line(jar.x + 30, jar.y - 28, jar.x - 4, jar.y - 24, FO.bark, 3);
  pm.line(jar.x + 30, jar.y - 28, jar.x - 4, jar.y - 24, FO.barkLight, 1);
  leafClump(pm, jar.x - 6, jar.y - 26, 5, 3);
  // The round window: the forest outside, in a ring of bark.
  const { x: wx, y: wy, r } = TREE_WINDOW;
  pm.circle(wx, wy, r + 4, FO.barkDark);
  pm.circle(wx, wy, r + 2, FO.bark);
  for (let y = wy - r; y <= wy + r; y++) {
    for (let x = wx - r; x <= wx + r; x++) {
      if (Math.hypot(x - wx, y - wy) > r) {
        continue;
      }
      const k = (y - (wy - r)) / (2 * r);
      let col = k < 0.55 ? FO.sky[k < 0.3 ? 0 : 1] : FO.moss;
      if (k < 0.75 && (x - wx + 40) % 13 < 3) {
        col = FO.far; // trunks out there
      }
      pm.set(x, y, col);
    }
  }
  leafClump(pm, wx - 10, wy - r + 3, 8, 4);
  leafClump(pm, wx + 9, wy - r + 4, 8, 4);
  pm.vline(wx, wy - r, wy + r, FO.barkDark);
  pm.hline(wx - r, wx + r, wy, FO.barkDark);
  // Shelves of acorn cups and pots, either side of the window.
  for (const sx of [56, 176]) {
    pm.rect(sx, 72, 30, 3, FO.woodDark);
    pm.hline(sx, sx + 29, 72, FO.wood);
    for (let i = 0; i < 4; i++) {
      const px = sx + 4 + i * 7;
      if (i % 2) {
        pm.ellipse(px, 69, 2.5, 2.5, '#a86a3a');
        pm.hline(px - 2, px + 2, 67, '#6a4022');
      } else {
        pm.rect(px - 2, 66, 5, 6, i ? '#6fb8a0' : '#e8a050');
        pm.hline(px - 2, px + 2, 66, '#ffffff');
      }
    }
  }
  // The doorway: a ring of bark round it.
  const d = HOUSE_DOOR;
  pm.rect(d.x - 4, d.y - 4, d.w + 8, d.h + 4, FO.bark);
  pm.hline(d.x - 4, d.x + d.w + 3, d.y - 4, FO.barkLight);
  pm.rect(d.x, d.y, d.w, d.h, FO.barkDark);
  // The floor: smooth wood, darker at the back, with a round mossy rug.
  for (let y = FLOOR_TOP; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const board = Math.floor((x + (y - FLOOR_TOP) * 0.6) / 22);
      pm.set(x, y, (x + Math.floor((y - FLOOR_TOP) * 0.6)) % 22 === 0 ? FO.woodDark : board % 2 ? FO.wood : FO.woodLight);
    }
    pm.dither(0, y, W, 1, FO.woodDark, 0.4 - (y - FLOOR_TOP) * 0.02);
  }
  pm.hline(0, W - 1, FLOOR_TOP, FO.barkDark);
  pm.ellipse(128, 142, 46, 10, FO.mossDark);
  pm.ellipse(128, 141, 44, 9, FO.moss);
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2;
    const k = Math.sqrt(rand());
    pm.set(128 + Math.cos(a) * 40 * k, 141 + Math.sin(a) * 8 * k, rand() < 0.5 ? FO.mossLight : FO.mossDark);
  }
  return pm;
}

// The front door from inside: a round-topped door of planks with a little
// leafy wreath, or `open` onto the forest outside.
export function drawTreeDoor(open = false) {
  const { w, h } = HOUSE_DOOR;
  const pm = new Pixmap(w, h);
  if (open) {
    for (let y = 0; y < h; y++) {
      pm.hline(0, w - 1, y, y < h - 12 ? FO.sky[Math.min(2, Math.floor(y / 12))] : FO.moss);
    }
    for (const x of [3, 15]) {
      pm.rect(x, 0, 4, h - 12, FO.far);
    }
    return pm;
  }
  for (let x = 0; x < w; x++) {
    pm.vline(x, 0, h - 1, Math.floor(x / 5) % 2 ? FO.wood : FO.woodLight);
  }
  for (const y of [8, h - 10]) {
    pm.rect(0, y, w, 2, FO.woodDark);
  }
  // A wreath of leaves, and the knob.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    pm.circle(w / 2 + Math.cos(a) * 5, 20 + Math.sin(a) * 5, 1.5, i % 2 ? FO.leaf : FO.leafLight);
  }
  pm.set(w / 2, 15, FO.cap);
  pm.circle(w - 5, 28, 1.5, '#ffe066');
  return pm;
}

// The jar of fireflies hanging from the branch: a glass jar with a cork, on
// a string; `lit`, glowing with the fireflies in it (dim when they're out).
// Its top is the string's top.
export function drawFireflyJar(lit = true) {
  const pm = new Pixmap(13, 24);
  pm.vline(6, 0, 6, FO.ropeDark);
  pm.rect(4, 7, 5, 3, FO.wood);
  pm.hline(4, 8, 7, FO.woodLight);
  pm.ellipse(6, 16, 5, 6, lit ? '#fff4b0' : '#c8e0d8');
  pm.dither(1, 10, 11, 13, lit ? '#ffe066' : '#a8c4bc', 0.4);
  if (lit) {
    for (const [x, y] of [[4, 13], [8, 15], [5, 18], [7, 20]]) {
      pm.set(x, y, '#ffffff');
    }
  }
  pm.set(3, 12, '#ffffff');
  pm.set(3, 13, '#ffffff');
  return pm.outline(C.outline);
}

// ------------------------------------------------------------ the family
// Tree folk: a trunk of a body with a face in the bark, branchy arms with
// leaves at the tips, root feet, and leaves on top (a big round crown for
// dad, long trailing willow leaves for mum, two little leaves for the
// sapling). Facing right.
// frame: 'idle' | 'blink' | 'wave1' | 'wave2' | 'hop' | 'walk'
const FOLK = {
  dad: { w: 24, h: 34, body: [11, 6, 10], by: 22, bark: '#8a5a38', dark: '#5a3822', light: '#b07a4e' },
  mum: { w: 22, h: 32, body: [10, 5, 9], by: 21, bark: '#a87a50', dark: '#6e4c30', light: '#d0a070' },
  kid: { w: 16, h: 22, body: [7, 4, 6], by: 15, bark: '#b08458', dark: '#74523a', light: '#d8aa78' },
};

export function drawTreeFolk(frame = 'idle', who = 'dad') {
  const s = FOLK[who];
  const pm = new Pixmap(s.w, s.h);
  const hop = frame === 'hop';
  const step = frame === 'walk' ? 1 : 0;
  const [cx, rx, ry] = s.body;
  const by = s.by - (hop ? 1 : 0);
  // Root feet, splaying out.
  const footY = s.h - 1;
  for (const [x, dir] of [[cx - rx + 2 - step, -1], [cx + rx - 2 + step, 1]]) {
    const top = Math.round(by + ry - 2);
    pm.vline(x, top, hop ? top + 2 : footY - 1, s.dark);
    pm.hline(x, x + dir * 2, hop ? top + 3 : footY, s.dark);
  }
  // The back arm: a branch with a leaf at the end.
  pm.line(cx - rx + 1, by - 2, cx - rx - 3, by + 3, s.dark, 2);
  pm.set(cx - rx - 4, by + 4, FO.leaf);
  // The body: a trunk, rounded at the top, its bark in vertical lines.
  pm.ellipse(cx, by, rx, ry, s.bark);
  pm.rect(cx - rx, by, rx * 2 + 1, ry, s.bark);
  for (let x = cx - rx + 2; x <= cx + rx; x += 3) {
    pm.vline(x, by - ry + 3, by + ry - 1, s.dark);
  }
  pm.vline(cx - rx + 1, by - ry + 2, by + ry - 1, s.light);
  // What's on top.
  const top = by - ry;
  if (who === 'dad') {
    pm.ellipse(cx, top - 4, 10, 6, FO.leafDark);
    pm.ellipse(cx - 1, top - 5, 9, 5, FO.leaf);
    pm.ellipse(cx - 3, top - 7, 4, 2, FO.leafLight);
    pm.set(cx + 5, top - 6, FO.cap); // an acorn tucked in
  } else if (who === 'mum') {
    pm.ellipse(cx, top - 2, 7, 4, FO.leaf);
    for (const x of [cx - 7, cx - 5, cx + 6, cx + 8]) {
      const len = 9 + (x % 3);
      for (let y = 0; y < len; y++) {
        pm.set(x + Math.round(Math.sin(y / 3) * 0.6), top - 2 + y, y % 3 ? FO.leaf : FO.leafLight);
      }
    }
    pm.circle(cx + 3, top - 4, 1.5, '#ff8fc8'); // a flower in her leaves
    pm.set(cx + 3, top - 4, '#ffe066');
  } else {
    pm.vline(cx, top - 4, top, s.dark);
    pm.ellipse(cx - 3, top - 4, 3, 1.5, FO.leafLight);
    pm.ellipse(cx + 3, top - 5, 3, 1.5, FO.leaf);
  }
  // The face in the bark: eyes (or shut), knobbly brows, a big smile.
  const ey = by - ry + (who === 'kid' ? 4 : 6);
  const eyes = who === 'kid' ? [cx, cx + 4] : [cx - 1, cx + 4];
  for (const ex of eyes) {
    if (frame === 'blink') {
      pm.hline(ex - 1, ex, ey, C.outline);
    } else {
      pm.rect(ex - 1, ey - 1, 2, 2, '#ffffff');
      pm.set(ex, ey, C.outline);
      pm.set(ex, ey - 1, C.outline);
    }
    if (who === 'dad') {
      pm.hline(ex - 2, ex + 1, ey - 3, FO.mossDark); // mossy eyebrows
    }
  }
  const my = ey + (who === 'kid' ? 3 : 4);
  pm.set(eyes[0] - 1, my - 1, C.outline);
  pm.hline(eyes[0], eyes[1], my, C.outline);
  pm.set(eyes[1] + 1, my - 1, C.outline);
  pm.set(eyes[0] - 2, my - 2, C.cheek);
  pm.set(eyes[1] + 2, my - 2, C.cheek);
  // The front arm: down, or waving up high.
  if (frame === 'wave1' || frame === 'wave2') {
    const up = frame === 'wave1' ? 0 : 2;
    pm.line(cx + rx - 1, by - 1, cx + rx + 4, by - 7 - up, s.dark, 2);
    pm.ellipse(cx + rx + 5, by - 9 - up, 1.5, 1, FO.leafLight);
  } else {
    pm.line(cx + rx - 1, by - 1, cx + rx + 3, by + 4, s.dark, 2);
    pm.set(cx + rx + 4, by + 5, FO.leafLight);
  }
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- the pet
// Sprout, the tree family's pet: a little leaf dragon. A round green body
// with a pale tummy, a big head with curly bud horns and a flower on top, a
// long curling vine of a tail, and two big leaves for wings (folded down,
// flapped up and down, or spread wide mid-hop). Facing right.
// frame: 'idle' | 'blink' | 'wave1' | 'wave2' | 'hop' | 'walk'
export const SPROUT = { body: '#5fbf5a', dark: '#2f7a3a', light: '#a8e07a', tummy: '#e8f4b0', wing: '#7cd06a' };

export function drawSprout(frame = 'idle') {
  const k = SPROUT;
  const pm = new Pixmap(24, 20);
  const hop = frame === 'hop';
  const step = frame === 'walk' ? 1 : 0;
  const by = hop ? 12 : 13;
  const cx = 10;
  // The curling vine of a tail, with a leaf on the end.
  pm.line(cx - 5, by + 1, cx - 8, by + 3, k.dark, 2);
  pm.line(cx - 8, by + 3, cx - 10, by, k.dark);
  pm.line(cx - 10, by, cx - 9, by - 2, k.dark);
  pm.ellipse(cx - 8, by - 3, 1.5, 1, k.light);
  // Little legs.
  for (const x of [cx - 3 - step, cx + 2 + step]) {
    pm.rect(x, by + 3, 2, hop ? 2 : 4, k.dark);
  }
  // The wings: big leaves on its back, with a vein down each.
  const wing = (tipX, tipY) => {
    pm.line(cx - 1, by - 3, tipX, tipY, k.wing, 3);
    pm.line(cx - 1, by - 3, tipX, tipY, k.dark, 1);
  };
  if (frame === 'wave1') {
    wing(cx - 7, by - 12);
  } else if (frame === 'wave2') {
    wing(cx - 9, by - 1);
  } else if (hop) {
    wing(cx - 9, by - 9);
    wing(cx - 3, by - 13);
  } else {
    wing(cx - 8, by - 6);
  }
  // A round body and its pale tummy.
  pm.ellipse(cx, by, 5, 4, k.body);
  pm.ellipse(cx + 1, by + 1, 3, 2.5, k.tummy);
  // A big round head with a snout, curly bud horns and a flower on top.
  const hx = cx + 6;
  const hy = by - 6;
  pm.line(hx - 2, hy - 4, hx - 4, hy - 7, k.dark);
  pm.set(hx - 4, hy - 8, k.light);
  pm.line(hx + 1, hy - 4, hx + 2, hy - 7, k.dark);
  pm.set(hx + 3, hy - 8, k.light);
  pm.circle(hx, hy, 4.5, k.body);
  pm.ellipse(hx + 4, hy + 1, 3, 2.2, k.body);
  pm.set(hx + 6, hy, k.dark); // nostril
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    pm.set(hx - 1 + dx, hy - 6 + dy, '#ff8fc8');
  }
  pm.set(hx - 1, hy - 6, '#ffe066');
  // Big shiny eyes (or shut), and a smile.
  if (frame === 'blink') {
    pm.hline(hx, hx + 2, hy - 1, C.outline);
  } else {
    pm.rect(hx, hy - 2, 3, 3, '#ffffff');
    pm.rect(hx + 1, hy - 2, 2, 2, C.outline);
    pm.set(hx + 1, hy - 2, '#ffffff');
  }
  pm.hline(hx + 3, hx + 5, hy + 3, C.outline);
  pm.set(hx, hy + 2, C.cheek);
  return pm.outline(C.outline);
}
