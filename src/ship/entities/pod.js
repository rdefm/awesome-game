import { ease } from '../../engine/tween.js';
import { seededRandom } from '../../engine/pixmap.js';
import { BB } from '../art/bluebell.js';
import { BATH, PD, SCOPE, TRAY } from '../art/pod.js';
import { BUBBLE_BATH, POD, SEED_TRAY, STAR_WINDOW, TELESCOPE } from '../layout.js';
import { hold, isFriendItem } from './friends.js';
import { FarHouse, HouseProp, inRect, wakeAndHopOut } from './house.js';

// ---------------------------------------------------------------- the house
// The pink alien's round pod, far off in Bluebell's meadow, with its
// stepping-stone path up to the door. Tap it and she walks up the path and
// goes inside (see BluebellScene).
export class Pod extends FarHouse {
  constructor(assets) {
    super(assets.pod, POD);
  }
}

// ------------------------------------------------------------ inside house
const BUBBLE_RISE = 10; // px per second
const BUBBLE_TOP = 40; // how far up a bubble floats before it pops

// The bubble bath. Tap it and she swishes the water: bubbles float up out of
// it and pop. Drop a friend in and it splashes about in the bubbles, then
// gives a big shake and hops back out.
export class BubbleBath extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.bubbleBath;
    this.bubble = assets.bubble;
    this.spot = BUBBLE_BATH.spot;
    this.friend = null; // splashing in it
    this.swishing = false;
    this.bubbles = []; // from the middle of the water
  }

  hitTest(px, py) {
    return inRect(px, py, BUBBLE_BATH.x - BATH.w / 2, BUBBLE_BATH.y - BATH.h, BATH.w, BATH.h);
  }

  accepts(item) {
    return isFriendItem(item) && !this.friend && !this.swishing;
  }

  // A few bubbles up out of the water.
  froth(n) {
    for (let i = 0; i < n; i++) {
      this.bubbles.push({ x: -16 + Math.random() * 32, y: -16, phase: Math.random() * 6 });
    }
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.swishing) {
      return;
    }
    this.swishing = true;
    girl.faceToward(BUBBLE_BATH.x);
    for (let i = 0; i < 2; i++) {
      girl.act('reach', 0.25);
      this.froth(2);
      await engine.wait(0.3);
    }
    engine.audio.play('splash');
    scene.bits(BUBBLE_BATH.x, BUBBLE_BATH.y - 18, 3, PD.water);
    girl.say('heart', 1.2);
    this.swishing = false;
  }

  // A friend splashing in it is tapped (it's sat in us, like a seat).
  spin() {
    this.use();
  }

  // A friend in the bath can't be picked up (it's held), but if it were,
  // it'd simply leave.
  release() {
    this.friend = null;
  }

  // A friend dropped in it: in it goes (sat in it, so it's drawn here),
  // splashes about, then shakes off and hops back out.
  async receive(friend) {
    const { scene } = this;
    const { engine } = scene;
    hold(friend);
    this.swishing = true;
    await scene.putDown(friend, BUBBLE_BATH.x, BUBBLE_BATH.spot.y);
    friend.seat = this;
    this.friend = friend;
    this.swishing = false;
    for (let i = 0; i < 3; i++) {
      engine.audio.play('splash');
      friend.pose?.(i % 2 ? 'hop' : 'idle');
      scene.bits(BUBBLE_BATH.x, BUBBLE_BATH.y - 18, 3, PD.water);
      this.froth(2);
      await engine.wait(0.6);
    }
    await wakeAndHopOut(this, friend, BUBBLE_BATH.x);
  }

  update(dt) {
    for (const b of this.bubbles) {
      b.y -= dt * BUBBLE_RISE;
      b.phase += dt * 3;
    }
    this.bubbles = this.bubbles.filter((b) => {
      if (b.y >= -BUBBLE_TOP) {
        return true;
      }
      this.scene.engine.audio.play('pop');
      this.scene.sparkles(BUBBLE_BATH.x + b.x, BUBBLE_BATH.y + b.y, 1);
      return false;
    });
  }

  draw(r) {
    const { x, y } = BUBBLE_BATH;
    const s = this.bounce;
    r.image(this.imgs.back, x, y, { scaleX: s, scaleY: 2 - s });
    const { friend } = this;
    if (friend) {
      r.image(friend.seatFrame(), x, y - 8, { flipX: friend.facing < 0 });
    }
    r.image(this.imgs.front, x, y, { scaleX: s, scaleY: 2 - s });
  }

  // The bubbles float up over everything.
  drawOver(r) {
    const { x, y } = BUBBLE_BATH;
    for (const b of this.bubbles) {
      r.image(this.bubble, x + Math.round(b.x + Math.sin(b.phase) * 2), y + Math.round(b.y), { alpha: 0.9 });
    }
  }
}

// The telescope, pointing up at the round window. Tap it and she looks
// through it: night falls in the window, the stars come out and twinkle, a
// shooting star streaks across, and then it's day again.
export class Telescope extends HouseProp {
  constructor(assets) {
    super();
    this.img = assets.telescope;
    this.nightSky = assets.nightSky;
    this.spot = TELESCOPE.spot;
    this.night = 0; // 0 = day in the window, 1 = starry night
    this.shooting = -1; // 0..1 across the window, or -1 for none
    this.looking = false;
    // Where the stars are, from the window's centre.
    const rand = seededRandom(7);
    this.stars = Array.from({ length: 9 }, () => {
      const a = rand() * Math.PI * 2;
      const d = 3 + rand() * (STAR_WINDOW.r - 6);
      return { x: Math.round(Math.cos(a) * d), y: Math.round(Math.sin(a) * d), phase: rand() * 6 };
    });
  }

