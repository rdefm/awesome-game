import { W, H } from './layout.js';

const CRUISE_SPEED = 8; // px/s for the nearest stars at rest

// Live stars drifting past the windows. `warp` multiplies their speed and,
// once it's high, stretches them into streaks.
export class Starfield {
  constructor() {
    this.warp = 1;
    this.stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: 0.25 + Math.random() * 0.75,
      tw: Math.random() * 10,
    }));
  }

  update(dt) {
    for (const s of this.stars) {
      s.x -= CRUISE_SPEED * this.warp * s.z * dt;
      s.tw += dt;
      if (s.x < -60) {
        s.x += W + 120;
        s.y = Math.random() * H;
      }
    }
  }

  draw(r) {
    for (const s of this.stars) {
      const color = s.z > 0.8 ? '#ffffff' : s.z > 0.5 ? '#c9d4ff' : '#8088c0';
      const streak = Math.min(48, (this.warp - 1) * s.z * 0.8);
      if (streak >= 1) {
        r.rect(s.x, s.y, streak + 1, 1, color, 0.9);
      } else {
        const twinkle = 0.55 + 0.45 * Math.sin(s.tw * (2 + s.z * 3));
        r.pixel(s.x, s.y, color, twinkle);
        if (s.z > 0.92) {
          r.pixel(s.x - 1, s.y, color, twinkle * 0.4);
          r.pixel(s.x + 1, s.y, color, twinkle * 0.4);
        }
      }
    }
  }
}
