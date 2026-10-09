import { Pixmap, bayer, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { BB } from './bluebell.js';
import { MG } from './mushroomGrove.js';
import { PD } from './pod.js';
import { CA } from './candy.js';
import { EM } from './ember.js';
import { FL, SNOW_CRITTER_COLORS } from './frozenLake.js';
import { FR } from './frosty.js';
import { IC } from './iceCave.js';
import { MS } from './milkshakeLake.js';
import { OA } from './oasis.js';
import { ST, ZIG_STRIPES, stripe } from './stripey.js';

// The hoverbike's town map: an illustrated picture of a planet seen from up
// high, and little pictures of each place on it to tap. The paths between
// the places are drawn over the top as the map is shown (see townMap.js),
// so they follow the places wherever they are.
export const MAP = { x: 6, y: 19, w: 244, h: 135 }; // where the picture sits on screen

// Each planet's map's dotted paths (`dot`, with its `shade` underneath), and
// the colour of the shadows things cast on its ground.
export const MAP_STYLE = {
  candy: { dot: '#fffaf2', shade: '#c04f9a', shadow: CA.groundDeep },
  ember: { dot: EM.lavaHi, shade: EM.lavaDark, shadow: EM.rockDark },
  stripey: { dot: '#fff4d8', shade: ST.rockShade, shadow: ST.sandDeep },
  frosty: { dot: '#ffffff', shade: FR.peakDark, shadow: FR.snowDeep },
  bluebell: { dot: '#ffffff', shade: BB.hillDark, shadow: BB.grassDark },
};

const BODY = '#ff00ff'; // stand-in colour, striped once the shape's drawn

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

// Ember from up high: dark rock cracked with glowing seams, ash dunes, and the
// great volcano at the back with a river of lava running down from its
// crater to the falls, under a craggy rock border.
export function drawEmberMap() {
  const { w, h } = MAP;
  const pm = new Pixmap(w, h);
  const rand = seededRandom(19);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      pm.set(x, y, bayer(x, y) < 0.2 + (y / h) * 0.15 ? EM.rockDark : EM.rock);
    }
  }
  // Ash dunes: soft humps with a shaded side and a pale top.
  for (const [dx, dy, rx, ry] of [[30, 30, 24, 10], [64, 122, 32, 9], [134, 118, 22, 8], [226, 30, 18, 10], [24, 104, 16, 8]]) {
    pm.ellipse(dx, dy, rx, ry, EM.ash);
    pm.ellipse(dx + rx * 0.3, dy + ry * 0.3, rx * 0.6, ry * 0.5, EM.ashDark);
    pm.ellipse(dx - rx * 0.25, dy - ry * 0.45, rx * 0.4, ry * 0.25, EM.ashLight);
  }
  // Glowing seams wandering across the ground.
  for (let i = 0; i < 12; i++) {
    let x = rand() * w;
    let y = rand() * h;
    for (let s = 0; s < 10 + Math.floor(rand() * 14); s++) {
      pm.set(Math.round(x), Math.round(y), s % 4 === 0 ? EM.lavaLight : EM.lava);
      x += rand() < 0.5 ? 1 : -1 + rand() * 3;
      y += (rand() - 0.5) * 1.4;
    }
  }
  // The volcano, its crater glowing, with the lava house at its foot.
  const vx = 170;
  for (let y = 4; y < 58; y++) {
    const half = 8 + (y - 4) * 1.3;
    for (let x = Math.round(vx - half); x <= vx + half; x++) {
      pm.set(x, y, bayer(x, y) < 0.3 + (x - vx) / half * 0.3 ? EM.ashDark : EM.ash);
    }
  }
  pm.ellipse(vx, 5, 9, 2.5, EM.lavaDark);
  pm.ellipse(vx, 5, 7, 1.5, EM.lavaLight);
  // The lava river: down the volcano's right side and on to the falls.
  let x = vx + 4;
  for (let y = 6; y < 102; y++) {
    x += y < 50 ? 0.45 : Math.sin(y * 0.15) * 0.6 + 0.1;
    pm.rect(Math.round(x) - 1, y, 3, 1, EM.lava);
    pm.set(Math.round(x), y, y % 5 ? EM.lavaLight : EM.lavaHi);
  }
  // Glowing pebbles.
  for (let i = 0; i < 120; i++) {
    const px = Math.floor(rand() * w);
    const py = Math.floor(rand() * h);
    pm.set(px, py, rand() < 0.3 ? EM.lavaLight : EM.ashLight);
  }
  // A craggy rock border all round.
  for (let i = 0; i < w; i++) {
    const d = 2 + (Math.floor(i / 5) % 2);
    pm.rect(i, 0, 1, d, EM.rockLight);
    pm.rect(i, h - d, 1, d, EM.rockLight);
  }
  for (let i = 0; i < h; i++) {
    const d = 2 + (Math.floor(i / 5) % 2);
    pm.rect(0, i, d, 1, EM.rockLight);
    pm.rect(w - d, i, d, 1, EM.rockLight);
  }
  return pm;
}

