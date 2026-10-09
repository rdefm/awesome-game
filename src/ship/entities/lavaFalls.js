import { ease } from '../../engine/tween.js';
import { EM } from '../art/ember.js';
import { FALLS_GEYSER, FALLS_POOL, LAVA_FALLS } from '../layout.js';
import { clampToFloor } from './girl.js';
import { Secret } from './secret.js';

// The things at the lava falls on Ember. None of them can be picked up, but
// they all do something when tapped.

const POOL_TOP = FALLS_POOL.y - FALLS_POOL.ry;
const STONE_REST = 3; // how high she stands on a stepping stone
const BUBBLE_GONE = 24; // how high bubbles float before they've faded away

// -------------------------------------------------------------------- falls
// The glowing cascade itself (painted on the backdrop): bright streaks run
// down it. Tap it and it surges, hissing and spitting sparks, and a rush of
// bubbles comes up in the pool.
export class Falls {
  constructor() {
    this.x = LAVA_FALLS.x;
    this.y = POOL_TOP;
    this.depth = POOL_TOP - 1; // behind the bubbles rising in front of it
    this.surge = 0;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) <= LAVA_FALLS.w / 2 + 4 && py >= LAVA_FALLS.top - 4 && py <= this.y + 2;
  }

  onTap() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.surge > 0.3) {
      return;
    }
    engine.audio.play('sizzle');
    this.surge = 1;
    engine.tweens.to(this, { surge: 0 }, 1.4, ease.inQuad);
    scene.bits(this.x, this.y, 10, EM.lavaLight);
    scene.bubbles.rush(4);
    girl.faceToward(this.x);
    girl.say('star', 1.2);
  }

  draw(r) {
    const t = this.scene.engine.time;
    const h = this.y - LAVA_FALLS.top;
    const left = this.x - LAVA_FALLS.w / 2;
    // Bright streaks pouring down, faster while it surges.
    for (let i = 0; i < 7; i++) {
      const x = left + 2 + ((i * 11) % (LAVA_FALLS.w - 3));
      const y = LAVA_FALLS.top + ((t * (34 + this.surge * 40) + i * 23) % h);
      r.rect(x, y, 1, Math.min(6, this.y - y), EM.lavaHi, 0.8);
    }
    if (this.surge > 0) {
      r.rect(left, LAVA_FALLS.top, LAVA_FALLS.w + 1, h, EM.lavaHi, this.surge * 0.35);
    }
    // The splash at the bottom, frothing.
    const froth = 2 + Math.round(Math.sin(t * 9) + this.surge * 3);
    r.rect(this.x - LAVA_FALLS.w / 2 - froth, this.y + 1, LAVA_FALLS.w + froth * 2, 1, EM.lavaHi, 0.7);
  }
}

// ------------------------------------------------------------------ bubbles
// Lava bubbles swelling up out of the pool now and then and floating up.
// Tap one and it pops in a burst of sparks; every fifth pop she cheers.
export class LavaBubbles {
  constructor(assets) {
    this.img = assets.lavaBubble;
    this.y = POOL_TOP;
    this.list = []; // { x, y, size, grow, vy, phase, age }
    this.next = 0.5;
    this.pops = 0;
  }

  // A bubble swells up out of the pool somewhere.
  blow() {
    const { x: px, rx } = FALLS_POOL;
    this.list.push({
      x: px - rx + 14 + Math.random() * (rx * 2 - 28), y: POOL_TOP + 2 + Math.random() * 8,
      size: 0.7 + Math.random() * 0.6, grow: 0, vy: 7 + Math.random() * 5, phase: Math.random() * 6, age: 0,
    });
  }

  // Several at once (when the falls surges).
  rush(n) {
    for (let i = 0; i < n; i++) {
      this.blow();
    }
  }

  // Where bubble `b` is drawn (bottom-centre, swaying side to side), its
  // middle, and how big it's grown.
  placed(b) {
    const s = b.size * b.grow;
    const x = b.x + Math.sin(this.scene.engine.time * 2 + b.phase) * 2 * b.grow;
    return { x, y: b.y, mid: b.y - 5 * s, s };
  }

  // The bubble under (x, y), generously: they're small and moving.
  at(px, py) {
    return this.list.find((b) => {
      const { x, mid, s } = this.placed(b);
      return Math.hypot(px - x, py - mid) <= 6 * s + 5;
    });
  }

  hitTest(px, py) {
    return Boolean(this.at(px, py));
  }

