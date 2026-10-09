import { ease } from '../../engine/tween.js';
import { LAMP_H, ROCKET_LAMP_H } from '../art/decor.js';
import { WALL_HANG } from '../layout.js';
import { countKind } from '../world.js';
import { Carryable } from './carryable.js';
import { hold, isFriendItem, letGo, strike } from './friends.js';
import { clampToFloor } from './girl.js';
import { inRect } from './house.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Decor for the ship (the pieces, and which she has, are in ../decor.js).
// Printed in the store room, then carryable like anything else: anywhere in
// the ship, into the bag, even out to the planets.

// How many of each piece the printer will make (counting ones anywhere).
export const MAX_COPIES = 3;

export const canPrint = (world, kind) => countKind(world, kind) < MAX_COPIES;

// Rugs lie flat under everything; wall pieces hang behind everything on the
// floor, but stuck on over the wall's own fixtures (lockers, the door, at
// depth -10 or less) so they're never hidden. Within a layer, nearer still
// goes in front.
const RUG_DEPTH = -100;
const WALL_DEPTH = -5;

// A piece of decor. `layer` is 'rug' or 'wall' for ones drawn under or
// behind everything else, or null for ones that stand on the floor.
class Decor extends Carryable {
  constructor(state, layer = null) {
    super(state);
    this.layer = layer;
  }

  get hangsOnWall() {
    return this.layer === 'wall';
  }

  get depth() {
    if (this.held || this.falling || !this.layer) {
      return super.depth;
    }
    return (this.hangsOnWall ? WALL_DEPTH : RUG_DEPTH) + this.y / 1000;
  }

  // Where it comes to rest when let go at (x, y): wall pieces hang on the
  // wall, if there is one here (snapping up onto it if dropped on the
  // floor); everything else is on the floor.
  restingSpot(x, y) {
    if (this.hangsOnWall && this.scene.hasWall) {
      return { x: clamp(x, WALL_HANG.minX, WALL_HANG.maxX), y: clamp(y, WALL_HANG.minY, WALL_HANG.maxY) };
    }
    return clampToFloor(x, y, this.scene.width);
  }
}

// ---------------------------------------------------------------- rug
// `size`: { half, shadow }: half its width (for tapping), and its shadow's
// width while carried.
export class Rug extends Decor {
  constructor(assets, state, key = 'rug', size = { half: 24, shadow: 34 }) {
    super(state, 'rug');
    this.img = assets.decor[key];
    this.size = size;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < this.size.half && Math.abs(py - this.y) < 8;
  }

