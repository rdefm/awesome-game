import { ease } from '../../engine/tween.js';
import { STREAM_ART, WATER } from '../art/bluebell.js';
import { H, HORIZON, STREAM, WALK, inStream, streamAt } from '../layout.js';
import { hold, isFriendItem, letGo } from './friends.js';
import { clampToFloor } from './girl.js';
import { SteppingStone } from './lavaFalls.js';

// The little stream across the far end of Bluebell's meadow, and the things
// in it.

const STREAM_DEPTH = -200; // painted on the ground, under everything stood on it
const THING_SINK = 3; // how deep things float in it
const FRIEND_SINK = 6; // and how deep friends paddle
export const WASH_UP_DELAY = 1.2; // seconds a thing's out of sight downstream
const GONE = H + 16; // how far down it floats before it's quite out of sight
const SPLASH_EVERY = 0.22; // seconds between splashes as she wades through it

// Something bobbing along in the stream: a thing floating off downstream, or
// a friend paddling across. It stands in for the thing itself (which is out
// of the scene meanwhile, so it can't be tapped or picked up), drawing it
// sunk in the water up to `sink` deep. It follows the stream down, `offset`
// to the side of its middle.
class Floater {
  constructor(item, y, offset, sink) {
    Object.assign(this, { item, y, offset, sink, phase: Math.random() * 6 });
  }

  get x() {
    return streamAt(this.y).x + this.offset;
  }

  get depth() {
    return this.y;
  }

  // The thing itself bobs along with it.
  update() {
    const { item } = this;
    const t = item.scene.engine.time;
    item.x = this.x + Math.sin(t * 2 + this.phase) * 0.6;
    item.y = Math.round(this.y) + this.sink + Math.round(Math.sin(t * 5 + this.phase));
  }

  draw(r) {
    const { item } = this;
    const surface = Math.round(this.y);
    // Only the part above the water shows.
    const { ctx } = r;
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.round(this.x - 24 + r.offsetX), Math.round(surface - 60 + r.offsetY), 48, 60);
    ctx.clip();
    item.draw(r);
    ctx.restore();
    r.rect(this.x - 6, surface, 12, 1, WATER.foam, 0.8); // the ripple round it
    r.rect(this.x - 4, surface + 1, 8, 1, WATER.shallow, 0.6);
  }
}

// ------------------------------------------------------------------ stream
// The water itself, running down out of the hills towards the viewer (she
// can wade straight through it, splashing). Drop a thing in and it bobs off
// downstream, out of sight, then washes up on the bank a moment later; drop
// a friend in and it paddles across to the far bank and shakes itself dry.
// Either way it's remembered on the bank straight away, so it's never lost
// (even if she's off somewhere else before it's back).
export class Stream {
  constructor(assets) {
    this.img = assets.stream;
    this.depth = STREAM_DEPTH;
    this.priority = -2; // things stood in it win the tap
    this.splashIn = 0;
  }

  // Just the water (a tap there walks her into it; it's only for drops).
  // Not over the stepping stones: something dropped on those comes to rest
  // on the bank instead (see besideStream).
  hitTest(px, py) {
    const onStone = (s) => Math.abs(px - s.x) <= 6 && Math.abs(py - (s.y - 2)) <= 4;
    return inStream(px, py) && !this.scene.stones?.some(onStone);
  }

  accepts(item) {
    return !item.busy;
  }

  // Where something washes up (or climbs out): on the bank on `side` of the
  // stream (-1 left, 1 right), down at the front.
  bank(side) {
    const y = WALK.maxY - 2;
    const { x, half } = streamAt(y);
    return clampToFloor(x + side * (half + 7), y, this.scene.width);
  }

  async receive(item) {
    const { scene } = this;
    const { engine, girl } = scene;
    const y = Math.max(HORIZON + 6, Math.min(H - 4, item.y));
    const { x: mid, half } = streamAt(y);
    const offset = Math.max(-half + 2, Math.min(half - 2, item.x - mid));
    const friend = isFriendItem(item);
    // A friend heads for the bank across from where it went in; a thing
    // washes up on the bank it went in nearer.
    const side = (offset < 0 ? -1 : 1) * (friend ? -1 : 1);
    const bank = this.bank(side);
    if (friend) {
      hold(item);
    }
    scene.settle(item, bank.x, bank.y);
    scene.remove(item);
    engine.tweens.cancel(item);
    const float = scene.add(new Floater(item, y, offset, friend ? FRIEND_SINK : THING_SINK));
    this.splash(float.x, y, 6);
    girl.faceToward(float.x);
    girl.say('bang', 1);
    if (friend) {
      await this.paddle(float, side);
    } else {
      await this.bobAway(float);
      await this.washUp(float, side);
    }
    scene.remove(float);
    scene.add(item);
    item.falling = true; // up out of the water and onto the bank
    await engine.tweens.to(item, { x: bank.x, y: bank.y - 8 }, 0.3, ease.outQuad);
    await scene.putDown(item, bank.x, bank.y);
    if (friend) {
      await this.shakeDry(item);
    } else {
      scene.sparkles(item.x, item.y - 6, 4);
      if (girl.mode === 'idle') {
        girl.faceToward(item.x);
        girl.say('heart', 1.2);
      }
    }
  }

