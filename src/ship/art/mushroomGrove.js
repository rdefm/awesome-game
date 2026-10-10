import { Pixmap, bayer, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { BB, drawMeadow } from './bluebell.js';
import { MUSHROOM_GROVE, W } from '../layout.js';

// Everything painted for the mushroom grove on Bluebell: a shady corner of
// the meadow with giant mushrooms towering far off, glowing moss, the giant
// mushrooms close up to bounce on, the fairy ring, the glow pond and its
// lilies, the racing snails, the hollow log and what scuttles out of it, and
// the shy mushroom creature.

export const MG = {
  moss: '#2f8f6a',
  mossDark: '#1f6a52',
  glow: '#9dffd8',
  glowDeep: '#5ae0b0',
  stem: '#f6ecd6',
  stemShade: '#d8c8a6',
  gills: '#c8a8b8',
  water: '#1a3a4a',
  waterDeep: '#0e2432',
  waterLight: '#3a6a7a',
  lily: '#f0c8ff',
  lilyShade: '#c890e8',
  bark: '#8a5a3a',
  barkDark: '#5e3a24',
  hole: '#1a1018',
  twig: '#a07040',
  flag: '#ffd84a',
  snailBody: '#e8dcc0',
  snails: [
    { shell: '#ff8ab8', swirl: '#c85088' },
    { shell: '#7ab8ff', swirl: '#3a78c8' },
  ],
  beetle: '#3a5ad8',
  beetleDark: '#1a2a6a',
  beetleShine: '#a8c8ff',
  hogSpines: '#7a5a3a',
  hogTips: '#c8a878',
  hogFace: '#e8c8a0',
  caps: [
    { cap: '#e8505a', shade: '#b8303c', light: '#ff8a8a', spot: '#ffffff' },
    { cap: '#9a6ae8', shade: '#6e44b8', light: '#c8a8ff', spot: '#9dffd8' },
    { cap: '#ffa850', shade: '#d87a2a', light: '#ffd08a', spot: '#ffffff' },
  ],
};

// A mushroom standing on (x, y), `h` tall with a cap `rx` wide, in cap colours `k`.
function farShroom(pm, x, y, h, rx, k) {
  pm.rect(x - 2, y - h, 4, h, MG.stem);
  pm.vline(x + 1, y - h, y, MG.stemShade);
  pm.ellipse(x, y - h, rx, rx * 0.6, k.cap);
  pm.dither(x - rx, y - h, rx * 2 + 1, Math.ceil(rx * 0.6), k.shade, 0.35);
  pm.set(x - Math.round(rx / 3), y - h - Math.round(rx / 3), k.spot);
  pm.set(x + Math.round(rx / 3), y - h - 1, k.spot);
}

// The meadow (see drawMeadow), shadier, with big mushrooms among the hills
// at the back, glowing moss on the floor and little mushrooms dotted about.
export function drawMushroomGrove({ horizon = 100 } = {}) {
  const pm = drawMeadow({ horizon, seed: 12 });
  const rand = seededRandom(51);
  // Shade the floor under the mushrooms' canopy.
  for (let y = horizon + 4; y < pm.height; y++) {
    pm.dither(0, y, W, 1, MG.mossDark, 0.28);
  }
  // Giant mushrooms towering at the back.
  [[22, 44, 20, 0], [70, 40, 16, 2], [118, 36, 14, 1], [178, 42, 18, 0], [232, 46, 22, 1]].forEach(([x, h, rx, v]) => {
    farShroom(pm, x, horizon + 6, h, rx, MG.caps[v]);
  });
  // Patches of glowing moss.
  for (let i = 0; i < 9; i++) {
    const x = 10 + Math.floor(rand() * (W - 20));
    const y = horizon + 14 + Math.floor(rand() * 44);
    pm.ellipse(x, y, 7, 2, MG.moss);
    pm.dither(x - 5, y - 1, 11, 3, MG.glowDeep, 0.5);
    pm.set(x - 2, y, MG.glow);
    pm.set(x + 3, y - 1, MG.glow);
  }
  // Little mushrooms.
  for (let i = 0; i < 22; i++) {
    const x = Math.floor(rand() * W);
    const y = horizon + 10 + Math.floor(rand() * (pm.height - horizon - 12));
    const k = MG.caps[i % 3];
    pm.set(x, y, MG.stem);
    pm.hline(x - 1, x + 1, y - 1, k.cap);
    pm.set(x, y - 2, k.cap);
  }
  return pm;
}

// A giant mushroom to bounce on, standing on its bottom row: a fat dome cap
// with spots (the middle of the top of it is at `top` pixels above its foot).
export function drawBounceShroom(variant = 0) {
  const { rx, top } = MUSHROOM_GROVE.shrooms[variant];
  const k = MG.caps[variant];
  const w = rx * 2 + 4;
  const h = top + 1;
  const cx = w / 2;
  const pm = new Pixmap(w, h);
  // The stem, flaring a little at the foot.
  pm.rect(cx - 5, 10, 10, h - 10, MG.stem);
  pm.dither(cx, 10, 5, h - 10, MG.stemShade, 0.5);
  pm.hline(cx - 7, cx + 6, h - 1, MG.stem);
  pm.hline(cx - 6, cx + 5, h - 2, MG.stem);
  // The cap: a dome, its underside showing gills along the bottom.
  pm.ellipse(cx, 8, rx, 7.5, k.cap);
  pm.rect(cx - rx, 8, rx * 2, 5, MG.gills);
  pm.ellipse(cx, 8, rx, 7.5, k.cap);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < w; x++) {
      if (y > 8 && pm.isSet(x, y)) {
        pm.set(x, y, bayer(x, y) < 0.5 ? MG.gills : k.shade);
      }
    }
  }
  pm.dither(cx + 2, 2, rx - 2, 7, k.shade, 0.35);
  pm.ellipse(cx - rx / 2, 3, rx / 3, 1.5, k.light);
  for (const [dx, dy, r] of [[-rx / 2, 4, 2], [rx / 4, 2, 2.5], [rx * 0.7, 6, 1.5], [-rx * 0.1, 6, 1.5]]) {
    pm.circle(cx + dx, dy, r, k.spot);
  }
  return pm.outline(C.outline);
}

