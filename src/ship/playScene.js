import { Scene } from '../engine/scene.js';
import { clampToFloor } from './entities/girl.js';
import { FLOOR_TOP, W, H } from './layout.js';

// Swallows all input (and draws nothing) while a scripted sequence plays.
export const BLOCK_INPUT = { draw() {} };

// What every place the girl can be has in common: tap-to-walk, little
// particle effects, a short message banner and fading in/out between places.
export class PlayScene extends Scene {
  constructor(assets) {
    super();
    this.assets = assets;
    this.particles = [];
    this.busy = false; // true during a scripted event
    this.fade = 1; // black overlay; scenes fade in on enter
    this.toastMsg = null;
  }

  enter() {
    this.engine.tweens.to(this, { fade: 0 }, 0.5);
  }

  // Fades to black, then swaps to the scene `makeScene` builds.
  async leaveTo(makeScene) {
    this.busy = true;
    this.modal = BLOCK_INPUT;
    await this.engine.tweens.to(this, { fade: 1 }, 0.45);
    this.engine.setScene(makeScene());
  }

  // Tap on a prop: walk over to it, then use it (unless interrupted on the way).
  async interact(prop) {
    const girl = this.girl;
    if (girl.mode === 'held') {
      return;
    }
    const arrived = await girl.walkTo(prop.spot.x, prop.spot.y);
    if (arrived) {
      prop.use();
    }
  }

  onTapEmpty(p) {
    const target = clampToFloor(p.x, Math.max(p.y, FLOOR_TOP + 10));
    this.ripple(target.x, target.y);
    this.girl.walkTo(target.x, target.y);
  }

  toast(text, seconds = 2) {
    this.toastMsg = { text, t: 0, life: seconds };
  }

  // ------------------------------------------------------------ particles
  dust(x, y) {
    for (let i = 0; i < 6; i++) {
      const dir = i < 3 ? -1 : 1;
      this.particles.push({
        x: x + dir * 4, y: y - 1, vx: dir * (10 + Math.random() * 20), vy: -6 - Math.random() * 8,
        life: 0.4 + Math.random() * 0.2, age: 0, color: this.dustColor ?? '#8b93b8', size: 2, gravity: 0,
      });
    }
  }

  sparkles(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.particles.push({
        x, y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30 - 10, life: 0.7, age: 0, img: this.assets.sparkle, gravity: 30,
      });
    }
  }

  ripple(x, y) {
    this.particles.push({ x, y, ring: true, life: 0.35, age: 0 });
  }

  update(dt) {
    super.update(dt);
    for (const p of this.particles) {
      p.age += dt;
      if (!p.ring) {
        p.vy += (p.gravity ?? 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
    if (this.toastMsg) {
      this.toastMsg.t += dt;
      if (this.toastMsg.t > this.toastMsg.life) {
        this.toastMsg = null;
      }
    }
  }

  drawParticles(r) {
    for (const p of this.particles) {
      const k = 1 - p.age / p.life;
      if (p.ring) {
        const rad = 2 + (p.age / p.life) * 6;
        r.rect(p.x - rad, p.y, rad * 2, 1, '#e1e6f2', k);
        r.rect(p.x - rad / 2, p.y - 2, rad, 1, '#e1e6f2', k * 0.5);
      } else if (p.note) {
        // A little quaver: head, stem and flag.
        r.rect(p.x, p.y, 2, 2, p.color, k);
        r.rect(p.x + 1, p.y - 4, 1, 4, p.color, k);
        r.rect(p.x + 2, p.y - 4, 1, 1, p.color, k);
      } else if (p.img) {
        r.image(p.img, p.x, p.y, { ay: 0.5, alpha: k });
      } else {
        r.rect(p.x, p.y, p.size, p.size, p.color, k);
      }
    }
  }

  // Banner text, the fade, and anything else that sits above the whole scene.
  drawOverlay(r) {
    const m = this.toastMsg;
    if (m) {
      const alpha = Math.min(1, m.t / 0.15, (m.life - m.t) / 0.3);
      const img = this.assets.text(m.text, '#ffe066', { outline: '#1b1427' });
      r.image(img, W / 2, 8 - (1 - Math.min(1, m.t / 0.15)) * 4, { ay: 0, alpha });
    }
    if (this.fade > 0) {
      r.rect(0, 0, W, H, '#000000', this.fade);
    }
  }
}
