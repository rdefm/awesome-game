import { ease } from '../../engine/tween.js';
import { GOGGLE_COLORS, HUT_WALLS, SLING, TIMER_GLASS, TIMER_SAND, sandHalf } from '../art/zigHut.js';
import { EASEL, GOGGLE_SHELF, HAMMOCK, SAND_TIMER, ZIG_HUT } from '../layout.js';
import { hold, isFriendItem, letGo } from './friends.js';
import { FarHouse, HouseProp, inRect } from './house.js';

// ---------------------------------------------------------------- the house
// Zig's stripy dome hut, out among the mesas at the back of Stripey, with its
// sandy path up to the door. Tap it and she walks up the path and goes
// inside (see StripeyScene).
export class ZigHut extends FarHouse {
  constructor(assets) {
    super(assets.zigHut, ZIG_HUT);
  }
}

// ------------------------------------------------------------ inside house
// The easel: tap it and she paints the walls in the next planet's stripes
// (see HUT_WALLS), its canvas showing whichever they're in now.
export class Easel extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.easel;
    this.rooms = assets.zigRoom;
    this.spot = EASEL.spot;
    this.v = 0; // which stripes the walls are in
    this.painting = false;
  }

  hitTest(px, py) {
    return inRect(px, py, EASEL.x - 15, EASEL.y - 44, 30, 44);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.painting) {
      return;
    }
    this.painting = true;
    girl.faceToward(EASEL.x);
    for (let i = 0; i < 3; i++) {
      girl.act('reach', 0.2);
      engine.audio.play('rustle');
      await engine.wait(0.25);
    }
    this.v = (this.v + 1) % HUT_WALLS.length;
    scene.room = this.rooms[this.v];
    engine.audio.play('chime');
    for (const x of [40, 100, 160, 220]) {
      scene.sparkles(x, 60, 3);
    }
    girl.say('star', 1.4);
    this.painting = false;
  }

  draw(r) {
    const s = this.bounce;
    r.image(this.imgs[this.v], EASEL.x, EASEL.y, { scaleX: s, scaleY: 2 - s });
  }
}

// The sand timer on its little table. Tap it and she turns it over; the sand
// runs down through the neck, and when it's all through it dings.
export const TIMER_RUN = 5; // seconds for all the sand to run through

export class SandTimer extends HouseProp {
  constructor(assets) {
    super();
    this.img = assets.sandTimer;
    this.spot = SAND_TIMER.spot;
    this.sandUp = 0; // how much of the sand is in the top bulb, 0..1
    this.turn = 0; // how far over it's turned, 0..1
    this.turning = false;
  }

  hitTest(px, py) {
    return inRect(px, py, SAND_TIMER.x - 7, SAND_TIMER.y - TIMER_GLASS.h, 14, TIMER_GLASS.h);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.turning) {
      return;
    }
    this.turning = true;
    girl.faceToward(SAND_TIMER.x);
    girl.act('reach', 0.5);
    engine.audio.play('whirr');
    await engine.tweens.to(this, { turn: 1 }, 0.4, ease.inOutSine);
    this.sandUp = 1 - this.sandUp; // upside down, the bottom's sand is on top now
    this.turn = 0;
    this.turning = false;
    engine.audio.play('click');
  }

  update(dt) {
    if (this.turning || this.sandUp <= 0) {
      return;
    }
    this.sandUp = Math.max(0, this.sandUp - dt / TIMER_RUN);
    if (this.sandUp === 0) {
      this.ranOut();
    }
  }

  // All the sand's through: ding!
  ranOut() {
    const { scene } = this;
    scene.engine.audio.play('ding');
    scene.sparkles(SAND_TIMER.x, SAND_TIMER.y - TIMER_GLASS.h, 5);
    scene.girl.say('star', 1.2);
  }

  draw(r) {
    const { x, y } = SAND_TIMER;
    const { h, top, neck, bottom } = TIMER_GLASS;
    const s = this.bounce;
    if (this.turning) {
      // Lifted up and turned over (end on, it squashes flat).
      const k = Math.sin(this.turn * Math.PI);
      r.image(this.img, x, y - k * 6 - h / 2, { ay: 0.5, scaleY: Math.max(0.1, Math.abs(Math.cos(this.turn * Math.PI))) });
      return;
    }
    r.image(this.img, x, y, { scaleX: s, scaleY: 2 - s });
    const y0 = y - h; // the picture's top row
    // The sand in each bulb, settled at the bottom of it.
    const fill = (from, to, rows) => {
      for (let row = to; row > to - rows && row >= from; row--) {
        const half = Math.round(sandHalf(row));
        r.rect(x - half, y0 + row, half * 2 + 1, 1, TIMER_SAND);
      }
    };
    const size = neck - top;
    fill(top, neck - 1, Math.round(this.sandUp * size));
    fill(neck, bottom, Math.round((1 - this.sandUp) * (bottom - neck + 1)));
    if (this.sandUp > 0) {
      // A thin trickle running through the neck.
      const t = this.scene.engine.time;
      for (let row = neck - 1; row < bottom; row++) {
        if ((row + Math.floor(t * 12)) % 2) {
          r.pixel(x, y0 + row, TIMER_SAND);
        }
      }
    }
  }
}