// The fairy ring, flat on the floor: a ring of tiny mushrooms round a patch of
// glowing moss, centred on its middle (it's 2 * rx + 5 wide, 2 * ry + 7 tall).
export function drawFairyRing() {
  const { rx, ry } = MUSHROOM_GROVE.ring;
  const w = rx * 2 + 5;
  const h = ry * 2 + 7;
  const cx = Math.floor(w / 2);
  const cy = h - ry - 3;
  const pm = new Pixmap(w, h);
  pm.ellipse(cx, cy, rx - 2, ry - 1, MG.moss);
  pm.dither(cx - rx, cy - ry, w, ry * 2, MG.glowDeep, 0.3);
  // Back half of the ring first, then the front, so nearer caps overlap.
  const n = 14;
  const spots = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: Math.round(cx + Math.cos(a) * rx), y: Math.round(cy + Math.sin(a) * ry), k: MG.caps[i % 3] };
  }).sort((a, b) => a.y - b.y);
  for (const { x, y, k } of spots) {
    pm.vline(x, y - 1, y, MG.stem);
    pm.hline(x - 1, x + 1, y - 2, k.cap);
    pm.set(x, y - 3, k.cap);
    pm.set(x - 1, y - 2, k.light);
  }
  return pm;
}

// The glow pond, flat on the floor: dark still water in a rim of glowing moss,
// centred on its middle (it's 2 * rx + 5 wide, 2 * ry + 5 tall).
export function drawGlowPond() {
  const { rx, ry } = MUSHROOM_GROVE.pond;
  const w = rx * 2 + 5;
  const h = ry * 2 + 5;
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  const pm = new Pixmap(w, h);
  pm.ellipse(cx, cy, rx + 2, ry + 2, MG.moss);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pm.isSet(x, y) && bayer(x, y) < 0.25) {
        pm.set(x, y, MG.glowDeep);
      }
    }
  }
  pm.ellipse(cx, cy, rx, ry, MG.water);
  pm.ellipse(cx, cy + 1, rx - 3, ry - 2, MG.waterDeep);
  // A faint gleam on the water, and glowing tufts round the rim.
  pm.hline(cx - Math.round(rx / 2), cx - Math.round(rx / 4), cy - Math.round(ry / 2), MG.waterLight);
  for (const a of [0.4, 1.3, 2.2, 3.4, 4.3, 5.4]) {
    pm.set(Math.round(cx + Math.cos(a) * (rx + 1)), Math.round(cy + Math.sin(a) * (ry + 1)), MG.glow);
  }
  return pm;
}

