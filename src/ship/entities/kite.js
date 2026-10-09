import { ease } from '../../engine/tween.js';
import { KITE_COLORS, KITE_CROSS, KITE_REEL, KITE_TAIL } from '../art/bluebell.js';
import { KITE } from '../layout.js';
import { hold, isFriendItem, letGo } from './friends.js';
import { clampToFloor, herSide } from './girl.js';
import { Secret } from './secret.js';

const RUN = 30; // how far she runs with it
const RUN_TIME = 0.9;
const SKY_Y = 44; // how high it flies
const LOOP_R = 14; // the size of its loop-the-loop
const RISE_TIME = 1.4;
const LOOP_TIME = 1.6;
const SINK_TIME = 2.6; // floating back down
const BOWS = 4; // bows on its tail
const BOW_GAP = 5; // and how far apart down it they are
const GROUND = 4; // how far above its spot it is, lying in the grass

// -------------------------------------------------------------------- kite
// A kite lying in the grass out on the far stretch, its reel beside it. Tap
// it and she picks up the reel and runs a few steps, and it swoops up into
// the sky on its string, loops the loop in the wind and floats back down into
// the grass. Drop a friend on it and the wind takes it up with the friend
// riding it, round a loop-the-loop and gently back down, delighted. Nothing
// about it is saved.
export class Kite extends Secret {
  constructor(assets) {
    const { x, y } = KITE;
    super(x, y, { w: 30, h: 10, reach: 20 });
    this.imgs = assets.kite;
    this.flight = null; // up off the grass: where it's flying (its spars' cross)
    this.loop = 0; // how far round a loop-the-loop it is, 0..1
    this.holder = null; // who's got the reel (the girl, or nobody: it's in the grass)
    this.rider = null; // a friend riding it
  }

  // Where it is in the sky: round its loop, and bobbing in the wind once it's
  // well up off the grass.
  get at() {
    const { x, y } = this.flight;
    const a = this.loop * Math.PI * 2;
    const t = this.scene.engine.time;
    const up = Math.min(1, (this.y - y) / 30);
    return {
      x: x + Math.sin(a) * LOOP_R + Math.sin(t * 1.7) * 2 * up,
      y: y - (1 - Math.cos(a)) * LOOP_R + Math.sin(t * 2.3) * 1.5 * up,
    };
  }

  // The reel's end of the string: in her hands, or lying in the grass.
  get reel() {
    const { holder } = this;
    if (holder) {
      return { x: holder.x + holder.facing * 4, y: holder.y - (13 + holder.lift) * holder.scale };
    }
    return { x: this.x + KITE_REEL.x, y: this.y + KITE_REEL.y };
  }

  // Up in the sky, or with a friend on it (about to be): busy.
  get aloft() {
    return Boolean(this.flight || this.rider);
  }

  // Busy: nothing to do but watch.
  onTap() {
    if (this.aloft) {
      return;
    }
    super.onTap();
  }

  async use() {
    if (this.aloft) {
      return;
    }
    await super.use();
  }

  async reveal() {
    const { scene } = this;
    const { engine, girl } = scene;
    const side = herSide(scene, this.x);
    await scene.scripted(async () => {
      girl.faceToward(this.x);
      await girl.act('reach', 0.4); // picks up the reel...
      this.holder = girl;
      engine.audio.play('pickup');
      // ...and off she runs with it, and up it swoops behind her.
      const run = clampToFloor(girl.x + side * RUN, girl.y, scene.width);
      girl.faceToward(run.x);
      girl.act('walk', RUN_TIME);
      await Promise.all([
        engine.tweens.to(girl, { x: run.x, y: run.y }, RUN_TIME, ease.linear),
        this.fly({ x: this.x + side * 8, y: SKY_Y }, () => {
          girl.faceToward(this.x);
          girl.act('reach', LOOP_TIME); // holding on tight
        }),
      ]);
      // Back she goes to put the reel down beside it.
      await girl.walkTo(this.x + KITE_REEL.x, this.y + 3);
      this.holder = null;
    });
    this.react('cheer', 'heart');
    scene.hearts(girl.x, girl.headTop - 2, 3);
  }

