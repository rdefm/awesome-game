import { ease } from '../../engine/tween.js';
import { seededRandom } from '../../engine/pixmap.js';
import { BB } from '../art/bluebell.js';
import { BATH, CHEST, CUPBOARD, FRAME, KETTLE_ART, NOOK, PD, POD_LIGHTS, SCOPE, STOVE, TRAY, lightString } from '../art/pod.js';
import { iconFor, isFriend } from '../kinds.js';
import {
  BED_NOOK, BUBBLE_BATH, DRESSER, H, KETTLE, PANTRY, PHOTO_FRAME, POD, PULL_CORD, SEED_TRAY, STAR_WINDOW, TELESCOPE, W,
} from '../layout.js';
import { BELL_NOTES } from './bluebell.js';
import { FriendBunk, tuckHerIn, wakeHer } from './bunkroom.js';
import { FarHouse, FriendBed, HouseProp, inRect } from './house.js';
import { DRAWER_THINGS, PANTRY_SNACKS } from './items.js';

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
// In flower, tap it and its bluebells ring, she lifts one out in a little pot
// (see PottedBluebell), then the rest's seeds blow off and sow it again,
// ready to grow from the start.
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
    const potted = scene.spawn('pottedbell', SEED_TRAY.x, SEED_TRAY.y - 12, { v: Math.floor(Math.random() * BELL_NOTES) });
    if (potted) {
      engine.audio.play('pop');
      scene.sparkles(SEED_TRAY.x, SEED_TRAY.y - 14, 4);
      await scene.putDown(potted, SEED_TRAY.x - 14, SEED_TRAY.spot.y + 6);
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
      POD_LIGHTS.forEach(({ x, y }, i) => {
        const color = this.scene.cord.colorOf(i, t);
        const glow = k * (0.55 + 0.15 * Math.sin(t * 1.5 + i));
        r.rect(x - 2, y - 2, 5, 5, color, glow * 0.3);
        r.rect(x - 1, y - 1, 3, 3, color, glow);
      });
    }
    super.drawOver(r);
  }
}

// The pantry cupboard. Tap it and its doors swing open on its shelves of
// jars, and out pops a nectar pot, then a seed cookie next time, and so on
// (but only so many lying about the pod at once).
export const MAX_PANTRY_SNACKS = 4;

export class Pantry extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.pantry;
    this.spot = PANTRY.spot;
    this.open = false;
    this.giving = false;
    this.nextSnack = 0; // which of PANTRY_SNACKS comes out next
  }

  hitTest(px, py) {
    return inRect(px, py, PANTRY.x - CUPBOARD.body / 2, PANTRY.y - CUPBOARD.h, CUPBOARD.body, CUPBOARD.h, 2);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.giving) {
      return;
    }
    girl.faceToward(PANTRY.x);
    if (scene.entities.filter((e) => PANTRY_SNACKS.includes(e.kind)).length >= MAX_PANTRY_SNACKS) {
      girl.say('heart', 1.2);
      scene.toast('PLENTY OF SNACKS!');
      return;
    }
    this.giving = true;
    girl.act('reach', 0.4);
    engine.audio.play('creak');
    this.open = true;
    this.squash = 1;
    engine.tweens.to(this, { squash: 0 }, 0.4, ease.outElastic);
    await engine.wait(0.3);
    const kind = PANTRY_SNACKS[this.nextSnack % PANTRY_SNACKS.length];
    this.nextSnack += 1;
    const snack = scene.spawn(kind, PANTRY.x, PANTRY.y - 14);
    if (snack) {
      engine.audio.play('pop');
      scene.sparkles(PANTRY.x, PANTRY.y - 16, 5);
      await scene.putDown(snack, PANTRY.x - 6, PANTRY.spot.y + 6);
    }
    girl.say('heart', 1.2);
    await engine.wait(0.3);
    engine.audio.play('close');
    this.open = false;
    this.giving = false;
  }

  draw(r) {
    const s = this.bounce;
    r.image(this.imgs[this.open ? 1 : 0], PANTRY.x, PANTRY.y, { scaleX: s, scaleY: 2 - s });
  }
}

