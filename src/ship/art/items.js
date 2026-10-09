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

// ---------------------------------------------------------- galley foods
// What comes out of the galley's mixing pot (see recipes.js).
export function drawCocoa() {
  return outlinedGrid([
    '..s.s...',
    '.s.s....',
    '..s.s...',
    'mmmmmm..',
    'mwwwwmmm',
    'mCCCCm.m',
    'mCCCCm.m',
    'mCCCCmmm',
    '.mCCm...',
  ], { s: C.white, m: '#ff8fc8', w: '#f4e2c4', C: '#8a5a3a' });
}

export function drawIceLolly() {
  return outlinedGrid([
    '.bbbb.',
    'bwBBBb',
    'bwBpBb',
    'bBpBBb',
    'bBBBpb',
    'bpBBBb',
    '.bbbb.',
    '..ss..',
    '..ss..',
  ], { b: '#6fb2e8', B: '#a9d6f2', w: C.white, p: '#ff8fc8', s: '#d9a877' });
}

export function drawSparkleCake() {
  return outlinedGrid([
    '....y....',
    '...yWy...',
    '....y....',
    '.vvvvvvv.',
    'vVwVwVwVv',
    'vVVVVVVVv',
    'ppppppppp',
    'pPPPPPPPp',
    '.ppppppp.',
  ], { y: C.yellow, W: C.white, v: '#9a6cf0', V: '#c4a6ff', w: C.white, p: '#d65a9a', P: C.pink });
}

export function drawBluebellTea() {
  return outlinedGrid([
    '..s.s...',
    '...s....',
    'wwwwwww.',
    'wTTTTTwww',
    'wTbTTTw.w',
    'wTTTTTw.w',
    'wwwwwwwww',
    '.wwwww...',
    'ddddddd..',
  ], { s: C.white, w: '#e8ecf6', T: '#6f8fe8', b: '#3f5fc8', d: '#b8c2dc' });
}

export function drawSnowCone() {
  return outlinedGrid([
    '..ggg..',
    '.gWWWg.',
    'gWWpWWg',
    'gWyWWWg',
    'ccccccc',
    '.cCcCc.',
    '.cCcCc.',
    '..cCc..',
    '..cCc..',
    '...c...',
  ], { g: '#d0e4f4', W: C.white, p: '#ff8fc8', y: '#8ff0c8', c: '#b07a3a', C: '#e0a85a' });
}

export function drawSmoothie() {
  return outlinedGrid([
    '....ss.',
    '....s..',
    '.gggsg.',
    'gOOsOOg',
    'gYYYYYg',
    'gOOOOOg',
    'gYYYYYg',
    'gOOOOOg',
    '.ggggg.',
  ], { g: '#e8ecf6', s: C.white, O: '#ff9d3c', Y: C.yellow });
}

// ---------------------------------------------------------- picnic foods
// What comes out of the picnic basket on Bluebell.
export function drawSandwich() {
  return outlinedGrid([
    '.........b',
    '.......bBb',
    '.....bBBBb',
    '...bBBBBBb',
    '.bBBBBBBBb',
    'bBBBBBBBBb',
    'gGgGgGgGgG',
    'rrrrrrrrrr',
    'bBBBBBBBBb',
    'bbbbbbbbbb',
  ], { b: '#d9a45a', B: '#fbe6b8', g: '#3f9e45', G: '#8ee87a', r: '#e2483d' });
}

export function drawBerryJuice() {
  return outlinedGrid([
    '..s....',
    '..s....',
    '.ggsgg.',
    'gPPsPPg',
    'gPPPPPg',
    'gPbPbPg',
    'gPPPPPg',
    'gPPbPPg',
    '.ggggg.',
  ], { g: '#e8ecf6', s: C.white, P: '#9a3fc4', b: '#4f6fe8' });
}

// ---------------------------------------------------------- pantry treats
// What comes out of the pantry cupboard in the pink alien's pod: a little
// pot of golden nectar with a dipper in it, and a cookie dotted with seeds.
export function drawNectar() {
  return outlinedGrid([
    '....d..',
    '....d..',
    '.llldl.',
    'nNNNdNn',
    '.nNNNn.',
    'nNyNNNn',
    'nNNNNNn',
    '.nnnnn.',
  ], { d: '#c08a5a', l: '#fff0a0', n: '#e8a020', N: '#ffc83a', y: '#fff0a0' });
}

export function drawSeedCookie() {
  return outlinedGrid([
    '..bbbb..',
    '.bBsBBb.',
    'bBBBBsBb',
    'bsBBBBBb',
    'bBBsBBsb',
    '.bBBBBb.',
    '..bbbb..',
  ], { b: '#b07a3a', B: '#e0b070', s: '#6a4a32' });
}

// A faint outline of a picture (one not found yet, on the recipe card): just
// its edge, with the inside left empty.
export function drawOutlineOf(pm, color = '#64729f') {
  const out = new Pixmap(pm.width, pm.height);
  for (let y = 0; y < pm.height; y++) {
    for (let x = 0; x < pm.width; x++) {
      const edge = !pm.isSet(x - 1, y) || !pm.isSet(x + 1, y) || !pm.isSet(x, y - 1) || !pm.isSet(x, y + 1);
      if (pm.isSet(x, y) && edge) {
        out.set(x, y, color);
      }
    }
  }
  return out;
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

// ---------------------------------------------------------------- drawer finds
// What's tucked away in the drawers of the dresser in the pink alien's pod:
// a stripy sock, a packet of seeds with a flower on the front, and a little
// plushie of the pink alien itself.
export function drawSock() {
  return outlinedGrid([
    'cccc....',
    'CcCc....',
    'pppp....',
    'wwww....',
    'pppp....',
    'wwww....',
    'ppppp...',
    'wwwwwww.',
    'pppppppp',
    '.tttttt.',
  ], { c: '#8adcc8', C: '#58a894', p: '#ff7fbf', w: '#ffffff', t: '#c8508e' });
}

export function drawSeedPacket() {
  return outlinedGrid([
    '.ffffff.',
    'tttttttt',
    'tWWWWWWt',
    'tWWyWWWt',
    'tWyoyWWt',
    'tWWyWWWt',
    'tWWgWgWt',
    'tWWgggWt',
    'tWWWWWWt',
    'tttttttt',
  ], { f: '#8a62c8', t: '#b48ae8', W: '#fff8ec', y: '#ffd84a', o: '#ff8a3a', g: '#5fbf6a' });
}

export function drawPlushie() {
  return outlinedGrid([
    '..o....o..',
    '...d..d...',
    '..bbbbbb..',
    '.bbbbbbbb.',
    'bbwkbbwkbb',
    'bbwkbbwkbb',
    'bcbbbbbbcb',
    '.bbbmmbbb.',
    '.bbbbbbbb.',
    '..bb..bb..',
  ], { o: '#ffe0a0', d: '#c04f9a', b: '#ff8fc8', c: '#ffe0a0', w: '#ffffff', k: '#2a1040', m: '#c04f9a' });
}
