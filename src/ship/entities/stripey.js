import { ease } from '../../engine/tween.js';
import { ST, ZIG_STRIPES } from '../art/stripey.js';
import { STRIPEY_SECRETS } from '../layout.js';
import { Carryable } from './carryable.js';
import { hold, isFriendItem, letGo, play } from './friends.js';
import { isSnack } from './items.js';
import { Secret } from './secret.js';
import { Stroller } from './stroller.js';

// ------------------------------------------------------------- stripe stone
// A banded pebble. Tap it and it plinks a note (each colour its own). Zig
// can play a whole tune with one.
export class StripeStone extends Carryable {
  // `state.v` picks its colours, and its note.
  constructor(assets, state) {
    super(state);
    this.v = state.v ?? 0;
    this.img = assets.stripeStone[this.v % assets.stripeStone.length];
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 9 && py > this.y - 11 && py < this.y + 3;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('plink', { note: this.v * 2 });
    this.boing(1);
    scene.sparkles(this.x, this.y - 6, 3);
    scene.girl.faceToward(this.x);
    scene.girl.say('note', 1);
  }

  draw(r) {
    this.shadow(r, 10);
    r.image(this.img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ------------------------------------------------------------- stripe cactus
// A stripy cactus that wobbles when tapped. It's very thirsty: give it a
// juice from the ship's snack locker and it drinks it all up and bursts into
// flower (`stage` 1), and stays in flower for good.
export class StripeCactus extends Carryable {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.stripeCactus;
    this.stage = state.stage ?? 0;
    this.busy = false;
  }

  get bloomed() {
    return this.stage > 0;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 9 && py > this.y - 26 && py < this.y + 3;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play(this.bloomed ? 'tinkle' : 'boing');
    this.boing(1.3);
    if (this.bloomed) {
      scene.sparkles(this.x, this.y - 22, 4);
    }
    scene.girl.faceToward(this.x);
    scene.girl.say(this.bloomed ? 'heart' : 'question', 1);
  }

  accepts(item) {
    return !this.busy && !this.held && !this.falling && !this.bloomed && item.kind === 'juice';
  }

  // Glug, glug, glug... and pop! A flower. The first one has a sticker in it.
  async receive(juice) {
    const { scene } = this;
    const { engine, girl } = scene;
    this.busy = true;
    this.draggable = false;
    juice.draggable = false;
    scene.useUp(juice);
    const side = juice.x < this.x ? -1 : 1;
    await engine.tweens.to(juice, { x: this.x + side * 9, y: this.y }, 0.2, ease.outQuad);
    girl.faceToward(this.x);
    for (let sip = 1; sip <= 3; sip++) {
      engine.audio.play('slurp');
      this.boing(0.7);
      juice.bites = sip;
      await engine.wait(0.35);
    }
    scene.remove(juice);
    engine.tweens.cancel(juice);
    engine.audio.play('grow');
    this.stage = 1;
    scene.saveStage(this, 1);
    this.boing(1.8);
    scene.sparkles(this.x, this.y - 22, 8);
    scene.bits(this.x, this.y - 22, 6, '#ff7ab8');
    girl.say('star', 1.4);
    scene.findSticker('stripey.bloom', this.x, this.y - 30);
    this.busy = false;
    this.draggable = true;
  }

  draw(r) {
    this.shadow(r, 12);
    r.image(this.imgs[this.bloomed ? 1 : 0], this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ---------------------------------------------------------------------- Zig
// Things from other planets that give Zig new stripes, and which stripes
// (see ZIG_STRIPES).
export const NEW_STRIPES = {
  bluebell: 1,
  firebloom: 2,
  frostflower: 3,
  snowball: 3,
  lollipop: 4,
  gumdrop: 4,
};

// Zig, the stripey alien, strolls about like any friend (see stroller.js).
// Tap it and it waves both its arms about with a wobbly "zig-zig!". Give it a
// stripe stone and it plays a tune on its own stripes, like a xylophone.
// Bring it something from another planet and it twirls round into stripes
// of that planet's colours (remembered as its `stage`).
export class Zig extends Stroller {
  constructor(assets, state) {
    const stripes = (state.stage ?? 0) % ZIG_STRIPES.length;
    super(state, assets.zig[stripes], { speed: 16, wander: 70, width: 16, height: 28 });
    this.assets = assets;
    this.stripes = stripes;
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
    this.boing(1);
    this.facing = girl.x < this.x ? -1 : 1;
    girl.faceToward(this.x);
    engine.audio.play('zig');
    for (let i = 0; i < 6; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      this.boing(0.4);
      await engine.wait(0.16);
    }
    scene.hearts(this.x, this.y - 30, 2);
    girl.say('heart', 1.2);
    letGo(this);
  }

  onPickUp() {
    super.onPickUp();
    this.scene.engine.audio.play('zig');
  }

  accepts(item) {
    const wanted = isSnack(item) || isFriendItem(item) || item.kind === 'stripestone' || Object.hasOwn(NEW_STRIPES, item.kind);
    return this.free && wanted;
  }

  receive(item) {
    if (isFriendItem(item)) {
      return play(item, this);
    }
    if (isSnack(item)) {
      return this.eat(item);
    }
    return item.kind === 'stripestone' ? this.playTune(item) : this.restripe(item);
  }

  // The stone set down beside it, Zig taps its own stripes top to bottom, a
  // note on each, then all the way back up — and gives her a sticker.
  async playTune(stone) {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    const side = stone.x < this.x ? -1 : 1;
    await scene.putDown(stone, this.x + side * 14, this.y + 1);
    this.facing = side;
    girl.faceToward(this.x);
    const notes = [4, 3, 2, 1, 0, 2, 4, 7];
    for (let i = 0; i < notes.length; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      engine.audio.play('plink', { note: notes[i] });
      this.boing(0.3);
      const { a, b } = ZIG_STRIPES[this.stripes];
      scene.bits(this.x, this.y - 6 - notes[i] * 3, 2, i % 2 ? a : b);
      await engine.wait(0.22);
    }
    engine.audio.play('cheer');
    this.frame = 'hop';
    await engine.tweens.to(this, { lift: 8 }, 0.16, ease.outQuad);
    scene.hearts(this.x, this.y - 30, 3);
    await engine.tweens.to(this, { lift: 0 }, 0.2, ease.inQuad);
    girl.say('note', 1.4);
    scene.findSticker('stripey.tune', this.x, this.y - 32); // a thank-you present
    letGo(this);
  }

  // Set down beside it, the thing from far away makes Zig twirl round —
  // and come back in that planet's colours.
  async restripe(thing) {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    const side = thing.x < this.x ? -1 : 1;
    await scene.putDown(thing, this.x + side * 15, this.y + 1);
    this.facing = side;
    girl.faceToward(this.x);
    engine.audio.play('zig');
    this.frame = 'wave1';
    await engine.wait(0.4);
    const stripes = NEW_STRIPES[thing.kind];
    engine.audio.play('wheee');
    for (let spin = 0; spin < 2; spin++) {
      this.turn = 0;
      await engine.tweens.to(this, { turn: 0.25 }, 0.18, ease.linear);
      if (spin === 1) {
        this.wear(stripes);
        scene.saveStage(this, stripes);
      }
      await engine.tweens.to(this, { turn: 1 }, 0.42, ease.linear);
    }
    this.turn = 0;
    const { a, b } = ZIG_STRIPES[stripes];
    scene.bits(this.x, this.y - 16, 6, a);
    scene.bits(this.x, this.y - 16, 6, b);
    scene.sparkles(this.x, this.y - 16, 6);
    engine.audio.play('cheer');
    scene.hearts(this.x, this.y - 30, 3);
    girl.say('heart', 1.4);
    scene.findSticker('stripey.stripes', this.x, this.y - 32);
    letGo(this);
  }

  // Changes into stripes `stripes` (see ZIG_STRIPES).
  wear(stripes) {
    this.stripes = stripes;
    this.imgs = this.assets.zig[stripes];
  }
}

// ------------------------------------------------------------------- secret
// A low striped mound of sand with a stripy worm living in it. It pokes its
// head out to look around; the second time it has a good wiggle; the third
// it springs right up out of the mound in a loop and back in, flicking a
// sticker out.
export class SandMound extends Secret {
  constructor(assets) {
    const { x, y } = STRIPEY_SECRETS.mound;
    super(x, y, { w: 32, h: 12, reach: 22 });
    this.img = assets.mound;
    this.wormImgs = assets.worm;
    this.peek = 0; // how far the worm is up out of the hole, 0..1
    this.wiggle = 0;
    this.jump = null; // { p } while springing out and back in
    this.blink = false;
  }

  async reveal(n) {
    const { scene } = this;
    const { engine } = scene;
    engine.audio.play('wriggle');
    scene.bits(this.x, this.y - 8, 4, ST.sandDark);
    await engine.wait(0.3);
    const kind = n % 3;
    if (kind === 2) {
      engine.audio.play('wheee');
      this.jump = { p: 0 };
      this.react('surprised', 'bang');
      await engine.tweens.to(this.jump, { p: 0.5 }, 0.5, ease.linear);
      scene.findSticker('stripey.worm', this.x, this.y - 40); // flicked off its tail
      await engine.tweens.to(this.jump, { p: 1 }, 0.5, ease.linear);
      engine.audio.play('pop');
      scene.bits(this.x, this.y - 8, 6, ST.sandDark);
      this.jump = null;
    } else {
      engine.audio.play('peek');
      await engine.tweens.to(this, { peek: 1 }, 0.3, ease.outQuad);
      this.react('surprised', 'bang');
      if (kind === 1) {
        engine.audio.play('giggle');
        await engine.tweens.to(this, { wiggle: 1 }, 1.2, ease.linear);
        this.wiggle = 0;
      } else {
        for (let i = 0; i < 2; i++) {
          this.blink = i % 2 === 1;
          await engine.wait(0.3);
        }
        this.blink = false;
      }
      engine.audio.play('hide');
      await engine.tweens.to(this, { peek: 0 }, 0.25, ease.inQuad);
    }
    this.react('cheer', 'heart');
  }

  draw(r) {
    // The worm pokes up out of the hole (as many rows of it as are out),
    // swaying if it's wiggling, then the front of the mound goes over it.
    const up = this.wormImgs.up[this.blink ? 1 : 0];
    const rows = Math.round(this.peek * 13);
    if (rows > 0) {
      const sway = this.wiggle > 0 ? Math.round(Math.sin(this.wiggle * Math.PI * 8) * 2) : 0;
      r.image(up[rows], this.x + sway, this.y - 5, { flipX: sway < 0 });
    }
    r.image(this.img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }

  // The worm loops the loop over everything.
  drawOver(r) {
    const j = this.jump;
    if (!j) {
      return;
    }
    const x = this.x - Math.sin(j.p * Math.PI * 2) * 14;
    const y = this.y - 6 - Math.sin(Math.PI * j.p) * 30;
    r.image(this.wormImgs.whole, x, y, { flipX: j.p > 0.5 });
  }
}
