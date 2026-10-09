import { ease } from '../../engine/tween.js';
import { FR } from '../art/frosty.js';
import { IC, NEST } from '../art/iceCave.js';
import { CAMPFIRE, FUR_NEST, ICE_CAVE, ICICLES, POND_WINDOW } from '../layout.js';
import { hold, isFriendItem } from './friends.js';
import { FarHouse, HouseProp, drawZzz, inRect, wakeAndHopOut } from './house.js';

// ---------------------------------------------------------------- the house
// The yetis' ice cave, in the mountainside at the back of Frosty, with its
// snowy path up to the mouth. Tap it and she walks up the path and goes
// inside (see FrostyScene).
export class IceCave extends FarHouse {
  constructor(assets) {
    super(assets.iceCave, ICE_CAVE);
  }
}

// ------------------------------------------------------------ inside house
// The icicles hanging from the ledge: tap them and she runs her hand along
// them, each one swinging and chiming its own note, down the row and back.
export class Icicles extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.icicles;
    this.spot = ICICLES.spot;
    this.swing = ICICLES.lengths.map(() => 0); // how far each is swinging, -1..1
    this.playing = false;
  }

  hitTest(px, py) {
    const { x, y, gap, lengths } = ICICLES;
    return inRect(px, py, x - gap / 2, y, gap * lengths.length, Math.max(...lengths));
  }

  // The order they chime in: along the row, then back to the first.
  static tune() {
    const n = ICICLES.lengths.length;
    return [...Array(n).keys(), 0];
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.playing) {
      return;
    }
    this.playing = true;
    girl.faceToward(ICICLES.x + (ICICLES.gap * (ICICLES.lengths.length - 1)) / 2);
    girl.act('reach', 0.3);
    for (const i of Icicles.tune()) {
      this.ring(i);
      await engine.wait(0.16);
    }
    girl.say('note', 1.2);
    this.playing = false;
  }

  // Icicle i chimes (the shortest highest) and swings to and fro.
  ring(i) {
    const { scene } = this;
    const { lengths } = ICICLES;
    const note = [...lengths].sort((a, b) => b - a).indexOf(lengths[i]);
    scene.engine.audio.play('plink', { note });
    scene.sparkles(this.tipX(i), ICICLES.y + lengths[i], 1);
    this.swing[i] = 1;
    const { tweens } = scene.engine;
    tweens.to(this.swing, { [i]: -1 }, 0.2, ease.inOutSine).then(() => tweens.to(this.swing, { [i]: 0 }, 0.3, ease.outElastic));
  }

  tipX(i) {
    return ICICLES.x + i * ICICLES.gap;
  }

  draw(r) {
    const s = this.bounce;
    ICICLES.lengths.forEach((len, i) => {
      r.image(this.imgs[i], this.tipX(i) + Math.round(this.swing[i] * 2), ICICLES.y, { ay: 0, scaleY: 2 - s });
    });
  }
}

// The window of clear ice onto the frozen pond, a fish swimming under the
// ice. Tap it and she knocks on the glass: the fish comes up to see, blows
// some bubbles, does a flip and swims off again.
export class PondWindow extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.iceFish;
    this.spot = POND_WINDOW.spot;
    this.fish = { x: 0, y: 6, facing: 1 }; // from the window's centre
    this.visiting = false;
    this.flip = 0; // 0..1 through a flip
    this.bubbles = [];
  }

  hitTest(px, py) {
    const { x, y, r } = POND_WINDOW;
    return Math.hypot(px - x, py - y) <= r + 4;
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.visiting) {
      return;
    }
    this.visiting = true;
    girl.faceToward(POND_WINDOW.x);
    girl.act('reach', 0.4);
    for (let i = 0; i < 2; i++) {
      engine.audio.play('click');
      await engine.wait(0.18);
    }
    const { fish } = this;
    fish.facing = fish.x > 0 ? -1 : 1;
    await engine.tweens.to(fish, { x: 0, y: -2 }, 0.5, ease.outQuad);
    for (let i = 0; i < 3; i++) {
      engine.audio.play('plop');
      this.bubbles.push({ x: fish.x + fish.facing * 5, y: fish.y - 2 });
      await engine.wait(0.25);
    }
    engine.audio.play('splash');
    await engine.tweens.to(this, { flip: 1 }, 0.5, ease.inOutSine);
    this.flip = 0;
    girl.say('heart', 1.2);
    scene.hearts(POND_WINDOW.x, POND_WINDOW.y - POND_WINDOW.r, 1);
    await engine.tweens.to(fish, { y: 6 }, 0.6, ease.inOutSine);
    this.visiting = false;
  }

  update(dt) {
    for (const b of this.bubbles) {
      b.y -= dt * 8;
    }
    this.bubbles = this.bubbles.filter((b) => b.y > -8);
    if (this.visiting) {
      return;
    }
    // Lazily to and fro under the ice.
    const { fish } = this;
    fish.x += fish.facing * dt * 5;
    if (Math.abs(fish.x) > 11) {
      fish.x = Math.sign(fish.x) * 11;
      fish.facing = -fish.facing;
    }
  }

  draw(r) {
    const { x, y } = POND_WINDOW;
    const { fish } = this;
    const t = this.scene.engine.time;
    const frame = Math.floor(t * 4) % 2;
    // A flip: it turns right over (end on, it squashes flat).
    const flat = Math.max(0.15, Math.abs(Math.cos(this.flip * Math.PI)));
    const flipped = this.flip > 0.5;
    r.image(this.imgs[frame], x + Math.round(fish.x), y + Math.round(fish.y) + 4, {
      ay: 1, flipX: (fish.facing < 0) !== flipped, scaleY: flat,
    });
    for (const b of this.bubbles) {
      r.pixel(x + Math.round(b.x), y + Math.round(b.y), FR.iceLight);
    }
  }
}

