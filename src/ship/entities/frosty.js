import { ease } from '../../engine/tween.js';
import { FR } from '../art/frosty.js';
import { FROSTY_SECRETS } from '../layout.js';
import { Carryable } from './carryable.js';
import { hold, isFriendItem, letGo, play } from './friends.js';
import { clampToFloor } from './girl.js';
import { isSnack } from './items.js';
import { Secret } from './secret.js';
import { Stroller } from './stroller.js';

// ----------------------------------------------------------------- snowball
// Tap it and it puffs a little snow. The baby yeti loves to play with one.
export class Snowball extends Carryable {
  constructor(assets, state) {
    super(state);
    this.img = assets.snowball;
    this.lift = 0; // how high it's been tossed
  }

  hitTest(px, py) {
    const y = this.y - this.lift;
    return Math.abs(px - this.x) < 7 && py > y - 11 && py < y + 3;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('poof');
    this.boing(1);
    scene.bits(this.x, this.y - 6, 5, FR.snow);
    scene.girl.faceToward(this.x);
  }

  draw(r) {
    this.shadow(r, 8);
    r.image(this.img, this.x, this.y + 1 - this.lift, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ------------------------------------------------------------- frost flower
// Twinkles to itself; tap it and it lights up with a tinkle.
export class FrostFlower extends Carryable {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.frostFlower;
    this.glow = 0;
    this.phase = this.x * 0.37;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 8 && py > this.y - 22 && py < this.y + 3;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tinkle');
    this.boing(1);
    this.glow = 1.2;
    scene.sparkles(this.x, this.y - 16, 6);
    scene.girl.faceToward(this.x);
    scene.girl.say('star', 1);
  }

  update(dt) {
    this.glow = Math.max(0, this.glow - dt);
  }

  draw(r) {
    const t = this.scene.engine.time;
    const img = this.glow > 0 ? this.imgs[2] : this.imgs[Math.floor(t * 1.5 + this.phase) % 2];
    this.shadow(r, 8);
    r.image(img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// -------------------------------------------------------------------- yetis
// Mum and baby yeti plod about the snow like any strolling friend (see
// stroller.js), each with its own tap fun and things it loves.

// Mum yeti: big, soft and gentle. Tap her and she waves hello with a happy
// hoot. Bring her baby back to her for a cuddle, and she's always glad of a
// warm fire flower from Ember to toast her paws on.
export class MumYeti extends Stroller {
  constructor(assets, state) {
    super(state, assets.mumYeti, { speed: 12, wander: 60, width: 22, height: 30 });
  }

  onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (!this.free) {
      return;
    }
    this.waveHello();
  }

  async waveHello() {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    this.boing(0.6);
    this.facing = girl.x < this.x ? -1 : 1;
    girl.faceToward(this.x);
    engine.audio.play('hoo');
    for (let i = 0; i < 6; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      await engine.wait(0.2);
    }
    scene.hearts(this.x, this.y - 32, 2);
    girl.say('heart', 1.2);
    letGo(this);
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item) || item.kind === 'firebloom');
  }

  receive(item) {
    if (item.kind === 'babyYeti') {
      return cuddle(this, item);
    }
    if (isFriendItem(item)) {
      return play(item, this);
    }
    if (isSnack(item)) {
      return this.eat(item);
    }
    return this.warmUp(item);
  }

  // A fire flower planted beside her: she holds her paws out to its glow,
  // toasty at last, and gives her a sticker to say thank you.
  async warmUp(flower) {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    const side = flower.x < this.x ? -1 : 1;
    await scene.putDown(flower, this.x + side * 16, this.y + 1);
    this.facing = side;
    girl.faceToward(this.x);
    engine.audio.play('flare');
    flower.flare = 1.5;
    scene.bits(flower.x, flower.y - 22, 6, '#ffb347');
    for (let i = 0; i < 6; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      await engine.wait(0.22);
    }
    engine.audio.play('hoo');
    this.frame = 'blink'; // eyes shut, all cosy
    scene.hearts(this.x, this.y - 32, 3);
    await engine.wait(0.6);
    girl.say('heart', 1.4);
    scene.findSticker('frosty.warm', this.x, this.y - 34); // a thank-you present
    letGo(this);
  }
}

// Baby yeti: a little bundle of fluff that never strays far from mum. Tap it
// and it bounces with a giggle. Give it a snowball and it throws it up in
// the air and catches it — or doesn't, and gets a face full of snow!
export class BabyYeti extends Stroller {
  constructor(assets, state) {
    super(state, assets.babyYeti, { speed: 20, wander: 50, width: 14, height: 18 });
  }

  // Mum, if she's out here too.
  get mum() {
    return this.scene.entities.find((e) => e.kind === 'mumYeti' && !e.held && !e.seat) ?? null;
  }

  nextStroll() {
    const { mum } = this;
    if (!mum) {
      return super.nextStroll();
    }
    // Toddles back to mum's side.
    const side = Math.random() < 0.5 ? -1 : 1;
    return clampToFloor(mum.x + side * (16 + Math.random() * 10), mum.y + 2 + (Math.random() - 0.5) * 8);
  }

  onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (!this.free) {
      return;
    }
    this.stayPut();
    const { scene } = this;
    scene.engine.audio.play('giggle');
    this.boing(0.8);
    this.frame = 'hop';
    const { tweens } = scene.engine;
    tweens.to(this, { lift: 8 }, 0.15, ease.outQuad).then(() => tweens.to(this, { lift: 0 }, 0.2, ease.inQuad)).then(() => {
      if (this.frame === 'hop' && !this.busy && !this.held) {
        this.frame = 'idle';
      }
    });
    scene.bits(this.x, this.y - 2, 4, FR.snow);
    scene.girl.faceToward(this.x);
    scene.girl.say('heart', 1.2);
  }

  onPickUp() {
    super.onPickUp();
    this.scene.engine.audio.play('squeak');
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item) || item.kind === 'snowball');
  }

  receive(item) {
    if (item.kind === 'mumYeti') {
      return cuddle(item, this);
    }
    if (isFriendItem(item)) {
      return play(item, this);
    }
    if (isSnack(item)) {
      return this.eat(item);
    }
    return this.tossSnowball(item);
  }

  // Up goes the snowball, twice caught... and the third time — poof! — right
  // on its head. It thinks that's the funniest thing ever.
  async tossSnowball(ball) {
    hold(this);
    ball.draggable = false;
    const { scene } = this;
    const { engine, girl } = scene;
    const side = ball.x < this.x ? -1 : 1;
    await scene.putDown(ball, this.x + side * 4, this.y + 1);
    girl.faceToward(this.x);
    this.facing = side;
    for (let i = 0; i < 3; i++) {
      const last = i === 2;
      this.frame = 'wave1';
      engine.audio.play('wheee');
      await engine.tweens.to(ball, { lift: 26 + i * 6 }, 0.35, ease.outQuad);
      this.frame = 'wave2';
      // Caught in its paws... or, the last time, right on its head.
      await engine.tweens.to(ball, { lift: last ? 16 : 12 }, 0.3, ease.inQuad);
      if (!last) {
        engine.audio.play('boop');
        await engine.tweens.to(ball, { lift: 0 }, 0.12, ease.outQuad);
      }
    }
    // Poof!
    engine.audio.play('poof');
    scene.bits(this.x, this.y - 18, 10, FR.snow);
    this.boing(1.4);
    engine.tweens.to(ball, { lift: 0 }, 0.15, ease.inQuad);
    this.frame = 'blink';
    await engine.wait(0.4);
    engine.audio.play('giggle');
    for (let i = 0; i < 2; i++) {
      this.frame = 'hop';
      await engine.tweens.to(this, { lift: 7 }, 0.15, ease.outQuad);
      scene.hearts(this.x, this.y - 20, 2);
      await engine.tweens.to(this, { lift: 0 }, 0.18, ease.inQuad);
    }
    girl.say('heart', 1.4);
    scene.findSticker('frosty.snowball', this.x, this.y - 24); // shaken out of its fur
    ball.draggable = true;
    letGo(this);
  }
}

