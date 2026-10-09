import { Pixmap, seededRandom } from '../../engine/pixmap.js';
import { drawText, measureText } from '../../engine/font.js';
import { C } from './palette.js';
import { drawShell } from './room.js';
import {
  BALL_PIT, BUNK_LADDER, BUNK_PORTHOLE, FLOOR_TOP, FRIEND_BUNKS, HER_BUNK, LIFT, NIGHT_LIGHT, SWING, TRAMPOLINE, W,
} from '../layout.js';

export const BALL_COLORS = ['#ff5a5a', '#ffe066', '#4fa8f0', '#7cf28a', '#ff8fc8', '#ff9d3c'];
const PAD = { face: '#4fa8f0', light: '#8fd2ff', dark: '#2f68b8' };

// The arrow by a side wall that goes through to the next room (pointing
// right; flipped to point left).
export function drawRoomArrow() {
  const pm = new Pixmap(10, 15);
  for (let y = 0; y < 13; y++) {
    const len = 6 - Math.abs(y - 6);
    pm.hline(1, 1 + len, y + 1, C.yellow);
    if (y < 6) {
      pm.set(1, y + 1, C.white);
    }
  }
  pm.vline(1, 7, 12, C.orange);
  return pm.outline(C.outline);
}

// Dashed hazard paint marking a bay on the floor.
function floorBay(pm, x0, y0, x1, y1) {
  for (let x = x0; x <= x1; x++) {
    if (x % 6 < 4) {
      pm.set(x, y0, C.yellow);
      pm.set(x, y1, C.yellow);
    }
  }
  for (let y = y0; y <= y1; y++) {
    if (y % 6 < 4) {
      pm.set(x0 - Math.round((y - y0) * 0.4), y, C.yellow);
      pm.set(x1 + Math.round((y - y0) * 0.4), y, C.yellow);
    }
  }
}

// Big stencilled letters, centred on x.
function stencil(pm, text, x, y, color) {
  drawText(pm, text, Math.round(x - measureText(text, 2) / 2), y, color, 2);
}

// The store room: bare walls with a cargo net and hooks, and painted bays
// on the floor ready for whatever she wants to keep in here.
export function drawStoreRoom() {
  const pm = drawShell();
  stencil(pm, 'STORE ROOM', 128, 30, C.wallLight);
  pm.hline(86, 170, 42, C.wallLight);
  // A cargo net strung across the far right-hand wall.
  const net = { x0: 182, x1: 242, y0: 24, y1: 86 };
  for (let k = -60; k <= 60; k += 8) {
    pm.line(net.x0 + Math.max(0, k), net.y0 + Math.max(0, -k), net.x0 + Math.min(60, 62 + k), net.y0 + Math.min(62, 60 - k), C.metal);
    pm.line(net.x1 - Math.max(0, k), net.y0 + Math.max(0, -k), net.x1 - Math.min(60, 62 + k), net.y0 + Math.min(62, 60 - k), C.metal);
  }
  for (const [x, y] of [[net.x0, net.y0], [net.x1, net.y0], [net.x0, net.y1], [net.x1, net.y1]]) {
    pm.rect(x - 1, y - 1, 3, 3, C.metalLight);
  }
  // A rail of hooks between the lift and the printer.
  pm.rect(72, 70, 32, 3, C.metalDark);
  pm.hline(72, 103, 70, C.metalLight);
  for (let x = 78; x < 104; x += 12) {
    pm.vline(x, 73, 77, C.metalLight);
    pm.hline(x, x + 2, 78, C.metalLight);
    pm.set(x + 2, 77, C.metalLight);
  }
  floorBay(pm, 42, 120, 104, 150);
  floorBay(pm, 152, 120, 214, 150);
  return pm;
}

// The ball pit's back half, painted into the playroom: its padded back wall
// and the top of the balls.
function ballPitBack(pm) {
  const { x, w, back, rim, top } = BALL_PIT;
  pm.rect(x, back, w, rim - back, PAD.face);
  pm.hline(x, x + w - 1, back, PAD.light);
  for (let sx = x + 16; sx < x + w; sx += 16) {
    pm.vline(sx, back + 1, rim - 1, PAD.dark);
  }
  pm.rect(x, rim, w, top - rim + 2, PAD.dark);
  const rand = seededRandom(11);
  for (let i = 0; i < 150; i++) {
    const bx = x + 3 + Math.floor(rand() * (w - 6));
    const by = rim + 1 + Math.floor(rand() * (top - rim + 1));
    ball(pm, bx, by, BALL_COLORS[Math.floor(rand() * BALL_COLORS.length)]);
  }
  // Padded side walls.
  for (const sx of [x, x + w - 4]) {
    pm.rect(sx, back, 4, top - back, PAD.face);
    pm.vline(sx, back, top - 1, PAD.light);
    pm.vline(sx + 3, back, top - 1, PAD.dark);
  }
}

