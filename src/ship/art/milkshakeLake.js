import { Pixmap, bayer, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { CA, drawCandyland } from './candy.js';
import { MILKSHAKE_LAKE } from '../layout.js';

// Everything painted for the milkshake lake on Candy: the land with a great
// strawberry milkshake lake at the back, a giant stripy straw stuck in it,
// floating cherries and a wafer boat.

export const MS = {
  shake: '#f77fb4',
  shakeDark: '#d85a98',
  shakeLight: '#ffa8d0',
  cream: '#fffaf2',
  creamShade: '#f2dce6',
  wafer: '#f2c272',
  waferDark: '#c8904a',
  cherry: '#e8283c',
  cherryDark: '#a0142a',
  stalk: '#5aa04a',
};

// The candy land (see drawCandyland) with the milkshake lake filling the
// back of it, ringed with whipped cream and swirled with strawberry.
export function drawMilkshakeLake({ horizon = 100 } = {}) {
  const pm = drawCandyland({ horizon, seed: 12 });
  const rand = seededRandom(31);
  const { x: cx, y: cy, rx, ry } = MILKSHAKE_LAKE;
  const inLake = (x, y, grow = 0) => ((x - cx) / (rx + grow)) ** 2 + ((y - cy) / (ry + grow)) ** 2 <= 1;
  for (let y = cy - ry - 3; y <= cy + ry + 3; y++) {
    for (let x = cx - rx - 3; x <= cx + rx + 3; x++) {
      if (inLake(x, y)) {
        const deep = 1 - Math.abs(y - cy) / ry;
        pm.set(x, y, bayer(x, y) < deep * 0.35 ? MS.shakeDark : MS.shake);
      } else if (inLake(x, y, 2.5)) {
        pm.set(x, y, y > cy ? MS.cream : MS.creamShade); // the whipped-cream shore
      }
    }
  }
  // Swirls of lighter strawberry drifting across it.
  for (let i = 0; i < 14; i++) {
    const sx = cx - rx + 12 + Math.floor(rand() * (rx * 2 - 24));
    const sy = cy - ry + 3 + Math.floor(rand() * (ry * 2 - 6));
    const len = 4 + Math.floor(rand() * 8);
    for (let x = sx; x < sx + len; x++) {
      if (inLake(x, sy)) {
        pm.set(x, sy, MS.shakeLight);
      }
    }
  }
  // Blobs of cream along the near shore.
  for (let x = cx - rx + 6; x < cx + rx - 6; x += 9 + Math.floor(rand() * 6)) {
    const y = Math.round(cy + ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2))) + 2;
    pm.ellipse(x, y, 3, 1.5, MS.cream);
  }
  return pm;
}

// The giant straw, standing in the lake (bottom-centre at the waterline),
// leaning a little, with red and white stripes and a bend at the top.
export function drawStraw() {
  const pm = new Pixmap(16, 44);
  for (let i = 0; i < 36; i++) {
    const x = 5 + Math.floor(i / 9);
    const color = Math.floor(i / 4) % 2 ? '#ff5a6a' : '#ffffff';
    pm.rect(x - 1, 43 - i, 4, 1, color);
  }
  // The bendy bit, pointing off to the right.
  for (let i = 0; i < 9; i++) {
    const color = Math.floor(i / 3) % 2 ? '#ff5a6a' : '#ffffff';
    pm.rect(8 + i * 0.6, 7 - i * 0.6, 4, 2, color);
  }
  pm.rect(13, 1, 2, 3, '#ffffff');
  return pm.outline(C.outline);
}

// A floating cherry with its stalk, sat in the milkshake up to its middle.
export function drawCherry() {
  const pm = new Pixmap(11, 14);
  pm.line(5, 6, 8, 0, MS.stalk, 1);
  pm.set(9, 0, MS.stalk);
  pm.circle(5, 9, 4, MS.cherry);
  pm.ellipse(6, 11, 3, 1.5, MS.cherryDark);
  pm.set(3, 7, '#ffd0d8');
  pm.set(4, 7, '#ffffff');
  return pm.outline(C.outline);
}

// A wafer boat with a cocktail-umbrella sail, bottom-centre on the waterline.
export function drawWaferBoat() {
  const pm = new Pixmap(28, 22);
  // The hull: a wafer with its criss-cross pattern.
  for (let y = 15; y < 21; y++) {
    const inset = y - 15;
    for (let x = 1 + inset; x < 27 - inset; x++) {
      pm.set(x, y, (x + y) % 3 === 0 || (x - y) % 3 === 0 ? MS.waferDark : MS.wafer);
    }
  }
  pm.rect(0, 14, 28, 2, MS.wafer);
  // A cocktail-umbrella sail on a stick.
  pm.rect(13, 3, 1, 12, '#ffffff');
  for (let y = 0; y < 6; y++) {
    for (let x = 13 - y * 2; x <= 13 + y * 2; x++) {
      pm.set(x, 2 + y, Math.floor((x - 1) / 3) % 2 ? CA.lemon : '#7cf28a');
    }
  }
  return pm.outline(C.outline);
}
