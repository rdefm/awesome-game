import { ease } from '../../engine/tween.js';
import { LAMP_H } from '../art/decor.js';
import { WALL_HANG } from '../layout.js';
import { countKind } from '../world.js';
import { Carryable } from './carryable.js';
import { hold, isFriendItem, letGo, strike } from './friends.js';
import { clampToFloor } from './girl.js';
import { inRect } from './house.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Decor for the ship, in the order the printer offers it. Printed in the
// store room, then carryable like anything else: anywhere in the ship, into
// the bag, even out to the planets.
export const DECOR = ['rug', 'lamp', 'beanbag', 'wallposter'];

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
    return clampToFloor(x, y);
  }
}

// ---------------------------------------------------------------- rug
export class Rug extends Decor {
  constructor(assets, state) {
    super(state, 'rug');
    this.img = assets.decor.rug;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 24 && Math.abs(py - this.y) < 8;
  }

  draw(r) {
    if (this.held || this.falling) {
      this.shadow(r, 34);
    }
    r.image(this.img, this.x, this.y, { ay: 0.5, scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ---------------------------------------------------------------- lamp
// Tap it to switch it on or off. On is remembered as `stage` 1.
export class Lamp extends Decor {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.decor.lamp;
    this.glow = assets.decor.lampGlow;
    this.on = state.stage === 1;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 9 && py > this.y - LAMP_H && py < this.y + 3;
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
    const shadeY = this.y - LAMP_H + 8;
    if (this.on) {
      r.image(this.glow, this.x, shadeY, { ay: 0.5, alpha: 0.3 });
    }
    r.image(this.imgs[this.on ? 1 : 0], this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ---------------------------------------------------------------- beanbag
// Tap it and she flops right in; drop a friend on it and they do. A cosy
// little sit, then they hop out beside it.
const SINK = 7; // how far up off the floor whoever's sat in it is

export class Beanbag extends Decor {
  constructor(assets, state) {
    super(state);
    this.img = assets.decor.beanbag;
    this.sitter = null;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 15 && py > this.y - 18 && py < this.y + 3;
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
    who.y = clampToFloor(this.x, this.y + 1).y;
    who.lift = 20;
    strike(who, 'sit', 'hop');
    await engine.tweens.to(who, { lift: SINK }, 0.22, ease.inQuad);
    engine.audio.play('poof');
    this.boing(1.8);
    scene.dust(this.x, this.y);
    strike(who, 'sitBlink', 'blink');
    engine.audio.play('giggle');
    for (let i = 0; i < 3; i++) {
      await engine.wait(0.45);
      scene.hearts(this.x, this.y - 26, 1);
    }
    // And out again, beside it.
    const out = clampToFloor(this.x + side * 20, this.y + 2);
    strike(who, 'cheer', 'hop');
    await engine.tweens.to(who, { lift: 16, x: (this.x + out.x) / 2 }, 0.18, ease.outQuad);
    await engine.tweens.to(who, { lift: 0, x: out.x, y: out.y }, 0.2, ease.inQuad);
    Object.assign(who, { lift: 0, x: out.x, y: out.y });
    this.sitter = null;
    this.draggable = true;
  }

  draw(r) {
    this.shadow(r, 26);
    r.image(this.img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ---------------------------------------------------------------- wall poster
export class WallPoster extends Decor {
  constructor(assets, state) {
    super(state, 'wall');
    this.img = assets.decor.wallposter;
  }

  hitTest(px, py) {
    const { width, height } = this.img;
    return inRect(px, py, this.x - width / 2, this.y - height, width, height);
  }

  draw(r) {
    r.image(this.img, this.x, this.y, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}
