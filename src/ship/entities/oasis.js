import { ease } from '../../engine/tween.js';
import { OA, PALM_ART } from '../art/oasis.js';
import { ST } from '../art/stripey.js';
import { DUNE, LILY_PADS, OASIS_POOL, PALM, WALK, duneTop } from '../layout.js';
import { clampToFloor } from './girl.js';

// The things at the oasis on Stripey. None of them can be picked up, but
// they all do something when tapped.

// --------------------------------------------------------------------- frog
// The stripy frog, sat on a lily pad, blinking and puffing out its throat
// now and then. Tap it and it croaks, leaps high and dives into the pool with
// a big splash (splashing her too, if she's close), then pops up on the next
// pad along (back and forth along the row). Every third dive she cheers.
export class Frog {
  constructor(assets) {
    this.imgs = assets.frog;
    this.pad = 1;
    this.way = 1; // which way along the row of pads it's going next
    this.x = LILY_PADS[1].x;
    this.y = LILY_PADS[1].y;
    this.dir = 1;
    this.lift = 0;
    this.dunk = 0; // how far under it is as it pops back up, 0..1
    this.under = false;
    this.leaping = false;
    this.busy = false;
    this.blinkIn = 2;
    this.puffIn = 3;
    this.puff = 0;
    this.dives = 0;
  }

  hitTest(px, py) {
    return !this.busy && Math.abs(px - this.x) <= 12 && py >= this.y - 18 && py <= this.y + 4;
  }

  async onTap() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.busy || scene.busy) {
      return;
    }
    this.busy = true;
    girl.faceToward(this.x);
    engine.audio.play('ribbit');
    this.puff = 0.5;
    await engine.wait(0.4);
    // Up, and down into the water between this pad and the next, working
    // along the row and back (so it never dives in on top of a pad).
    if (!LILY_PADS[this.pad + this.way]) {
      this.way = -this.way;
    }
    const next = this.pad + this.way;
    const to = LILY_PADS[next];
    const splash = { x: (this.x + to.x) / 2, y: OASIS_POOL.y + 2 };
    this.dir = splash.x < this.x ? -1 : 1;
    this.leaping = true;
    const arc = engine.tweens.to(this, { lift: 22 }, 0.25, ease.outQuad)
      .then(() => engine.tweens.to(this, { lift: 0 }, 0.25, ease.inQuad));
    await Promise.all([engine.tweens.to(this, { x: splash.x, y: splash.y }, 0.5, ease.linear), arc]);
    this.leaping = false;
    this.under = true;
    engine.audio.play('splash');
    scene.bits(this.x, this.y - 2, 10, OA.waterLight);
    scene.ripple(this.x, this.y);
    if (Math.hypot(girl.x - this.x, girl.y - this.y) < 48) {
      girl.say('bang', 1);
      girl.act('surprised', 0.8);
    } else {
      girl.say('star', 1);
    }
    await engine.wait(0.7);
    // Up again on the next pad.
    Object.assign(this, { pad: next, x: to.x, y: to.y, dunk: 1, under: false });
    scene.ripple(this.x, this.y);
    engine.audio.play('pop');
    await engine.tweens.to(this, { dunk: 0 }, 0.4, ease.outBack);
    this.dives += 1;
    if (this.dives % 3 === 0) {
      girl.say('heart', 1.2);
      girl.act('cheer', 0.8);
      scene.hearts(girl.x, girl.headTop - 2, 3);
    }
    this.busy = false;
  }

  update(dt) {
    this.blinkIn -= dt;
    if (this.blinkIn < -0.15) {
      this.blinkIn = 2 + Math.random() * 3;
    }
    this.puff = Math.max(0, this.puff - dt);
    this.puffIn -= dt;
    if (this.puffIn <= 0) {
      this.puff = 0.6;
      this.puffIn = 3 + Math.random() * 4;
    }
  }

  draw(r) {
    if (this.under) {
      return;
    }
    if (this.dunk > 0) {
      // Popping up out of the water: only the rows above it show.
      const rows = Math.round(this.imgs.up.length - 1 - (this.imgs.up.length - 1) * this.dunk);
      if (rows > 0) {
        r.image(this.imgs.up[rows], this.x, this.y, { flipX: this.dir < 0 });
      }
      return;
    }
    const frame = this.leaping ? 'leap' : this.puff > 0 ? 'puff' : this.blinkIn < 0 ? 'blink' : 'sit';
    r.image(this.imgs[frame], this.x, this.y - this.lift, { flipX: this.dir < 0 });
  }
}