  onTap(p) {
    const { scene } = this;
    const { engine, girl } = scene;
    const bubble = this.at(p.x, p.y);
    if (!bubble) {
      return;
    }
    this.list = this.list.filter((b) => b !== bubble);
    const { x, mid } = this.placed(bubble);
    engine.audio.play('pop');
    scene.bits(x, mid, 6, EM.lavaLight);
    scene.sparkles(x, mid, 3);
    girl.faceToward(x);
    this.pops += 1;
    if (this.pops % 5 === 0) {
      girl.say('heart', 1.2);
      girl.act('cheer', 0.8);
    } else {
      girl.say('star', 0.8);
    }
  }

  update(dt) {
    this.next -= dt;
    if (this.next <= 0) {
      if (this.list.length < 6) {
        this.blow();
      }
      this.next = 0.9 + Math.random() * 0.9;
    }
    for (const b of this.list) {
      b.age += dt;
      b.grow = Math.min(1, b.grow + dt * 2);
      if (b.grow >= 1) {
        b.y -= b.vy * dt;
      }
    }
    this.list = this.list.filter((b) => b.y > BUBBLE_GONE);
  }

  draw(r) {
    for (const b of this.list) {
      const { x, y, s } = this.placed(b);
      const fade = Math.min(1, (y - BUBBLE_GONE) / 20);
      r.image(this.img, x, y, { scaleX: s, scaleY: s, alpha: fade });
    }
  }
}

// ----------------------------------------------------------- stepping stones
// Warm flat stones along the near shore. Tap one and she walks to whichever
// end of the row is nearer and hops across them all, each one glowing and
// ringing a note higher than the last, then hops off the far end and cheers.
// (Bluebell's stream has a row of its own: see stream.js.)
export class SteppingStone {
  // At `at` (bottom-centre). `imgs`: it plain and lit up; `spark`: the colour
  // of the bits that fly up as she lands on it.
  constructor(imgs, at, spark = EM.lavaLight) {
    this.imgs = imgs;
    this.x = at.x;
    this.y = at.y;
    this.spark = spark;
    this.squash = 0;
    this.glow = 0;
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }

  // The scene's whole row of stones, in order left to right.
  get row() {
    return this.scene.stones;
  }

  // Where she starts: just off whichever end of the row she's nearer.
  get spot() {
    const { row } = this;
    const mid = (row[0].x + row[row.length - 1].x) / 2;
    const end = this.scene.girl.x < mid ? row[0] : row[row.length - 1];
    return clampToFloor(end.x + (end === row[0] ? -16 : 16), end.y + 1, this.scene.width);
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) <= 12 && py >= this.y - 10 && py <= this.y + 3;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tap');
    this.boing();
    if (!scene.busy) {
      scene.interact(this);
    }
  }

  boing() {
    this.squash = 0.7;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.5, ease.outElastic);
  }

  // She's just landed on it: it glows, and rings note `note`.
  land(note) {
    const { scene } = this;
    this.boing();
    this.glow = 1;
    scene.engine.tweens.to(this, { glow: 0 }, 1.6, ease.inQuad);
    scene.engine.audio.play('plink', { note });
    scene.bits(this.x, this.y - 3, 3, this.spark);
  }

  async use() {
    const { scene } = this;
    const { girl } = scene;
    const stones = girl.x < this.row[0].x ? this.row : [...this.row].reverse();
    const last = stones[stones.length - 1];
    const off = clampToFloor(last.x + (stones === this.row ? 16 : -16), last.y + 1, scene.width);
    await scene.scripted(async () => {
      for (const [i, stone] of stones.entries()) {
        await this.hopTo(stone.x, stone.y + 1, STONE_REST);
        stone.land(i + 1);
      }
      await this.hopTo(off.x, off.y, 0);
      scene.dust(off.x, off.y);
    });
    girl.say('heart', 1.4);
    girl.act('cheer', 0.8);
    scene.hearts(girl.x, girl.headTop - 2, 3);
  }

  // One hop of hers, landing at (x, y) standing `rest` high.
  async hopTo(x, y, rest) {
    const { engine, girl } = this.scene;
    girl.faceToward(x);
    const arc = engine.tweens.to(girl, { lift: 12 }, 0.14, ease.outQuad)
      .then(() => engine.tweens.to(girl, { lift: rest }, 0.16, ease.inQuad));
    await Promise.all([engine.tweens.to(girl, { x, y }, 0.3, ease.linear), arc]);
  }

  draw(r) {
    const opts = { scaleX: this.bounce, scaleY: 2 - this.bounce };
    r.image(this.imgs[0], this.x, this.y + 1, opts);
    if (this.glow > 0) {
      r.image(this.imgs[1], this.x, this.y + 1, { ...opts, alpha: this.glow });
    }
  }
}

