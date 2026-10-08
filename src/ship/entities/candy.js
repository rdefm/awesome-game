import { ease } from '../../engine/tween.js';
import { CANDY_SECRETS, GINGERBREAD_HOUSE, HOUSE_DOOR, JAR, OVEN } from '../layout.js';
import { Carryable } from './carryable.js';
import { hold, isFriendItem, letGo, play } from './friends.js';
import { isSnack } from './items.js';
import { Secret } from './secret.js';
import { Stroller } from './stroller.js';

const inRect = (px, py, x, y, w, h, pad = 3) => px >= x - pad && px <= x + w + pad && py >= y - pad && py <= y + h + pad;

const JELLYBEANS = ['#ff5a5a', '#ffe066', '#7cf28a', '#6fb2ff', '#ff8fc8', '#9a7cf0'];

// ---------------------------------------------------------------- lollipop
// Tap it and its swirl spins round with a twinkle. The gummy bear would
// love a lick.
export class Lollipop extends Carryable {
  // `state.v` picks its colours.
  constructor(assets, state) {
    super(state);
    this.imgs = assets.lollipop[(state.v ?? 0) % assets.lollipop.length];
    this.spin = 0; // seconds of spinning left
    this.turn = 0;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 8 && py > this.y - 24 && py < this.y + 3;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tinkle');
    this.boing(0.8);
    this.spin = 1.2;
    scene.sparkles(this.x, this.y - 18, 5);
    scene.girl.faceToward(this.x);
    scene.girl.say('star', 1);
  }

  update(dt) {
    this.turn += dt * (this.spin > 0 ? 14 : 0.6);
    this.spin = Math.max(0, this.spin - dt);
  }

  draw(r) {
    this.shadow(r, 6);
    r.image(this.imgs[Math.floor(this.turn) % this.imgs.length], this.x, this.y + 1, {
      scaleX: this.bounce, scaleY: 2 - this.bounce,
    });
  }
}

// ----------------------------------------------------------------- gumdrop
// Tap it and it bounces up in a puff of sugar.
export class Gumdrop extends Carryable {
  constructor(assets, state) {
    super(state);
    this.img = assets.gumdrop[(state.v ?? 0) % assets.gumdrop.length];
    this.lift = 0;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 8 && py > this.y - 12 - this.lift && py < this.y + 3;
  }

  onTap() {
    const { scene } = this;
    const { tweens } = scene.engine;
    scene.engine.audio.play('boing');
    this.boing(1.2);
    tweens.to(this, { lift: 12 }, 0.18, ease.outQuad).then(() => tweens.to(this, { lift: 0 }, 0.22, ease.inQuad));
    scene.bits(this.x, this.y - 6, 5, '#ffffff');
    scene.girl.faceToward(this.x);
    scene.girl.say('heart', 1);
  }

  onPickUp() {
    this.lift = 0;
  }

  draw(r) {
    this.shadow(r, 9 - Math.min(4, this.lift / 3));
    r.image(this.img, this.x, this.y + 1 - this.lift, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ------------------------------------------------------------- gummy bear
// A wobbly jelly gummy bear. Tap it and it jiggles all over. Give it a
// lollipop and it has the biggest, happiest lick.
export class GummyBear extends Stroller {
  constructor(assets, state) {
    super(state, assets.gummy, { speed: 16, wander: 60, width: 14, height: 18 });
  }

  onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (!this.free) {
      return;
    }
    const { scene } = this;
    scene.engine.audio.play('wobble');
    this.boing(1.8);
    this.hopUp(6);
    scene.girl.faceToward(this.x);
    scene.girl.say('heart', 1.2);
  }

  onPickUp() {
    super.onPickUp();
    this.scene.engine.audio.play('wobble');
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item) || item.kind === 'lollipop');
  }

  receive(item) {
    if (isFriendItem(item)) {
      return play(item, this);
    }
    return isSnack(item) ? this.eat(item) : this.lick(item);
  }

