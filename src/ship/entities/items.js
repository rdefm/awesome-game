import { Carryable } from './carryable.js';
import { clampToFloor } from './girl.js';

// ---------------------------------------------------------------- bouncy ball
// Tap it and it bounces away from her across the floor: a big bounce, then a
// little one. [share of the distance, height, seconds]
const BOUNCES = [[0.65, 16, 0.5], [0.35, 6, 0.3]];

export class Ball extends Carryable {
  constructor(assets, state) {
    super(state);
    this.img = assets.ball;
    this.lift = 0;
    this.spin = 0;
    this.roll = null;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 10 && py > this.y - 14 - this.lift && py < this.y + 3;
  }

  onTap() {
    if (this.roll) {
      return;
    }
    const { engine, girl } = this.scene;
    const dir = girl.x < this.x ? 1 : -1;
    const to = clampToFloor(this.x + dir * (30 + Math.random() * 20), this.y + (Math.random() - 0.5) * 10);
    this.roll = { dir, dx: to.x - this.x, dy: to.y - this.y, sx: this.x, sy: this.y, bounce: 0, p: 0 };
    engine.audio.play('boing');
    girl.faceToward(this.x);
    girl.say('star', 1);
  }

  onPickUp() {
    this.roll = null;
    this.lift = 0;
  }

  update(dt) {
    const roll = this.roll;
    if (!roll || this.held || this.falling) {
      return;
    }
    const [share, height, dur] = BOUNCES[roll.bounce];
    roll.p = Math.min(1, roll.p + dt / dur);
    this.x = roll.sx + roll.dx * share * roll.p;
    this.y = roll.sy + roll.dy * share * roll.p;
    this.lift = Math.sin(Math.PI * roll.p) * height;
    this.spin += roll.dir * dt * 12;
    if (roll.p < 1) {
      return;
    }
    this.boing(0.6);
    roll.bounce += 1;
    roll.p = 0;
    roll.sx = this.x;
    roll.sy = this.y;
    if (roll.bounce < BOUNCES.length) {
      this.scene.engine.audio.play('boing');
    } else {
      this.roll = null;
      this.lift = 0;
      this.scene.settle(this);
    }
  }

  draw(r) {
    this.shadow(r, 10 - Math.min(4, this.lift / 4));
    r.image(this.img, this.x, this.y + 1 - this.lift, {
      flipX: Math.floor(this.spin) % 2 !== 0, scaleX: this.bounce, scaleY: 2 - this.bounce,
    });
  }
}

// ---------------------------------------------------------------- teddy bear
// She walks over and gives it a big squeezy cuddle.
export class Teddy extends Carryable {
  constructor(assets, state) {
    super(state);
    this.img = assets.teddy;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 10 && py > this.y - 18 && py < this.y + 3;
  }

  async use() {
    const { engine, girl } = this.scene;
    girl.faceToward(this.x);
    engine.audio.play('squeak');
    this.boing(1.6);
    this.scene.sparkles(this.x, this.y - 10, 5);
    girl.say('heart');
    await girl.act('cheer', 0.9);
  }

  draw(r) {
    this.shadow(r, 10);
    r.image(this.img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ---------------------------------------------------------------- crystal
// Glows and chimes when tapped.
export class Crystal extends Carryable {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.crystal;
    this.glow = 0;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 10 && py > this.y - 18 && py < this.y + 3;
  }

  onTap() {
    const { engine, girl } = this.scene;
    engine.audio.play('chime');
    this.boing(1.2);
    this.glow = 2;
    this.scene.sparkles(this.x, this.y - 10, 7);
    girl.faceToward(this.x);
    girl.say('star', 1.2);
  }

  update(dt) {
    this.glow = Math.max(0, this.glow - dt);
  }

  draw(r) {
    const t = this.scene.engine.time;
    this.shadow(r, 12);
    const lit = this.glow > 0 && Math.floor(this.glow * 8) % 3 !== 0;
    r.image(this.imgs[lit ? 1 : 0], this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
    // A slow twinkle so it looks precious even when nobody's touching it.
    if ((t * 0.7 + this.x * 0.1) % 3 < 0.25) {
      r.pixel(this.x + 1, this.y - 13, '#ffffff');
    }
  }
}
