import { ease } from '../../engine/tween.js';
import { BIKE_SIZE } from '../art/hoverbike.js';
import { clampToFloor } from './girl.js';

const HOVER = 6; // how high it floats with her on it

// The hoverbike, parked at `at` (bottom-centre, from HOVERBIKE). Tap it and
// she walks over and hops on, and the town map slides up (see OutdoorScene).
// While she's on it, it draws her sat on the seat.
export class Hoverbike {
  constructor(assets, at) {
    this.imgs = assets.hoverbike;
    this.x = at.x;
    this.y = at.y;
    this.parked = { ...at };
    this.spot = clampToFloor(at.x - 22, at.y + 1); // where she climbs on, just behind it
    this.lift = 0; // how high it's floating
    this.squash = 0;
    this.rider = null;
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }

  get floating() {
    return this.lift + (this.rider ? Math.sin(this.scene.engine.time * 4) * 1 : 0);
  }

  hitTest(px, py) {
    const top = this.y - this.lift - BIKE_SIZE.h - 4;
    return px >= this.x - BIKE_SIZE.w / 2 - 3 && px <= this.x + BIKE_SIZE.w / 2 + 3 && py >= top && py <= this.y + 4;
  }

  onTap() {
    const { scene } = this;
    if (scene.busy || this.rider) {
      return;
    }
    scene.engine.audio.play('tap');
    this.wobble();
    scene.interact(this);
  }

  use() {
    this.scene.rideBike();
  }

  wobble() {
    this.squash = 0.6;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.5, ease.outElastic);
  }

  // She hops up onto the seat and it hums up off the ground.
  async mount(girl) {
    const { engine } = this.scene;
    girl.cancelWalk();
    girl.facing = 1;
    await girl.hop(6);
    this.rider = girl;
    girl.riding = this;
    this.wobble();
    engine.audio.play('hoverUp');
    await engine.tweens.to(this, { lift: HOVER }, 0.4, ease.outBack);
  }

  // It settles back down and she hops off, just behind it.
  async dismount(girl) {
    const { engine } = this.scene;
    engine.audio.play('hoverDown');
    await engine.tweens.to(this, { lift: 0 }, 0.35, ease.inQuad);
    this.wobble();
    this.rider = null;
    girl.riding = null;
    Object.assign(girl, { x: this.spot.x, y: this.spot.y, lift: 0, facing: 1 });
    this.scene.dust(this.x, this.y);
    await girl.hop(6);
  }

  // Ridden in from off the top left, swooping down to park.
  async flyIn(girl) {
    const { engine } = this.scene;
    this.rider = girl;
    girl.riding = this;
    this.x = -40;
    this.lift = 50;
    engine.audio.play('whoosh');
    await engine.tweens.to(this, { x: this.parked.x, lift: HOVER }, 1, ease.outCubic);
  }

  update() {
    if (this.rider) {
      // She goes where the bike goes (for her bubbles, and for where she
      // ends up if she's carried off it).
      this.rider.x = this.x;
      this.rider.y = this.y;
      this.rider.lift = this.floating + BIKE_SIZE.seat;
    }
  }

  draw(r) {
    const t = this.scene.engine.time;
    const y = this.y - this.floating;
    const shadow = Math.max(10, 26 - this.lift / 3);
    r.rect(this.x - shadow / 2, this.y - 1, shadow, 2, '#000000', 0.22);
    if (this.rider) {
      r.image(this.rider.frames.sit, this.x - 2, y - BIKE_SIZE.seat + 3, { alpha: this.rider.alpha });
    }
    const glow = this.rider ? Math.floor(t * 10) % 2 : 0;
    r.image(this.imgs[glow], this.x, y, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}
