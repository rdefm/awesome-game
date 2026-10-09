import { ease } from '../../engine/tween.js';
import { DANDELION_HEAD, DANDELION_W, FLUFF, FLUFF_R } from '../art/bluebell.js';
import { DANDELION } from '../layout.js';
import { clampToFloor, herSide } from './girl.js';
import { Secret } from './secret.js';

export const REGROW_TIME = 14; // seconds bald before the fluff grows back
const SEED_COUNT = 18; // how many puff off when she blows
const FLOAT_HIGH = 26; // how high the seed she holds onto lifts her
const DRIFT = 24; // and how far it carries her across
const RISE_TIME = 1.2; // seconds going up
const SINK_TIME = 2; // and drifting back down

// ------------------------------------------------------- giant dandelion clock
// A dandelion gone to seed out on the far stretch, taller than she is. Tap it
// and she blows: the seeds puff off across the sky, and one she holds onto
// lifts her gently off the ground, drifts her along and lets her down again.
// The bald stalk grows its fluff back after a little while (tapped before
// then, it just gives a little "nothing left" wiggle). Nothing is saved.
export class Dandelion extends Secret {
  constructor(assets) {
    const { x, y } = DANDELION;
    super(x, y, { w: DANDELION_W, h: DANDELION_HEAD + 12, reach: 14 });
    this.imgs = assets.dandelion;
    this.fluff = 1; // how big its clock is (bald at 0)
    this.grown = true; // a full clock to blow (not bald, nor still growing back)
    this.regrowIn = 0;
    this.wiggle = 0;
    this.seeds = []; // the ones blowing away: { x, y, vx, vy, phase }
    this.held = null; // the one she's holding onto (or about to)
  }

  // The middle of its head, where the seeds grow.
  get head() {
    return { x: this.x, y: this.y - DANDELION_HEAD };
  }

  // Bald (or still growing back): she shrugs, and it wiggles.
  onTap() {
    if (this.grown) {
      super.onTap();
      return;
    }
    const { girl } = this.scene;
    this.scene.engine.audio.play('tap');
    this.boing(0.4);
    this.wiggle = 1;
    if (girl.onFeet) {
      girl.faceToward(this.x);
      girl.say('question', 1);
    }
  }

  async use() {
    if (!this.grown) {
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
      girl.act('reach', 0.7); // lips pursed, and...
      await engine.wait(0.4);
      engine.audio.play('blow');
      this.blow(-side);
      await this.catchSeed(side);
      await this.float(side);
    });
    this.react('cheer', 'heart');
    scene.hearts(girl.x, girl.headTop - 2, 3);
  }

  // Puff! Off the seeds go, away from her (`dir`), and it's bald.
  blow(dir) {
    const { head } = this;
    for (let i = 0; i < SEED_COUNT; i++) {
      const a = (i / SEED_COUNT) * Math.PI * 2;
      this.seeds.push({
        x: head.x + Math.cos(a) * (FLUFF_R - 2),
        y: head.y + Math.sin(a) * (FLUFF_R - 2),
        vx: dir * (12 + Math.random() * 22),
        vy: -(5 + Math.random() * 12),
        phase: Math.random() * 6,
      });
    }
    this.fluff = 0;
    this.grown = false;
    this.regrowIn = REGROW_TIME;
    this.boing(1);
    this.scene.bits(head.x, head.y, 4, FLUFF.white);
  }

  // One seed floats down to her and she reaches up and grabs it, turning
  // `side` (the way it'll carry her: back away from the stalk).
  async catchSeed(side) {
    const { engine, girl } = this.scene;
    this.held = { ...this.head, on: false };
    girl.faceToward(girl.x + side);
    await engine.tweens.to(this.held, this.hands(), 0.6, ease.inOutSine);
    this.held.on = true;
    engine.audio.play('pop');
  }

  // Up she goes on it, and along, then gently down again to land.
  async float(side) {
    const { scene } = this;
    const { engine, girl } = scene;
    const land = clampToFloor(girl.x + side * DRIFT, girl.y, scene.width);
    const mid = (girl.x + land.x) / 2;
    engine.audio.play('wheee');
    girl.act('held', RISE_TIME + SINK_TIME); // hanging on, legs kicking
    await Promise.all([
      engine.tweens.to(girl, { lift: FLOAT_HIGH }, RISE_TIME, ease.outSine),
      engine.tweens.to(girl, { x: mid }, RISE_TIME, ease.inSine),
    ]);
    await Promise.all([
      engine.tweens.to(girl, { lift: 0 }, SINK_TIME, ease.inOutSine),
      engine.tweens.to(girl, { x: land.x, y: land.y }, SINK_TIME, ease.outSine),
    ]);
    scene.dust(girl.x, girl.y);
    scene.persist(); // (she's somewhere new)
    // She lets go, and off it floats on the way it was carrying her.
    const { x, y } = this.hands();
    this.seeds.push({ x, y, vx: side * 10, vy: -8, phase: 0 });
    this.held = null;
    await girl.hop(3);
  }

  // Where her hands are, held up over her head (holding the seed's stalk).
  hands() {
    const { girl } = this.scene;
    return { x: girl.x, y: girl.y - (30 + girl.lift) * girl.scale };
  }

  update(dt) {
    this.wiggle = Math.max(0, this.wiggle - dt * 1.6);
    const t = this.scene.engine.time;
    // The loose seeds drift off up, bobbing, and away out of the sky.
    for (const s of this.seeds) {
      s.x += (s.vx + Math.sin(t * 2 + s.phase) * 6) * dt;
      s.y += (s.vy + Math.sin(t * 3 + s.phase) * 4) * dt;
      s.vy -= dt * 2;
    }
    this.seeds = this.seeds.filter((s) => s.y > -12 && s.x > -12 && s.x < this.scene.width + 12);
    if (this.grown || this.revealing) {
      return;
    }
    this.regrowIn -= dt;
    if (this.regrowIn <= 0) {
      this.regrow();
    }
  }

  // Back it grows, fluffing up to a full clock again (only blowable once
  // it's quite finished).
  regrow() {
    const { scene } = this;
    scene.engine.audio.play('grow');
    this.regrowIn = Infinity;
    scene.engine.tweens.to(this, { fluff: 1 }, 1.4, ease.outBack).then(() => {
      this.grown = true;
    });
    scene.sparkles(this.head.x, this.head.y, 5);
  }

  draw(r) {
    const t = this.scene.engine.time;
    const shake = Math.round(Math.sin(t * 30) * this.wiggle * 1.5);
    const sway = Math.round(Math.sin(t * 1.1 + 2) * 0.5) + shake;
    const { x, y } = this.head;
    r.image(this.imgs.stalk, this.x + shake, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
    if (this.fluff > 0) {
      const k = Math.min(1.1, this.fluff) * this.bounce;
      r.image(this.imgs.fluff, x + sway, y - 1 + (this.bounce - 1) * DANDELION_HEAD, { ay: 0.5, scaleX: k, scaleY: k });
    }
  }

  // The seeds over everything, out across the sky.
  drawOver(r) {
    const { seed } = this.imgs;
    for (const s of this.seeds) {
      r.image(seed, s.x, s.y, { ay: 0.5 });
    }
    if (this.held) {
      const { x, y } = this.held.on ? this.hands() : this.held;
      r.image(seed, x, y, { scaleX: 2, scaleY: 2 });
    }
  }
}
