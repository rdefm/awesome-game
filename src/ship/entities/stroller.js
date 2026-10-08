import { ease } from '../../engine/tween.js';
import { WALK } from '../layout.js';
import { Carryable } from './carryable.js';
import { hold, letGo } from './friends.js';
import { clampToFloor } from './girl.js';
import { feed } from './items.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// A friend who strolls about on its own (the yetis, Ginger, the gummy bear):
// it wanders its patch, blinks, gobbles snacks and sits in the pilot chair.
// `imgs` holds its frames: idle, blink, wave1, wave2, hop, walk. Each kind
// adds its own tap fun and things it loves.
export class Stroller extends Carryable {
  constructor(state, imgs, { speed, wander, width, height }) {
    super(state);
    this.imgs = imgs;
    this.speed = speed;
    this.wander = wander; // how far it strolls off at a time
    this.width = width;
    this.height = height;
    this.frame = 'idle';
    this.facing = -1;
    this.lift = 0;
    this.blinkIn = 2;
    this.restIn = 2 + Math.random() * 2;
    this.walk = null; // { x, y, steps } while strolling somewhere
    this.busy = false;
    this.priority = 5;
  }

  hitTest(px, py) {
    const y = this.y - this.perch;
    return Math.abs(px - this.x) < this.width / 2 && py > y - this.height - this.lift && py < y + 3;
  }

  get free() {
    return !this.busy && !this.held && !this.falling && !this.seat;
  }

  // The top of its head, where its chat lines go.
  get headTop() {
    return this.y - this.perch - this.height - this.lift;
  }

  onPickUp() {
    this.stayPut();
    this.frame = 'hop';
  }

  onLand() {
    if (!this.busy) {
      this.frame = 'idle';
    }
  }

  // Stops wherever it is (cutting short a stroll).
  stayPut() {
    this.walk = null;
    this.lift = 0;
  }

  pose(frame) {
    this.frame = frame;
  }

  // A happy little hop on the spot (a tap, say), back to idle afterwards.
  hopUp(height) {
    this.stayPut();
    this.frame = 'hop';
    const { tweens } = this.scene.engine;
    tweens.to(this, { lift: height }, 0.15, ease.outQuad).then(() => tweens.to(this, { lift: 0 }, 0.2, ease.inQuad)).then(() => {
      if (this.frame === 'hop' && !this.busy && !this.held) {
        this.frame = 'idle';
      }
    });
  }

  // A little hop of a chew with every bite.
  munch() {
    const { tweens } = this.scene.engine;
    tweens.to(this, { lift: 3 }, 0.1, ease.outQuad).then(() => tweens.to(this, { lift: 0 }, 0.12, ease.inQuad));
  }

  async eat(snack) {
    hold(this);
    await feed(this, snack);
    letGo(this);
  }

  // Where to stroll to next: somewhere nearby in its patch (the planet keeps
  // it clear of the ship).
  nextStroll() {
    const { minX, maxX } = this.scene.roam ?? WALK;
    return clampToFloor(clamp(this.x + (Math.random() - 0.5) * this.wander, minX, maxX), this.y + (Math.random() - 0.5) * 16);
  }

  update(dt) {
    if (this.held || this.falling || this.busy || this.seat) {
      return;
    }
    if (this.walk) {
      this.stroll(dt);
      return;
    }
    if (this.frame === 'idle' || this.frame === 'blink') {
      this.blinkIn -= dt;
      this.frame = this.blinkIn < 0 ? 'blink' : 'idle';
      if (this.blinkIn < -0.15) {
        this.blinkIn = 2 + Math.random() * 3;
      }
    }
    this.restIn -= dt;
    if (this.restIn <= 0) {
      const to = this.nextStroll();
      this.walk = { x: to.x, y: to.y, steps: 0 };
    }
  }

  // A step of a stroll: feet going, until it's there.
  stroll(dt) {
    const w = this.walk;
    const dx = w.x - this.x;
    const dy = w.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) {
      this.walk = null;
      this.frame = 'idle';
      this.restIn = 2 + Math.random() * 3;
      this.scene.settle(this); // remember where it wandered to
      return;
    }
    const step = Math.min(d, this.speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.facing = dx < 0 ? -1 : 1;
    w.steps += dt;
    this.frame = Math.floor(w.steps * 6) % 2 ? 'walk' : 'idle';
  }

  // How it looks sitting in the pilot chair (which draws it, so it spins too).
  seatFrame() {
    return this.imgs[this.frame];
  }

  draw(r) {
    if (this.seat) {
      return;
    }
    this.shadow(r, this.width);
    r.image(this.imgs[this.frame], this.x, this.y + 1 - this.lift, {
      flipX: this.facing < 0, scaleX: this.bounce * this.twirl, scaleY: 2 - this.bounce,
    });
  }
}