function ball(pm, x, y, color) {
  pm.rect(x - 1, y - 1, 3, 3, color);
  pm.set(x - 1, y - 1, C.white);
}

// The ball pit's padded front wall, with balls heaped up behind its top
// edge. Drawn over whoever's in the pit.
export function drawBallPitFront() {
  const { w, top, bottom } = BALL_PIT;
  const pm = new Pixmap(w, bottom - top + 4);
  const rand = seededRandom(12);
  for (let i = 0; i < 70; i++) {
    const bx = 3 + Math.floor(rand() * (w - 6));
    ball(pm, bx, 2 + Math.floor(rand() * 2), BALL_COLORS[Math.floor(rand() * BALL_COLORS.length)]);
  }
  const face = 4;
  pm.rect(0, face, w, pm.height - face, PAD.face);
  pm.hline(0, w - 1, face, PAD.light);
  pm.hline(0, w - 1, face + 1, PAD.light);
  pm.hline(0, w - 1, pm.height - 1, PAD.dark);
  for (let sx = 10; sx < w; sx += 20) {
    pm.vline(sx, face + 2, pm.height - 2, PAD.dark);
  }
  // Big friendly dots on the padding.
  for (let sx = 20; sx < w; sx += 20) {
    pm.circle(sx, face + 5, 2, BALL_COLORS[(sx / 20) % BALL_COLORS.length]);
  }
  for (const sx of [0, w - 4]) {
    pm.rect(sx, 0, 4, pm.height, PAD.face);
    pm.vline(sx, 0, pm.height - 1, PAD.light);
    pm.vline(sx + 3, 0, pm.height - 1, PAD.dark);
  }
  return pm;
}

// The swing's frame: two sloping legs and a bar across the top, standing on
// the floor (its bottom-centre is the swing's x, its y).
export const SWING_FRAME = { w: 84, h: SWING.y - SWING.top + 6 };

export function drawSwingFrame() {
  const { w, h } = SWING_FRAME;
  const pm = new Pixmap(w, h);
  const cx = w / 2;
  for (const side of [-1, 1]) {
    pm.line(cx + side * 38, h - 2, cx + side * 30, 4, '#d0304a', 3);
    pm.line(cx + side * 38, h - 2, cx + side * 30, 4, '#ff5a5a', 2);
    pm.rect(cx + side * 38 - 2, h - 2, 5, 2, C.metalDark);
  }
  pm.rect(cx - 34, 2, 68, 3, C.yellow);
  pm.hline(cx - 34, cx + 33, 4, C.orange);
  for (const side of [-1, 1]) {
    pm.rect(cx + side * 7 - 1, 5, 3, 1, C.metalLight);
  }
  return pm.outline(C.outline);
}

export function drawSwingSeat() {
  const pm = new Pixmap(20, 5);
  pm.rect(1, 1, 18, 3, '#9a6cf0');
  pm.hline(1, 18, 1, '#b99cf6');
  return pm.outline(C.outline);
}

// A round trampoline on stubby legs; `dip` is the mat stretched down under
// a bounce.
export function drawTrampoline(dip = false) {
  const { rx, mat } = TRAMPOLINE;
  const w = rx * 2 + 3;
  const h = mat + 9;
  const pm = new Pixmap(w, h);
  const cx = rx + 1;
  const cy = 5;
  for (const lx of [cx - rx + 3, cx - 8, cx + 8, cx + rx - 3]) {
    pm.rect(lx - 1, cy, 2, h - cy - 1, C.metalDark);
  }
  pm.ellipse(cx, cy, rx, 5, '#ffe066');
  for (let x = 0; x < w; x++) {
    if (Math.floor((x + 2) / 6) % 2) {
      for (let y = cy - 5; y <= cy + 5; y++) {
        if (pm.isSet(x, y) && y > 0) {
          pm.set(x, y, '#ff8fc8');
        }
      }
    }
  }
  pm.ellipse(cx, cy, rx - 4, 3, C.outline);
  pm.ellipse(cx, cy + (dip ? 1 : 0), rx - 5, dip ? 3 : 2, '#2b1f52');
  if (!dip) {
    pm.hline(cx - 8, cx - 3, cy - 1, '#4a3f80');
  }
  return pm.outline(C.outline);
}