// Baby back with mum: she scoops it up into a big cuddle and rocks it, then
// sets it down beside her.
export async function cuddle(mum, baby) {
  const { scene } = mum;
  const { engine, girl } = scene;
  hold(mum);
  hold(baby);
  const side = baby.x < mum.x ? -1 : 1;
  await scene.putDown(baby, mum.x + side * 10, mum.y + 1);
  mum.facing = side;
  baby.facing = -side;
  girl.faceToward(mum.x);
  engine.audio.play('hoo');
  // Up into mum's arms...
  mum.frame = 'wave1';
  baby.frame = 'hop';
  await engine.tweens.to(baby, { lift: 10, x: mum.x + side * 5 }, 0.3, ease.outQuad);
  // ...and a gentle rock side to side.
  engine.audio.play('giggle');
  for (let i = 0; i < 4; i++) {
    mum.boing(0.5);
    baby.facing = i % 2 ? side : -side;
    await engine.wait(0.3);
    scene.hearts((mum.x + baby.x) / 2, mum.y - 32, 1);
  }
  mum.frame = 'blink';
  baby.frame = 'blink';
  await engine.wait(0.5);
  scene.findSticker('frosty.cuddle', mum.x, mum.y - 36);
  // Back down beside her.
  baby.frame = 'hop';
  await engine.tweens.to(baby, { lift: 0, x: mum.x + side * 14 }, 0.3, ease.inQuad);
  girl.say('heart', 1.4);
  letGo(mum);
  letGo(baby);
  if (engine.scene !== scene) {
    return; // she left mid-cuddle; they're remembered where they landed
  }
  scene.settle(baby);
}