// Stripey from up high: sand in wavy stripes, flat-topped mesas ringed in
// their rock layers, stripy cacti here and there, and a green patch round
// the oasis, under a border of rock stripes.
export function drawStripeyMap() {
  const { w, h } = MAP;
  const pm = new Pixmap(w, h);
  const rand = seededRandom(23);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const band = Math.floor((y + Math.sin(x / 14) * 3) / 5) % 3;
      pm.set(x, y, band === 0 ? ST.sandDark : band === 1 ? ST.sand : ST.sandLight);
    }
  }
  // The green round the oasis, so the palms have something to drink.
  pm.ellipse(190, 112, 30, 12, ST.greenDark);
  pm.ellipse(190, 111, 27, 10, ST.green);
  // Mesas seen from above: rings of rock layers, the top in the middle,
  // shadow off to the lower right.
  for (const [mx, my, r] of [[34, 34, 20], [120, 28, 16], [226, 70, 14], [118, 116, 12]]) {
    pm.ellipse(mx + 4, my + 4, r, r * 0.7, ST.sandDeep);
    for (let k = r; k > 0; k -= 3) {
      pm.ellipse(mx, my, k, k * 0.7, ST.strata[Math.floor((r - k) / 3) % ST.strata.length]);
    }
  }
  // Stripy cacti dotted about.
  for (let i = 0; i < 14; i++) {
    const cx = 8 + Math.floor(rand() * (w - 16));
    const cy = 8 + Math.floor(rand() * (h - 16));
    pm.rect(cx, cy - 4, 2, 5, ST.green);
    pm.set(cx, cy - 2, ST.greenLight);
    pm.set(cx - 1, cy - 3, ST.green);
    pm.set(cx + 2, cy - 2, ST.green);
  }
  // Pebbles.
  for (let i = 0; i < 90; i++) {
    pm.set(Math.floor(rand() * w), Math.floor(rand() * h), rand() < 0.4 ? ST.strata[2] : ST.sandDeep);
  }
  // A border of rock stripes all round.
  for (let i = 0; i < Math.max(w, h); i++) {
    const color = ST.strata[Math.floor(i / 4) % 3 === 0 ? 2 : 1];
    pm.rect(i, 0, 1, 3, color);
    pm.rect(i, h - 3, 1, 3, color);
    pm.rect(0, i, 3, 1, color);
    pm.rect(w - 3, i, 3, 1, color);
  }
  return pm;
}

