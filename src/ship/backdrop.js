import { W } from './layout.js';

// A landable planet's backdrop (assets.backdrops[id]): its ground filling the
// screen, with whatever drifts across its sky (clouds, smoke) sliding by.
export function drawBackdrop(r, backdrop, t) {
  r.image(backdrop.ground, 0, 0, { ax: 0, ay: 0 });
  backdrop.clouds.forEach((img, i) => {
    r.image(img, ((i * 130 + 20 + t * (3 + i)) % (W + 50)) - 40, 14 + i * 12, { ax: 0, ay: 0 });
  });
}