const RATTLES = 4; // rattles as it heats up, before it whistles
const STEAM_TIME = 1.6; // seconds of steam it puffs out as it whistles
const COOL_RATE = 0.4; // how fast it cools off afterwards, per second

// The kettle on its little stove. Tap it and the stove lights and it heats
// up, rattling its lid, then whistles a cheerful tune with a puff of steam
// from its spout, and cools off again.
export class Kettle extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.kettle;
    this.puffImg = assets.steam;
    this.spot = KETTLE.spot;
    this.heat = 0; // 0 = cold, 1 = on the boil
    this.rattle = 0; // how hard its lid's rattling, 0..1
    this.steam = 0; // seconds of steam left to puff
    this.boiling = false;
    this.puffs = [];
  }

  // Where the steam comes out: the whistle on the end of its spout.
  get spout() {
    const { hob, spout } = KETTLE_ART;
    return { x: KETTLE.x + hob + spout.x, y: KETTLE.y - STOVE.h + 1 + spout.y };
  }

  hitTest(px, py) {
    const h = STOVE.h + KETTLE_ART.h;
    return inRect(px, py, KETTLE.x - STOVE.w / 2, KETTLE.y - h, STOVE.w, h, 2);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.boiling) {
      return;
    }
    this.boiling = true;
    girl.faceToward(KETTLE.x);
    girl.act('reach', 0.4);
    engine.audio.play('click');
    for (let i = 1; i <= RATTLES; i++) {
      await engine.wait(0.35);
      this.heat = i / RATTLES;
      this.rattle = 1;
      engine.audio.play('rattle');
    }
    engine.audio.play('whistle');
    this.steam = STEAM_TIME;
    scene.sparkles(this.spout.x, this.spout.y, 3);
    girl.say('note', 1.4);
    await engine.wait(STEAM_TIME);
    this.boiling = false;
  }

  update(dt) {
    this.rattle = Math.max(0, this.rattle - dt * 3);
    if (!this.boiling) {
      this.heat = Math.max(0, this.heat - dt * COOL_RATE);
    }
    if (this.steam > 0) {
      this.steam = Math.max(0, this.steam - dt);
      const { x, y } = this.spout;
      this.puffs.push({ x, y, vx: 14 + Math.random() * 10, vy: -(24 + Math.random() * 12), age: 0, life: 0.8 + Math.random() * 0.4 });
    }
    for (const p of this.puffs) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - dt * 2;
    }
    this.puffs = this.puffs.filter((p) => p.age < p.life);
  }

  draw(r) {
    const s = this.bounce;
    const hot = this.heat > 0.5 ? 1 : 0;
    const t = this.scene.engine.time;
    const jiggle = this.rattle > 0 ? Math.round(Math.sin(t * 60) * this.rattle) : 0;
    r.image(this.imgs.stove[this.boiling || this.heat > 0 ? 1 : 0], KETTLE.x, KETTLE.y, { scaleX: s, scaleY: 2 - s });
    r.image(this.imgs.kettle[hot], KETTLE.x + KETTLE_ART.hob + jiggle, KETTLE.y - STOVE.h + 1 - Math.abs(jiggle), { scaleX: s, scaleY: 2 - s });
  }

  // The steam billows up over everything.
  drawOver(r) {
    for (const p of this.puffs) {
      const k = p.age / p.life;
      const s = 0.4 + k * 1.2;
      r.image(this.puffImg, p.x, p.y, { ay: 0.5, scaleX: s, scaleY: s, alpha: 0.8 * (1 - k) });
    }
  }
}

// The chest of drawers. Tap a drawer and it slides out and up pops what's
// tucked away in it (a stripy sock, a seed packet, a plushie: each drawer its
// own). Once it's been taken out, that drawer comes up empty: a puff of dust,
// and a sneeze. What's been taken is remembered (as one of the scene's
// memories), so the drawers don't fill up again.
const DUST = '#e8dcf4';
export const drawerMemory = (kind) => `pod.drawer.${kind}`;

