import { Pixmap, bayer, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { BB, drawMeadow } from './bluebell.js';
import { MUSHROOM_GROVE, W } from '../layout.js';

// Everything painted for the mushroom grove on Bluebell: a shady corner of
// the meadow with giant mushrooms towering far off, glowing moss, the giant
// mushrooms close up to bounce on, and the shy mushroom creature.

export const MG = {
  moss: '#2f8f6a',
  mossDark: '#1f6a52',
  glow: '#9dffd8',
  glowDeep: '#5ae0b0',
  stem: '#f6ecd6',
  stemShade: '#d8c8a6',
  gills: '#c8a8b8',
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
