import { Pixmap } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { PRINTER } from '../layout.js';

// Decor for the ship (see entities/decor.js), and the store room's decor
// printer that makes it. All sprites keep a 1px margin for their outline.

// ---------------------------------------------------------------- rug
// A round rug lying flat, in rings of colour with a fringe at each end.
export function drawRug() {
  const pm = new Pixmap(50, 14);
  const cx = 24.5;
  const cy = 6.5;
  pm.ellipse(cx, cy, 21, 5, '#3fd0c9');
  pm.ellipse(cx, cy, 17, 4, '#ffe066');
  pm.ellipse(cx, cy, 12, 3, '#ff8fc8');
  pm.ellipse(cx, cy, 6, 1, '#f4f1ea');
  for (let x = 6; x < 44; x += 4) {
    pm.set(x, cy + 5 + (x > 12 && x < 37 ? 1 : 0), '#1f8a90');
  }
  pm.outline(C.outline);
  // Tassels poking out of each end, past the outline.
  for (const y of [5, 7]) {
    pm.hline(0, 1, y, '#ffe066');
    pm.hline(48, 49, y, '#ffe066');
  }
  return pm;
}

// ---------------------------------------------------------------- lamp
// A tall floor lamp: a round base, a thin pole and a big shade, which glows
// when it's `on`.
export const LAMP_H = 36;

export function drawLamp(on = false) {
  const pm = new Pixmap(18, LAMP_H);
  const cx = 9;
  const shade = on ? ['#fff2a0', '#ffe066', '#ffcf4a'] : ['#ff8fc8', '#d9609e', '#a8457c'];
  // Shade: wider at the bottom.
  for (let y = 1; y <= 11; y++) {
    const half = 4 + Math.floor(y / 3);
    pm.hline(cx - half, cx + half - 1, y, y < 4 ? shade[0] : y < 9 ? shade[1] : shade[2]);
  }
  if (on) {
    pm.rect(cx - 3, 12, 6, 2, '#fff8d0'); // the bulb, lit
  }
  pm.vline(cx, 12, LAMP_H - 5, C.metal);
  pm.vline(cx - 1, 12, LAMP_H - 5, C.metalLight);
  pm.ellipse(cx - 0.5, LAMP_H - 3, 5, 1.5, C.metalDark);
  pm.hline(cx - 4, cx + 2, LAMP_H - 4, C.metalLight);
  return pm.outline(C.outline);
}

// The soft pool of light around a lamp that's on (drawn see-through).
export function drawLampGlow() {
  const pm = new Pixmap(64, 64);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const d = Math.hypot(x - 31.5, y - 31.5);
      pm.dither(x, y, 1, 1, '#fff2a0', 1.2 * (1 - d / 32));
    }
  }
  return pm;
}

// ---------------------------------------------------------------- beanbag
// A big squashy beanbag.
export function drawBeanbag() {
  const pm = new Pixmap(30, 20);
  const cx = 14.5;
  const top = 4;
  pm.ellipse(cx, 13, 13, 5, '#9a6cf0');
  pm.ellipse(cx, (top + 13) / 2 + 1, 10, (13 - top) / 2 + 2, '#9a6cf0');
  // The dent in the middle where you sit.
  pm.ellipse(cx + 1, top + 4, 6, 2, '#7a4fd0');
  // Shine and shade.
  pm.hline(cx - 8, cx - 5, top + 3, '#c2a4ff');
  pm.set(cx - 9, top + 4, '#c2a4ff');
  pm.hline(cx - 9, cx + 9, 17, '#6a40b8');
  pm.hline(cx - 6, cx + 6, 18, '#6a40b8');
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- wall poster
// A planet poster for the wall: a pink ringed planet in a yellow frame.
export function drawWallPoster() {
  const pm = new Pixmap(24, 30);
  pm.rect(1, 1, 22, 28, C.yellow);
  pm.rect(2, 2, 20, 26, '#2b1f52');
  for (const [x, y] of [[4, 4], [18, 5], [6, 20], [19, 23], [12, 3]]) {
    pm.set(x, y, C.white);
  }
  pm.ellipse(12, 13, 9, 2, '#ffe066');
  pm.circle(12, 12, 5, C.pink);
  pm.circle(10, 10, 2, '#ffd0e8');
  pm.hline(4, 20, 14, '#ffe066');
  pm.hline(7, 17, 14, C.pink);
  pm.rect(2, 24, 20, 4, C.pink);
  pm.hline(5, 18, 25, C.white);
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- printer
// The decor printer: a chunky machine with a little screen, a row of
// lights (which flash while it's `printing`) and a slot at the front for what
// it prints to pop out of.
export function drawPrinter(printing = false) {
  const { w, h } = PRINTER;
  const pm = new Pixmap(w, h);
  // Body.
  pm.rect(2, 6, w - 4, h - 8, C.metal);
  pm.rect(2, 6, w - 4, 2, C.metalLight);
  pm.vline(2, 6, h - 3, C.metalLight);
  pm.vline(w - 3, 8, h - 3, C.metalDark);
  // A hopper on top.
  pm.rect(8, 1, w - 16, 5, C.metalDark);
  pm.hline(8, w - 9, 1, C.metal);
  // Screen with a little star on it.
  pm.rect(6, 11, 14, 9, C.screen);
  pm.hline(12, 14, 15, printing ? C.yellow : C.teal);
  pm.vline(13, 14, 16, printing ? C.yellow : C.teal);
  // Lights.
  const lights = printing ? [C.green, C.yellow, C.red] : [C.greenDark, C.redDark, C.redDark];
  lights.forEach((color, i) => pm.rect(23 + i * 3, 12, 2, 2, color));
  // Big round button.
  pm.circle(27.5, 17.5, 1.5, C.pink);
  // The output slot.
  pm.rect(6, 25, w - 12, 5, C.outline);
  pm.hline(6, w - 7, 30, C.metalHi);
  // Stripes along the bottom.
  for (let x = 3; x < w - 3; x++) {
    pm.set(x, h - 4, (x >> 2) % 2 ? C.yellow : C.outline);
    pm.set(x, h - 3, (x >> 2) % 2 ? C.yellow : C.outline);
  }
  return pm.outline(C.outline);
}
