import { ease } from '../../engine/tween.js';
import { EM } from '../art/ember.js';
import { happened, offerChat } from '../chat.js';
import { EMBER_SECRETS, WALK } from '../layout.js';
import { NEWT } from '../talks/newt.js';
import { Carryable } from './carryable.js';
import { hold, isFriendItem, letGo, play } from './friends.js';
import { clampToFloor } from './girl.js';
import { feed, isSnack } from './items.js';
import { Secret } from './secret.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ------------------------------------------------------------- fire flower
// Tap one and its flame petals leap up tall in a shower of warm sparks.
export class Firebloom extends Carryable {
  // `state.v` picks its colour.
  constructor(assets, state) {
    super(state);
    this.imgs = assets.firebloom[(state.v ?? 0) % assets.firebloom.length];
    this.flare = 0;
    this.phase = this.x * 0.41;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 9 && py > this.y - 30 && py < this.y + 3;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('flare');
    this.boing(1);
    this.flare = 1.2;
    scene.bits(this.x, this.y - 22, 6, EM.lavaLight);
    scene.bits(this.x, this.y - 22, 3, EM.lavaHi);
    scene.girl.faceToward(this.x);
    scene.girl.say('star', 1);
  }

  update(dt) {
    this.flare = Math.max(0, this.flare - dt);
  }

