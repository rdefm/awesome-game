import { ease } from '../../engine/tween.js';
import { PARKED_SHIP, WALK } from '../layout.js';
import { Carryable } from './carryable.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Shared squash-on-tap feedback, like the ship's props.
class Thing {
  constructor() {
    this.squash = 0;
  }

  boing(amount = 1) {
    this.squash = amount;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.5, ease.outElastic);
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }
}

// ------------------------------------------------------------- parked ship
export class ParkedShip extends Thing {
  constructor(assets) {
    super();
    this.img = assets.shipOutside.open;
    this.x = PARKED_SHIP.x;
    this.y = PARKED_SHIP.y;
    this.spot = PARKED_SHIP.spot;
    this.depth = 0; // always behind the girl, even as she climbs the ramp
  }

  hitTest(px, py) {
    return px >= this.x - 32 && px <= this.x + 32 && py >= this.y - 44 && py <= this.y + 4;
  }

  onTap() {
    if (this.scene.busy) {
      return;
    }
    this.scene.engine.audio.play('tap');
    this.boing(0.6);
    this.scene.interact(this);
  }

  use() {
    this.scene.boardShip();
  }

  draw(r) {
    r.rect(this.x - 24, this.y - 2, 48, 3, '#000000', 0.18);
    r.image(this.img, this.x, this.y, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ---------------------------------------------------------- giant bluebell
// Tap one and its bells swing and chime. Each flower has its own note, so
// tapping along the row plays a little tune.
export class Bluebell extends Carryable {
  // `state.v` picks both the stem shape and the note it rings.
  constructor(assets, state) {
    super(state);
    this.stem = assets.stems[state.v ?? 0];
    this.bellImg = assets.bell;
    this.note = state.v ?? 0;
    this.ring = 0;
    this.phase = this.x * 0.37;
  }

  get height() {
    return this.stem.img.height;
  }

  hitTest(px, py) {
    return px >= this.x - 8 && px <= this.x + 26 && py >= this.y - this.height - 2 && py <= this.y + 2;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play(`bell${this.note}`);
    this.ring = 1;
    for (const h of this.stem.hang) {
      scene.musicNote(this.x + h.x, this.y + h.y + 6);
    }
    scene.girl.faceToward(this.x);
    scene.girl.say('note', 1);
  }

  update(dt) {
    this.ring = Math.max(0, this.ring - dt * 0.8);
  }

  draw(r) {
    const t = this.scene.engine.time;
    const img = this.stem.img;
    const sway = Math.round(Math.sin(t * 1.4 + this.phase) * 0.6);
    if (this.held || this.falling) {
      this.shadow(r, 14);
    }
    r.image(img, this.x, this.y + 1, { ax: 8 / img.width });
    this.stem.hang.forEach((h, i) => {
      const swing = Math.sin(t * 14 + i * 1.3) * this.ring * 3 + sway;
      r.image(this.bellImg, this.x + h.x + swing, this.y + h.y, { ay: 0 });
    });
  }
}

// ------------------------------------------------------------------ critter
// A puffball that bounces around the meadow in little hops.
export class Critter extends Carryable {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.critter;
    this.facing = 1;
    this.lift = 0;
    this.restIn = 1;
    this.hop = null;
    this.landed = 0;
    this.priority = 5;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 11 && py > this.y - 18 - this.lift && py < this.y + 3;
  }

  onPickUp() {
    this.hop = null;
    this.hopsLeft = 0;
    this.lift = 0;
    this.scene.engine.audio.play('squeak');
  }

  onLand() {
    this.landed = 0.12;
    this.restIn = 1 + Math.random();
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('squeak');
    this.hop = { fromX: this.x, fromY: this.y, toX: this.x, toY: this.y, p: 0, dur: 0.6, height: 20 };
    scene.sparkles(this.x, this.y - 16, 6);
    scene.girl.faceToward(this.x);
    scene.girl.say('heart', 1.2);
  }

  update(dt) {
    if (this.held || this.falling) {
      return;
    }
    if (this.hop) {
      const h = this.hop;
      h.p = Math.min(1, h.p + dt / h.dur);
      this.x = h.fromX + (h.toX - h.fromX) * h.p;
      this.y = h.fromY + (h.toY - h.fromY) * h.p;
      this.lift = Math.sin(Math.PI * h.p) * h.height;
      if (h.p >= 1) {
        this.hop = null;
        this.lift = 0;
        this.landed = 0.12;
        this.hopsLeft = (this.hopsLeft ?? 1) - 1;
        this.restIn = this.hopsLeft > 0 ? 0.12 : 1.5 + Math.random() * 3;
        if (this.hopsLeft <= 0) {
          this.scene.settle(this); // remember where it wandered to
        }
      }
      return;
    }
    this.landed = Math.max(0, this.landed - dt);
    this.restIn -= dt;
    if (this.restIn <= 0) {
      // Where it likes to roam (the meadow keeps it away from the ship).
      const { minX, maxX } = this.scene.roam ?? WALK;
      if (!(this.hopsLeft > 0)) {
        // Pick a new direction and a few hops to go that way.
        this.hopsLeft = 2 + Math.floor(Math.random() * 4);
        this.dir = Math.random() < 0.5 ? -1 : 1;
        if (this.x < minX + 8 || this.x > maxX - 8) {
          this.dir = this.x < minX + 8 ? 1 : -1;
        }
        this.dy = (Math.random() - 0.5) * 6;
      }
      this.facing = this.dir;
      // If she's put it down outside its patch, it hops back a step at a time.
      this.hop = {
        fromX: this.x, fromY: this.y,
        toX: clamp(this.x + this.dir * 12, Math.min(minX, this.x), Math.max(maxX, this.x)),
        toY: clamp(this.y + this.dy, 124, 154),
        p: 0, dur: 0.32, height: 5,
      };
    }
  }

  draw(r) {
    const frame = this.held || this.lift > 1 ? 'jump' : this.landed > 0 ? 'squish' : 'idle';
    this.shadow(r, 10);
    r.image(this.imgs[frame], this.x, this.y + 1 - this.lift, {
      flipX: this.facing < 0, scaleX: this.bounce, scaleY: 2 - this.bounce,
    });
  }
}

// ---------------------------------------------------------------- butterfly
export class Butterfly {
  constructor(assets, i) {
    this.imgs = assets.butterflies[i % assets.butterflies.length];
    this.x = 100 + i * 50;
    this.y = 80 + i * 12;
    this.depth = 500;
    this.speed = 18;
    this.flap = Math.random();
    this.pickTarget();
  }

  pickTarget() {
    this.target = { x: 80 + Math.random() * 170, y: 64 + Math.random() * 64 };
  }

  hitTest(px, py) {
    return Math.hypot(px - this.x, py - this.y) < 10;
  }

  onTap() {
    this.scene.engine.audio.play('flutter');
    this.target = { x: this.x + (Math.random() - 0.5) * 60, y: 20 + Math.random() * 20 };
    this.speed = 60;
    this.scene.sparkles(this.x, this.y, 4);
  }

  update(dt) {
    this.flap += dt;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) {
      this.speed = 18;
      this.pickTarget();
      return;
    }
    this.x += (dx / d) * this.speed * dt;
    this.y += (dy / d) * this.speed * dt + Math.sin(this.flap * 9) * 0.5;
  }

  draw(r) {
    r.image(this.imgs[Math.floor(this.flap * 10) % 2], this.x, this.y, { ay: 0.5 });
  }
}

// ---------------------------------------------------------- friendly local
export class Local extends Carryable {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.local;
    this.reach = 24;
    this.frame = 'idle';
    this.lift = 0;
    this.blinkIn = 2;
    this.busy = false;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 12 && py > this.y - 24 - this.lift && py < this.y + 2;
  }