// Frosty from up high: deep snow shaded in soft blue drifts, snowy
// mountains ringed with ice, little pines dotted about, and the lake frozen
// over, under a border of packed snow and ice.
export function drawFrostyMap() {
  const { w, h } = MAP;
  const pm = new Pixmap(w, h);
  const rand = seededRandom(29);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const drift = Math.sin(x / 11 + y / 17) + Math.sin(y / 7 - x / 23);
      pm.set(x, y, drift > 1.1 && bayer(x, y) < 0.6 ? FR.snowShade : FR.snow);
    }
  }
  // Mountains seen from above: rings of rock with snowy tops, shadow off to
  // the lower right.
  for (const [mx, my, r] of [[30, 30, 20], [116, 24, 15], [170, 40, 18], [230, 76, 13], [120, 112, 11]]) {
    pm.ellipse(mx + 4, my + 4, r, r * 0.7, FR.snowDeep);
    pm.ellipse(mx, my, r, r * 0.7, FR.peakDark);
    pm.ellipse(mx - 1, my - 1, r * 0.75, r * 0.52, FR.peak);
    pm.ellipse(mx - 2, my - 2, r * 0.45, r * 0.32, FR.peakSnow);
  }
  // The frozen lake, round the place it sits.
  pm.ellipse(192, 110, 34, 14, FR.snowShade);
  pm.ellipse(192, 109, 31, 12, FL.ice);
  for (let i = 0; i < 6; i++) {
    pm.hline(172 + i * 7, 175 + i * 7, 104 + (i % 3) * 3, FL.iceLight);
  }
  // Little snowy pines.
  for (let i = 0; i < 16; i++) {
    const tx = 8 + Math.floor(rand() * (w - 16));
    const ty = 8 + Math.floor(rand() * (h - 16));
    pm.ellipse(tx + 1, ty + 1, 2.5, 1.5, FR.snowDeep);
    pm.circle(tx, ty, 2.5, FR.pine);
    pm.set(tx - 1, ty - 1, FR.snow);
  }
  // Glitter.
  for (let i = 0; i < 90; i++) {
    pm.set(Math.floor(rand() * w), Math.floor(rand() * h), rand() < 0.5 ? '#ffffff' : FR.iceLight);
  }
  // A border of packed snow and ice all round.
  for (let i = 0; i < Math.max(w, h); i++) {
    const d = 2 + (Math.floor(i / 6) % 2);
    const color = Math.floor(i / 6) % 2 ? FR.ice : '#ffffff';
    pm.rect(i, 0, 1, d, color);
    pm.rect(i, h - d, 1, d, color);
    pm.rect(0, i, d, 1, color);
    pm.rect(w - d, i, d, 1, color);
  }
  return pm;
}

// ------------------------------------------------------------ place pictures
// Each is centred on its place's spot on the map.

