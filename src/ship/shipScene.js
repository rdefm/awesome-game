import { Scene } from '../engine/scene.js';
import { ease } from '../engine/tween.js';
import { PLANETS } from './art/props.js';
import { Girl, clampToFloor } from './entities/girl.js';
import { Chair, ConsoleScreen, Plant, Porthole, Poster } from './entities/props.js';
import { FLOOR_TOP, PLANET_SPOT, W, H } from './layout.js';
import { PlanetMap } from './planetMap.js';
import { loadSave, writeSave } from './save.js';
import { Starfield } from './starfield.js';

// The spaceship interior: one room, one hero, a handful of things to poke.
export class ShipScene extends Scene {
  constructor(assets) {
    super();
    this.assets = assets;
    this.stars = new Starfield();
    this.particles = [];
    this.shake = 0;
    this.alert = false;
    this.warpTint = 0;
    this.busy = false; // true during a ship-wide event (blast-off, travel)
    this.planetSlide = 0;

    const save = loadSave();
    this.planetIndex = Number.isInteger(save.planet) && PLANETS[save.planet] ? save.planet : 0;
    const start = clampToFloor(save.x ?? 96, save.y ?? 136);

    this.porthole = this.add(new Porthole(assets));
    this.poster = this.add(new Poster(assets));
    this.screen = this.add(new ConsoleScreen(assets));
    this.chair = this.add(new Chair(assets));
    this.plant = this.add(new Plant(assets));
    this.girl = this.add(new Girl(assets, start.x, start.y));
    this.map = new PlanetMap(this, assets);
  }

  get planet() {
    return PLANETS[this.planetIndex];
  }

  persist() {
    writeSave({ x: Math.round(this.girl.x), y: Math.round(this.girl.y), planet: this.planetIndex });
  }

  // Tap on a prop: walk over to it, then use it (unless interrupted on the way).
  async interact(prop) {
    const girl = this.girl;
    if (girl.mode === 'held') {
      return;
    }
    if (prop === this.chair && girl.mode === 'seated') {
      prop.use();
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

  openMap() {
    if (!this.busy && !this.modal) {
      this.map.open();
    }
  }

  async blastOff() {
    if (this.busy) {
      this.girl.say('question', 0.8);
      return;
    }
    this.busy = true;
    const { engine, girl, screen, poster } = this;
    const tw = engine.tweens;
    girl.say('bang', 1);
    for (const n of [3, 2, 1]) {
      screen.countdown = n;
      engine.audio.play('beep');
      await engine.wait(0.65);
    }
    screen.countdown = 'GO';
    engine.audio.play('go');
    engine.audio.play('blast');
    this.alert = true;
    poster.flicker = true;
    girl.act('surprised', 0.7).then(() => girl.act('cheer', 1.8));
    tw.to(this, { shake: 2.5 }, 0.6, ease.inQuad);
    await tw.to(this.stars, { warp: 70 }, 1.2, ease.inCubic);
    await engine.wait(1.2);
    screen.countdown = null;
    engine.audio.play('settle');
    tw.to(this, { shake: 0 }, 1.3, ease.outQuad);
    await tw.to(this.stars, { warp: 1 }, 1.5, ease.outCubic);
    this.alert = false;
    poster.flicker = false;
    girl.say('star');
    this.busy = false;
  }

  async travelTo(index) {
    const { engine, girl } = this;
    const tw = engine.tweens;
    if (index === this.planetIndex) {
      girl.say('heart');
      return;
    }
    this.busy = true;
    engine.audio.play('warp');
    girl.say('bang', 1);
    girl.act('cheer', 2.4);
    tw.to(this, { warpTint: 1 }, 0.8);
    tw.to(this, { shake: 1 }, 0.6);
    tw.to(this.stars, { warp: 45 }, 1, ease.inCubic);
    await tw.to(this, { planetSlide: -1 }, 1, ease.inCubic);
    this.planetIndex = index;
    this.persist();
    this.planetSlide = 1;
    await engine.wait(0.5);
    engine.audio.play('arrive');
    tw.to(this, { warpTint: 0 }, 1);
    tw.to(this, { shake: 0 }, 0.8);
    tw.to(this.stars, { warp: 1 }, 1.4, ease.outCubic);
    await tw.to(this, { planetSlide: 0 }, 1.4, ease.outCubic);
    girl.say('heart');
    this.busy = false;
  }

  // ------------------------------------------------------------ particles
  dust(x, y) {
    for (let i = 0; i < 6; i++) {
      const dir = i < 3 ? -1 : 1;
      this.particles.push({
        x: x + dir * 4, y: y - 1, vx: dir * (10 + Math.random() * 20), vy: -6 - Math.random() * 8,
        life: 0.4 + Math.random() * 0.2, age: 0, color: '#8b93b8', size: 2, gravity: 0,
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
    this.stars.update(dt);
    for (const p of this.particles) {
      p.age += dt;
      if (!p.ring) {
        p.vy += (p.gravity ?? 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
  }

  draw(r) {
    const t = this.engine.time;
    r.offsetX = this.shake ? Math.round((Math.random() - 0.5) * 2 * this.shake) : 0;
    r.offsetY = this.shake ? Math.round((Math.random() - 0.5) * 2 * this.shake) : 0;

    // Layer 1: outer space, seen through the window holes in the room.
    r.image(this.assets.space, 0, 0, { ax: 0, ay: 0 });
    this.stars.draw(r);
    const px = PLANET_SPOT.x + this.planetSlide * 130;
    const py = PLANET_SPOT.y + Math.sin(t * 0.5) * 1.5;
    r.image(this.assets.planetsBig[this.planetIndex], px, py, { ay: 0.5 });
    this.porthole.drawBehind(r);

    // Layer 2: the room itself, then props and the girl, depth-sorted.
    r.image(this.assets.room, 0, 0, { ax: 0, ay: 0 });
    this.drawEntities(r);
    for (const e of this.entities) {
      e.drawOver?.(r);
    }

    for (const p of this.particles) {
      const k = 1 - p.age / p.life;
      if (p.ring) {
        const rad = 2 + (p.age / p.life) * 6;
        r.rect(p.x - rad, p.y, rad * 2, 1, '#e1e6f2', k);
        r.rect(p.x - rad / 2, p.y - 2, rad, 1, '#e1e6f2', k * 0.5);
      } else if (p.img) {
        r.image(p.img, p.x, p.y, { ay: 0.5, alpha: k });
      } else {
        r.rect(p.x, p.y, p.size, p.size, p.color, k);
      }
    }

    // Ship-wide lighting moods.
    if (this.alert) {
      r.rect(-4, -4, W + 8, H + 8, '#ff2040', 0.12 + 0.1 * Math.sin(t * 10));
    }
    if (this.warpTint > 0) {
      r.rect(-4, -4, W + 8, H + 8, '#4060ff', 0.18 * this.warpTint);
    }

    r.offsetX = 0;
    r.offsetY = 0;
    this.modal?.draw(r);
  }
}
