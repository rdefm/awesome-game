import { ease } from '../../engine/tween.js';
import { MS } from '../art/milkshakeLake.js';
import { CHERRIES, STRAW, WAFER_BOAT } from '../layout.js';

// The things in the milkshake lake on Candy. They're out in the lake, so
// she can't pick them up, but they all do something when tapped.

// ------------------------------------------------------------------- straw
// A giant stripy straw stuck in the lake. Tap it and she walks over to it
// for a long slurp: blobs of milkshake whizz up it and she's delighted.
export class Straw {
  constructor(assets) {
    this.img = assets.straw;
    this.x = STRAW.x;
    this.y = STRAW.y;
    this.spot = STRAW.spot;
    this.squash = 0;
    this.sips = []; // blobs of milkshake on their way up, 0..1
    this.slurping = false;
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }

  hitTest(px, py) {
    return px >= this.x - 6 && px <= this.x + 14 && py >= this.y - 46 && py <= this.y + 3;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tap');
    this.squash = 0.8;
    scene.engine.tweens.to(this, { squash: 0 }, 0.4, ease.outElastic);
    if (!this.slurping && !scene.busy) {
      scene.interact(this);
    }
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    this.slurping = true;
    girl.faceToward(this.x);
    girl.act('reach', 1.4);
    for (let i = 0; i < 4; i++) {
      engine.audio.play('slurp');
      this.sips.push({ t: 0 });
      await engine.wait(0.3);
    }
    await engine.wait(0.4);
    girl.say('heart', 1.4);
    scene.hearts(girl.x, girl.headTop - 2, 3);
    girl.act('cheer', 0.8);
    this.slurping = false;
  }

  update(dt) {
    for (const sip of this.sips) {
      sip.t += dt * 1.6;
    }
    this.sips = this.sips.filter((sip) => sip.t < 1);
  }

  draw(r) {
    r.image(this.img, this.x, this.y, { ax: 0.3, scaleX: this.bounce, scaleY: 2 - this.bounce });
    // Milkshake whizzing up the straw (it leans right as it goes up).
    for (const sip of this.sips) {
      const up = sip.t * 34;
      r.rect(this.x - 2 + up / 9, this.y - 2 - up, 2, 2, MS.shake);
    }
  }
}

// ------------------------------------------------------------------ cherry
// A cherry bobbing about in the lake. Tap it and it ducks right under with
// a plop and a splash, then pops back up again.
export class Cherry {
  // `i` picks which of CHERRIES it is.
  constructor(assets, i) {
    this.imgs = assets.cherry;
    this.home = CHERRIES[i];
    this.x = this.home.x;
    this.y = this.home.y;
    this.phase = i * 2.1;
    this.dunk = 0; // how far under it's gone, 0..1
    this.busy = false;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 10 && py > this.y - 16 && py < this.y + 4;
  }

  async onTap() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.busy || scene.busy) {
      return;
    }
    this.busy = true;
    girl.faceToward(this.x);
    engine.audio.play('plop');
    scene.bits(this.x, this.y - 2, 6, MS.shakeLight);
    await engine.tweens.to(this, { dunk: 1 }, 0.2, ease.inQuad);
    await engine.wait(0.4);
    engine.audio.play('pop');
    girl.say('star', 1);
    await engine.tweens.to(this, { dunk: 0 }, 0.45, ease.outBack);
    scene.sparkles(this.x, this.y - 8, 4);
    this.busy = false;
  }

  update() {
    const t = this.scene.engine.time;
    this.x = this.home.x + Math.sin(t * 0.5 + this.phase) * 4;
    this.y = this.home.y + Math.sin(t * 1.3 + this.phase) * 0.8;
  }

  draw(r) {
    // Sat in the milkshake up to its middle, or ducked right under by
    // `dunk`: only the rows above the surface show.
    const rows = Math.round((this.imgs.length - 5) * (1 - this.dunk));
    if (rows > 0) {
      r.image(this.imgs[rows], this.x, this.y);
    }
    r.rect(this.x - 6, this.y, 12, 1, MS.shakeLight, 0.8); // the ripple round it
  }
}

// -------------------------------------------------------------- wafer boat
// A wafer boat with an umbrella sail, sailing up and down the lake. Tap it
// and it toots, rocks, and puts on a burst of speed.
export class WaferBoat {
  constructor(assets) {
    this.img = assets.waferBoat;
    this.x = WAFER_BOAT.minX + 30;
    this.y = WAFER_BOAT.y;
    this.dir = 1;
    this.speed = 8;
    this.rock = 0;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 16 && py > this.y - 24 && py < this.y + 3;
  }

  onTap() {
    const { scene } = this;
    const { engine, girl } = scene;
    engine.audio.play('toot');
    this.rock = 1;
    this.speed = 40;
    scene.bits(this.x - this.dir * 12, this.y - 2, 5, MS.cream);
    girl.faceToward(this.x);
    girl.say('heart', 1);
  }

  update(dt) {
    this.x += this.dir * this.speed * dt;
    if (this.x > WAFER_BOAT.maxX || this.x < WAFER_BOAT.minX) {
      this.x = Math.max(WAFER_BOAT.minX, Math.min(WAFER_BOAT.maxX, this.x));
      this.dir = -this.dir;
    }
    this.speed += (8 - this.speed) * Math.min(1, dt * 0.8);
    this.rock = Math.max(0, this.rock - dt * 0.7);
  }

  draw(r) {
    const t = this.scene.engine.time;
    const tilt = Math.sin(t * 2) * 0.03 + Math.sin(t * 14) * this.rock * 0.12;
    const bob = Math.round(Math.sin(t * 1.7));
    r.image(this.img, this.x, this.y + 1 + bob, { flipX: this.dir < 0, scaleX: 1 + tilt, scaleY: 1 - tilt });
    r.rect(this.x - 14, this.y + 1, 28, 1, MS.shakeLight, 0.7);
  }
}
