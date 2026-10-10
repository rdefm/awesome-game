import { MOON_PETALS, MOONFLOWER_H } from '../art/bluebell.js';
import { MOONFLOWER } from '../layout.js';
import { softGlow } from '../night.js';
import { Secret } from './secret.js';

// --------------------------------------------------------------- moonflower
// A tall flower out on the far stretch of the meadow, a pale bud by day. Tap
// it and she walks over and touches it: it opens out and dusk falls across
// Bluebell (see ../night.js). Tap it again and it closes up as the sun comes up.
// At night it glows softly.
export class Moonflower extends Secret {
  constructor(assets) {
    const { x, y } = MOONFLOWER;
    super(x, y, { w: 14, h: MOONFLOWER_H + 2, reach: 14 });
    this.imgs = assets.moonflower;
  }

  async reveal() {
    const { scene } = this;
    const { engine, girl } = scene;
    const night = !scene.night;
    girl.faceToward(this.x);
    girl.act('reach', 0.6);
    engine.audio.play(night ? 'dusk' : 'dawn');
    scene.sparkles(this.x, this.y - MOONFLOWER_H + 4, 4);
    await scene.fadeNight(night);
    this.react('cheer', night ? 'star' : 'heart');
  }

  draw(r) {
    const dusk = this.scene.dusk ?? 0;
    const opts = { scaleX: this.bounce, scaleY: 2 - this.bounce };
    // (The open flower covers the bud right over, so it just fades in on top.)
    r.image(this.imgs.closed, this.x, this.y + 1, opts);
    r.image(this.imgs.open, this.x, this.y + 1, { ...opts, alpha: dusk });
  }

  // At night its open flower glows softly, gently brightening and dimming.
  drawGlow(r, dusk) {
    const t = this.scene.engine.time;
    softGlow(r, this.x, this.y - MOONFLOWER_H + 5, 10, MOON_PETALS.petal, dusk * (0.3 + 0.06 * Math.sin(t * 1.3)));
  }
}

// ---------------------------------------------------------------- fireflies
// Fireflies drifting low over the meadow at night (only to be seen once
// dusk falls), each blinking on and off in its own time.
const FIREFLY = { count: 16, on: '#f6ff8a', halo: '#c8ff5a' };

export class Fireflies {
  // `width`: how wide the meadow is.
  constructor(width) {
    this.depth = 400; // (it draws nothing in the usual way, only over the night shade)
    this.flies = Array.from({ length: FIREFLY.count }, (_, i) => ({
      x: ((i + Math.random()) / FIREFLY.count) * width,
      y: 96 + Math.random() * 50,
      phase: Math.random() * 6,
      speed: 0.3 + Math.random() * 0.4,
      blink: 1.5 + Math.random() * 2,
    }));
  }

  // Where firefly `f` has wandered to at time `t`, looping about its home spot.
  pos(f, t) {
    return {
      x: f.x + Math.sin(t * f.speed + f.phase) * 14,
      y: f.y + Math.sin(t * f.speed * 1.7 + f.phase * 2) * 6,
    };
  }

  // Each one that's lit just now: a bright dot in a soft halo.
  drawGlow(r, dusk) {
    const t = this.scene.engine.time;
    for (const f of this.flies) {
      const lit = Math.max(0, Math.sin(t * f.blink + f.phase)) ** 2 * dusk;
      if (lit <= 0.02) {
        continue;
      }
      const { x, y } = this.pos(f, t);
      const px = Math.round(x);
      const py = Math.round(y);
      r.rect(px - 1, py - 1, 3, 3, FIREFLY.halo, lit * 0.35);
      r.rect(px, py, 1, 1, FIREFLY.on, lit);
    }
  }
}