// A glowing water-lily, sitting on its bottom row: a round pad with a notch,
// and a pointy flower open on top of it.
export function drawGlowLily() {
  const pm = new Pixmap(13, 8);
  pm.ellipse(6, 6, 6, 1.5, MG.moss);
  pm.set(9, 5, MG.waterDeep);
  pm.set(10, 6, MG.waterDeep);
  // Petals, outer then inner, and a bright heart.
  pm.rect(3, 4, 7, 2, MG.lily);
  pm.set(2, 3, MG.lily);
  pm.set(10, 3, MG.lily);
  pm.rect(4, 1, 5, 3, MG.lily);
  pm.set(6, 0, MG.lily);
  pm.dither(3, 4, 7, 2, MG.lilyShade, 0.4);
  pm.rect(5, 2, 3, 2, MG.glow);
  pm.set(6, 2, '#ffffff');
  return pm;
}

// A racing snail, facing right, sitting on its bottom row: a swirly shell
// (pink for variant 0, blue for 1) on a soft body with two little stalks.
// frame: 'a' (bunched up) | 'b' (stretched out, mid-crawl).
export function drawSnail(variant = 0, frame = 'a') {
  const k = MG.snails[variant];
  const stretch = frame === 'b' ? 1 : 0;
  const pm = new Pixmap(11, 8);
  pm.rect(1 - stretch, 6, 8 + stretch * 2, 2, MG.snailBody);
  pm.rect(7 + stretch, 4, 2, 2, MG.snailBody);
  pm.set(8 + stretch, 2, MG.snailBody);
  pm.set(8 + stretch, 3, MG.snailBody);
  pm.set(9 + stretch, 2, MG.snailBody);
  pm.set(9 + stretch, 3, MG.snailBody);
  pm.set(9 + stretch, 1, C.outline);
  pm.circle(4, 3.5, 3, k.shell);
  pm.set(4, 3, k.swirl);
  pm.hline(3, 5, 4, k.swirl);
  pm.set(5, 2, k.swirl);
  pm.set(3, 1, '#ffffff');
  return pm.outline(C.outline);
}

// The hollow log, lying on its bottom row along the floor: 2 * hl long, bark
// with moss along the top, and a dark hole at either end.
export function drawHollowLog() {
  const { hl } = MUSHROOM_GROVE.log;
  const w = hl * 2 + 3;
  const pm = new Pixmap(w, 13);
  pm.rect(2, 2, w - 4, 10, MG.bark);
  pm.dither(2, 8, w - 4, 4, MG.barkDark, 0.5);
  for (const x of [7, 13, 20, 26]) {
    pm.hline(x, x + 3, 5 + (x % 3), MG.barkDark);
  }
  pm.hline(3, w - 4, 2, MG.moss);
  pm.dither(4, 1, w - 8, 2, MG.glowDeep, 0.4);
  // The open ends: rings of pale wood round dark holes.
  for (const x of [2, w - 3]) {
    pm.ellipse(x, 7, 2, 5, MG.stemShade);
    pm.ellipse(x, 7, 1, 4, MG.hole);
  }
  // A little mushroom growing out of the top.
  pm.vline(hl + 4, 0, 1, MG.stem);
  pm.hline(hl + 3, hl + 5, 0, MG.caps[0].cap);
  return pm.outline(C.outline);
}

// A shiny little beetle, facing right, legs in or out (frame 'a' | 'b').
export function drawBeetle(frame = 'a') {
  const pm = new Pixmap(9, 6);
  const out = frame === 'b' ? 1 : 0;
  for (const x of [2, 4, 6]) {
    pm.set(x + (x === 4 ? out : -out), 5, MG.beetleDark);
  }
  pm.ellipse(4, 3, 3, 2, MG.beetle);
  pm.vline(4, 1, 4, MG.beetleDark);
  pm.rect(7, 2, 2, 2, MG.beetleDark);
  pm.set(3, 2, MG.beetleShine);
  return pm.outline(C.outline);
}