// ------------------------------------------------------------------- geyser
// A crusty vent with a pumice rock sat on top. Tap either and it rumbles,
// then a fountain of glowing lava and steam blasts up, lifting the rock high
// into the air and bobbing it there, until it dies down and the rock drops
// back onto the vent with a thud.
export class FallsGeyser extends Secret {
  constructor(assets) {
    const { x, y } = FALLS_GEYSER;
    super(x, y, { w: 24, h: 22, reach: 22 });
    this.img = assets.vent;
    this.puffImg = assets.steam;
    this.rockImg = assets.pumice;
    this.rumble = 0;
    this.spout = 0; // seconds of fountain left
    this.puffs = [];
    this.rock = { lift: 0 };
  }

  // Taps on the rock count too, wherever the fountain has it.
  hitTest(px, py) {
    const rockY = this.y - 9 - this.rock.lift; // the middle of it
    return super.hitTest(px, py) || (Math.abs(px - this.x) <= 10 && Math.abs(py - rockY) <= 9);
  }

  async reveal() {
    const { scene } = this;
    const { engine } = scene;
    engine.audio.play('rumble');
    this.rumble = 1;
    scene.bits(this.x, this.y - 4, 4, EM.ashLight);
    await engine.wait(0.7);
    engine.audio.play('whoosh');
    this.spout = 2;
    this.react('surprised', 'bang');
    await engine.tweens.to(this.rock, { lift: 58 }, 0.6, ease.outQuad);
    await engine.wait(1.4);
    await engine.tweens.to(this.rock, { lift: 0 }, 0.45, ease.inQuad);
    engine.audio.play('thud');
    this.boing(1);
    scene.dust(this.x, this.y);
    this.react('cheer', 'heart');
  }

  update(dt) {
    this.rumble = Math.max(0, this.rumble - dt * 1.2);
    if (this.spout > 0) {
      this.spout = Math.max(0, this.spout - dt);
      // Steam billowing up, and blobs of lava flung up and falling back.
      this.puffs.push({
        x: this.x + (Math.random() - 0.5) * 4, y: this.y - 4, vx: (Math.random() - 0.5) * 10,
        vy: -(80 + Math.random() * 30), age: 0, life: 0.9 + Math.random() * 0.4, drag: 1.8,
      });
      this.puffs.push({
        x: this.x + (Math.random() - 0.5) * 3, y: this.y - 4, vx: (Math.random() - 0.5) * 24,
        vy: -(70 + Math.random() * 40), age: 0, life: 1, gravity: 140, lava: true,
      });
    }
    for (const p of this.puffs) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.lava) {
        p.vy += p.gravity * dt;
      } else {
        p.vy *= 1 - dt * p.drag;
      }
    }
    this.puffs = this.puffs.filter((p) => p.age < p.life && p.y < this.y);
  }

  draw(r) {
    const t = this.scene.engine.time;
    const shake = this.rumble > 0 ? Math.round(Math.sin(t * 50) * this.rumble) : 0;
    r.rect(this.x - 11, this.y - 1, 22, 2, '#000000', 0.2);
    r.image(this.img, this.x + shake, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
    if (this.rock.lift < 1) {
      r.image(this.rockImg, this.x + shake, this.y - 4, { scaleX: this.bounce, scaleY: 2 - this.bounce });
    }
  }

  // The fountain, and the rock riding up on it, above everything else.
  drawOver(r) {
    for (const p of this.puffs) {
      const k = p.age / p.life;
      if (p.lava) {
        r.rect(p.x, p.y, 2, 2, k < 0.5 ? EM.lavaHi : EM.lava, 1 - k * 0.5);
      } else {
        const s = 0.6 + k * 1.6;
        r.image(this.puffImg, p.x, p.y, { ay: 0.5, scaleX: s, scaleY: s, alpha: 0.85 * (1 - k) });
      }
    }
    if (this.rock.lift >= 1) {
      const bob = this.spout > 0 ? Math.sin(this.scene.engine.time * 8) * 2 : 0;
      const shadow = Math.max(4, 14 - this.rock.lift / 6);
      r.rect(this.x - shadow / 2, this.y - 2, shadow, 1, '#000000', 0.2);
      r.image(this.rockImg, this.x, this.y - 4 - this.rock.lift + bob);
    }
  }
}
