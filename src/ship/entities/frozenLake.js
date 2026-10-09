import { ease } from '../../engine/tween.js';
import { FR } from '../art/frosty.js';
import { FL } from '../art/frozenLake.js';
import { FISHING_HOLE, FROZEN_LAKE, WALK, onIce } from '../layout.js';
import { hold, isFriendItem, letGo } from './friends.js';
import { clampToFloor } from './girl.js';

// The things at the frozen lake on Frosty. None of them can be picked up,
// but they all do something when tapped.

// ---------------------------------------------------------------------- ice
// The sheet of ice (painted on the backdrop). Tap it and she goes to the
// nearer end and slides all the way across to the other on a spray of ice,
// with a twirl in the middle, and any friends out here slide along behind
// her in a line. Every third slide is a big cheer.
export class Ice {
  constructor() {
    this.x = FROZEN_LAKE.x;
    this.y = FROZEN_LAKE.y;
    this.depth = 0; // under everything else
    this.spray = []; // { x, y, vx, vy, age }
    this.slides = 0;
  }

  // The end of the ice nearer her, where she sets off from.
  get spot() {
    const [left, right] = FROZEN_LAKE.ends;
    return this.scene.girl.x < this.x ? left : right;
  }

  hitTest(px, py) {
    return onIce(px, py) && py < WALK.minY; // the ice out front is for walking on
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
    const from = this.spot;
    const to = FROZEN_LAKE.ends.find((end) => end !== from);
    const way = Math.sign(to.x - from.x);
    // Her friends out here line up behind her (furthest along the line first).
    const friends = scene.entities.filter((e) => isFriendItem(e) && e.free);
    await scene.scripted(async () => {
      girl.faceToward(to.x);
      for (const friend of friends) {
        hold(friend);
      }
      await Promise.all(friends.map((friend, i) => {
        friend.facing = way;
        friend.pose?.('walk');
        return engine.tweens.to(friend, clampToFloor(from.x - way * 12 * (i + 1), from.y), 0.4, ease.outQuad);
      }));
      girl.say('bang', 0.8);
      await engine.wait(0.4);
      // Wheee: off across the ice, twirling round in the middle.
      girl.mode = 'act';
      girl.pose = { frame: 'cheer', token: {} };
      engine.audio.play('wheee');
      for (const friend of friends) {
        friend.pose?.('hop');
      }
      const steps = 12;
      const span = to.x - from.x;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = from.x + span * ease.outQuad(t);
        if (i === Math.round(steps / 2)) {
          girl.faceToward(from.x); // round she goes...
          engine.audio.play('tinkle');
          scene.sparkles(girl.x, girl.headTop, 6);
        } else if (i === Math.round(steps / 2) + 1) {
          girl.faceToward(to.x); // ...and back
        }
        const glide = 0.08 + t * 0.05;
        await Promise.all([
          engine.tweens.to(girl, { x }, glide, ease.linear),
          ...friends.map((friend, k) => engine.tweens.to(friend, clampToFloor(x - way * 12 * (k + 1), friend.y), glide, ease.linear)),
        ]);
        this.kick(girl.x, girl.y, -way);
      }
      girl.pose = null;
      girl.mode = 'idle';
    });
    for (const friend of friends) {
      letGo(friend);
      friend.boing(0.6);
      scene.settle(friend);
    }
    scene.persist();
    this.slides += 1;
    girl.say('heart', 1.4);
    girl.act('cheer', 0.8);
    scene.hearts(girl.x, girl.headTop - 2, this.slides % 3 === 0 ? 6 : 3 + Math.min(friends.length, 2));
  }

  // A spray of ice flung up behind (`back`: -1 left, 1 right) her skates at (x, y).
  kick(x, y, back) {
    for (let i = 0; i < 3; i++) {
      this.spray.push({ x: x + back * 3, y: y - 1, vx: back * (10 + Math.random() * 20), vy: -(15 + Math.random() * 20), age: 0 });
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
      r.rect(p.x, p.y, 1, 1, p.age < 0.3 ? '#ffffff' : FL.iceDark, 1 - p.age / 0.6);
    }
  }
}