// The fur-rug nest: tap it and she fluffs it up. Drop a friend in it and it
// curls up for a nap (zzz), then wakes with a big stretch and hops out.
export class FurNest extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.furNest;
    this.spot = FUR_NEST.spot;
    this.friend = null; // napping in it
    this.sleepy = false;
    this.fluffing = false;
  }

  hitTest(px, py) {
    return inRect(px, py, FUR_NEST.x - NEST.w / 2, FUR_NEST.y - NEST.h, NEST.w, NEST.h);
  }

  accepts(item) {
    return isFriendItem(item) && !this.friend && !this.fluffing;
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.fluffing) {
      return;
    }
    this.fluffing = true;
    girl.faceToward(FUR_NEST.x);
    for (let i = 0; i < 2; i++) {
      girl.act('reach', 0.2);
      engine.audio.play('rustle');
      scene.bits(FUR_NEST.x - 8 + i * 16, FUR_NEST.y - 8, 3, IC.furLight);
      await engine.wait(0.25);
    }
    girl.say('heart', 1.2);
    this.fluffing = false;
  }

  // A friend napping in it is tapped (it's sat in us, like a seat).
  spin() {
    this.use();
  }

  // A napping friend can't be picked up (it's held), but if it were, it'd
  // simply leave.
  release() {
    this.friend = null;
  }

  // A friend dropped on it: in it goes (sat in it, so it's drawn here), naps,
  // then wakes with a stretch and hops back out.
  async receive(friend) {
    const { scene } = this;
    const { engine } = scene;
    hold(friend);
    this.fluffing = true;
    await scene.putDown(friend, FUR_NEST.x, FUR_NEST.spot.y);
    friend.seat = this;
    this.friend = friend;
    this.fluffing = false;
    engine.audio.play('rustle');
    await engine.wait(0.4);
    this.sleepy = true;
    friend.pose?.('blink');
    engine.audio.play('lullaby');
    await engine.wait(3);
    this.sleepy = false;
    await wakeAndHopOut(this, friend, FUR_NEST.x);
  }

  draw(r) {
    const { x, y } = FUR_NEST;
    const s = this.bounce;
    r.image(this.imgs.back, x, y, { scaleX: s, scaleY: 2 - s });
    const { friend } = this;
    if (friend) {
      r.image(friend.seatFrame(), x, y - 4, { flipX: friend.facing < 0 });
      if (this.sleepy) {
        drawZzz(r, this.scene, x, y);
      }
    }
    r.image(this.imgs.front, x, y, { scaleX: s, scaleY: 2 - s });
  }
}

// The campfire. Tap it and she warms her hands: it flares up, crackling, and
// every friend about the cave comes and huddles round it.
export class Campfire extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.campfire;
    this.spot = CAMPFIRE.spot;
    this.flare = 0; // 0..1, how high it's leaping
    this.warming = false;
  }

  hitTest(px, py) {
    return inRect(px, py, CAMPFIRE.x - 13, CAMPFIRE.y - 30, 26, 32);
  }

  // The friends in the cave free to come to the fire (strolling ones only:
  // they walk over), at most one for each spot round it (the rest stay put).
  huddlers() {
    return this.scene.entities.filter((e) => isFriendItem(e) && e.free && 'walk' in e).slice(0, CAMPFIRE.seats.length);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.warming) {
      return;
    }
    this.warming = true;
    girl.faceToward(CAMPFIRE.x);
    girl.act('reach', 0.8);
    engine.audio.play('flare');
    await engine.tweens.to(this, { flare: 1 }, 0.3, ease.outQuad);
    this.huddlers().forEach((friend, i) => {
      const seat = CAMPFIRE.seats[i];
      friend.walk = { x: seat.x, y: seat.y, steps: 0 };
    });
    for (let i = 0; i < 3; i++) {
      engine.audio.play('crack');
      scene.bits(CAMPFIRE.x, CAMPFIRE.y - 20, 3, IC.flameLight);
      await engine.wait(0.3);
    }
    scene.hearts(CAMPFIRE.x, CAMPFIRE.y - 34, 2);
    girl.say('heart', 1.4);
    await engine.tweens.to(this, { flare: 0 }, 0.6);
    this.warming = false;
  }

  draw(r) {
    const { x, y } = CAMPFIRE;
    const t = this.scene.engine.time;
    // A warm glow on the floor round it.
    r.rect(x - 24, y - 4, 48, 8, IC.glow, 0.15 + this.flare * 0.15);
    const s = this.bounce;
    const frame = Math.floor(t * 6) % 2;
    r.image(this.imgs[this.flare > 0.3 ? 2 + frame : frame], x, y, { scaleX: s, scaleY: 2 - s });
  }
}