  // The lollipop stood up beside it: three long licks, a jelly wobble of
  // delight each time, and a thank-you sticker.
  async lick(lolly) {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    const side = lolly.x < this.x ? -1 : 1;
    await scene.putDown(lolly, this.x + side * 11, this.y + 1);
    this.facing = side;
    girl.faceToward(this.x);
    for (let i = 0; i < 3; i++) {
      this.frame = 'wave1';
      engine.audio.play('lick');
      await engine.wait(0.3);
      this.frame = 'idle';
      lolly.spin = 0.3;
      lolly.boing(0.5);
      this.boing(1.4);
      scene.sparkles(lolly.x, lolly.y - 18, 3);
      await engine.wait(0.25);
    }
    engine.audio.play('wobble');
    this.frame = 'blink'; // mmm!
    scene.hearts(this.x, this.y - 20, 3);
    await engine.wait(0.5);
    girl.say('heart', 1.4);
    scene.findSticker('candy.lolly', this.x, this.y - 22);
    letGo(this);
  }
}

// ------------------------------------------------------------------ Ginger
// Ginger, the gingerbread girl who lives in the gingerbread house. Tap her
// and she does a jingly little dance. She's never seen snow: bring her a
// snowball from Frosty and she's over the moon.
export class Ginger extends Stroller {
  constructor(assets, state) {
    super(state, assets.ginger, { speed: 14, wander: 70, width: 14, height: 24 });
  }

  onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (this.free) {
      this.dance();
    }
  }

  // Hop, twirl, hop, and a wave.
  async dance() {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(this.x);
    engine.audio.play('jingle');
    for (let i = 0; i < 2; i++) {
      this.frame = 'hop';
      await engine.tweens.to(this, { lift: 6 }, 0.15, ease.outQuad);
      await engine.tweens.to(this, { lift: 0 }, 0.18, ease.inQuad);
      this.turn = 0;
      await engine.tweens.to(this, { turn: 1 }, 0.4, ease.inOutSine);
      this.turn = 0;
    }
    this.facing = girl.x < this.x ? -1 : 1;
    for (let i = 0; i < 4; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      await engine.wait(0.18);
    }
    scene.hearts(this.x, this.y - 28, 2);
    girl.say('heart', 1.2);
    letGo(this);
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item) || item.kind === 'snowball');
  }

  receive(item) {
    if (isFriendItem(item)) {
      return play(item, this);
    }
    return isSnack(item) ? this.eat(item) : this.firstSnow(item);
  }

  // A snowball beside her: she pokes it, it puffs a flurry of snow all over
  // her, and she twirls round and round in it, giving a sticker to say thank you.
  async firstSnow(ball) {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    const side = ball.x < this.x ? -1 : 1;
    await scene.putDown(ball, this.x + side * 10, this.y + 1);
    this.facing = side;
    girl.faceToward(this.x);
    this.frame = 'wave1';
    ball.boing(1.2);
    engine.audio.play('poof');
    for (let i = 0; i < 3; i++) {
      scene.bits(this.x, this.y - 30, 8, '#ffffff');
      await engine.wait(0.15);
    }
    engine.audio.play('jingle');
    for (let i = 0; i < 3; i++) {
      this.turn = 0;
      await engine.tweens.to(this, { turn: 1 }, 0.35, ease.inOutSine);
      scene.bits(this.x, this.y - 30, 4, '#ffffff');
    }
    this.turn = 0;
    this.frame = 'blink';
    scene.hearts(this.x, this.y - 28, 3);
    await engine.wait(0.5);
    girl.say('heart', 1.4);
    scene.findSticker('candy.snow', this.x, this.y - 30); // a thank-you present
    letGo(this);
  }
}

// ------------------------------------------------------------------- secret
// A big candy-floss bush with a sugar mouse living in it. It peeks out over
// the top; the second time it twitches its nose; the third it scampers out
// across the front and back in again, dropping a sticker.
export class FlossBush extends Secret {
  constructor(assets) {
    const { x, y } = CANDY_SECRETS.bush;
    super(x, y, { w: 34, h: 16, reach: 22 });
    this.imgs = assets.flossBush;
    this.mouseImgs = assets.sugarMouse;
    this.rustle = false;
    this.peek = 0; // how far the mouse is up over the bush, 0..1
    this.dash = null; // { p } while scampering out and back
    this.blink = false;
  }

