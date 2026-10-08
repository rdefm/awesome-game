import { seededRandom } from '../engine/pixmap.js';
import { W, H } from './layout.js';

// A landable planet's backdrop (assets.backdrops[id]): its ground filling the
// screen, with whatever drifts across its sky (clouds, smoke) sliding by.
export function drawBackdrop(r, backdrop, t) {
  r.image(backdrop.ground, 0, 0, { ax: 0, ay: 0 });
  backdrop.clouds.forEach((img, i) => {
    r.image(img, ((i * 130 + 20 + t * (3 + i)) % (W + 50)) - 40, 14 + i * 12, { ax: 0, ay: 0 });
  });
}

// The same snowflakes every time: where each starts, how fast it falls and
// how far it sways. The bigger ones are nearer, so they fall faster.
const rand = seededRandom(23);
const FLAKES = Array.from({ length: 70 }, () => {
  const near = rand() < 0.3;
  return {
    x: rand() * W, y: rand() * H, speed: near ? 22 + rand() * 10 : 9 + rand() * 8,
    sway: 2 + rand() * 4, phase: rand() * 6, size: near ? 2 : 1,
  };
});

const wrap = (v, m) => ((v % m) + m) % m;

// Snow falling over the whole scene (for a backdrop with `snow`), drifting
// gently to the right as it comes down.
export function drawWeather(r, backdrop, t) {
  if (!backdrop.snow) {
    return;
  }
  for (const f of FLAKES) {
    const x = wrap(f.x + t * 4 + Math.sin(t * 1.3 + f.phase) * f.sway, W);
    const y = wrap(f.y + t * f.speed, H + 4) - 2;
    r.rect(Math.round(x), Math.round(y), f.size, f.size, '#ffffff', f.size > 1 ? 0.95 : 0.75);
  }
}