export class Dresser extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.dresser;
    this.spot = DRESSER.spot;
    this.open = -1; // which drawer is pulled out (-1 = all shut)
    this.picked = 0; // the drawer last tapped
    this.pulling = false;
  }

  // The middle of drawer `i`'s front, shut.
  drawerY(i) {
    return DRESSER.y - CHEST.h + CHEST.drawers[i];
  }

  // Whichever drawer is nearest the tap.
  drawerAt(py) {
    let best = 0;
    CHEST.drawers.forEach((_, i) => {
      if (Math.abs(py - this.drawerY(i)) < Math.abs(py - this.drawerY(best))) {
        best = i;
      }
    });
    return best;
  }

  hitTest(px, py) {
    return inRect(px, py, DRESSER.x - CHEST.body / 2, DRESSER.y - CHEST.h, CHEST.body, CHEST.h, 2);
  }

  onTap(p) {
    if (!this.pulling) {
      this.picked = this.drawerAt(p.y);
    }
    super.onTap(p);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.pulling) {
      return;
    }
    this.pulling = true;
    const i = this.picked;
    const kind = DRAWER_THINGS[i];
    const memory = drawerMemory(kind);
    const y = this.drawerY(i) + 4;
    girl.faceToward(DRESSER.x);
    girl.act('reach', 0.4);
    engine.audio.play('drawer');
    this.open = i;
    this.squash = 1;
    engine.tweens.to(this, { squash: 0 }, 0.4, ease.outElastic);
    await engine.wait(0.3);
    const thing = scene.memories.includes(memory) ? null : scene.spawn(kind, DRESSER.x, y);
    if (thing) {
      scene.remember(memory);
      engine.audio.play('pop');
      scene.sparkles(DRESSER.x, y - 4, 5);
      await scene.putDown(thing, DRESSER.x + 4, DRESSER.spot.y + 8);
      girl.say('star', 1.2);
    } else {
      // Nothing in it but dust... ah... ah... choo!
      scene.bits(DRESSER.x, y - 2, 8, DUST);
      engine.audio.play('sneeze');
      await engine.wait(0.55);
      girl.hop(5);
      scene.bits(DRESSER.x, y - 4, 6, DUST);
      girl.say('question', 1.2);
    }
    await engine.wait(0.4);
    engine.audio.play('close');
    this.open = -1;
    this.pulling = false;
  }

  draw(r) {
    const s = this.bounce;
    r.image(this.imgs[this.open + 1], DRESSER.x, DRESSER.y, { scaleX: s, scaleY: 2 - s });
  }
}

// ------------------------------------------------------- the pod's touches
// The string of lights can be any of these colours (old saves: gold), and
// the photo frame holds a picture of a friend (or nothing yet). Saved
// together as `pod` (see PodScene.savePod).
export const LIGHT_COLORS = ['pink', 'gold', 'blue', 'green', 'rainbow'];
const BULBS = { pink: '#ff8fc8', gold: PD.glow, blue: '#8fd0ff', green: '#8af0a0' };
const RAINBOW = ['#ff6a6a', '#ffb35a', '#fff07a', '#8af0a0', '#8fd0ff', '#c49aff'];
const RAINBOW_CHASE = 3; // how fast the rainbow's colours run along the string, bulbs per second

// Just what a photo of a friend needs to show: who it is, and how it looks.
function snapshotOf({ kind, v, stage, hat, crew }) {
  return {
    kind, ...(v === undefined ? {} : { v }), ...(stage === undefined ? {} : { stage }), ...(hat ? { hat } : {}),
    ...(crew && typeof crew === 'object' ? { crew: { ...crew } } : {}),
  };
}

export function normalizePod(raw) {
  const lights = LIGHT_COLORS.includes(raw?.lights) ? raw.lights : 'gold';
  const photo = raw?.photo && typeof raw.photo === 'object' && isFriend(raw.photo.kind) ? snapshotOf(raw.photo) : null;
  return { lights, photo };
}

const TUG = 4; // how far down the cord comes as she pulls it