// ----------------------------------------------------------- fishing hole
// A round hole cut in the ice, with a curious fish living under it. Now and
// then a bubble wobbles up. Tap it and she kneels down to peer in: up pops
// the fish to see who's there, looks her up and down, blows a bubble and
// ducks back under. Every third time it's so pleased to see her it leaps
// right out in a flip and back in with a splash.
export class FishingHole {
  constructor(assets) {
    this.imgs = assets.lakeFish;
    this.jumpImgs = assets.iceFish; // the same fish as under the ice cave's window
    this.x = FISHING_HOLE.x;
    this.y = FISHING_HOLE.y;
    this.spot = FISHING_HOLE.spot;
    this.peek = 0; // how far the fish is up out of the hole, 0..1
    this.frame = 'look';
    this.facing = 1;
    this.leap = null; // { p } while flipping out of the water
    this.bubbles = []; // { x, y, age }
    this.bubbleIn = 2;
    this.visits = 0;
    this.busy = false;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) <= FISHING_HOLE.rx + 4 && py >= this.y - 8 - this.peek * 12 && py <= this.y + 6;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tap');
    if (!scene.busy && !this.busy) {
      scene.interact(this);
    }
  }

  async use() {
    if (this.busy) {
      return;
    }
    this.busy = true;
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(this.x);
    girl.act('reach', 0.8);
    this.visits += 1;
    await engine.wait(0.3);
    // Up it pops.
    engine.audio.play('plop');
    scene.ripple(this.x, this.y);
    this.facing = girl.x < this.x ? -1 : 1;
    await engine.tweens.to(this, { peek: 1 }, 0.35, ease.outBack);
    girl.say('bang', 0.8);
    // Who's this? A look one way, then the other, then right at her.
    for (const look of [-this.facing, this.facing]) {
      await engine.wait(0.4);
      this.facing = look;
    }
    this.frame = 'oh';
    engine.audio.play('blorp');
    this.bubbles.push({ x: this.x + this.facing * 3, y: this.y - 10, age: 0 });
    await engine.wait(0.5);
    this.frame = 'blink';
    await engine.wait(0.2);
    this.frame = 'look';
    if (this.visits % 3 === 0) {
      await this.flip();
    } else {
      await engine.wait(0.3);
      engine.audio.play('plop');
      await engine.tweens.to(this, { peek: 0 }, 0.3, ease.inQuad);
      scene.ripple(this.x, this.y);
      girl.say('heart', 1.2);
    }
    this.busy = false;
  }

  // Out of the water in a big arc, a flip at the top, and back in — splash!
  async flip() {
    const { scene } = this;
    const { engine, girl } = scene;
    this.peek = 0;
    this.leap = { p: 0 };
    engine.audio.play('wheee');
    scene.bits(this.x, this.y - 2, 6, FL.ice);
    await engine.tweens.to(this.leap, { p: 1 }, 1.1, ease.linear);
    this.leap = null;
    engine.audio.play('splash');
    scene.bits(this.x, this.y - 2, 10, FL.iceLight);
    scene.ripple(this.x, this.y);
    girl.say('heart', 1.4);
    girl.act('cheer', 0.8);
    scene.hearts(girl.x, girl.headTop - 2, 4);
  }

  update(dt) {
    for (const b of this.bubbles) {
      b.age += dt;
      b.y -= dt * 10;
      b.x += Math.sin(b.age * 8) * dt * 4;
    }
    this.bubbles = this.bubbles.filter((b) => b.age < 1.2);
    this.bubbleIn -= dt;
    if (this.bubbleIn <= 0 && this.peek === 0 && !this.leap) {
      this.bubbles.push({ x: this.x + (Math.random() - 0.5) * 8, y: this.y, age: 0.4 }); // a little one, from under
      this.bubbleIn = 2 + Math.random() * 3;
    }
  }

  draw(r) {
    if (this.peek > 0) {
      // Up out of the water: only the rows above it show.
      const up = this.imgs[this.frame];
      const rows = Math.round((up.length - 1) * this.peek);
      if (rows > 0) {
        r.image(up[rows], this.x, this.y + 1, { flipX: this.facing < 0 });
      }
    }
    for (const b of this.bubbles) {
      r.rect(Math.round(b.x), Math.round(b.y), 2, 2, '#ffffff', b.age < 0.9 ? 0.9 : (1.2 - b.age) * 3);
    }
  }

  // The fish flips over the top of everything.
  drawOver(r) {
    const j = this.leap;
    if (!j) {
      return;
    }
    const x = this.x + (j.p - 0.5) * 6;
    const y = this.y - Math.sin(Math.PI * j.p) * 34;
    const frame = Math.floor(j.p * 8) % 2;
    // Squashed thin as it flips over at the top of the leap.
    const squash = 0.3 + 0.7 * Math.abs(Math.cos(Math.PI * j.p));
    r.image(this.jumpImgs[frame], x, y, { scaleX: 1.5, scaleY: 1.5 * squash, flipX: this.facing < 0 });
  }
}