// The shelf of goggles: tap it and she tries on a pair, then the next pair,
// and the next, and then puts them back.
export class GoggleShelf extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.goggles;
    this.spot = GOGGLE_SHELF.spot;
    this.worn = null; // which pair she has on, if any (GOGGLE_COLORS)
  }

  hitTest(px, py) {
    return inRect(px, py, GOGGLE_SHELF.x, GOGGLE_SHELF.y - 8, GOGGLE_SHELF.w, 11);
  }

  use() {
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(GOGGLE_SHELF.x + GOGGLE_SHELF.w / 2);
    girl.act('reach', 0.4);
    const next = this.worn === null ? 0 : this.worn + 1;
    this.worn = next < GOGGLE_COLORS.length ? next : null;
    if (this.worn === null) {
      engine.audio.play('pop');
      return;
    }
    engine.audio.play('boop');
    scene.sparkles(girl.x, girl.y - 20, 3);
    girl.say('star', 1.2);
  }

  // Where each pair sits on the shelf.
  pairAt(v) {
    return { x: GOGGLE_SHELF.x + 8 + v * 13, y: GOGGLE_SHELF.y };
  }

  draw(r) {
    this.imgs.forEach((img, v) => {
      if (v !== this.worn) {
        const p = this.pairAt(v);
        r.image(img, p.x, p.y, { scaleX: this.bounce });
      }
    });
  }

  // The pair she has on, over her eyes (bobbing with her head as she walks).
  drawOver(r) {
    const { girl } = this.scene;
    if (this.worn === null || !girl.onFeet || girl.riding || girl.alpha <= 0) {
      return;
    }
    const f = girl.frames;
    const bob = [f.idle[1], f.walk[1], f.walk[3]].includes(girl.currentFrame()) ? 1 : 0;
    const s = girl.scale;
    const eyes = girl.y + 1 - girl.lift * s - (16.5 - bob) * s;
    r.image(this.imgs[this.worn], girl.x + girl.facing * s, eyes, {
      flipX: girl.facing < 0, scaleX: s, scaleY: s, alpha: girl.alpha,
    });
  }
}

// The hammock, slung between two hooks: tap it and it swings. Drop a friend
// in it and it swings them off to sleep (zzz), then out they hop.
export class Hammock extends HouseProp {
  constructor(assets) {
    super();
    this.img = assets.sling;
    this.spot = HAMMOCK.spot;
    this.rock = 0; // how far over it's swung, -1..1
    this.swinging = false;
    this.friend = null; // napping in it
    this.sleepy = false;
  }

  get centre() {
    return (HAMMOCK.x1 + HAMMOCK.x2) / 2;
  }

  hitTest(px, py) {
    return inRect(px, py, HAMMOCK.x1 + 4, HAMMOCK.sag - SLING.h - 4, HAMMOCK.x2 - HAMMOCK.x1 - 8, SLING.h + 4);
  }

  accepts(item) {
    return isFriendItem(item) && !this.swinging && !this.friend;
  }

  use() {
    if (!this.swinging) {
      this.swing(3);
    }
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

  // Swings to and fro `n` times.
  async swing(n) {
    const { scene } = this;
    const { engine, girl } = scene;
    this.swinging = true;
    girl.faceToward(this.centre);
    engine.audio.play('creak');
    for (let i = 0; i < n; i++) {
      await engine.tweens.to(this, { rock: 1 }, 0.45, ease.inOutSine);
      await engine.tweens.to(this, { rock: -1 }, 0.45, ease.inOutSine);
      if (i % 2) {
        scene.hearts(this.centre, HAMMOCK.sag - 20, 1);
      }
    }
    await engine.tweens.to(this, { rock: 0 }, 0.25, ease.inOutSine);
    this.swinging = false;
  }

  // A friend dropped on it: in it goes (sat in it, so it's drawn here), swung
  // off to sleep, then it wakes with a stretch and hops back out.
  async receive(friend) {
    const { scene } = this;
    const { engine, girl } = scene;
    hold(friend);
    this.swinging = true;
    await scene.putDown(friend, this.centre, HAMMOCK.spot.y);
    friend.seat = this;
    this.friend = friend;
    this.swinging = false;
    const swung = this.swing(4);
    await engine.wait(1);
    this.sleepy = true;
    friend.pose?.('blink');
    await swung;
    await engine.wait(0.6);
    this.sleepy = false;
    friend.pose?.('wave1'); // a big stretch
    engine.audio.play('giggle');
    await engine.wait(0.4);
    this.friend = null;
    friend.seat = null;
    friend.facing = girl.x < this.centre ? -1 : 1;
    friend.pose?.('hop');
    friend.lift = 10;
    await engine.tweens.to(friend, { lift: 0 }, 0.3, ease.inQuad);
    scene.hearts(friend.x, friend.y - 20, 2);
    girl.say('heart', 1.4);
    letGo(friend);
  }

  draw(r) {
    const { x1, x2, top, sag } = HAMMOCK;
    const cx = this.centre + Math.round(this.rock * 3);
    const s = this.bounce;
    const ends = [{ x: cx - SLING.w / 2 + 1, hook: x1 }, { x: cx + SLING.w / 2 - 1, hook: x2 }];
    const endY = sag - SLING.h + 1;
    // The ropes up to the hooks.
    for (const end of ends) {
      const steps = Math.ceil(Math.hypot(end.x - end.hook, endY - top));
      for (let i = 0; i <= steps; i += 1) {
        r.pixel(end.hook + ((end.x - end.hook) * i) / steps, top + ((endY - top) * i) / steps, '#e8d2a0');
      }
    }
    const { friend } = this;
    if (friend) {
      r.image(friend.seatFrame(), cx, sag - 5, { flipX: friend.facing < 0 });
      if (this.sleepy) {
        const t = this.scene.engine.time;
        for (let i = 0; i < 2; i++) {
          const k = (t * 0.5 + i * 0.5) % 1;
          r.image(this.scene.assets.text('Z', '#ffffff'), cx + 8 + k * 6, sag - 30 - k * 10, { alpha: 1 - k });
        }
      }
    }
    r.image(this.img, cx, sag, { scaleX: s, scaleY: 2 - s });
  }
}
