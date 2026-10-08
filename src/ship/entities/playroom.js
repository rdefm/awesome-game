import { ease } from '../../engine/tween.js';
import { BALL_COLORS } from '../art/shipRooms.js';
import { BALL_PIT, SWING, TRAMPOLINE } from '../layout.js';
import { hold, isFriendItem, letGo } from './friends.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const inRect = (px, py, x, y, w, h, pad = 3) => px >= x - pad && px <= x + w + pad && py >= y - pad && py <= y + h + pad;

// Shows a pose on whoever's playing: one of her frames, or a friend's.
function strike(who, girlFrame, friendFrame) {
  if (who === who.scene.girl) {
    who.pose = { frame: girlFrame, token: {} };
  } else {
    who.pose?.(friendFrame);
  }
}

// Playground kit, one at a time: tap it and she walks over and has a go, or
// drop a friend on it and they do. Each kind plays out its own `play(who)`,
// which ends with them back on the floor beside it.
class Kit {
  constructor() {
    this.squash = 0;
    this.rider = null; // whoever's on it
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

  // A friend on it was tapped (while it's their `seat`).
  spin() {
    this.scene.engine.audio.play('giggle');
  }

  async use() {
    const { scene } = this;
    const { girl } = scene;
    if (this.rider) {
      girl.say('question', 1); // someone's on it: her turn next
      return;
    }
    this.rider = girl;
    girl.mode = 'act';
    await scene.scripted(() => this.play(girl));
    this.rider = null;
    girl.riding = null;
    girl.pose = null;
    girl.lift = 0;
    girl.mode = 'idle';
    girl.say('heart', 1.2);
    scene.persist();
  }

  accepts(item) {
    return isFriendItem(item) && !this.rider && !this.scene.busy;
  }

  async receive(friend) {
    const { scene } = this;
    hold(friend);
    this.rider = friend;
    await this.play(friend);
    this.rider = null;
    friend.seat = null;
    friend.lift = 0;
    letGo(friend);
    if (scene.engine.scene === scene) {
      scene.settle(friend);
      scene.girl.say('heart', 1.2);
    }
  }

  // Whoever's playing is drawn by the kit itself while it's `inside` (so
  // it can be hidden in the ball pit): she's `riding` it, a friend has it as
  // its `seat` (which also keeps it from wandering off).
  climbIn(who) {
    if (who === who.scene.girl) {
      who.riding = this;
    } else {
      who.seat = this;
    }
  }

  climbOut(who) {
    who.riding = null;
    who.seat = null;
  }
}

// ------------------------------------------------------------------ ball pit
// A big padded box of balls. In they hop, then dive right under and pop up
// again in a splash of balls.
const PIT_TOP = 60; // how high above the floor whoever's in it can be seen
const PIT_SIDE = 12; // and how far past its sides

export class BallPit extends Kit {
  constructor(assets) {
    super();
    this.front = assets.ballPit;
    this.y = BALL_PIT.bottom;
    this.inside = null;
    // Whoever's in it is composed with the front wall here, so anything that
    // sinks below the balls is cut off at the floor.
    this.comp = document.createElement('canvas');
    this.comp.width = BALL_PIT.w + PIT_SIDE * 2;
    this.comp.height = BALL_PIT.bottom - PIT_TOP;
    this.ctx = this.comp.getContext('2d');
  }

  get spot() {
    const { x, w, spot } = BALL_PIT;
    return { x: clamp(this.scene.girl.x, x + 14, x + w - 14), y: spot.y };
  }

  hitTest(px, py) {
    const { x, w, back, bottom } = BALL_PIT;
    return inRect(px, py, x, back, w, bottom - back);
  }

  splash(x, n = 2) {
    for (const color of BALL_COLORS) {
      this.scene.bits(x, BALL_PIT.top - 2, n, color);
    }
  }

  // A hop over the front wall, up to `lift` and down to `y`.
  async hop(who, x, y, lift) {
    const { tweens } = this.scene.engine;
    tweens.to(who, { x, y }, 0.4, ease.linear);
    await tweens.to(who, { lift: 18 }, 0.2, ease.outQuad);
    await tweens.to(who, { lift }, 0.2, ease.inQuad);
  }