  async reveal(n) {
    const { scene } = this;
    const { engine } = scene;
    engine.audio.play('rustle');
    this.rustle = true;
    scene.bits(this.x, this.y - 12, 4, '#ffb0dc');
    await engine.wait(0.35);
    this.rustle = false;
    const kind = n % 3;
    if (kind === 2) {
      engine.audio.play('squeak');
      this.dash = { p: 0 };
      this.react('surprised', 'bang');
      await engine.tweens.to(this.dash, { p: 0.5 }, 0.6, ease.inOutSine);
      scene.findSticker('candy.mouse', this.x + 20, this.y - 6); // dropped as it runs
      await engine.tweens.to(this.dash, { p: 1 }, 0.6, ease.inOutSine);
      engine.audio.play('rustle');
      this.dash = null;
    } else {
      engine.audio.play('peek');
      await engine.tweens.to(this, { peek: 1 }, 0.3, ease.outQuad);
      this.react('surprised', 'bang');
      for (let i = 0; i < (kind === 1 ? 4 : 2); i++) {
        this.blink = i % 2 === 1;
        if (kind === 1) {
          engine.audio.play('sniff');
        }
        await engine.wait(0.3);
      }
      this.blink = false;
      engine.audio.play('hide');
      await engine.tweens.to(this, { peek: 0 }, 0.25, ease.inQuad);
    }
    this.react('cheer', 'heart');
  }

  draw(r) {
    // The mouse peeks up from behind, then the bush goes over it.
    if (this.peek > 0) {
      r.image(this.mouseImgs[this.blink ? 1 : 0], this.x + 4, this.y - 8 - Math.round(this.peek * 8));
    }
    r.image(this.imgs[this.rustle ? 1 : 0], this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }

  // The mouse scampers out in front of everything: out to the right, a turn,
  // and back into the bush.
  drawOver(r) {
    const d = this.dash;
    if (!d) {
      return;
    }
    const out = Math.sin(Math.PI * d.p);
    const x = this.x + out * 40;
    const y = this.y + 4 + Math.abs(Math.sin(d.p * 20)) * -2;
    r.image(this.mouseImgs[0], x, y, { flipX: d.p > 0.5 });
  }
}

// ------------------------------------------------------- gingerbread house
// The house far off at the back, with its path winding up to the door. Tap
// it and she walks to the path, then up it to go inside (see CandyScene).
export class GingerbreadHouse {
  constructor(assets) {
    this.imgs = assets.house;
    this.x = GINGERBREAD_HOUSE.x;
    this.y = GINGERBREAD_HOUSE.y;
    this.spot = GINGERBREAD_HOUSE.path[0];
    this.depth = 0; // the path's on the ground: everything stands in front of it
    this.open = false;
    this.squash = 0;
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }

  hitTest(px, py) {
    return px >= this.x - 24 && px <= this.x + 24 && py >= this.y - 46 && py <= this.y + 2;
  }

  onTap() {
    const { scene } = this;
    if (scene.busy) {
      return;
    }
    scene.engine.audio.play('tap');
    this.squash = 0.6;
    scene.engine.tweens.to(this, { squash: 0 }, 0.5, ease.outElastic);
    scene.interact(this);
  }

  use() {
    this.scene.enterHouse();
  }

  draw(r) {
    r.image(this.imgs.path, 0, 0, { ax: 0, ay: 0 });
    r.image(this.open ? this.imgs.open : this.imgs.shut, this.x, this.y, { scaleX: this.bounce, scaleY: 2 - this.bounce });
    // Smoke curling from the chimney.
    const t = this.scene.engine.time;
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.4 + i / 3) % 1;
      r.rect(this.x + 11 + Math.sin(k * 6 + i) * 2, this.y - 40 - k * 16, 2, 2, '#ffffff', 0.7 * (1 - k));
    }
  }
}

// ----------------------------------------------------------- inside house
// Shared "you touched me" feedback for the things in the house that stay put.
class HouseProp {
  constructor() {
    this.squash = 0;
    this.depth = -10;
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }

  onTap() {
    this.scene.engine.audio.play('tap');
    this.squash = 1;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.35, ease.outElastic);
    this.scene.interact(this);
  }
}