// Bunting strung across the top of the wall.
function bunting(pm) {
  const flags = ['#ff5a5a', '#ffe066', '#4fa8f0', '#7cf28a', '#ff8fc8'];
  for (let x = 0; x < W; x++) {
    const y = 15 + Math.round(Math.sin((x % 64) / 64 * Math.PI) * 5);
    pm.set(x, y, C.metalHi);
    if (x % 10 === 2) {
      const color = flags[(x / 10 | 0) % flags.length];
      for (let i = 0; i < 6; i++) {
        pm.hline(x, x + 5 - i, y + 1 + i, color);
      }
    }
  }
}

function paintedStar(pm, x, y, color) {
  pm.hline(x - 2, x + 2, y, color);
  pm.vline(x, y - 2, y + 2, color);
  pm.set(x, y, C.white);
}

// The playroom: bright paint, bunting, a soft rug, and the back of the ball
// pit (the swing and trampoline are drawn live).
export function drawPlayRoom() {
  const pm = drawShell();
  // Wallpaper in a soft purple over the panelling, with painted stars.
  for (let y = 12; y < 94; y++) {
    pm.dither(0, y, W, 1, '#5a4a8a', 0.55);
  }
  bunting(pm);
  const rand = seededRandom(21);
  for (let i = 0; i < 14; i++) {
    paintedStar(pm, 8 + Math.floor(rand() * (W - 16)), 30 + Math.floor(rand() * 54), ['#ffe066', '#ff8fc8', '#8fd2ff'][i % 3]);
  }
  // A painted ringed planet.
  pm.ellipse(226, 53, 18, 3, '#ffe066');
  pm.circle(226, 50, 9, '#ff9d3c');
  pm.circle(223, 47, 4, '#ffcf7a');
  pm.hline(217, 235, 54, '#ffe066');
  stencil(pm, 'PLAY', 60, 34, '#ffe066');
  // A big soft rug under the swing.
  pm.ellipse(SWING.x, 140, 44, 10, '#9a6cf0');
  pm.ellipse(SWING.x, 140, 38, 8, '#ff8fc8');
  pm.ellipse(SWING.x, 140, 32, 6, '#9a6cf0');
  ballPitBack(pm);
  // Contact shadows so things sit on the floor.
  pm.dither(BALL_PIT.x - 2, BALL_PIT.bottom - 1, BALL_PIT.w + 4, 3, C.floorDark, 0.7);
  pm.dither(TRAMPOLINE.x - TRAMPOLINE.rx, TRAMPOLINE.y - 2, TRAMPOLINE.rx * 2, 3, C.floorDark, 0.6);
  pm.hline(0, W - 1, FLOOR_TOP, C.metalDark);
  return pm;
}

// ---------------------------------------------------------------------- lift
// The lift's door frame, with the floor indicator over it (its bottom-centre
// is the doorway's, on the floor line). The doorway itself is left empty:
// the lift draws its car and sliding doors in there.
export const LIFT_FRAME = { w: LIFT.w + 10, h: LIFT.h + 12 };

export function drawLiftFrame() {
  const { w, h } = LIFT_FRAME;
  const pm = new Pixmap(w, h);
  pm.rect(1, 1, w - 2, h - 1, C.metalDark);
  pm.rect(2, 2, w - 4, h - 2, C.metal);
  pm.hline(2, w - 3, 2, C.metalLight);
  pm.vline(2, 2, h - 1, C.metalLight);
  // The indicator: a little screen with an up and a down arrow.
  const cx = Math.floor(w / 2);
  pm.rect(cx - 7, 4, 14, 6, C.screen);
  for (let i = 0; i < 3; i++) {
    pm.hline(cx - 4 - i, cx - 4 + i, 5 + i, C.yellow);
    pm.hline(cx + 4 - i, cx + 4 + i, 8 - i, C.teal);
  }
  for (let y = 12; y < h; y++) {
    for (let x = 5; x < 5 + LIFT.w; x++) {
      pm.clear(x, y);
    }
  }
  return pm.outline(C.outline);
}

// The call button beside the lift; `lit` once it's been pressed.
export function drawLiftButton(lit = false) {
  const pm = new Pixmap(9, 13);
  pm.rect(1, 1, 7, 11, C.metalLight);
  pm.rect(2, 2, 5, 9, C.metal);
  pm.circle(4, 6, 2, lit ? C.yellow : C.metalDark);
  pm.set(3, 5, lit ? C.white : C.metal);
  return pm.outline(C.outline);
}

