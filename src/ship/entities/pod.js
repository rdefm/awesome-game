import { ease } from '../../engine/tween.js';
import { seededRandom } from '../../engine/pixmap.js';
import { BB } from '../art/bluebell.js';
import { BATH, NOOK, PD, POD_LIGHTS, SCOPE, TRAY } from '../art/pod.js';
import { BED_NOOK, BUBBLE_BATH, H, POD, SEED_TRAY, STAR_WINDOW, TELESCOPE, W } from '../layout.js';
import { FriendBunk, tuckHerIn, wakeHer } from './bunkroom.js';
import { FarHouse, FriendBed, HouseProp, inRect } from './house.js';

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
export class BubbleBath extends FriendBed {
  constructor(assets) {
    super({ x: BUBBLE_BATH.x, y: BUBBLE_BATH.spot.y });
    this.imgs = assets.bubbleBath;
    this.bubble = assets.bubble;
    this.spot = BUBBLE_BATH.spot;
    this.swishing = false;
    this.bubbles = []; // from the middle of the water
  }

  get inUse() {
    return this.swishing;
  }

  hitTest(px, py) {
    return inRect(px, py, BUBBLE_BATH.x - BATH.w / 2, BUBBLE_BATH.y - BATH.h, BATH.w, BATH.h);
  }

  // A few bubbles up out of the water.
  froth(n) {
    for (let i = 0; i < n; i++) {
      this.bubbles.push({ x: -16 + Math.random() * 32, y: -16, phase: Math.random() * 6 });
    }
  }

  async play() {
    const { scene } = this;
    const { engine, girl } = scene;
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

  // A friend in it splashes about in the bubbles.
  async stay(friend) {
    const { scene } = this;
    const { engine } = scene;
    for (let i = 0; i < 3; i++) {
      engine.audio.play('splash');
      friend.pose?.(i % 2 ? 'hop' : 'idle');
      scene.bits(BUBBLE_BATH.x, BUBBLE_BATH.y - 18, 3, PD.water);
      this.froth(2);
      await engine.wait(0.6);
    }
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
    this.drawFriend(r, x, y, 8);
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

const DIM_RATE = 1.25; // how fast the pod dims as she nods off (and brightens as she wakes), per second

// The bed nook, round and cushioned, in the wall under the window, with its
// little curtain. Tap it and she climbs in and snoozes (zzz) till she's
// woken (a tap on her, the nook, or anywhere else), the pod dimming round
// her and its string of lights glowing softly. Drop a friend in and it's
// tucked in for a nap; pick it up out of it and it wakes. Nothing's saved (a
// friend napping in it is remembered on the floor beside it).
export class BedNook extends FriendBunk {
  constructor(assets) {
    super(assets, BED_NOOK, false, assets.bedNook.quilt);
    this.imgs = assets.bedNook;
    this.blanketEnd = BED_NOOK.w - 3;
    this.dim = 0; // how dim the pod is, 0..1
  }

  get herAsleep() {
    return Boolean(this.sleeper) && this.sleeper === this.scene.girl;
  }

  // A friend napping in it can be lifted out; she can't.
  get draggable() {
    return super.draggable && !this.herAsleep;
  }

  hitTest(px, py) {
    const { x, y } = BED_NOOK;
    return inRect(px, py, x - NOOK.w / 2, y + NOOK.floor - NOOK.h, NOOK.w, NOOK.h, 1);
  }

  onTap(p) {
    if (this.herAsleep) {
      this.scene.engine.audio.play('tap');
      this.wakeUp();
      return;
    }
    super.onTap(p);
  }

  // In she climbs, or (with a friend napping in it) she pats it.
  use() {
    if (this.sleeper) {
      return super.use();
    }
    if (!this.scene.busy) {
      return this.scene.scripted(() => tuckHerIn(this));
    }
  }

  wakeUp() {
    return wakeHer(this);
  }

  update(dt) {
    const to = this.herAsleep ? 1 : 0;
    this.dim = to > this.dim ? Math.min(to, this.dim + dt * DIM_RATE) : Math.max(to, this.dim - dt * DIM_RATE);
  }

  drawBed(r) {
    const s = this.bounce;
    r.image(this.imgs.nook, BED_NOOK.x, BED_NOOK.y + NOOK.floor, { scaleX: s, scaleY: 2 - s });
  }

  draw(r) {
    super.draw(r);
    r.image(this.imgs.curtain, BED_NOOK.x, BED_NOOK.y + NOOK.floor);
  }

  // The pod dimmed while she naps, its lights glowing softly through it.
  drawOver(r) {
    const k = this.dim;
    if (k > 0) {
      const t = this.scene.engine.time;
      r.rect(0, 0, W, H, PD.dimmed, 0.5 * k);
      POD_LIGHTS.forEach(({ x, y, color }, i) => {
        const glow = k * (0.55 + 0.15 * Math.sin(t * 1.5 + i));
        r.rect(x - 2, y - 2, 5, 5, color, glow * 0.3);
        r.rect(x - 1, y - 1, 3, 3, color, glow);
      });
    }
    super.drawOver(r);
  }
}