  // Off it bobs down the stream, drifting to the middle, and out of sight.
  async bobAway(float) {
    const { engine } = this.scene;
    const dur = 0.6 + (GONE - float.y) / 22;
    await engine.tweens.to(float, { y: GONE, offset: 0 }, dur, ease.inSine);
    this.scene.remove(float);
    await engine.wait(WASH_UP_DELAY);
  }

  // ...and back it comes, carried in on a ripple at the edge of the stream.
  async washUp(float, side) {
    const { engine } = this.scene;
    float.y = H + 4;
    float.offset = side * (streamAt(H).half - 3);
    this.scene.add(float);
    engine.audio.play('plop');
    await engine.tweens.to(float, { y: WALK.maxY + 2 }, 0.6, ease.outQuad);
    this.splash(float.x, float.y, 3);
  }

  // A friend paddles across to the far bank, splashing as it goes (the
  // stream carrying it down a little on the way).
  async paddle(float, side) {
    const { engine } = this.scene;
    const strokes = 5;
    const to = { y: float.y + 6, offset: side * (streamAt(float.y + 6).half - 1) };
    const swim = engine.tweens.to(float, to, strokes * 0.3, ease.inOutSine);
    for (let i = 0; i < strokes; i++) {
      await engine.wait(0.3);
      engine.audio.play('plop');
      this.splash(float.x - side * 4, float.y, 2);
    }
    await swim;
  }

  // Out on the bank: a big wet shake, drops flying, and a happy giggle.
  async shakeDry(friend) {
    const { scene } = this;
    const { engine, girl } = scene;
    engine.audio.play('shake');
    for (let i = 0; i < 6; i++) {
      await engine.tweens.to(friend, { squash: i % 2 ? -0.9 : 0.9 }, 0.06, ease.linear);
      scene.bits(friend.x, friend.y - 10, 3, WATER.shallow);
    }
    friend.squash = 0;
    engine.audio.play('giggle');
    scene.hearts(friend.x, friend.y - 20, 2);
    if (girl.mode === 'idle') {
      girl.faceToward(friend.x);
      girl.say('heart', 1.2);
    }
    letGo(friend);
  }

  splash(x, y, n) {
    this.scene.engine.audio.play('splash');
    this.scene.bits(x, y, n, WATER.foam);
    this.scene.ripple(x, y);
  }

  // She splashes as she wades through.
  update(dt) {
    const { girl } = this.scene;
    this.splashIn -= dt;
    if (girl.mode === 'walk' && inStream(girl.x, girl.y) && this.splashIn <= 0) {
      this.scene.bits(girl.x, girl.y, 2, WATER.foam);
      this.splashIn = SPLASH_EVERY;
    }
  }

  draw(r) {
    const t = this.scene.engine.time;
    r.image(this.img, STREAM_ART.x, H, { ax: 0 });
    // Glints of foam running down it, faster nearer the viewer.
    for (let i = 0; i < 12; i++) {
      const k = (t * 0.22 + i / 12) % 1;
      const y = HORIZON + 4 + k * k * (H - HORIZON - 4);
      const { x, half } = streamAt(y);
      const across = (((i * 7) % 11) / 10 - 0.5) * half * 1.4;
      r.rect(x + across, y, 1 + Math.round(k * 2), 1, WATER.foam, 0.4 + k * 0.4);
    }
    // The water rippling round the stepping stones.
    for (const s of this.scene.stones ?? []) {
      const w = 15 + Math.round(Math.sin(t * 6 + s.x) * 1.5);
      r.rect(s.x - w / 2, s.y, w, 1, WATER.foam, 0.6);
    }
  }
}

// Where something put down at `spot` comes to rest: there, unless that's in
// the water, when it's on the nearer bank instead (only something dropped
// right in floats off; see Stream). `width`: how wide the meadow is.
export function besideStream(spot, width) {
  if (!inStream(spot.x, spot.y)) {
    return spot;
  }
  const { x, half } = streamAt(spot.y);
  return clampToFloor(x + (spot.x < x ? -1 : 1) * (half + 4), spot.y, width);
}

// The stepping stones across it: tap one and she hops across the lot, each
// one ringing a note higher than the last, there and back.
export function streamStones(assets) {
  return STREAM.stones.map((at) => new SteppingStone(assets.streamStone, at, WATER.foam));
}