// The pull-cord hanging from the string of lights. Each pull changes them
// to the next colour (pink, gold, blue, green, then rainbow, and round
// again), which stays. It also colours the bulbs, over the room's own.
export class LightCord extends HouseProp {
  constructor(assets, lights) {
    super();
    this.tassel = assets.pullCord;
    this.spot = PULL_CORD.spot;
    this.lights = lights; // one of LIGHT_COLORS (see normalizePod)
    this.tug = 0;
    this.pulling = false;
    this.top = lightString(PULL_CORD.x);
  }

  hitTest(px, py) {
    return inRect(px, py, PULL_CORD.x - 3, this.top, 7, PULL_CORD.y - this.top, 2);
  }

  // The colour of bulb `i` at time `t`.
  colorOf(i, t) {
    return this.lights === 'rainbow' ? RAINBOW[(i + Math.floor(t * RAINBOW_CHASE)) % RAINBOW.length] : BULBS[this.lights];
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.pulling) {
      return;
    }
    this.pulling = true;
    girl.faceToward(PULL_CORD.x);
    girl.act('reach', 0.4);
    await engine.tweens.to(this, { tug: TUG }, 0.12, ease.outQuad);
    engine.audio.play('pullcord');
    this.lights = LIGHT_COLORS[(LIGHT_COLORS.indexOf(this.lights) + 1) % LIGHT_COLORS.length];
    scene.savePod({ lights: this.lights });
    for (const { x, y } of POD_LIGHTS.filter((_, i) => i % 4 === 1)) {
      scene.sparkles(x, y, 2);
    }
    await engine.tweens.to(this, { tug: 0 }, 0.5, ease.outElastic);
    girl.say(this.lights === 'rainbow' ? 'star' : 'heart', 1);
    this.pulling = false;
  }

  draw(r) {
    const t = this.scene.engine.time;
    POD_LIGHTS.forEach(({ x, y }, i) => {
      const color = this.colorOf(i, t);
      r.rect(x - 1, y - 1, 3, 3, color);
      r.rect(x - 2, y, 5, 1, color);
      r.rect(x, y - 2, 1, 5, color);
      r.pixel(x, y - 1, '#ffffff', 0.7);
    });
    const end = PULL_CORD.y - 6 + Math.round(this.tug);
    r.rect(PULL_CORD.x, this.top, 1, end - this.top, PD.shellDeep);
    const s = this.bounce;
    r.image(this.tassel, PULL_CORD.x, PULL_CORD.y + Math.round(this.tug), { scaleX: s, scaleY: 2 - s });
  }
}

const FLASH_FADE = 1.5; // how fast the camera flash fades, per second

// The photo frame on the wall: a picture of the last friend she brought into
// the pod (in its hat, if it had one on), or an empty frame with a question
// mark until then. A flash and a click as it takes a new one.
export class PhotoFrame {
  constructor(assets, photo) {
    this.assets = assets;
    this.imgs = assets.photoFrame;
    this.photo = photo;
    this.flash = 0; // 0..1
    this.depth = -10;
  }

  snap(entry) {
    if (!isFriend(entry.kind)) {
      return;
    }
    const { scene } = this;
    this.photo = snapshotOf(entry);
    scene.savePod({ photo: this.photo });
    scene.engine.audio.play('shutter');
    this.flash = 1;
    scene.sparkles(PHOTO_FRAME.x, PHOTO_FRAME.y - FRAME.h / 2, 4);
  }

  update(dt) {
    this.flash = Math.max(0, this.flash - dt * FLASH_FADE);
  }

  draw(r) {
    const { x, y } = PHOTO_FRAME;
    const { w, h, inner } = FRAME;
    r.image(this.photo ? this.imgs.full : this.imgs.empty, x, y);
    const left = x - w / 2 + inner.x;
    const top = y - h + inner.y;
    if (this.photo) {
      const icon = iconFor(this.assets, this.photo);
      const k = Math.min(1, (inner.w - 2) / icon.width, (inner.h - 2) / icon.height);
      r.image(icon, left + inner.w / 2, top + inner.h - 1, { scaleX: k, scaleY: k });
    }
    if (this.flash > 0) {
      r.rect(left, top, inner.w, inner.h, '#ffffff', this.flash);
      r.rect(left - 4, top - 4, inner.w + 8, inner.h + 8, '#ffffff', this.flash * 0.3);
    }
  }
}