// ----------------------------------------------------------------- bunk room
const WOOD = { face: '#b5835a', dark: '#7a4f33', light: '#d9a877' };
const SHEET = { face: '#e8ecf6', shade: '#b8c2dc' };

// Her bed (bottom-centre on the floor): a big headboard on the left, a
// footboard on the right, and a mattress `deck` up, with a pillow on it.
export function drawBed(w, deck) {
  const h = deck + 18;
  const pm = new Pixmap(w + 2, h);
  const floor = h - 2;
  const top = floor - deck;
  for (const x of [4, w - 3]) {
    pm.rect(x - 1, floor - 3, 3, 4, WOOD.dark); // legs
  }
  pm.rect(2, top + 3, w - 2, deck - 6, WOOD.face);
  pm.hline(2, w - 1, top + 3, WOOD.light);
  pm.hline(2, w - 1, top + deck - 4, WOOD.dark);
  pm.rect(2, top, w - 2, 3, SHEET.face);
  pm.hline(2, w - 1, top + 2, SHEET.shade);
  // Headboard, with a heart on it.
  pm.rect(1, 1, 5, floor, WOOD.face);
  pm.vline(1, 1, floor, WOOD.light);
  pm.hline(1, 5, 1, WOOD.light);
  pm.rect(2, 5, 3, 2, C.pink);
  pm.set(3, 7, C.pink);
  // Footboard.
  pm.rect(w - 4, top - 6, 4, floor - top + 7, WOOD.face);
  pm.vline(w - 4, top - 6, floor, WOOD.light);
  // A pillow against the headboard.
  pm.ellipse(13, top - 1, 6, 2, C.white);
  pm.hline(9, 16, top + 1, SHEET.shade);
  return pm.outline(C.outline);
}

// One bunk of the bunk bed: a mattress on a wooden board, a pillow at the
// left-hand end. BUNK_DECK.top is how far down it the top of the mattress is.
export const BUNK_DECK = { top: 4 };

export function drawBunkDeck(w) {
  const pm = new Pixmap(w + 2, 12);
  const { top } = BUNK_DECK;
  pm.rect(1, top, w, 3, SHEET.face);
  pm.hline(1, w, top + 2, SHEET.shade);
  pm.rect(1, top + 3, w, 4, WOOD.face);
  pm.hline(1, w, top + 3, WOOD.light);
  pm.hline(1, w, top + 6, WOOD.dark);
  pm.ellipse(10, top - 1, 6, 2, C.white);
  return pm.outline(C.outline);
}

// The bunk bed's frame: a post at each end from the floor up past the top
// bunk, and the ladder up its right-hand end. Its bottom-left is at
// BUNK_FRAME.x, on the floor.
const [LOWER_BUNK, UPPER_BUNK] = FRIEND_BUNKS;
export const BUNK_FRAME = { x: LOWER_BUNK.x - LOWER_BUNK.w / 2 - 2, h: LOWER_BUNK.y - BUNK_LADDER.top + 2 };

export function drawBunkFrame() {
  const left = BUNK_FRAME.x;
  const w = BUNK_LADDER.x + 7 - left;
  const { h } = BUNK_FRAME;
  const pm = new Pixmap(w, h);
  const floor = h - 2;
  const postTop = floor - UPPER_BUNK.deck - 12;
  for (const x of [1, LOWER_BUNK.w]) {
    pm.rect(x, postTop, 3, floor - postTop + 1, WOOD.face);
    pm.vline(x, postTop, floor, WOOD.light);
    pm.rect(x - 1, postTop - 1, 5, 2, WOOD.dark);
  }
  // The ladder.
  const lx = BUNK_LADDER.x - left;
  for (const x of [lx - 4, lx + 4]) {
    pm.vline(x, 1, floor, WOOD.face);
  }
  for (let y = floor - 5; y > 2; y -= 7) {
    pm.hline(lx - 3, lx + 3, y, WOOD.light);
  }
  return pm.outline(C.outline);
}

