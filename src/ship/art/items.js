import { Pixmap } from '../../engine/pixmap.js';
import { C } from './palette.js';

// A character-grid sprite with a 1px margin so its outline isn't clipped.
function outlinedGrid(rows, palette) {
  const pm = new Pixmap(Math.max(...rows.map((r) => r.length)) + 2, rows.length + 2);
  pm.grid(rows, palette, 1, 1);
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- bouncy ball
export function drawBall() {
  const pm = new Pixmap(12, 12);
  pm.circle(5.5, 5.5, 4.5, C.red);
  // A white band round the middle, kept inside the ball.
  for (let y = 5; y <= 6; y++) {
    for (let x = 0; x < 12; x++) {
      if (pm.isSet(x, y)) {
        pm.set(x, y, C.white);
      }
    }
  }
  for (let x = 0; x < 12; x++) {
    if (pm.isSet(x, 9) || pm.isSet(x, 10)) {
      pm.set(x, pm.isSet(x, 10) ? 10 : 9, C.redDark);
    }
  }
  pm.set(3, 3, '#ffb0b0');
  pm.set(4, 2, '#ffb0b0');
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- teddy bear
const TEDDY = [
  '.bb.....bb.',
  'bBBb...bBBb',
  'bBpBBBBBpBb',
  '.BBBBBBBBB.',
  '.BBkBBBkBB.',
  '.BBBmmmBBB.',
  '.BBBmkmBBB.',
  '..BBBBBBB..',
  '.bBBrrrBBb.',
  'bBBBBBBBBBb',
  'bBBBmmmBBBb',
  '.BBBmmmBBB.',
  '.BBBBBBBBB.',
  '.bBB...BBb.',
  '.bbb...bbb.',
];

export const TEDDY_PALETTE = { B: '#c98a52', b: '#9a6235', m: '#f0c79a', p: '#f2a0a0', k: C.outline, r: C.red };

export function drawTeddy() {
  return outlinedGrid(TEDDY, TEDDY_PALETTE);
}

// ---------------------------------------------------------------- crystal
// A little cluster of glowing gems. `glow` brightens it after a tap.
export function drawCrystal(glow = false) {
  const pm = new Pixmap(14, 16);
  const body = glow ? '#d6c2ff' : C.purple;
  const dark = glow ? C.purple : '#6a45b8';
  const hi = glow ? C.white : '#d6c2ff';
  const gem = (x, top, w, h) => {
    for (let y = 0; y < h; y++) {
      const half = y < 2 ? y : w;
      pm.hline(x - half, x + half, top + y, body);
    }
    pm.vline(x + 1, top + 2, top + h - 1, dark);
    pm.vline(x - 1, top + 2, top + h - 2, hi);
  };
  gem(4, 6, 2, 9);
  gem(10, 7, 2, 8);
  gem(7, 1, 2, 14);
  // Rocky base.
  pm.rect(1, 14, 12, 2, C.metalDark);
  pm.hline(2, 11, 14, C.metal);
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- snacks
// Treats from the ship's snack locker.
export function drawCookie() {
  return outlinedGrid([
    '..ccccc..',
    '.cCCkCyc.',
    'cCkCCCCCc',
    'cCCCyCkCc',
    'cyCkCCCCc',
    'cCCCCCkCc',
    '.cCkCyCc.',
    '..ccccc..',
  ], { C: '#e0a85a', c: '#b07a3a', k: '#5a3520', y: C.pink });
}

export function drawStarFruit() {
  return outlinedGrid([
    '....o....',
    '...oYo...',
    'ooooYoooo',
    'oyyYYYyyo',
    '.oyyYyyo.',
    '..oyyyo..',
    '.oyyoyyo.',
    '.ooo.ooo.',
  ], { o: '#e0a020', y: C.yellow, Y: '#fff3b0' });
}

export function drawJuice() {
  return outlinedGrid([
    '.....ss',
    '....s..',
    '.pppsp.',
    'pPPPPPp',
    'pPwwwPp',
    'pPwgwPp',
    'pPwwwPp',
    'pPPPPPp',
    '.ppppp.',
  ], { p: '#d65a9a', P: C.pink, w: C.white, g: C.greenDark, s: C.white });
}

// ---------------------------------------------------------------- the bag
// A chunky backpack for the bag button. `open` gapes the flap so it looks
// ready to swallow whatever is being dragged.
export function drawBag(open = false) {
  const pm = new Pixmap(18, 18);
  const body = C.orange;
  const dark = '#d06a2a';
  // Carry loop.
  pm.ring(9, 4, 3, 2, C.metalLight);
  pm.rect(2, 5, 14, 12, body);
  pm.rect(1, 7, 16, 9, body);
  pm.dither(2, 13, 14, 4, dark, 0.5);
  // Front pocket with a star badge.
  pm.rect(5, 10, 8, 5, dark);
  pm.rect(6, 11, 6, 3, body);
  pm.set(9, 12, C.yellow);
  if (open) {
    pm.rect(3, 4, 12, 4, C.outline);
    pm.rect(2, 2, 14, 2, C.teal);
    pm.hline(3, 14, 1, C.teal);
  } else {
    pm.rect(2, 5, 14, 4, C.teal);
    pm.hline(3, 14, 8, C.tealDark);
    pm.rect(8, 8, 2, 2, C.yellow);
  }
  return pm.outline(C.outline);
}

// Tab icon for the "things" pocket of the bag (friends use the heart emote).
export function drawBoxIcon() {
  return outlinedGrid([
    'yyyyyyy',
    'yYYYYYy',
    'oooyooo',
    'oOOyOOo',
    'oOOOOOo',
    'ooooooo',
  ], { y: C.yellow, Y: '#fff3b0', o: '#d06a2a', O: C.orange });
}

// Tab icon for the friends pocket of the bag.
export function drawHeartIcon() {
  return outlinedGrid([
    '.rr.rr.',
    'rhrrrrr',
    'rrrrrrr',
    '.rrrrr.',
    '..rrr..',
    '...r...',
  ], { r: C.red, h: '#ffb0b0' });
}