// The front door: tap it and she goes back out to Candy. It swings open on
// its left-hand hinge.
export class HouseDoor extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.houseDoor;
    this.spot = HOUSE_DOOR.spot;
    this.open = 0; // 0 = shut, 1 = swung wide
  }

  hitTest(px, py) {
    const { x, y, w, h } = HOUSE_DOOR;
    return inRect(px, py, x, y, w, h);
  }

  onTap(p) {
    if (!this.scene.busy) {
      super.onTap(p);
    }
  }

  use() {
    this.scene.leaveHouse();
  }

  async swing(to) {
    this.scene.engine.audio.play('creak');
    await this.scene.engine.tweens.to(this, { open: to }, 0.4, to ? ease.outCubic : ease.inQuad);
  }

  draw(r) {
    const { x, y, w, h } = HOUSE_DOOR;
    r.image(this.imgs.open, x, y + h, { ax: 0 });
    const shut = 1 - this.open;
    if (shut > 0.05) {
      r.image(this.imgs.shut, x, y + h, { ax: 0, scaleX: shut * this.bounce });
    }
  }
}

// Ginger's oven: tap it and it glows, dings, and out pops a fresh cupcake
// (the first one ever has a sticker baked into it). It won't bake more than
// a few at a time.
export const MAX_CUPCAKES = 3;

export class Oven extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.oven;
    this.spot = OVEN.spot;
    this.glow = 0;
    this.baking = false;
  }

  hitTest(px, py) {
    return inRect(px, py, OVEN.x, OVEN.y, OVEN.w, OVEN.h);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.baking) {
      return;
    }
    girl.faceToward(OVEN.x + OVEN.w / 2);
    const cupcakes = scene.entities.filter((e) => e.kind === 'cupcake').length;
    if (cupcakes >= MAX_CUPCAKES) {
      girl.say('heart', 1.2);
      scene.toast('PLENTY OF CUPCAKES!');
      return;
    }
    this.baking = true;
    girl.act('reach', 0.4);
    engine.audio.play('flare');
    await engine.tweens.to(this, { glow: 1 }, 0.3);
    for (let i = 0; i < 3; i++) {
      scene.bits(OVEN.x + 25, OVEN.y - 2, 2, '#ffffff'); // puffs from the chimney
      await engine.wait(0.3);
    }
    engine.audio.play('ding');
    const x = OVEN.x + 25;
    const y = OVEN.y + 44;
    const cake = scene.spawn('cupcake', x, y);
    if (cake) {
      scene.sparkles(x, y - 6, 5);
      await scene.putDown(cake, x, this.spot.y + 6);
      const found = scene.findSticker('candy.bake', cake.x, cake.y - 14);
      // A cheer, unless she's off somewhere else by now.
      if (found && (girl.mode === 'idle' || girl.mode === 'act')) {
        girl.act('cheer', 0.8);
      }
    }
    girl.say('heart', 1.2);
    await engine.tweens.to(this, { glow: 0 }, 0.4);
    this.baking = false;
  }

  draw(r) {
    const s = this.bounce;
    r.image(this.imgs[this.glow > 0.5 ? 1 : 0], OVEN.x + OVEN.w / 2, OVEN.y + OVEN.h, { scaleX: s, scaleY: 2 - s });
  }
}

// A jar of jellybeans on the shelf: tap it and the lid pops up and
// jellybeans fly out.
export class JellyJar extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.jar;
    this.spot = JAR.spot;
    this.open = false;
  }

  hitTest(px, py) {
    return inRect(px, py, JAR.x - 7, JAR.y - 20, 14, 20);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.open) {
      return;
    }
    girl.faceToward(JAR.x);
    girl.act('reach', 0.4);
    this.open = true;
    engine.audio.play('pop');
    for (const color of JELLYBEANS) {
      scene.bits(JAR.x, JAR.y - 18, 1, color);
    }
    girl.say('star', 1.2);
    await engine.wait(0.6);
    this.open = false;
  }

  draw(r) {
    const s = this.bounce;
    r.image(this.imgs[this.open ? 1 : 0], JAR.x, JAR.y, { scaleX: s, scaleY: 2 - s });
  }
}