  async play(who) {
    const { scene } = this;
    const { engine } = scene;
    const { tweens } = engine;
    const x = clamp(who.x, BALL_PIT.x + 14, BALL_PIT.x + BALL_PIT.w - 14);
    this.inside = who;
    this.climbIn(who);
    strike(who, 'cheer', 'hop');
    engine.audio.play('boing');
    await this.hop(who, x, BALL_PIT.inY, -4);
    engine.audio.play('land');
    this.splash(x);
    for (let i = 0; i < 2; i++) {
      // Right under...
      strike(who, 'surprised', 'idle');
      await engine.wait(0.3);
      engine.audio.play('hide');
      await tweens.to(who, { lift: -32 }, 0.35, ease.inQuad);
      this.splash(who.x, 1);
      await engine.wait(0.6 + Math.random() * 0.4);
      // ...and out again somewhere else!
      who.x = clamp(who.x + (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 16), BALL_PIT.x + 14, BALL_PIT.x + BALL_PIT.w - 14);
      who.facing = Math.random() < 0.5 ? -1 : 1;
      strike(who, 'cheer', 'hop');
      engine.audio.play('giggle');
      await tweens.to(who, { lift: 6 }, 0.25, ease.outBack);
      this.splash(who.x);
      if (who === scene.girl) {
        who.say(i ? 'star' : 'heart', 1);
      } else {
        scene.hearts(who.x, BALL_PIT.top - 26, 2);
      }
      await tweens.to(who, { lift: -4 }, 0.3, ease.inOutSine);
    }
    await engine.wait(0.3);
    // Back out over the side, onto the floor.
    engine.audio.play('boing');
    tweens.to(who, { y: BALL_PIT.spot.y }, 0.4, ease.linear);
    await tweens.to(who, { lift: 18 }, 0.2, ease.outQuad);
    this.inside = null;
    this.climbOut(who);
    strike(who, 'held', 'hop');
    await tweens.to(who, { lift: 0 }, 0.2, ease.inQuad);
    engine.audio.play('land');
    scene.dust(who.x, who.y);
    strike(who, 'idle', 'idle');
  }

  draw(r) {
    const c = this.ctx;
    const left = BALL_PIT.x - PIT_SIDE;
    c.clearRect(0, 0, this.comp.width, this.comp.height);
    const who = this.inside;
    if (who) {
      const img = who === this.scene.girl ? who.currentFrame() : who.seatFrame();
      const ix = Math.round(who.x - img.width / 2) - left;
      const iy = Math.round(who.y + 1 - who.lift - img.height) - PIT_TOP;
      if (who.facing < 0) {
        c.save();
        c.translate(ix + img.width, iy);
        c.scale(-1, 1);
        c.drawImage(img, 0, 0);
        c.restore();
      } else {
        c.drawImage(img, ix, iy);
      }
    }
    c.drawImage(this.front, PIT_SIDE, this.comp.height - this.front.height);
    r.image(this.comp, BALL_PIT.x + BALL_PIT.w / 2, BALL_PIT.bottom, { scaleY: 2 - this.bounce });
  }
}

// --------------------------------------------------------------------- swing
// A swing hanging from a frame: on they sit, and higher and higher they go.
const SWING_SPEED = 2.6; // radians per second through each swing

export class Swing extends Kit {
  constructor(assets) {
    super();
    this.imgs = assets.swing;
    this.y = SWING.y - 1; // so whoever's on it is in front
    this.spot = SWING.spot;
    this.t = 0;
    this.amp = 0; // how high it's swinging (radians)
    this.angle = 0;
  }

  hitTest(px, py) {
    const seat = this.seat;
    return inRect(px, py, seat.x - 14, seat.y - 22, 28, 30) || inRect(px, py, SWING.x - 38, SWING.top - 4, 76, 6);
  }

  // Where the middle of the seat is now.
  get seat() {
    return {
      x: SWING.x + Math.sin(this.angle) * SWING.rope,
      y: SWING.top + Math.cos(this.angle) * SWING.rope,
    };
  }