// ---------------------------------------------------------- snow critters
// Little round puffs of fluff that waddle about the snow (and out onto the
// ice). Tap one and it squeaks and hops; every other time it flops down on
// its tummy and toboggans off, all the further out on the ice.
export class SnowCritter {
  constructor(assets, variant) {
    this.imgs = assets.snowCritters[variant];
    const start = clampToFloor(70 + variant * 60 + Math.random() * 30, 132 + variant * 6);
    this.x = start.x;
    this.y = start.y;
    this.facing = variant % 2 ? -1 : 1;
    this.lift = 0;
    this.belly = false;
    this.walk = null; // { x, y, steps }
    this.restIn = 1 + Math.random() * 3;
    this.blinkIn = 2 + Math.random() * 2;
    this.taps = 0;
    this.busy = false;
  }

  get depth() {
    return this.y;
  }

  hitTest(px, py) {
    return !this.busy && Math.abs(px - this.x) <= 9 && py >= this.y - 14 - this.lift && py <= this.y + 3;
  }

  async onTap() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.busy) {
      return;
    }
    this.busy = true;
    this.walk = null;
    this.taps += 1;
    girl.faceToward(this.x);
    engine.audio.play('squeak');
    await engine.tweens.to(this, { lift: 7 }, 0.15, ease.outQuad);
    await engine.tweens.to(this, { lift: 0 }, 0.18, ease.inQuad);
    if (this.taps % 2 === 0) {
      // Flop! And off it goes on its tummy, further on the ice.
      this.belly = true;
      engine.audio.play('wheee');
      const far = onIce(this.x, this.y) ? 60 : 30;
      const { minX, maxX } = this.scene.roam ?? WALK;
      const x = Math.max(minX, Math.min(maxX, this.x + this.facing * far));
      await engine.tweens.to(this, { x }, 1, ease.outQuad);
      this.belly = false;
      scene.bits(this.x, this.y - 2, 4, FR.snow);
    }
    scene.hearts(this.x, this.y - 16, 1);
    girl.say('heart', 1);
    this.restIn = 1.5;
    this.busy = false;
  }

  update(dt) {
    this.blinkIn -= dt;
    if (this.blinkIn < -0.15) {
      this.blinkIn = 2 + Math.random() * 3;
    }
    if (this.busy) {
      return;
    }
    if (this.walk) {
      const w = this.walk;
      const dx = w.x - this.x;
      const dy = w.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 1) {
        this.walk = null;
        this.restIn = 1.5 + Math.random() * 3;
        return;
      }
      const step = Math.min(d, 14 * dt);
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
      this.facing = dx < 0 ? -1 : 1;
      w.steps += dt;
      return;
    }
    this.restIn -= dt;
    if (this.restIn <= 0) {
      const { minX, maxX } = this.scene.roam ?? WALK;
      const to = clampToFloor(Math.max(minX, Math.min(maxX, this.x + (Math.random() - 0.5) * 70)), this.y + (Math.random() - 0.5) * 16);
      this.walk = { ...to, steps: 0 };
    }
  }

  draw(r) {
    let frame = 'stand';
    if (this.belly) {
      frame = 'belly';
    } else if (this.walk) {
      frame = Math.floor(this.walk.steps * 7) % 2 ? 'step' : 'stand'; // a waddle
    } else if (this.blinkIn < 0) {
      frame = 'blink';
    }
    const waddle = this.walk ? Math.round(Math.sin(this.walk.steps * 22)) : 0;
    r.rect(this.x - 5, this.y, 10, 1, '#000000', 0.12);
    r.image(this.imgs[frame], this.x + waddle * 0.5, this.y + 1 - this.lift, { flipX: this.facing < 0 });
  }
}
