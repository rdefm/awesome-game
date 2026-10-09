import { ease } from '../engine/tween.js';
import { drawBackdrop, drawWeather } from './backdrop.js';
import { PARKED_SHIP, W, H } from './layout.js';

const START_Y = -10;

// Outside view of the little ship lowering itself onto the planet (shown by
// its `backdrop`, see backdrop.js), played as a full-screen modal over the
// ship interior.
export class LandingCutscene {
  constructor(scene, backdrop, assets) {
    this.scene = scene;
    this.backdrop = backdrop;
    this.assets = assets;
    this.shipY = START_Y;
    this.squash = 0;
    this.thrust = true;
    this.puffs = [];
  }

  async play() {
    const { engine } = this.scene;
    const tw = engine.tweens;
    engine.audio.play('descend');
    await tw.to(this, { shipY: PARKED_SHIP.y }, 2.6, ease.outCubic);
    this.thrust = false;
    engine.audio.play('thud');
    this.squash = 1;
    engine.music.sting('landed');
    for (let i = 0; i < 14; i++) {
      const dir = i % 2 ? 1 : -1;
      this.puffs.push({
        x: PARKED_SHIP.x + dir * (6 + Math.random() * 16), y: PARKED_SHIP.y - 1,
        vx: dir * (20 + Math.random() * 40), vy: -4 - Math.random() * 10, age: 0, life: 0.6 + Math.random() * 0.5,
      });
    }
    await tw.to(this, { squash: 0 }, 0.6, ease.outElastic);
    await engine.wait(0.9);
  }

  update(dt) {
    for (const p of this.puffs) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - dt * 2.5;
    }
    this.puffs = this.puffs.filter((p) => p.age < p.life);
  }

  draw(r) {
    const a = this.assets;
    const t = this.scene.engine.time;
    drawBackdrop(r, this.backdrop, t);
    // Shadow on the ground grows and darkens as the ship gets close.
    const near = Math.max(0, Math.min(1, (this.shipY - START_Y) / (PARKED_SHIP.y - START_Y)));
    const sw = 14 + near * 30;
    r.rect(PARKED_SHIP.x - sw / 2, PARKED_SHIP.y - 2, sw, 3, '#000000', 0.1 + near * 0.2);
    const jiggle = this.thrust ? Math.round(Math.sin(t * 40) * 0.6) : 0;
    if (this.thrust) {
      const flame = a.flame[Math.floor(t * 16) % 2];
      r.image(flame, PARKED_SHIP.x + 1 + jiggle, this.shipY - 12, { ay: 0 });
      // Downwash kicking up dust once the ship is low.
      if (near > 0.6 && Math.random() < 0.6) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        this.puffs.push({ x: PARKED_SHIP.x + 1, y: PARKED_SHIP.y - 1, vx: dir * (30 + Math.random() * 30), vy: -3, age: 0, life: 0.5 });
      }
    }
    const sx = 1 + this.squash * 0.1;
    r.image(a.shipOutside.closed, PARKED_SHIP.x + jiggle, this.shipY, { scaleX: sx, scaleY: 2 - sx });
    for (const p of this.puffs) {
      r.rect(p.x, p.y, 3, 2, this.backdrop.puff, 1 - p.age / p.life);
    }
    drawWeather(r, this.backdrop, t);
    r.rect(0, 0, W, 10, '#000000');
    r.rect(0, H - 10, W, 10, '#000000');
  }
}
