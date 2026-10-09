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

// ---------------------------------------------------------------- star rug
// A dark round rug lying flat, with a big yellow star (squashed flat too).
export function drawStarRug() {
  const pm = new Pixmap(46, 14);
  const cx = 22.5;
  const cy = 6.5;
  pm.ellipse(cx, cy, 21, 5, '#2b1f52');
  pm.ellipse(cx, cy, 19, 4, '#3a2063');
  for (const [x, y] of [[8, 5], [36, 8], [12, 9], [33, 4]]) {
    pm.set(x, y, C.white);
  }
  // The star: five points, flattened to a third of its height.
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    pm.line(cx, cy, cx + Math.cos(a) * 9, cy + Math.sin(a) * 3.5, C.yellow, 2);
  }
  pm.ellipse(cx, cy, 3, 1, C.yellow);
  pm.hline(cx - 1, cx + 1, cy - 1, '#fff2a0');
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- rocket lamp
// A little rocket on a stand, whose porthole and flame light up when it's `on`.
export const ROCKET_LAMP_H = 32;

export function drawRocketLamp(on = false) {
  const pm = new Pixmap(18, ROCKET_LAMP_H);
  const cx = 9;
  // Nose cone and body.
  for (let y = 1; y <= 6; y++) {
    const half = Math.ceil(y * 0.7);
    pm.hline(cx - half, cx + half - 1, y, C.red);
  }
  pm.rect(cx - 4, 7, 8, 13, C.white);
  pm.vline(cx - 4, 7, 19, '#ffffff');
  pm.vline(cx + 3, 7, 19, '#cfc8bb');
  pm.circle(cx - 0.5, 11.5, 2, on ? '#fff2a0' : C.tealDark);
  pm.set(cx - 1, 11, on ? '#ffffff' : C.teal);
  // Fins.
  pm.rect(cx - 7, 16, 3, 5, C.red);
  pm.rect(cx + 4, 16, 3, 5, C.red);
  pm.rect(cx - 4, 20, 8, 2, C.redDark);
  // Flame (lit) or nozzle.
  if (on) {
    pm.rect(cx - 2, 22, 4, 3, C.orange);
    pm.rect(cx - 1, 22, 2, 4, C.yellow);
  } else {
    pm.rect(cx - 2, 22, 4, 2, C.metalDark);
  }
  // The stand.
  pm.vline(cx, 24, ROCKET_LAMP_H - 4, C.metal);
  pm.ellipse(cx - 0.5, ROCKET_LAMP_H - 3, 5, 1.5, C.metalDark);
  pm.hline(cx - 4, cx + 2, ROCKET_LAMP_H - 4, C.metalLight);
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- big cushion
// A big flat floor cushion, tufted with buttons.
export function drawBigCushion() {
  const pm = new Pixmap(36, 16);
  const cx = 17.5;
  pm.ellipse(cx, 9, 16, 5, '#ff7ab8');
  pm.ellipse(cx, 7, 15, 4, C.pink);
  for (const x of [cx - 8, cx, cx + 8]) {
    pm.set(x, 7, '#c74a8e');
  }
  pm.hline(cx - 11, cx - 6, 4, '#ffd0e8');
  pm.hline(cx - 13, cx + 13, 13, '#c74a8e');
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- fish tank
// A fish tank on a little stand. `frame` 0/1: the fish over on the left
// or the right of the tank.
export function drawFishTank(frame = 0) {
  const pm = new Pixmap(30, 28);
  // Glass and water.
  pm.rect(2, 2, 26, 18, '#8fd2ff');
  pm.rect(3, 5, 24, 14, '#3fa8d8');
  pm.hline(3, 26, 5, '#8fe0ff');
  // Gravel and weed.
  for (let x = 3; x < 27; x++) {
    pm.set(x, 18, x % 3 ? C.yellow : C.orange);
    pm.set(x, 17, x % 4 ? null : '#ffcf4a');
  }
  pm.vline(6, 11, 17, C.greenDark);
  pm.vline(7, 13, 17, C.green);
  pm.vline(23, 12, 17, C.green);
  // The fish, and a bubble above it.
  const fx = frame ? 18 : 11;
  pm.ellipse(fx, 11, 2.5, 1.5, C.orange);
  const tail = frame ? fx + 3 : fx - 3;
  pm.vline(tail, 10, 12, C.orange);
  pm.set(frame ? fx - 1 : fx + 1, 10, C.outline);
  pm.set(frame ? fx - 2 : fx + 2, 7, C.white);
  // The stand.
  pm.rect(2, 20, 26, 2, C.metalDark);
  pm.rect(4, 22, 2, 5, C.metal);
  pm.rect(24, 22, 2, 5, C.metal);
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- fairy lights
// A string of fairy lights for the wall, drooping between two hooks.
// `frame` 0/1: which half of the bulbs is shining brightest.
const BULB_COLORS = [C.yellow, C.pink, C.teal, C.green, C.orange];

export function drawFairyLights(frame = 0) {
  const pm = new Pixmap(44, 14);
  const sag = (x) => 2 + Math.round(5 * Math.sin((Math.PI * (x - 1)) / 42));
  for (let x = 1; x < 43; x++) {
    pm.set(x, sag(x), C.greenDark);
  }
  pm.rect(1, 1, 2, 2, C.metalLight);
  pm.rect(41, 1, 2, 2, C.metalLight);
  for (let i = 0; i < 8; i++) {
    const x = 4 + i * 5;
    const bright = (i + frame) % 2 === 0;
    const color = BULB_COLORS[i % BULB_COLORS.length];
    pm.rect(x, sag(x) + 1, 2, 3, bright ? color : '#64729f');
    if (bright) {
      pm.set(x, sag(x) + 1, C.white);
    }
  }
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- planet mobile
// A mobile for the wall: a hoop with three little planets hanging off it.
export function drawPlanetMobile() {
  const pm = new Pixmap(30, 30);
  pm.vline(15, 1, 4, C.metalLight);
  pm.ellipse(15, 5, 12, 1, C.metal);
  pm.ellipse(15, 5, 10, 0, C.metalDark);
  const planets = [[5, 15, 3, C.teal], [15, 22, 4, C.pink], [25, 13, 2.5, C.orange]];
  for (const [x, y, r, color] of planets) {
    pm.vline(x, 6, y - Math.ceil(r), '#cfc8bb');
    pm.circle(x, y, r, color);
    pm.set(x - 1, y - 1, C.white);
  }
  pm.ellipse(15, 22, 6, 1, C.yellow);
  pm.circle(15, 22, 3, C.pink);
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