  onTap() {
    if (this.busy) {
      return;
    }
    this.scene.engine.audio.play('tap');
    this.boing(0.8);
    this.frame = 'wave1';
    this.scene.interact(this);
  }

  onPickUp() {
    this.frame = 'hop';
    this.scene.engine.audio.play('giggle');
  }

  onLand() {
    if (!this.busy) {
      this.frame = 'idle';
    }
  }

  // Say hello: they wave at each other, then it does a happy hop.
  async use() {
    if (this.busy) {
      return;
    }
    this.busy = true;
    const { engine, girl } = this.scene;
    girl.faceToward(this.x);
    engine.audio.play('boop');
    girl.act('wave', 1.6);
    for (let i = 0; i < 8; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      await engine.wait(0.2);
    }
    this.frame = 'hop';
    engine.audio.play('giggle');
    await engine.tweens.to(this, { lift: 12 }, 0.18, ease.outQuad);
    this.scene.sparkles(this.x, this.y - 22, 8);
    await engine.tweens.to(this, { lift: 0 }, 0.22, ease.inQuad);
    this.frame = 'idle';
    girl.say('heart');
    this.busy = false;
  }

  update(dt) {
    if (this.frame !== 'idle' && this.frame !== 'blink') {
      return;
    }
    this.blinkIn -= dt;
    this.frame = this.blinkIn < 0 ? 'blink' : 'idle';
    if (this.blinkIn < -0.15) {
      this.blinkIn = 2 + Math.random() * 3;
    }
  }

  draw(r) {
    const bob = this.frame === 'idle' ? Math.round(Math.sin(this.scene.engine.time * 3) * 0.6) : 0;
    this.shadow(r, 12);
    r.image(this.imgs[this.frame], this.x, this.y + 1 - this.lift + bob, {
      scaleX: this.bounce, scaleY: 2 - this.bounce,
    });
  }
}
