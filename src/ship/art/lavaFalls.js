import { Pixmap, bayer, fractalNoise, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { EM, drawEmberPlain } from './ember.js';
import { FALLS_POOL, LAVA_FALLS, W } from '../layout.js';

// Everything painted for the lava falls on Ember: the plain with a great dark
// cliff across the back, a glowing cascade of lava pouring down it into a
// bubbling pool, stepping stones, a pumice rock and a lava bubble.

// The top of the cliff at column x: craggy, sloping down to nothing on the
// left, with a notch where the falls pour over.
function cliffTop(x) {
  if (Math.abs(x - LAVA_FALLS.x) <= LAVA_FALLS.w / 2 + 2) {
    return LAVA_FALLS.top;
  }
  const crag = 22 + Math.round(fractalNoise(x / 16, 0.5, 41, 3) * 14);
  return crag + Math.max(0, 118 - x) * 2.6;
}

// The volcanic plain (see drawEmberPlain) with the cliff and the falls at the
// back, pouring into a lava pool ringed with dark rock.
export function drawLavaFalls({ horizon = 100 } = {}) {
  const pm = drawEmberPlain({ horizon, seed: 14 });
  const rand = seededRandom(23);
  const { x: px, y: py, rx, ry } = FALLS_POOL;
  const left = LAVA_FALLS.x - LAVA_FALLS.w / 2;
  const right = LAVA_FALLS.x + LAVA_FALLS.w / 2;
  // The cliff: dark rock, lit along its top edge, warming to a lava glow
  // either side of the falls.
  for (let x = 0; x < W; x++) {
    const top = Math.round(cliffTop(x));
    for (let y = top; y < py; y++) {
      const edge = y - top;
      const near = Math.min(Math.abs(x - left), Math.abs(x - right));
      let color = edge < 2 ? EM.rockLight : bayer(x, y) < 0.3 + edge * 0.006 ? EM.rockDark : EM.rock;
      if (near < 14 && bayer(x, y) < (1 - near / 14) * 0.5) {
        color = EM.lavaDark;
      }
      pm.set(x, y, color);
    }
  }
  // Ledges and cracks in the cliff face.
  for (let i = 0; i < 16; i++) {
    const x = 100 + Math.floor(rand() * (W - 100));
    const y = Math.round(cliffTop(x)) + 6 + Math.floor(rand() * 50);
    if (y < py - 4 && (x < left - 3 || x > right + 3)) {
      pm.rect(x, y, 4 + Math.floor(rand() * 6), 1, EM.rockLight);
      pm.rect(x + 1, y + 1, 3, 1, EM.rockDark);
    }
  }
  // The falls: darker at the edges, bright in the middle, streaked yellow.
  for (let y = LAVA_FALLS.top; y < py; y++) {
    for (let x = left; x <= right; x++) {
      const k = Math.abs(x - LAVA_FALLS.x) / (LAVA_FALLS.w / 2);
      let color = k > 0.85 ? EM.lavaDark : k > 0.5 ? EM.lava : EM.lavaLight;
      if ((x * 7 + Math.floor(y / 5) * 3) % 11 === 0) {
        color = EM.lavaHi;
      }
      pm.set(x, y, color);
    }
  }
  pm.ellipse(LAVA_FALLS.x, LAVA_FALLS.top, LAVA_FALLS.w / 2 + 1, 2, EM.lavaLight); // the lip it pours over
  pm.rect(left + 2, LAVA_FALLS.top - 1, LAVA_FALLS.w - 4, 1, EM.lavaHi);
  // The pool, glowing, with a rim of dark rock and crusty bits floating in it.
  const inPool = (x, y, grow = 0) => ((x - px) / (rx + grow)) ** 2 + ((y - py) / (ry + grow)) ** 2 <= 1;
  for (let y = py - ry - 3; y <= py + ry + 3; y++) {
    for (let x = px - rx - 3; x <= px + rx + 3; x++) {
      if (inPool(x, y)) {
        const deep = 1 - Math.abs(y - py) / ry;
        pm.set(x, y, bayer(x, y) < deep * 0.4 ? EM.lavaLight : EM.lava);
      } else if (inPool(x, y, 2.5)) {
        pm.set(x, y, y > py ? EM.rockLight : EM.rockDark);
      }
    }
  }
  for (let i = 0; i < 10; i++) {
    const x = px - rx + 10 + Math.floor(rand() * (rx * 2 - 20));
    const y = py - ry + 3 + Math.floor(rand() * (ry * 2 - 6));
    if (Math.abs(x - LAVA_FALLS.x) > 20 && inPool(x, y)) {
      pm.rect(x, y, 3 + Math.floor(rand() * 4), 1, EM.lavaDark);
    }
  }
  // Where the falls land: a bright frothing splash.
  pm.ellipse(LAVA_FALLS.x, py - ry + 2, LAVA_FALLS.w / 2 + 6, 2.5, EM.lavaLight);
  pm.ellipse(LAVA_FALLS.x, py - ry + 2, LAVA_FALLS.w / 2, 1.5, EM.lavaHi);
  return pm;
}

// A flat, warm stepping stone, bottom-centre on the ground. Lit, its cracks
// glow bright where she's just landed on it.
export function drawSteppingStone(lit = false) {
  const pm = new Pixmap(22, 8);
  pm.ellipse(11, 4, 10, 3.5, EM.rockLight);
  pm.ellipse(11, 5, 9, 2.5, EM.rock);
  pm.rect(4, 6, 14, 1, EM.rockDark);
  const crack = lit ? EM.lavaHi : EM.lavaDark;
  pm.line(6, 3, 10, 5, crack, 1);
  pm.line(10, 5, 15, 3, crack, 1);
  if (lit) {
    pm.set(11, 4, EM.lavaLight);
    pm.set(14, 4, EM.lavaLight);
  }
  return pm.outline(C.outline);
}

// A lumpy grey pumice rock, full of holes (light enough for a geyser to lift).
export function drawPumice() {
  const pm = new Pixmap(14, 10);
  pm.ellipse(7, 5, 6, 4, '#a89a9e');
  pm.ellipse(8, 6, 4.5, 3, '#8a7c82');
  pm.ellipse(5, 3, 2, 1, '#cfc4c4');
  for (const [x, y] of [[4, 6], [9, 3], [10, 7], [6, 8], [2, 4]]) {
    pm.set(x, y, '#5a4a52');
  }
  return pm.outline(C.outline);
}

// A glowing lava bubble, shiny on top (drawn scaled to grow as it rises).
export function drawLavaBubble() {
  const pm = new Pixmap(11, 11);
  pm.circle(5, 5, 5, EM.lavaDark);
  pm.circle(5, 5, 4, EM.lava);
  pm.circle(5, 6, 2.5, EM.lavaLight);
  pm.rect(3, 2, 2, 1, EM.lavaHi);
  pm.set(3, 3, EM.lavaHi);
  return pm.outline(C.outline);
}