  // A friend dropped on it (when it's lying free in the grass).
  accepts(item) {
    return isFriendItem(item) && !item.busy && !this.aloft && !this.revealing;
  }

  // Up the friend goes on it, round a loop-the-loop and back down, and hops
  // for joy.
  async receive(friend) {
    const { scene } = this;
    const { engine, girl } = scene;
    hold(friend);
    this.rider = friend;
    await scene.putDown(friend, this.x, this.y + 1);
    engine.audio.play('boop');
    friend.pose?.('hop');
    girl.faceToward(this.x);
    await this.fly({ x: this.x, y: SKY_Y - 6 }, () => girl.say('bang', 1.2));
    this.rider = null;
    friend.lift = 0;
    friend.x = this.x;
    engine.audio.play('giggle');
    friend.pose?.('wave1');
    await engine.tweens.to(friend, { lift: 10 }, 0.16, ease.outQuad);
    await engine.tweens.to(friend, { lift: 0 }, 0.2, ease.inQuad);
    scene.hearts(friend.x, friend.y - 24, 3);
    scene.sparkles(friend.x, friend.y - 16, 6);
    girl.say('heart', 1.4);
    letGo(friend);
    if (engine.scene !== scene) {
      return; // she left mid-flight; it's remembered where it landed
    }
    scene.settle(friend);
  }

  // Off the grass with a gust, swooping up to `sky`, round a loop-the-loop
  // (`looping` called as it starts) and floating gently back down into the
  // grass where it was.
  async fly(sky, looping) {
    const { engine } = this.scene;
    const ground = { x: this.x, y: this.y - GROUND };
    this.flight = { ...ground };
    this.loop = 0;
    engine.audio.play('swoop');
    await Promise.all([
      engine.tweens.to(this.flight, { x: sky.x }, RISE_TIME, ease.inOutSine),
      engine.tweens.to(this.flight, { y: sky.y }, RISE_TIME, ease.outSine),
    ]);
    looping();
    engine.audio.play('wheee');
    await engine.tweens.to(this, { loop: 1 }, LOOP_TIME, ease.inOutSine);
    this.loop = 0;
    engine.audio.play('flutter');
    await engine.tweens.to(this.flight, ground, SINK_TIME, ease.inOutSine);
    this.flight = null;
    engine.audio.play('land');
    this.scene.dust(this.x, this.y);
    this.boing(0.8);
  }

  // A friend riding it sits on its face, wherever it's flown to (as high
  // up off the grass as it is).
  update() {
    if (!this.rider || !this.flight) {
      return;
    }
    const { x, y } = this.at;
    this.rider.x = x;
    this.rider.lift = Math.max(0, this.y - GROUND - y);
  }

  draw(r) {
    const { fly, lying, reel } = this.imgs;
    const end = this.reel;
    if (this.flight) {
      const at = this.at;
      this.drawString(r, end, at);
      this.drawTail(r, at);
      r.image(fly, at.x, at.y, { ay: KITE_CROSS / fly.height });
    } else {
      r.image(lying, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
      if (this.holder) { // (bringing the reel back to it)
        this.drawString(r, end, { x: this.x, y: this.y - GROUND });
      }
    }
    r.image(reel, end.x, end.y, { ay: 0.5 });
  }

  // The string from the reel up to it, sagging a little.
  drawString(r, from, to) {
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    const sag = len * 0.1;
    const steps = Math.ceil(len);
    for (let i = 0; i <= steps; i++) {
      const k = i / steps;
      r.pixel(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k + Math.sin(k * Math.PI) * sag, KITE_COLORS.string);
    }
  }

  // Its ribbon tail, fluttering below it, with bows along it.
  drawTail(r, at) {
    const t = this.scene.engine.time;
    const wave = (k) => Math.sin(t * 6 - k * 0.4) * k * 0.15;
    const top = at.y + KITE_TAIL;
    for (let k = 0; k < BOWS * BOW_GAP; k++) {
      r.pixel(at.x + wave(k), top + k, KITE_COLORS.string);
    }
    for (let i = 1; i <= BOWS; i++) {
      const k = i * BOW_GAP - 1;
      r.image(this.imgs.bow, at.x + wave(k), top + k, { ay: 0.5 });
    }
  }
}