  draw(r) {
    if (this.held || this.falling) {
      this.shadow(r, this.size.shadow);
    }
    r.image(this.img, this.x, this.y, { ay: 0.5, scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ---------------------------------------------------------------- lamp
// Tap it to switch it on or off. On is remembered as `stage` 1. `shape`:
// { h, glowY }: how tall it is, and how far down from its top the light is.
export class Lamp extends Decor {
  constructor(assets, state, key = 'lamp', shape = { h: LAMP_H, glowY: 8 }) {
    super(state);
    this.imgs = assets.decor[key];
    this.glow = assets.decor.lampGlow;
    this.shape = shape;
    this.on = state.stage === 1;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 9 && py > this.y - this.shape.h && py < this.y + 3;
  }

  onTap() {
    const { scene } = this;
    this.on = !this.on;
    scene.saveStage(this, this.on ? 1 : 0);
    scene.engine.audio.play('click');
    this.boing(0.6);
    scene.girl.faceToward(this.x);
    if (this.on) {
      scene.girl.say('star', 1);
    }
  }

  draw(r) {
    this.shadow(r, 12);
    const shadeY = this.y - this.shape.h + this.shape.glowY;
    if (this.on) {
      r.image(this.glow, this.x, shadeY, { ay: 0.5, alpha: 0.3 });
    }
    r.image(this.imgs[this.on ? 1 : 0], this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ---------------------------------------------------------------- beanbag
// Tap it and she flops right in; drop a friend on it and they do. A cosy
// little sit, then they hop out beside it. `shape`: { half, h, sink }: half
// its width, its height, and how far up off the floor whoever's sat in it is.
export class Beanbag extends Decor {
  constructor(assets, state, key = 'beanbag', shape = { half: 15, h: 18, sink: 7 }) {
    super(state);
    this.img = assets.decor[key];
    this.shape = shape;
    this.sitter = null;
  }

  hitTest(px, py) {
    const { half, h } = this.shape;
    return Math.abs(px - this.x) < half && py > this.y - h && py < this.y + 3;
  }

  // Tapped: she walks over and flops in herself (unless someone's in it).
  async use() {
    const { scene } = this;
    const { girl } = scene;
    if (this.sitter) {
      girl.say('question', 1); // someone's in it: her turn next
      return;
    }
    if (scene.busy) {
      return;
    }
    girl.mode = 'act';
    await scene.scripted(() => this.flop(girl));
    girl.pose = null;
    girl.mode = 'idle';
    girl.say('heart', 1.2);
    scene.persist();
  }

  accepts(item) {
    return isFriendItem(item) && !this.sitter && !this.held && !this.falling;
  }

  async receive(friend) {
    const { scene } = this;
    hold(friend);
    await this.flop(friend);
    letGo(friend);
    if (scene.engine.scene === scene) {
      scene.settle(friend);
      scene.girl.say('heart', 1.2);
    }
  }

  // Whoever it is (her or a friend) flumps in, has a cosy little sit with
  // their eyes shut, then hops out on the side they came from.
  async flop(who) {
    const { scene } = this;
    const { engine } = scene;
    const side = who.x < this.x ? -1 : 1;
    this.sitter = who;
    this.draggable = false;
    who.x = this.x;
    who.y = clampToFloor(this.x, this.y + 1, this.scene.width).y;
    who.lift = 20;
    strike(who, 'sit', 'hop');
    await engine.tweens.to(who, { lift: this.shape.sink }, 0.22, ease.inQuad);
    engine.audio.play('poof');
    this.boing(1.8);
    scene.dust(this.x, this.y);
    strike(who, 'sitBlink', 'blink');
    engine.audio.play('giggle');
    for (let i = 0; i < 3; i++) {
      await engine.wait(0.45);
      scene.hearts(this.x, this.y - this.shape.sink - 19, 1);
    }
    // And out again, beside it.
    const out = clampToFloor(this.x + side * 20, this.y + 2, this.scene.width);
    strike(who, 'cheer', 'hop');
    await engine.tweens.to(who, { lift: 16, x: (this.x + out.x) / 2 }, 0.18, ease.outQuad);
    await engine.tweens.to(who, { lift: 0, x: out.x, y: out.y }, 0.2, ease.inQuad);
    Object.assign(who, { lift: 0, x: out.x, y: out.y });
    this.sitter = null;
    this.draggable = true;
  }

  draw(r) {
    this.shadow(r, this.shape.half * 2 - 4);
    r.image(this.img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ---------------------------------------------------------------- big cushion
// Big and flat, but just as good for a flop.
export class BigCushion extends Beanbag {
  constructor(assets, state) {
    super(assets, state, 'bigcushion', { half: 17, h: 14, sink: 4 });
  }
}

// ---------------------------------------------------------------- star rug
export class StarRug extends Rug {
  constructor(assets, state) {
    super(assets, state, 'starrug', { half: 22, shadow: 32 });
  }
}

// ---------------------------------------------------------------- rocket lamp
// Switches on just like the lamp: the porthole glows and the flame lights.
export class RocketLamp extends Lamp {
  constructor(assets, state) {
    super(assets, state, 'rocketlamp', { h: ROCKET_LAMP_H, glowY: 12 });
  }
}

// ---------------------------------------------------------------- fish tank
// A fish swimming to and fro. Tap it and the fish darts about with a blorp.
export class FishTank extends Decor {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.decor.fishtank;
    this.dart = 0; // > 0 while the fish is darting about after a tap
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 15 && py > this.y - 28 && py < this.y + 3;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('blorp');
    this.boing(0.5);
    this.dart = 1;
    scene.engine.tweens.to(this, { dart: 0 }, 1.2);
    scene.girl.faceToward(this.x);
  }

  draw(r) {
    this.shadow(r, 24);
    const speed = this.dart > 0 ? 8 : 0.8;
    const frame = Math.floor((this.scene?.engine.time ?? 0) * speed) % 2;
    r.image(this.imgs[frame], this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ---------------------------------------------------------------- wall pieces
// Something that hangs on the wall. `key` names its picture (or its frames,
// which it twinkles through), and `sound` is what a tap on it plays.
export class WallPiece extends Decor {
  constructor(assets, state, key, sound = 'tap') {
    super(state, 'wall');
    const art = assets.decor[key];
    this.imgs = Array.isArray(art) ? art : [art];
    this.sound = sound;
  }

  get img() {
    return this.imgs[Math.floor((this.scene?.engine.time ?? 0) * 2) % this.imgs.length];
  }

  hitTest(px, py) {
    const { width, height } = this.imgs[0];
    return inRect(px, py, this.x - width / 2, this.y - height, width, height);
  }

  onTap() {
    this.scene.engine.audio.play(this.sound);
    this.boing();
  }

  draw(r) {
    r.image(this.img, this.x, this.y, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

export class WallPoster extends WallPiece {
  constructor(assets, state) {
    super(assets, state, 'wallposter');
  }
}

export class FairyLights extends WallPiece {
  constructor(assets, state) {
    super(assets, state, 'fairylights', 'tinkle');
  }
}

export class PlanetMobile extends WallPiece {
  constructor(assets, state) {
    super(assets, state, 'planetmobile', 'chime');
  }
}