// --------------------------------------------------------------------- palm
// A palm tree on the shore, its coconuts hanging up in the crown. Tap it and
// she gives the trunk a shake: the fronds sway and down drops a coconut,
// which thuds onto the sand and rolls away. A new one grows back in a while.
export class Palm {
  constructor(assets) {
    this.imgs = assets.palm; // [swayed left, still, swayed right]
    this.assets = assets;
    this.x = PALM.x;
    this.y = PALM.y;
    // Where the crown is (the image is anchored at the trunk's foot).
    this.crown = { x: this.x + PALM_ART.crown.x - PALM_ART.base, y: this.y - PALM_ART.h + PALM_ART.crown.y };
    this.hanging = [{ dx: -4, dy: 3, grow: 1 }, { dx: 1, dy: 5, grow: 1 }, { dx: 5, dy: 2, grow: 1 }];
    this.shake = 0;
    this.fallen = []; // the coconuts lying about, oldest first
  }

  get spot() {
    return clampToFloor(this.x + 14, this.y + 8);
  }

  // The crown, or close by the trunk as it curves up to it.
  hitTest(px, py) {
    const { crown } = this;
    if (Math.abs(px - crown.x) <= 20 && Math.abs(py - crown.y - 2) <= 10) {
      return true;
    }
    if (py < crown.y || py > this.y + 2) {
      return false;
    }
    const k = (this.y - py) / (this.y - crown.y);
    return Math.abs(px - (this.x + (crown.x - this.x) * k * k)) <= 6;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tap');
    this.wobble(0.5);
    if (!scene.busy) {
      scene.interact(this);
    }
  }

  wobble(amount) {
    const { tweens } = this.scene.engine;
    tweens.cancel(this);
    this.shake = amount;
    tweens.to(this, { shake: 0 }, 1, ease.linear);
  }

  get sway() {
    return Math.round(Math.sin(this.scene.engine.time * 18) * this.shake * 2);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(this.x);
    girl.act('reach', 0.6);
    engine.audio.play('rustle');
    this.wobble(1);
    await engine.wait(0.3);
    const nut = this.hanging.find((n) => n.grow >= 1);
    if (!nut) {
      girl.say('question', 1); // none left yet
      return;
    }
    nut.grow = 0;
    const coconut = scene.add(new Coconut(this.assets, this.crown.x + nut.dx, this.crown.y + nut.dy + 11));
    this.fallen.push(coconut);
    if (this.fallen.length > 4) {
      this.fallen.shift().vanish();
    }
    await coconut.drop();
    girl.say('star', 1);
  }

  update(dt) {
    for (const nut of this.hanging) {
      nut.grow = Math.min(1, nut.grow + dt / 8);
    }
  }

  draw(r) {
    const s = Math.sign(this.sway);
    r.image(this.imgs[1 + s], this.x, this.y, { ax: (PALM_ART.base + 0.5) / PALM_ART.w });
    // The coconuts hang from the crown, swaying with it (growing ones small).
    for (const nut of this.hanging) {
      if (nut.grow > 0.15) {
        r.image(this.assets.coconut[0], this.crown.x + nut.dx + s * 2, this.crown.y + nut.dy,
          { ay: 0, scaleX: nut.grow, scaleY: nut.grow });
      }
    }
  }
}

// ------------------------------------------------------------------ coconut
// A coconut, dropped from the palm. It thuds down, bounces and rolls off
// along the sand. Tap one lying about and she gives it a kick to send it
// rolling away again.
export class Coconut {
  // (x, y) is where it starts falling from (bottom-centre).
  constructor(assets, x, y) {
    this.imgs = assets.coconut;
    this.x = x;
    this.y = clampToFloor(x, 128 + Math.random() * 12).y; // where it lands
    this.lift = this.y - y; // how high above it, falling
    this.vx = 0;
    this.roll = 0; // how far it's rolled, for turning it
    this.alpha = 1;
    this.falling = true;
    this.gone = false; // fading away to make room for newer ones
  }

  get spot() {
    const side = this.scene.girl.x < this.x ? -1 : 1;
    return clampToFloor(this.x + side * 12, this.y + 1);
  }

  hitTest(px, py) {
    return !this.falling && !this.gone && Math.abs(px - this.x) <= 7 && py >= this.y - 11 && py <= this.y + 3;
  }

  // Off the tree: down onto the sand, a little bounce, and off it rolls.
  async drop() {
    const { scene } = this;
    const { engine } = scene;
    await engine.tweens.to(this, { lift: 0 }, 0.1 + Math.sqrt(this.lift) * 0.06, ease.inQuad);
    engine.audio.play('thud');
    scene.dust(this.x, this.y);
    this.falling = false;
    this.vx = 34 + Math.random() * 20;
    await engine.tweens.to(this, { lift: 5 }, 0.15, ease.outQuad);
    await engine.tweens.to(this, { lift: 0 }, 0.15, ease.inQuad);
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tap');
    if (!scene.busy) {
      scene.interact(this);
    }
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(this.x);
    girl.act('reach', 0.4);
    engine.audio.play('boing');
    this.vx = (this.x < girl.x ? -1 : 1) * (60 + Math.random() * 20);
    await engine.tweens.to(this, { lift: 4 }, 0.12, ease.outQuad);
    await engine.tweens.to(this, { lift: 0 }, 0.12, ease.inQuad);
    girl.say('star', 1);
  }