  draw(r) {
    const t = this.scene.engine.time;
    const img = this.flare > 0 ? this.imgs[2] : this.imgs[Math.floor(t * 5 + this.phase) % 2];
    this.shadow(r, 10);
    r.image(img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ------------------------------------------------------------------- geode
// A lumpy rock with a secret inside: it's too tough for her, but the newt can
// crack it open with a smack of its tail. Once open (`stage` 1) it stays open,
// and sparkles and chimes when tapped.
export class Geode extends Carryable {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.geode;
    this.stage = state.stage ?? 0;
    this.glow = 0;
  }

  get open() {
    return this.stage > 0;
  }

  crackOpen() {
    this.stage = 1;
    this.boing(1.4);
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 12 && py > this.y - 15 && py < this.y + 3;
  }

  onTap() {
    const { scene } = this;
    const { girl } = scene;
    girl.faceToward(this.x);
    if (this.open) {
      scene.engine.audio.play('chime');
      this.boing(1);
      this.glow = 1.5;
      scene.sparkles(this.x, this.y - 8, 6);
      girl.say('star', 1);
    } else {
      // A heavy thunk: whatever's inside, she can't get at it.
      scene.engine.audio.play('land');
      this.boing(0.5);
      girl.say('question', 1);
    }
  }

  update(dt) {
    this.glow = Math.max(0, this.glow - dt);
  }

  draw(r) {
    const t = this.scene.engine.time;
    this.shadow(r, 16);
    r.image(this.imgs[this.open ? 1 : 0], this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
    if (this.open && (this.glow > 0 || (t * 0.8 + this.x * 0.1) % 3 < 0.2)) {
      r.pixel(this.x - 5, this.y - 8, '#ffffff');
      r.pixel(this.x + 5, this.y - 7, '#ffffff');
    }
  }
}

// --------------------------------------------------------------------- newt
// A little fire newt that scurries about Ember. Like every friend it greets
// her, plays with other friends and gobbles snacks. It's always far too warm:
// bring it a giant bluebell from cool, shady Bluebell and it sits happily in
// the shade. And drop a geode on it to see what its tail can do.
export class Newt extends Carryable {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.newt;
    this.frame = 'idle';
    this.facing = -1;
    this.lift = 0;
    this.blinkIn = 2;
    this.restIn = 1 + Math.random() * 2;
    this.walk = null; // { x, y, steps } while scurrying somewhere
    this.busy = false;
    this.priority = 5;
  }

  hitTest(px, py) {
    const y = this.y - this.perch;
    return Math.abs(px - this.x) < 11 && py > y - 16 - this.lift && py < y + 3;
  }

  onTap() {
    const { scene } = this;
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (this.busy) {
      return;
    }
    this.stayPut();
    scene.engine.audio.play('squeak');
    this.boing(0.8);
    this.frame = 'hop';
    const { tweens } = scene.engine;
    tweens.to(this, { lift: 9 }, 0.15, ease.outQuad).then(() => tweens.to(this, { lift: 0 }, 0.2, ease.inQuad)).then(() => {
      if (this.frame === 'hop' && !this.busy && !this.held) {
        this.frame = 'idle';
      }
    });
    scene.bits(this.x, this.y - 8, 4, EM.lavaLight);
    scene.girl.faceToward(this.x);
    scene.girl.say('heart', 1.2);
    offerChat(scene, this, 0.4); // once it's landed
  }

  // Where its chat lines go.
  get headTop() {
    return this.y - this.perch - 16 - this.lift;
  }

  // What it has to say, and whether it's had its shade, or cracked a geode.
  chat() {
    const { scene } = this;
    return { tree: NEWT, facts: { shady: happened(scene, 'ember.newt'), cracked: happened(scene, 'ember.geode') } };
  }

  onPickUp() {
    this.stayPut();
    this.frame = 'hop';
    this.scene.engine.audio.play('squeak');
  }

  onLand() {
    if (!this.busy) {
      this.frame = 'idle';
    }
  }

  // Stops wherever it is (cutting short a scurry).
  stayPut() {
    this.walk = null;
    this.lift = 0;
  }

  pose(frame) {
    this.frame = frame;
  }

  accepts(item) {
    const free = !this.busy && !this.held && !this.falling && !this.seat;
    const wanted = isSnack(item) || isFriendItem(item) || item.kind === 'bluebell' || (item.kind === 'geode' && !item.open);
    return free && wanted;
  }

  receive(item) {
    if (isFriendItem(item)) {
      return play(item, this);
    }
    if (isSnack(item)) {
      return this.eat(item);
    }
    return item.kind === 'bluebell' ? this.coolOff(item) : this.crack(item);
  }

  async eat(snack) {
    hold(this);
    await feed(this, snack);
    letGo(this);
  }

  // A little hop of a chew with every bite.
  munch() {
    const { tweens } = this.scene.engine;
    tweens.to(this, { lift: 3 }, 0.1, ease.outQuad).then(() => tweens.to(this, { lift: 0 }, 0.12, ease.inQuad));
  }

  // A giant bluebell planted beside it, arching over it: shade at last! It
  // lets off a hiss of steam, hops for joy, and gives her a sticker.
  async coolOff(bell) {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    // The stem stands to its left, so the bells hang over the newt.
    await scene.putDown(bell, this.x - 12, this.y + 1);
    girl.faceToward(this.x);
    engine.audio.play('sizzle');
    scene.bits(this.x, this.y - 10, 8, EM.steam);
    await engine.wait(0.5);
    engine.audio.play('giggle');
    for (let i = 0; i < 2; i++) {
      this.frame = 'hop';
      await engine.tweens.to(this, { lift: 8 }, 0.16, ease.outQuad);
      scene.hearts(this.x, this.y - 20, i ? 2 : 3);
      await engine.tweens.to(this, { lift: 0 }, 0.2, ease.inQuad);
    }
    girl.say('heart', 1.4);
    scene.findSticker('ember.newt', this.x, this.y - 22); // a thank-you present
    letGo(this);
  }

  // Turns its back on the geode, then — whack! — its tail cracks it open.
  async crack(geode) {
    hold(this);
    geode.draggable = false;
    const { scene } = this;
    const { engine, girl } = scene;
    const side = geode.x < this.x ? -1 : 1;
    await scene.putDown(geode, this.x + side * 15, this.y);
    girl.faceToward(this.x);
    this.facing = -side; // tail toward the geode
    for (let i = 0; i < 2; i++) {
      engine.audio.play('tap');
      this.boing(0.8);
      await engine.wait(0.25);
    }
    this.frame = 'hop';
    await engine.tweens.to(this, { lift: 10 }, 0.18, ease.outQuad);
    await engine.tweens.to(this, { lift: 0 }, 0.12, ease.inQuad);
    engine.audio.play('crack');
    geode.crackOpen();
    scene.saveStage(geode, 1);
    scene.bits(geode.x, geode.y - 6, 8, EM.geode);
    scene.sparkles(geode.x, geode.y - 8, 8);
    await engine.wait(0.3);
    engine.audio.play('chime');
    this.facing = side;
    this.frame = 'idle';
    girl.say('star', 1.4);
    scene.findSticker('ember.geode', geode.x, geode.y - 14); // tucked inside
    scene.hearts(this.x, this.y - 18, 2);
    geode.draggable = true;
    letGo(this);
  }

  update(dt) {
    if (this.held || this.falling || this.busy || this.seat) {
      return;
    }
    if (this.walk) {
      this.scurry(dt);
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
      // Off somewhere nearby in its patch (the planet keeps it clear of the ship).
      const { minX, maxX } = this.scene.roam ?? WALK;
      const to = clampToFloor(clamp(this.x + (Math.random() - 0.5) * 70, minX, maxX), this.y + (Math.random() - 0.5) * 16, this.scene.width);
      this.walk = { x: to.x, y: to.y, steps: 0 };
    }
  }

  // A step of a scurry: little legs going, until it's there.
  scurry(dt) {
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
    const step = Math.min(d, 26 * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.facing = dx < 0 ? -1 : 1;
    w.steps += dt;
    this.frame = Math.floor(w.steps * 10) % 2 ? 'walk' : 'idle';
  }

  // How it looks sitting in the pilot chair (which draws it, so it spins too).
  seatFrame() {
    return this.dressed(this.imgs[this.frame]);
  }

  draw(r) {
    if (this.seat) {
      return;
    }
    this.shadow(r, 14);
    r.image(this.dressed(this.imgs[this.frame]), this.x, this.y + 1 - this.lift, {
      flipX: this.facing < 0, scaleX: this.bounce * this.twirl, scaleY: 2 - this.bounce,
    });
  }
}

// ------------------------------------------------------------------ secrets
// A crusty steam vent: it rumbles, then whooshes a plume of steam into the
// air. Every third go (starting with the first) it's a big one, and the
// first big one blasts a sticker up out of the ground.
export class Geyser extends Secret {
  constructor(assets) {
    const { x, y } = EMBER_SECRETS.vent;
    super(x, y, { w: 24, h: 10, reach: 20 });
    this.img = assets.vent;
    this.puffImg = assets.steam;
    this.rumble = 0;
    this.spout = 0; // seconds of steam left to blow
    this.power = 1;
    this.puffs = [];
  }

  async reveal(n) {
    const { scene } = this;
    const { engine } = scene;
    const big = n % 3 === 0;
    engine.audio.play('rumble');
    this.rumble = 1;
    scene.bits(this.x, this.y - 4, 4, EM.ashLight);
    await engine.wait(0.8);
    engine.audio.play('whoosh');
    this.power = big ? 1.6 : 1;
    this.spout = big ? 1.6 : 1;
    this.react('surprised', 'bang');
    if (big) {
      await engine.wait(0.3);
      scene.findSticker('ember.geyser', this.x, this.y - 48); // blown up out of the vent
    }
    await engine.wait(this.spout);
    this.react('cheer', 'heart');
  }

  update(dt) {
    this.rumble = Math.max(0, this.rumble - dt * 1.2);
    if (this.spout > 0) {
      this.spout = Math.max(0, this.spout - dt);
      this.puffs.push({
        x: this.x + (Math.random() - 0.5) * 4, y: this.y - 4, vx: (Math.random() - 0.5) * 10,
        vy: -(60 + Math.random() * 30) * this.power, age: 0, life: 0.9 + Math.random() * 0.4,
      });
    }
    for (const p of this.puffs) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy *= 1 - dt * 1.8;
    }
    this.puffs = this.puffs.filter((p) => p.age < p.life);
  }

  draw(r) {
    const t = this.scene.engine.time;
    const shake = this.rumble > 0 ? Math.round(Math.sin(t * 50) * this.rumble) : 0;
    r.rect(this.x - 11, this.y - 1, 22, 2, '#000000', 0.2);
    r.image(this.img, this.x + shake, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }

  // Steam billows above everything else.
  drawOver(r) {
    for (const p of this.puffs) {
      const k = p.age / p.life;
      const s = 0.6 + k * 1.6;
      r.image(this.puffImg, p.x, p.y, { ay: 0.5, scaleX: s, scaleY: s, alpha: 0.85 * (1 - k) });
    }
  }
}

// A bubbling lava pool with a little glowing fish living in it. It leaps out
// in an arc and splashes back in: once, then twice, then one great big leap
// that flips a sticker out.
export class LavaPool extends Secret {
  constructor(assets) {
    const { x, y } = EMBER_SECRETS.pool;
    super(x, y, { w: 34, h: 9, reach: 24 });
    this.imgs = assets.lavaPool;
    this.fishImgs = assets.lavaFish;
    this.fish = null; // { x0, dx, height, p } mid-leap
  }

  async reveal(n) {
    const { scene } = this;
    const { engine } = scene;
    engine.audio.play('blorp');
    await engine.wait(0.4);
    const kind = n % 3;
    if (kind === 2) {
      await this.leap(-1, 52, 1.1, true);
    } else {
      for (let i = 0; i <= kind; i++) {
        await this.leap(i % 2 ? 1 : -1, 22, 0.7);
      }
    }
    this.react('cheer', 'heart');
  }

  // One leap, out from one side of the pool and back in at the other.
  async leap(dir, height, dur, sticker = false) {
    const { scene } = this;
    const { engine } = scene;
    const fish = { x0: this.x - dir * 10, dx: dir * 20, height, p: 0, facing: dir };
    this.fish = fish;
    engine.audio.play('blorp');
    scene.bits(fish.x0, this.y - 4, 5, EM.lavaLight);
    this.react('surprised', 'bang');
    await engine.tweens.to(fish, { p: 0.5 }, dur / 2, ease.linear);
    if (sticker) {
      scene.findSticker('ember.fish', this.x, this.y - height - 6); // flipped off its tail
    }
    await engine.tweens.to(fish, { p: 1 }, dur / 2, ease.linear);
    engine.audio.play('blorp');
    scene.bits(fish.x0 + fish.dx, this.y - 4, 5, EM.lavaLight);
    this.fish = null;
  }

  draw(r) {
    const t = this.scene.engine.time;
    r.image(this.imgs[Math.floor(t * 2.5) % 2], this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }

  // The fish arcs above everything else.
  drawOver(r) {
    const f = this.fish;
    if (!f) {
      return;
    }
    const t = this.scene.engine.time;
    const x = f.x0 + f.dx * f.p;
    const y = this.y - 3 - Math.sin(Math.PI * f.p) * f.height;
    r.image(this.fishImgs[Math.floor(t * 10) % 2], x, y, { ay: 0.5, flipX: f.facing < 0 });
  }
}