// ------------------------------------------------------------------- secret
// A big soft snow drift with a shy snow hare living behind it. It peeks up
// over the top; the second time it wiggles its ears; the third it bounds
// right over the drift and back, kicking up a sticker.
export class SnowDrift extends Secret {
  constructor(assets) {
    const { x, y } = FROSTY_SECRETS.drift;
    super(x, y, { w: 34, h: 12, reach: 22 });
    this.img = assets.drift;
    this.hareImgs = assets.hare;
    this.peek = 0; // how far the hare is up over the drift, 0..1
    this.jump = null; // { p } while bounding over the top
    this.blink = false;
  }

  async reveal(n) {
    const { scene } = this;
    const { engine } = scene;
    engine.audio.play('poof');
    scene.bits(this.x, this.y - 10, 5, FR.snow);
    await engine.wait(0.3);
    const kind = n % 3;
    if (kind === 2) {
      engine.audio.play('wheee');
      this.jump = { p: 0 };
      this.react('surprised', 'bang');
      await engine.tweens.to(this.jump, { p: 0.5 }, 0.45, ease.linear);
      scene.findSticker('frosty.hare', this.x, this.y - 34); // kicked up off its paws
      await engine.tweens.to(this.jump, { p: 1 }, 0.45, ease.linear);
      engine.audio.play('poof');
      scene.bits(this.x, this.y - 8, 6, FR.snow);
      this.jump = null;
    } else {
      engine.audio.play('peek');
      await engine.tweens.to(this, { peek: 1 }, 0.3, ease.outQuad);
      this.react('surprised', 'bang');
      for (let i = 0; i < (kind === 1 ? 4 : 2); i++) {
        this.blink = i % 2 === 1;
        await engine.wait(0.3);
      }
      this.blink = false;
      engine.audio.play('hide');
      await engine.tweens.to(this, { peek: 0 }, 0.25, ease.inQuad);
    }
    this.react('cheer', 'heart');
  }

  draw(r) {
    // The hare peeks up from behind, then the drift goes over it.
    if (this.peek > 0) {
      r.image(this.hareImgs[this.blink ? 1 : 0], this.x + 4, this.y - Math.round(this.peek * 10));
    }
    r.image(this.img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }

  // The hare bounds over the top of everything.
  drawOver(r) {
    const j = this.jump;
    if (!j) {
      return;
    }
    const x = this.x + 18 - j.p * 36;
    const y = this.y - 10 - Math.sin(Math.PI * j.p) * 26;
    r.image(this.hareImgs[0], x, y, { flipX: true });
  }
}