// A round little hedgehog, facing right, mid-scuttle (frame 'a' | 'b').
export function drawHedgehog(frame = 'a') {
  const pm = new Pixmap(14, 10);
  const step = frame === 'b' ? 1 : 0;
  pm.rect(3 + step, 8, 2, 2, MG.hogFace);
  pm.rect(8 - step, 8, 2, 2, MG.hogFace);
  pm.ellipse(6, 5, 5, 3.5, MG.hogSpines);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 11; x++) {
      if (pm.isSet(x, y) && bayer(x, y) < 0.4) {
        pm.set(x, y, MG.hogTips);
      }
    }
  }
  pm.ellipse(10, 6, 2.5, 2, MG.hogFace);
  pm.set(13, 6, C.outline);
  pm.set(10, 5, C.outline);
  return pm.outline(C.outline);
}

// The shy mushroom creature: a little round fellow with a spotted cap and
// stubby legs, facing right. frame: 'idle' | 'blink' | 'peek' (cap lifted,
// one eye showing) | 'hide' (pulled right down: just a mushroom) | 'dance1' |
// 'dance2' (arms up, glowing) | 'wave1' | 'wave2' (one arm waving) | 'hop'
// (arms up) | 'walk' (mid-step).
export function drawMushroomCreature(frame = 'idle') {
  const k = MG.caps[2];
  const pm = new Pixmap(18, 22);
  const hidden = frame === 'hide';
  const peek = frame === 'peek';
  const lift = peek ? 3 : 0;
  // Legs.
  if (!hidden) {
    const step = frame === 'dance2' || frame === 'walk' ? 1 : 0;
    pm.rect(5 - step, 19, 3, 3, MG.stemShade);
    pm.rect(10 + step, 19, 3, 3, MG.stemShade);
  }
  // Body (the stem), or just a stubby stem when hiding.
  pm.ellipse(9, hidden ? 17 : 15, 5, hidden ? 4 : 6, MG.stem);
  pm.dither(9, hidden ? 15 : 12, 6, 8, MG.stemShade, 0.5);
  if (!hidden) {
    if (peek) {
      pm.circle(11, 13, 1.5, C.white);
      pm.set(12, 13, C.outline);
      pm.set(7, 17, C.cheek);
    } else {
      for (const ex of [6, 11]) {
        pm.circle(ex, 12, 1.6, C.white);
        if (frame === 'blink') {
          pm.hline(ex - 1, ex + 1, 12, MG.stemShade);
        } else {
          pm.set(ex + 1, 12, C.outline);
        }
      }
      pm.set(4, 15, C.cheek);
      pm.set(13, 15, C.cheek);
      pm.hline(8, 10, 16, '#9a4a3a');
    }
    if (frame.startsWith('dance')) {
      pm.line(3, 14, 1, frame === 'dance1' ? 8 : 10, MG.stem, 1);
      pm.line(15, 14, 17, frame === 'dance1' ? 10 : 8, MG.stem, 1);
    } else if (frame === 'hop') {
      pm.line(3, 14, 1, 9, MG.stem, 1);
      pm.line(15, 14, 17, 9, MG.stem, 1);
    } else if (frame.startsWith('wave')) {
      pm.line(15, 14, frame === 'wave1' ? 16 : 17, 8, MG.stem, 1);
    }
  }
  // The cap, big and spotted; pulled down over everything when hiding.
  const capY = (hidden ? 13 : 8) - lift;
  pm.ellipse(9, capY, 8, hidden ? 6 : 5.5, k.cap);
  pm.dither(9, capY - 2, 8, 8, k.shade, 0.4);
  pm.set(5, capY - 2, k.spot);
  pm.set(11, capY - 3, k.spot);
  pm.set(13, capY, k.spot);
  if (frame.startsWith('dance')) {
    pm.set(2, capY - 4, MG.glow);
    pm.set(16, capY - 4, MG.glow);
  }
  return pm.outline(C.outline);
}
