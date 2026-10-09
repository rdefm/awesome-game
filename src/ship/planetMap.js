import { ease } from '../engine/tween.js';
import { PLANETS } from './art/props.js';

const PANEL = { x: 24, y: 14, w: 208, h: 132 };
const SPOTS = [
  { x: 52, y: 64 },
  { x: 86, y: 108 },
  { x: 118, y: 58 },
  { x: 152, y: 106 },
  { x: 184, y: 62 },
  { x: 208, y: 106 },
];
const CLOSE = { x: PANEL.x + PANEL.w - 13, y: PANEL.y + 4, s: 9 };

// The holographic star map that opens from the cockpit screen. While open it
// is the scene's modal, so it gets every tap.
export class PlanetMap {
  constructor(scene, assets) {
    this.scene = scene;
    this.assets = assets;
    this.show = 0;
    this.closing = false;
  }

  async open() {
    this.closing = false;
    this.scene.modal = this;
    this.scene.engine.audio.play('open');
    await this.scene.engine.tweens.to(this, { show: 1 }, 0.3, ease.outBack);
  }

  async close() {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.scene.engine.audio.play('close');
    await this.scene.engine.tweens.to(this, { show: 0 }, 0.18, ease.inQuad);
    this.scene.modal = null;
  }

  pointerDown(p) {
    this.downAt = p;
  }

  async pointerUp(p) {
    if (this.closing || this.show < 0.9) {
      return;
    }
    const picked = SPOTS.findIndex((s) => Math.hypot(p.x - s.x, p.y - s.y) < 16);
    if (picked >= 0) {
      this.scene.engine.audio.play('select');
      this.selected = picked;
      await this.scene.engine.wait(0.2);
      this.selected = null;
      await this.close();
      this.scene.travelTo(picked);
      return;
    }
    const inPanel = p.x >= PANEL.x && p.x <= PANEL.x + PANEL.w && p.y >= PANEL.y && p.y <= PANEL.y + PANEL.h;
    const onClose = Math.abs(p.x - (CLOSE.x + 4)) < 14 && Math.abs(p.y - (CLOSE.y + 4)) < 14;
    if (onClose || !inPanel) {
      this.close();
    }
  }

  draw(r) {
    if (this.show <= 0) {
      return;
    }
    const t = this.scene.engine.time;
    const s = this.show;
    r.rect(0, 0, 256, 160, '#05050f', 0.55 * Math.min(1, s));
    // The panel unfolds from its centre line.
    const h = Math.max(2, PANEL.h * s);
    const top = PANEL.y + (PANEL.h - h) / 2;
    r.rect(PANEL.x, top, PANEL.w, h, '#0b2730', 0.92);
    r.rect(PANEL.x, top, PANEL.w, 1, '#3fd0c9');
    r.rect(PANEL.x, top + h - 1, PANEL.w, 1, '#3fd0c9');
    r.rect(PANEL.x, top, 1, h, '#3fd0c9');
    r.rect(PANEL.x + PANEL.w - 1, top, 1, h, '#3fd0c9');
    if (s < 0.9) {
      return;
    }
    // Holo grid.
    for (let gx = PANEL.x + 8; gx < PANEL.x + PANEL.w; gx += 12) {
      for (let gy = PANEL.y + 18; gy < PANEL.y + PANEL.h - 2; gy += 12) {
        r.pixel(gx, gy, '#1f8a90', 0.6);
      }
    }
    // Moving scanline.
    r.rect(PANEL.x + 1, PANEL.y + 1 + ((t * 30) % (PANEL.h - 2)), PANEL.w - 2, 1, '#3fd0c9', 0.15);
    r.image(this.assets.text('STAR MAP', '#3fd0c9', { scale: 2 }), PANEL.x + 8, PANEL.y + 5, { ax: 0, ay: 0 });
    r.image(this.assets.text('TAP A PLANET TO FLY THERE!', '#7cf28a'), PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h - 4, { ay: 1 });
    // Close button.
    r.rect(CLOSE.x, CLOSE.y, CLOSE.s, CLOSE.s, '#b8323f');
    r.image(this.assets.text('X', '#ffffff'), CLOSE.x + 5, CLOSE.y + 7, { ay: 1 });
    // Dotted flight lanes between planets.
    for (let i = 0; i < SPOTS.length - 1; i++) {
      const a = SPOTS[i];
      const b = SPOTS[i + 1];
      const n = Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 4);
      for (let k = 1; k < n; k++) {
        if ((k + Math.floor(t * 6)) % 3 === 0) {
          r.pixel(a.x + ((b.x - a.x) * k) / n, a.y + ((b.y - a.y) * k) / n, '#3fd0c9', 0.7);
        }
      }
    }
    SPOTS.forEach((spot, i) => {
      const bob = Math.sin(t * 2 + i) * 1.2;
      const big = this.selected === i ? 1.3 : 1;
      r.image(this.assets.planetsSmall[i], spot.x, spot.y + bob, { ay: 0.5, scaleX: big, scaleY: big });
      r.image(this.assets.text(PLANETS[i].name, '#e1e6f2', { outline: '#0b2730' }), spot.x, spot.y + 19, { ay: 1 });
      if (i === this.scene.planetIndex) {
        const blink = Math.floor(t * 3) % 2;
        r.image(this.assets.shipIcon, spot.x - 14 - blink, spot.y - 12 + bob, { ay: 0.5 });
        r.image(this.assets.text('HERE', '#ffe066'), spot.x - 14, spot.y - 19, { ay: 1 });
      }
    });
  }
}
