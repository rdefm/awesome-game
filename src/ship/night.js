import { seededRandom } from '../engine/pixmap.js';
import { H, HORIZON } from './layout.js';

// Night on Bluebell: tap the moonflower in the meadow (see Moonflower) and
// dusk falls across the meadow and the grove, and the pod's window shows the
// stars; tap it again and the sun comes up. Whether it's night is saved
// (`night` in the save), so it stays night wherever she goes on Bluebell,
// and across reloads; old saves have no setting, so it's day.

export const DUSK_FADE = 2.5; // seconds for night to fall, or the sun to come up

// The places out of doors where night falls (the pod's window shows it too).
const NIGHT_PLACES = new Set(['bluebell', 'mushroomgrove']);

export function isNight(save) {
  return save.night === true;
}

export function nightFalls(where) {
  return NIGHT_PLACES.has(where);
}

const NIGHT = { sky: '#0e1640', skyLow: '#2a2a6a', shade: '#101a48', star: '#ffffff', starGlow: '#c8d8ff' };

// The same stars every time, scattered over the sky (in bands across the
// whole width of the widest place).
const rand = seededRandom(31);
const STARS = Array.from({ length: 60 }, () => ({
  x: rand(), y: 4 + rand() * (HORIZON - 44), phase: rand() * 6, big: rand() < 0.15,
}));

// The sky deepening to night, `dusk` of the way there (0 = day), with the
// stars coming out, over a place `width` wide. Drawn over the backdrop,
// under everything standing in it.
export function drawNightSky(r, dusk, t, width) {
  if (dusk <= 0) {
    return;
  }
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    const top = Math.round((HORIZON * i) / bands);
    const bottom = Math.round((HORIZON * (i + 1)) / bands);
    r.rect(0, top, width, bottom - top, i < 3 ? NIGHT.sky : NIGHT.skyLow, dusk * (0.9 - i * 0.1));
  }
  // The stars come out once it's getting dark.
  const shine = Math.max(0, dusk * 1.6 - 0.6);
  if (shine <= 0) {
    return;
  }
  for (const s of STARS) {
    const twinkle = 0.55 + 0.45 * Math.sin(t * 2.2 + s.phase * 3);
    const x = Math.round(s.x * width);
    const y = Math.round(s.y);
    r.pixel(x, y, NIGHT.star, shine * twinkle);
    if (s.big) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        r.pixel(x + dx, y + dy, NIGHT.starGlow, shine * twinkle * 0.5);
      }
    }
  }
}

// Everything in a place `width` wide dimmed for the night, `dusk` of the way
// there. Drawn over everything; whatever glows draws itself over this.
export function drawNightShade(r, dusk, width) {
  if (dusk > 0) {
    r.rect(0, 0, width, H, NIGHT.shade, dusk * 0.45);
  }
}

// A soft round glow at (x, y), `reach` px out, in `color`, `alpha` at its
// brightest (in the middle).
export function softGlow(r, x, y, reach, color, alpha) {
  const cx = Math.round(x);
  const cy = Math.round(y);
  for (let k = 1; k <= 3; k++) {
    const d = Math.round((reach * k) / 3);
    r.rect(cx - d, cy - Math.round(d * 0.8), d * 2 + 1, Math.round(d * 1.6) + 1, color, alpha / 3);
  }
}