// A blanket `w` wide, for the right-hand end of a bed: smooth and flat, or
// (`tucked`) humped up over whoever's tucked in under it. Drawn with its
// bottom a little below the top of the mattress.
export function drawBlanket(w, color, tucked = false) {
  const h = 10;
  const pm = new Pixmap(w + 2, h);
  const bottom = h - 2;
  for (let x = 1; x <= w; x++) {
    const k = (x - 1) / (w - 1);
    const hump = tucked ? Math.round(Math.sin(Math.min(1, k * 1.4) * Math.PI) * 3 + 2) : 0;
    pm.vline(x, bottom - 3 - hump, bottom, color.face);
    pm.set(x, bottom - 3 - hump, color.light);
  }
  pm.hline(1, w, bottom, color.dark);
  pm.vline(1, bottom - 3, bottom, color.light); // the turned-down hem
  for (let x = 5; x < w; x += 6) {
    pm.set(x, bottom - 1, color.light); // little spots
  }
  return pm.outline(C.outline);
}

export const BLANKET_W = 32;
export const BLANKETS = {
  her: { face: '#9a6cf0', light: '#c4a6ff', dark: '#6244b0' },
  lower: { face: '#4fa8f0', light: '#8fd2ff', dark: '#2f68b8' },
  upper: { face: '#4fbf6a', light: '#84e29a', dark: '#2f8a4c' },
};

// The light switch on the wall: flicked up (lights on) or down (night).
export function drawLightSwitch(on = true) {
  const pm = new Pixmap(9, 13);
  pm.rect(1, 1, 7, 11, C.white);
  pm.rect(3, 3, 3, 7, C.metalLight);
  pm.rect(3, on ? 3 : 6, 3, 4, on ? C.yellow : C.metal);
  return pm.outline(C.outline);
}

// The soft round glow off the night light, drawn over the dimmed room:
// a warm middle, fading out in a dither.
export function drawNightGlow(r = 24) {
  const pm = new Pixmap(r * 2 + 1, r * 2 + 1);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y) / r;
      if (d <= 0.45 || (d <= 0.75 && (x + y) % 2 === 0) || (d <= 1 && x % 2 === 0 && y % 2 === 0)) {
        pm.set(r + x, r + y, d <= 0.45 ? '#ffe9b0' : '#ffcf7a');
      }
    }
  }
  return pm;
}

// The bunk room: deep blue walls with painted moons and stars, a round rug,
// a porthole onto space and a night light plugged in low on the wall.
export function drawBunkRoom() {
  const pm = drawShell();
  for (let y = 12; y < 94; y++) {
    pm.dither(0, y, W, 1, '#24305e', 0.6);
  }
  const rand = seededRandom(31);
  for (let i = 0; i < 16; i++) {
    const x = 92 + Math.floor(rand() * (W - 100));
    const y = 22 + Math.floor(rand() * 62);
    if (i % 4) {
      paintedStar(pm, x, y, ['#ffe066', '#8fd2ff', '#ff8fc8'][i % 3]);
    } else {
      pm.circle(x, y, 3, '#ffe066'); // a moon
      pm.circle(x + 2, y - 1, 3, '#2e3a6a');
    }
  }
  stencil(pm, 'SLEEPY', 190, 30, '#c4a6ff');
  // The porthole, onto deep space (the stars come out in it at night).
  const { x: px, y: py, r } = BUNK_PORTHOLE;
  pm.circle(px + 1, py + 2, r + 5, C.wallDark);
  pm.ring(px, py, r + 5, r, C.metalDark);
  pm.ring(px, py, r + 4, r + 1, C.metal);
  pm.ring(px, py, r + 3, r + 2, C.metalLight);
  pm.circle(px, py, r, C.space);
  pm.dither(px - r, py - r, r * 2, r, C.nebula, 0.35);
  // The night light: a little moon on a plug.
  const { x: nx, y: ny } = NIGHT_LIGHT;
  pm.rect(nx - 3, ny, 7, 5, C.white);
  pm.circle(nx, ny - 3, 3, '#ffe9b0');
  pm.circle(nx + 2, ny - 4, 2, C.white);
  // A round rug in front of the beds.
  pm.ellipse(HER_BUNK.x + 40, 147, 40, 8, '#6244b0');
  pm.ellipse(HER_BUNK.x + 40, 147, 34, 6, '#9a6cf0');
  // Contact shadows under the beds.
  pm.dither(HER_BUNK.x - HER_BUNK.w / 2, HER_BUNK.y - 2, HER_BUNK.w, 3, C.floorDark, 0.7);
  pm.dither(LOWER_BUNK.x - LOWER_BUNK.w / 2, LOWER_BUNK.y - 2, LOWER_BUNK.w + 14, 3, C.floorDark, 0.7);
  pm.hline(0, W - 1, FLOOR_TOP, C.metalDark);
  return pm;
}