  // Gone, with a puff of sand, to make room for newer ones.
  vanish() {
    const { scene } = this;
    this.gone = true;
    scene.dust(this.x, this.y);
    scene.engine.tweens.to(this, { alpha: 0 }, 0.4).then(() => scene.remove(this));
  }

  update(dt) {
    if (this.vx === 0) {
      return;
    }
    this.x += this.vx * dt;
    this.roll += Math.abs(this.vx) * dt;
    if (this.x < WALK.minX || this.x > WALK.maxX) {
      this.x = Math.max(WALK.minX, Math.min(WALK.maxX, this.x));
      this.vx = -this.vx * 0.6; // bounced off the edge
    }
    const slow = Math.max(0, Math.abs(this.vx) - 28 * dt);
    this.vx = Math.sign(this.vx) * (slow < 3 ? 0 : slow);
  }

  draw(r) {
    const turn = Math.floor(this.roll / 4) % 4;
    if (!this.falling && this.lift < 1) {
      r.rect(this.x - 4, this.y - 1, 8, 1, '#000000', 0.15 * this.alpha);
    }
    r.image(this.imgs[this.vx < 0 ? (4 - turn) % 4 : turn], this.x, this.y - this.lift, { alpha: this.alpha });
  }
}

// --------------------------------------------------------------------- dune
// The big sand dune at the back (painted on the backdrop). Tap it and she
// climbs to the top, then slides all the way down the front on a spray of
// sand, skidding off the bottom with a cheer.
export class Dune {
  constructor() {
    this.x = DUNE.peak.x;
    this.y = DUNE.foot.y;
    this.depth = 0; // the sand spray is behind everything else
    this.spot = DUNE.spot;
    this.spray = []; // { x, y, vx, vy, age }
    this.slides = 0;
  }

  hitTest(px, py) {
    return px >= DUNE.foot.x && py >= duneTop(px) - 3 && py < WALK.minY; // the floor in front is for walking
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tap');
    if (!scene.busy) {
      scene.interact(this);
    }
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    const { peak, foot } = DUNE;
    await scene.scripted(async () => {
      // Up the front of the dune to the top, slowly: it's steep.
      girl.mode = 'walk';
      girl.pose = null;
      for (const p of DUNE.climb) {
        girl.faceToward(p.x);
        await engine.tweens.to(girl, p, Math.hypot(p.x - girl.x, p.y - girl.y) / 22, ease.linear);
      }
      girl.mode = 'idle';
      girl.faceToward(foot.x);
      girl.say('bang', 0.8);
      await engine.wait(0.6);
      // Wheee: down the front, getting faster.
      girl.mode = 'act';
      girl.pose = { frame: 'cheer', token: {} };
      engine.audio.play('wheee');
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const x = peak.x - ((peak.x - foot.x) * i) / steps;
        await engine.tweens.to(girl, { x, y: duneTop(x) + 1 }, 0.13 - i * 0.007, ease.linear);
        this.kick(girl.x, girl.y);
      }
      const end = clampToFloor(foot.x - 28, foot.y + 10);
      await engine.tweens.to(girl, end, 0.45, ease.outQuad);
      scene.dust(girl.x, girl.y);
      girl.pose = null;
      girl.mode = 'idle';
    });
    scene.persist();
    this.slides += 1;
    girl.say('heart', 1.4);
    girl.act('cheer', 0.8);
    scene.hearts(girl.x, girl.headTop - 2, this.slides % 3 === 0 ? 6 : 3);
  }

  // A spray of sand flung up behind her as she slides past (x, y).
  kick(x, y) {
    for (let i = 0; i < 3; i++) {
      this.spray.push({ x: x + 3, y: y - 1, vx: 10 + Math.random() * 20, vy: -(20 + Math.random() * 25), age: 0 });
    }
  }

  update(dt) {
    for (const p of this.spray) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
    }
    this.spray = this.spray.filter((p) => p.age < 0.6);
  }

  draw(r) {
    for (const p of this.spray) {
      r.rect(p.x, p.y, 1, 1, p.age < 0.3 ? ST.sandLight : ST.sandDark, 1 - p.age / 0.6);
    }
  }
}