  async play(who) {
    const { scene } = this;
    const { engine } = scene;
    const { tweens } = engine;
    // Onto the seat (her legs hang down below it).
    who.x = SWING.x;
    who.y = SWING.y;
    who.facing = 1;
    this.who = who;
    strike(who, 'sit', 'idle');
    this.t = 0;
    engine.audio.play('wheee');
    await tweens.to(this, { amp: 0.55 }, 1.6, ease.inOutSine);
    strike(who, 'sitCheer', 'hop');
    if (who === scene.girl) {
      who.say('heart', 1.4);
    } else {
      scene.hearts(who.x, SWING.y - 30, 3);
    }
    engine.audio.play('wheee');
    await engine.wait(2.2);
    strike(who, 'sit', 'idle');
    await tweens.to(this, { amp: 0 }, 1.6, ease.inOutSine);
    this.who = null;
    // A hop down to the floor.
    tweens.to(who, { y: SWING.spot.y }, 0.25, ease.linear);
    await tweens.to(who, { lift: 0 }, 0.25, ease.inQuad);
    engine.audio.play('land');
    strike(who, 'idle', 'idle');
  }

  update(dt) {
    this.t += dt;
    this.angle = this.amp * Math.sin(this.t * SWING_SPEED);
    const who = this.who;
    if (who) {
      const seat = this.seat;
      who.x = seat.x;
      // Feet (hers dangle below the seat) to where they'd hang.
      who.lift = SWING.y + 1 - (seat.y + (who === this.scene.girl ? 7 : 1));
    }
  }

  draw(r) {
    r.image(this.imgs.frame, SWING.x, SWING.y + 2);
    const seat = this.seat;
    for (const dx of [-7, 7]) {
      const steps = SWING.rope;
      for (let i = 0; i <= steps; i += 1) {
        const k = i / steps;
        r.pixel(Math.round(SWING.x + dx + (seat.x - SWING.x) * k), Math.round(SWING.top + (seat.y - SWING.top) * k), '#b4bdd6');
      }
    }
    r.image(this.imgs.seat, seat.x, seat.y + 3, { scaleX: this.bounce });
  }
}

// ---------------------------------------------------------------- trampoline
// Boing, boing, BOING: each bounce higher than the last.
export class Trampoline extends Kit {
  constructor(assets) {
    super();
    this.imgs = assets.trampoline;
    this.y = TRAMPOLINE.y;
    this.spot = TRAMPOLINE.spot;
    this.dip = false;
  }

  hitTest(px, py) {
    const { x, y, rx, mat } = TRAMPOLINE;
    return inRect(px, py, x - rx, y - mat - 6, rx * 2, mat + 6);
  }

  async play(who) {
    const { scene } = this;
    const { engine } = scene;
    const { tweens } = engine;
    const stand = TRAMPOLINE.mat + 2; // up on the mat
    // Up onto it.
    strike(who, 'cheer', 'hop');
    tweens.to(who, { x: TRAMPOLINE.x, y: TRAMPOLINE.y + 1 }, 0.3, ease.linear);
    await tweens.to(who, { lift: stand + 8 }, 0.15, ease.outQuad);
    await tweens.to(who, { lift: stand }, 0.15, ease.inQuad);
    for (const height of [14, 22, 30, 40]) {
      this.dip = true;
      engine.audio.play('boing');
      await engine.wait(0.08);
      this.dip = false;
      strike(who, 'cheer', 'hop');
      await tweens.to(who, { lift: stand + height }, 0.22 + height / 160, ease.outQuad);
      strike(who, 'held', 'wave1');
      await tweens.to(who, { lift: stand }, 0.2 + height / 200, ease.inQuad);
    }
    this.dip = true;
    engine.audio.play('boing');
    scene.sparkles(who.x, who.y - 30, 8);
    if (who === scene.girl) {
      who.say('star', 1.2);
    } else {
      scene.hearts(who.x, who.y - 30, 3);
    }
    await engine.wait(0.1);
    this.dip = false;
    // And down off the side.
    tweens.to(who, { y: TRAMPOLINE.spot.y }, 0.3, ease.linear);
    await tweens.to(who, { lift: stand + 6 }, 0.12, ease.outQuad);
    strike(who, 'held', 'hop');
    await tweens.to(who, { lift: 0 }, 0.18, ease.inQuad);
    engine.audio.play('land');
    scene.dust(who.x, who.y);
    strike(who, 'idle', 'idle');
  }

  draw(r) {
    const { x, y, mat } = TRAMPOLINE;
    r.image(this.imgs[this.dip ? 1 : 0], x, y - mat - 5, { ay: 0, scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}