  hitTest(px, py) {
    const { x, y, r } = STAR_WINDOW;
    return inRect(px, py, TELESCOPE.x - SCOPE.w / 2, TELESCOPE.y - SCOPE.h, SCOPE.w, SCOPE.h) || Math.hypot(px - x, py - y) <= r + 4;
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.looking) {
      return;
    }
    this.looking = true;
    girl.faceToward(TELESCOPE.x);
    girl.act('reach', 2.4);
    engine.audio.play('tinkle');
    await engine.tweens.to(this, { night: 1 }, 0.6, ease.inOutSine);
    await engine.wait(0.8);
    engine.audio.play('whoosh');
    this.shooting = 0;
    await engine.tweens.to(this, { shooting: 1 }, 0.5, ease.linear);
    this.shooting = -1;
    scene.sparkles(STAR_WINDOW.x + 10, STAR_WINDOW.y + 4, 3);
    girl.say('heart', 1.4);
    await engine.wait(1);
    await engine.tweens.to(this, { night: 0 }, 0.6, ease.inOutSine);
    this.looking = false;
  }

  draw(r) {
    const { x, y, r: wr } = STAR_WINDOW;
    if (this.night > 0) {
      r.image(this.nightSky, x - wr, y - wr, { ax: 0, ay: 0, alpha: this.night });
      const t = this.scene.engine.time;
      for (const s of this.stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * 3 + s.phase);
        r.pixel(x + s.x, y + s.y, '#ffffff', this.night * twinkle);
        if (twinkle > 0.8) {
          r.pixel(x + s.x - 1, y + s.y, PD.glow, this.night * 0.5);
          r.pixel(x + s.x + 1, y + s.y, PD.glow, this.night * 0.5);
        }
      }
    }
    if (this.shooting >= 0) {
      // From the top left, down and across, a fading tail behind it.
      for (let i = 0; i < 6; i++) {
        const k = this.shooting - i * 0.05;
        if (k >= 0) {
          r.pixel(Math.round(x - 14 + k * 26), Math.round(y - 10 + k * 14), '#ffffff', 1 - i / 6);
        }
      }
    }
    const s = this.bounce;
    r.image(this.img, TELESCOPE.x, TELESCOPE.y, { scaleX: s, scaleY: 2 - s });
  }
}

// The seed tray on its little table. Tap it and she waters it, and it
// sprouts up a stage: shoots, then leaves, then tiny bluebells in flower.
// In flower, tap it and its bluebells ring, then their seeds blow off and
// sow it again, ready to grow from the start.
export class SeedTray extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.seedTray;
    this.spot = SEED_TRAY.spot;
    this.stage = 0;
    this.tending = false;
  }

  hitTest(px, py) {
    return inRect(px, py, SEED_TRAY.x - TRAY.w / 2, SEED_TRAY.y - TRAY.h, TRAY.w, TRAY.h);
  }

  get inFlower() {
    return this.stage === TRAY.stages - 1;
  }

  async use() {
    const { scene } = this;
    if (this.tending) {
      return;
    }
    this.tending = true;
    scene.girl.faceToward(SEED_TRAY.x);
    await (this.inFlower ? this.ring() : this.water());
    this.tending = false;
  }

  async water() {
    const { scene } = this;
    const { engine, girl } = scene;
    girl.act('reach', 0.8);
    for (let i = 0; i < 3; i++) {
      engine.audio.play('plop');
      scene.bits(SEED_TRAY.x - 8 + i * 8, SEED_TRAY.y - 12, 2, BB.skyLow);
      await engine.wait(0.2);
    }
    this.stage += 1;
    engine.audio.play('grow');
    this.squash = 1;
    engine.tweens.to(this, { squash: 0 }, 0.4, ease.outElastic);
    scene.sparkles(SEED_TRAY.x, SEED_TRAY.y - 10, this.inFlower ? 6 : 2);
    if (this.inFlower) {
      girl.say('heart', 1.4);
    }
  }

  async ring() {
    const { scene } = this;
    const { engine, girl } = scene;
    girl.act('reach', 0.4);
    for (const [i, dx] of TRAY.plants.entries()) {
      engine.audio.play('plink', { note: i });
      scene.sparkles(SEED_TRAY.x + dx, SEED_TRAY.y - 12, 1);
      await engine.wait(0.15);
    }
    engine.audio.play('poof');
    scene.bits(SEED_TRAY.x, SEED_TRAY.y - 10, 6, BB.bellLight);
    this.stage = 0;
    scene.hearts(SEED_TRAY.x, SEED_TRAY.y - 20, 2);
    girl.say('note', 1.2);
  }

  draw(r) {
    const s = this.bounce;
    r.image(this.imgs[this.stage], SEED_TRAY.x, SEED_TRAY.y, { scaleX: s, scaleY: 2 - s });
  }
}
