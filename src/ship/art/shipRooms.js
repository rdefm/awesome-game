import { Pixmap, seededRandom } from '../../engine/pixmap.js';
import { drawText, measureText } from '../../engine/font.js';
import { C } from './palette.js';
import { drawShell } from './room.js';
import { BALL_PIT, FLOOR_TOP, SWING, TRAMPOLINE, W } from '../layout.js';

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
  // A rail of hooks on the left-hand wall.
  pm.rect(18, 70, 66, 3, C.metalDark);
  pm.hline(18, 83, 70, C.metalLight);
  for (let x = 24; x < 84; x += 14) {
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
