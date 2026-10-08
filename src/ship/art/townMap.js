import { Pixmap, bayer, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { CA } from './candy.js';
import { MS } from './milkshakeLake.js';

// The hoverbike's town map: an illustrated picture of a planet seen from up
// high, and little pictures of each place on it to tap. The paths between
// the places are drawn over the top as the map is shown (see townMap.js),
// so they follow the places wherever they are.
export const MAP = { x: 6, y: 19, w: 244, h: 135 }; // where the picture sits on screen

const SPRINKLES = ['#ff5a8a', '#ffe066', '#7cf28a', '#6fb2ff', '#ffffff', '#c9b6ff'];

// A little lollipop tree seen from the side, standing on (x, y).
function tree(pm, x, y, color) {
  pm.rect(x, y - 5, 1, 5, '#ffffff');
  pm.circle(x, y - 7, 2.5, color);
  pm.set(x - 1, y - 8, '#ffffff');
}

// Candy from up high: rolling pink icing with mint and lilac hills, lollipop
// trees and sprinkles everywhere, under a frosting border.
export function drawCandyMap() {
  const { w, h } = MAP;
  const pm = new Pixmap(w, h);
  const rand = seededRandom(17);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      pm.set(x, y, bayer(x, y) < 0.18 + (y / h) * 0.12 ? CA.groundShade : CA.ground);
    }
  }
  // Rolling hills: soft humps with a shaded side and a frosting cap.
  const hills = [[30, 34, 26, 12, 0], [118, 22, 34, 12, 1], [222, 44, 30, 14, 0], [40, 128, 36, 12, 1], [128, 128, 26, 10, 0]];
  for (const [hx, hy, rx, ry, lilac] of hills) {
    pm.ellipse(hx, hy, rx, ry, lilac ? CA.hill : CA.mint);
    pm.ellipse(hx + rx * 0.3, hy + ry * 0.3, rx * 0.6, ry * 0.5, lilac ? CA.hillDark : CA.mintDark);
    pm.ellipse(hx - rx * 0.25, hy - ry * 0.45, rx * 0.4, ry * 0.25, CA.frosting);
  }
  // Lollipop trees dotted about.
  const pops = [CA.pink, CA.lemon, '#9a7cf0', '#7cf28a'];
  for (const [x, y] of [[14, 70], [26, 84], [112, 104], [130, 96], [232, 82], [240, 98], [96, 40], [150, 46], [66, 20], [196, 18]]) {
    tree(pm, x, y, pops[(x + y) % pops.length]);
  }
  // Sprinkles.
  for (let i = 0; i < 220; i++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(rand() * h);
    const color = SPRINKLES[Math.floor(rand() * SPRINKLES.length)];
    pm.set(x, y, color);
    pm.set(x + (rand() < 0.5 ? 1 : 0), y + 1, color);
  }
  // A wavy frosting border all round.
  for (let x = 0; x < w; x++) {
    const d = 2 + (Math.floor(x / 4) % 2);
    pm.rect(x, 0, 1, d, CA.frosting);
    pm.rect(x, h - d, 1, d, CA.frosting);
  }
  for (let y = 0; y < h; y++) {
    const d = 2 + (Math.floor(y / 4) % 2);
    pm.rect(0, y, d, 1, CA.frosting);
    pm.rect(w - d, y, d, 1, CA.frosting);
  }
  return pm;
}

// ------------------------------------------------------------ place pictures
// Each is centred on its place's spot on the map.

// Our ship, landed: a chubby rocket on its legs.
export function drawMapShip() {
  const pm = new Pixmap(26, 32);
  pm.ellipse(13, 30, 11, 1.5, CA.groundDeep); // its shadow on the ground
  pm.line(5, 29, 8, 22, C.metal, 2);
  pm.line(20, 29, 17, 22, C.metal, 2);
  pm.ellipse(13, 15, 7, 11, C.metalLight);
  pm.ellipse(15, 16, 4, 9, C.metal);
  pm.rect(6, 6, 14, 2, C.red);
  pm.ellipse(13, 3, 3, 3, C.red);
  pm.circle(13, 14, 3, C.tealDark);
  pm.circle(13, 14, 2, C.teal);
  pm.set(12, 13, '#ffffff');
  pm.rect(9, 22, 9, 2, C.redDark);
  return pm.outline(C.outline);
}

// The gingerbread house, with its icing roof and a gumdrop on top.
export function drawMapGingerbread() {
  const pm = new Pixmap(30, 30);
  pm.ellipse(15, 28, 13, 1.5, CA.groundDeep);
  pm.rect(4, 14, 22, 14, CA.ginger);
  pm.rect(4, 26, 22, 2, CA.gingerDark);
  for (let i = 0; i < 12; i++) {
    pm.rect(2 + i, 14 - i, 26 - i * 2, 1, CA.frosting); // icing roof
  }
  pm.rect(2, 14, 26, 1, '#ffd0ea');
  pm.circle(15, 3, 2, '#ff5a5a');
  pm.rect(13, 20, 5, 8, CA.choc);
  pm.set(16, 24, CA.lemon);
  pm.rect(6, 17, 5, 4, '#9fe6ff');
  pm.rect(20, 17, 5, 4, '#9fe6ff');
  pm.rect(8, 17, 1, 4, CA.frosting);
  pm.rect(22, 17, 1, 4, CA.frosting);
  pm.rect(22, 4, 3, 6, CA.gingerDark); // chimney
  return pm.outline(C.outline);
}

// The milkshake lake: a pink pool with a cream shore and the giant straw.
export function drawMapLake() {
  const pm = new Pixmap(44, 28);
  pm.ellipse(21, 18, 20, 8, MS.cream);
  pm.ellipse(21, 18, 18, 6.5, MS.shake);
  pm.ellipse(23, 20, 12, 3, MS.shakeDark);
  pm.rect(12, 16, 6, 1, MS.shakeLight);
  pm.rect(25, 14, 7, 1, MS.shakeLight);
  pm.circle(30, 19, 1.5, MS.cherry);
  // The straw, poking up.
  for (let i = 0; i < 14; i++) {
    pm.rect(10 + Math.floor(i / 5), 17 - i, 2, 1, Math.floor(i / 3) % 2 ? '#ff5a6a' : '#ffffff');
  }
  pm.rect(13, 2, 4, 2, '#ffffff');
  return pm.outline(C.outline);
}

// Her on the hoverbike, seen from the side: the "you are here" marker, and
// what flies across the map when she picks somewhere to go.
export function drawMapBike() {
  const pm = new Pixmap(18, 16);
  pm.ellipse(9, 14, 6, 1, '#bff8ff');
  pm.ellipse(9, 11, 8, 2.5, C.teal);
  pm.rect(3, 10, 13, 1, C.yellow);
  pm.line(14, 9, 15, 5, C.metal, 1);
  // Her, in her space helmet.
  pm.rect(6, 6, 4, 4, C.suit);
  pm.circle(8, 3, 3, '#e8f4ff');
  pm.circle(8.5, 3, 1.5, C.skin);
  pm.set(9, 3, C.outline);
  return pm.outline(C.outline);
}