// Our ship, landed: a chubby rocket on its legs, casting `shadow`.
export function drawMapShip(shadow) {
  const pm = new Pixmap(26, 32);
  pm.ellipse(13, 30, 11, 1.5, shadow); // its shadow on the ground
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

// The lava family's house, a stone dome with round glowing windows and a
// chimney, at the foot of the volcano.
export function drawMapLavaHouse() {
  const pm = new Pixmap(30, 26);
  pm.ellipse(15, 24, 13, 1.5, EM.rockDark);
  pm.rect(20, 3, 4, 8, EM.rockDark); // chimney
  pm.rect(19, 2, 6, 2, EM.rockLight);
  pm.ellipse(15, 25, 13, 16, EM.ashLight);
  pm.dither(2, 18, 26, 7, EM.ash, 0.5);
  for (const wx of [7, 23]) {
    pm.circle(wx, 15, 2.5, EM.lavaLight);
    pm.set(wx, 15, EM.lavaHi);
  }
  pm.circle(15, 17, 4, EM.rockLight);
  pm.rect(11, 17, 9, 7, EM.rockLight);
  pm.circle(15, 17, 2.5, '#7a3e2a');
  pm.rect(13, 17, 5, 7, '#7a3e2a');
  pm.set(17, 20, EM.lavaHi);
  return pm.outline(C.outline);
}

// The lava falls: a dark cliff with glowing lava pouring down it into a pool.
export function drawMapFalls() {
  const pm = new Pixmap(40, 32);
  pm.ellipse(20, 25, 18, 6, EM.rockLight);
  pm.ellipse(20, 25, 16, 4.5, EM.lava);
  pm.ellipse(20, 25, 10, 2.5, EM.lavaLight);
  for (let x = 6; x <= 34; x++) {
    const top = 3 + Math.abs(x - 20) * 0.3 + ((x * 5) % 3);
    pm.rect(x, Math.round(top), 1, Math.round(21 - top), x % 4 ? EM.rock : EM.rockDark);
    pm.set(x, Math.round(top), EM.rockLight);
  }
  pm.rect(17, 3, 7, 20, EM.lava);
  pm.rect(19, 3, 3, 20, EM.lavaLight);
  for (const y of [6, 11, 16]) {
    pm.set(20, y, EM.lavaHi);
  }
  pm.ellipse(20, 22, 6, 1.5, EM.lavaHi); // the splash at the bottom
  return pm.outline(C.outline);
}

// Zig's hut: a dome in orange and cream stripes with its two eye-stalk
// aerials and a round door.
export function drawMapZigHut() {
  const { a, b, dark } = ZIG_STRIPES[0];
  const pm = new Pixmap(30, 28);
  pm.ellipse(15, 26, 13, 1.5, ST.sandDeep);
  for (const [x, lean] of [[11, -2], [19, 2]]) {
    pm.line(x, 10, x + lean, 3, dark, 1);
    pm.circle(x + lean, 2, 1.5, '#ffffff');
  }
  pm.ellipse(15, 26, 13, 16, BODY);
  stripe(pm, BODY, a, b, 3, 1);
  pm.dither(20, 12, 8, 14, dark, 0.4);
  pm.circle(15, 20, 3.5, '#7a4a2a');
  pm.rect(12, 20, 7, 6, '#7a4a2a');
  pm.set(17, 22, '#ffe066');
  return pm.outline(C.outline);
}

// The oasis: a pool in turquoise stripes with a palm leaning over it.
export function drawMapOasis() {
  const pm = new Pixmap(42, 34);
  pm.ellipse(22, 25, 19, 7, ST.sandDark);
  pm.ellipse(22, 25, 17, 5.5, BODY);
  stripe(pm, BODY, OA.water, OA.waterLight, 2, 0);
  pm.ellipse(28, 26, 3, 1, OA.pad);
  // The palm, on the left bank, its fronds fanned out over the water.
  for (let i = 0; i < 18; i++) {
    pm.set(8 + Math.round((i / 18) ** 2 * 5), 26 - i, i % 2 ? OA.trunk : OA.trunkLight);
  }
  for (const [dx, dy] of [[-7, 3], [-5, -3], [0, -5], [6, -3], [9, 3], [4, 4], [-3, 4]]) {
    pm.line(13, 8, 13 + dx, 8 + dy, ST.greenDark, 1);
    pm.set(13 + dx, 8 + dy, ST.green);
  }
  pm.circle(12, 10, 1.5, OA.nut);
  return pm.outline(C.outline);
}

// The yetis' ice cave: a hump of blue rock under a snow cap, its arched
// mouth fringed with icicles and hung with a fur curtain.
export function drawMapIceCave() {
  const pm = new Pixmap(32, 26);
  pm.ellipse(16, 24, 14, 1.5, FR.snowDeep);
  pm.ellipse(16, 25, 14, 17, IC.rock);
  pm.dither(18, 12, 12, 12, IC.rockDark, 0.4);
  pm.ellipse(15, 10, 12, 5, FR.snow); // its snow cap
  pm.dither(4, 11, 22, 3, FR.snowShade, 0.4);
  pm.circle(16, 17, 5, IC.rockDeep);
  pm.rect(11, 17, 11, 7, IC.rockDeep);
  pm.circle(16, 18, 3.5, IC.fur);
  pm.rect(13, 18, 7, 6, IC.fur);
  pm.vline(16, 15, 23, IC.furDark);
  for (const x of [11, 13, 19, 21]) {
    pm.vline(x, 13, 14 + (x % 3), FR.iceLight); // icicles
  }
  return pm.outline(C.outline);
}

// The frozen lake: a pale sheet of ice in a snowbank, a fishing hole cut in
// it, and a snow critter sat beside it.
export function drawMapFrozenLake() {
  const pm = new Pixmap(44, 28);
  pm.ellipse(21, 18, 20, 8, '#ffffff');
  pm.ellipse(21, 18, 18, 6.5, FL.ice);
  pm.ellipse(24, 20, 11, 3, FL.iceDark);
  pm.hline(9, 14, 16, FL.iceLight);
  pm.hline(26, 31, 14, FL.iceLight);
  pm.ellipse(14, 19, 3, 1.5, FL.water); // the fishing hole
  pm.set(13, 19, FL.waterDeep);
  // A snow critter on the shore.
  pm.ellipse(35, 9, 4, 3.5, '#ffffff');
  pm.ellipse(35, 6, 2.5, 1, SNOW_CRITTER_COLORS[0].cap);
  pm.set(37, 8, C.outline);
  pm.set(39, 9, FL.feet);
  pm.rect(33, 12, 1, 1, FL.feet);
  pm.rect(36, 12, 1, 1, FL.feet);
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

// The pink alien's pod: a round pink dome with a glowing window and a bulb
// on its antenna.
export function drawMapPod() {
  const pm = new Pixmap(30, 28);
  pm.ellipse(15, 26, 13, 1.5, BB.grassDark);
  pm.vline(15, 2, 8, PD.shellDeep);
  pm.circle(15, 2, 1.5, PD.glow);
  pm.ellipse(15, 18, 13, 9, PD.shell);
  pm.dither(18, 14, 11, 12, PD.shellDark, 0.45);
  pm.ellipse(10, 14, 3, 2, PD.shellLight);
  pm.hline(3, 27, 20, PD.shellDeep);
  pm.circle(21, 16, 2.5, PD.shellDeep);
  pm.circle(21, 16, 1.5, PD.glow);
  pm.circle(13, 24, 3, PD.shellDeep);
  pm.rect(10, 24, 7, 3, PD.shellDeep);
  pm.circle(13, 24, 2, PD.glow);
  return pm.outline(C.outline);
}

// The mushroom grove: three giant mushrooms in a mossy patch, glowing spores
// floating up from them.
export function drawMapMushroomGrove() {
  const pm = new Pixmap(44, 32);
  pm.ellipse(22, 27, 20, 4, MG.moss);
  pm.dither(6, 24, 32, 6, MG.mossDark, 0.4);
  [[12, 24, 8, 4, 0], [30, 25, 9, 5, 1], [22, 21, 6, 3, 2]].forEach(([x, y, h, rx, v]) => {
    const k = MG.caps[v];
    pm.rect(x - 1, y - h, 3, h, MG.stem);
    pm.ellipse(x, y - h, rx + 2, rx - 0.5, k.cap);
    pm.dither(x - rx, y - h, rx + 3, rx, k.shade, 0.4);
    pm.set(x - 1, y - h - 1, k.spot);
    pm.set(x + 2, y - h, k.spot);
  });
  for (const [x, y] of [[8, 5], [24, 3], [38, 8], [16, 9]]) {
    pm.set(x, y, MG.glow);
    pm.set(x + 1, y, MG.glowDeep);
  }
  return pm.outline(C.outline);
}

// Bluebell from up high: a green meadow of rolling hills, dotted with giant
// bluebells, a shady mossy patch of mushrooms where the grove is, under a
// border of grass and flowers.
export function drawBluebellMap() {
  const { w, h } = MAP;
  const pm = new Pixmap(w, h);
  const rand = seededRandom(43);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const roll = Math.sin(x / 13 + y / 19) + Math.sin(y / 8 - x / 21);
      pm.set(x, y, roll > 1.1 && bayer(x, y) < 0.6 ? BB.grassLight : roll < -1.1 && bayer(x, y) < 0.5 ? BB.grassDark : BB.grass);
    }
  }
  // Rolling hills, with shadow off to the lower right.
  for (const [hx, hy, r] of [[28, 30, 20], [112, 20, 16], [160, 100, 14], [236, 30, 15], [70, 118, 13]]) {
    pm.ellipse(hx + 4, hy + 4, r, r * 0.7, BB.hillDark);
    pm.ellipse(hx, hy, r, r * 0.7, BB.hill);
    pm.ellipse(hx - 2, hy - 2, r * 0.6, r * 0.42, BB.grassLight);
  }
  // The mushroom grove's shady patch, round the place it sits.
  pm.ellipse(192, 109, 34, 15, BB.grassDark);
  pm.ellipse(192, 109, 30, 12, MG.mossDark);
  pm.dither(166, 102, 52, 14, MG.moss, 0.4);
  // Giant bluebells here and there.
  for (let i = 0; i < 26; i++) {
    const fx = 8 + Math.floor(rand() * (w - 16));
    const fy = 8 + Math.floor(rand() * (h - 16));
    pm.set(fx, fy + 1, BB.stem);
    pm.circle(fx, fy - 1, 1.5, rand() < 0.5 ? BB.bell : BB.bellLight);
  }
  // Glitter.
  for (let i = 0; i < 60; i++) {
    pm.set(Math.floor(rand() * w), Math.floor(rand() * h), rand() < 0.5 ? BB.grassLight : BB.bellHi);
  }
  // A border of grass and flowers all round.
  for (let i = 0; i < Math.max(w, h); i++) {
    const d = 2 + (Math.floor(i / 6) % 2);
    const color = Math.floor(i / 6) % 2 ? BB.bellLight : BB.hillDark;
    pm.rect(i, 0, 1, d, color);
    pm.rect(i, h - d, 1, d, color);
    pm.rect(0, i, d, 1, color);
    pm.rect(w - d, i, d, 1, color);
  }
  return pm;
}
