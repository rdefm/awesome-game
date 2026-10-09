import { ease } from '../../engine/tween.js';
import { BB, BURROW_H, BURROW_W } from '../art/bluebell.js';
import { PUFF_BURROW } from '../layout.js';
import { hold } from './friends.js';
import { herSide } from './girl.js';
import { Secret } from './secret.js';

// How long the puffball naps in the burrow before popping out by itself
// (seconds), and how often it snores meanwhile.
export const NAP_TIME = 12;
const SNORE_EVERY = 2.4;

// A baby puffball, out of the burrow for a play: its own entity while it's
// out, so it sorts in front of (or behind) her like anything else on the
// floor. It can't be tapped or picked up; the burrow moves it about.
class BabyPuff {
  constructor(img, x, y, facing) {
    Object.assign(this, { img, x, y, facing, lift: 0, scale: 0.4, spin: 0 });
  }

  draw(r) {
    const roll = Math.cos(this.spin * Math.PI); // head over heels, tumbling out
    r.image(this.img, this.x, this.y + 1 - this.lift, {
      flipX: (this.facing < 0) !== (roll < 0), scaleX: this.scale * Math.max(0.3, Math.abs(roll)), scaleY: this.scale,
    });
  }
}

// ---------------------------------------------------------- puffball burrow
// A little burrow in a grassy bank out on the far stretch. Tap it and a
// tumble of baby puffballs rolls out, bounces about squeaking and hops back
// in one by one (more of them each time, playing a different game). Drop the
// puffball on it and it wriggles in for a nap (snoring, zzz), popping back
// out when the burrow's tapped or after a while. Nothing about it is saved:
// a puffball napping when she leaves is just back out next time.
export class PuffBurrow extends Secret {
  constructor(assets) {
    const { x, y } = PUFF_BURROW;
    super(x, y, { w: BURROW_W - 6, h: BURROW_H - 2, reach: 22 });
    this.imgs = assets.burrow;
    this.babyImgs = assets.babyPuff;
    this.text = assets.text;
    this.babies = []; // the BabyPuffs out playing
    this.rumble = 0;
    this.napper = null; // the puffball asleep in it
    this.napLeft = 0;
    this.snoreIn = 0;
  }

  // The doorway, where babies (and the puffball) go in and out.
  get door() {
    return { x: this.x, y: this.y - 1 };
  }

  // Tapped while the puffball naps: it wakes straight away (no walking over).
  // (Still wriggling in, it's not woken just yet.)
  onTap() {
    if (this.napper) {
      this.scene.engine.audio.play('tap');
      this.boing(0.7);
      if (this.napper.napping) {
        this.wake();
      }
      return;
    }
    super.onTap();
  }

  async use() {
    if (this.napper) {
      return;
    }
    await super.use();
  }

  async reveal(n) {
    const { scene } = this;
    const { engine } = scene;
    const game = n % 3;
    const count = 3 + game;
    engine.audio.play('rustle');
    this.rumble = 1;
    scene.bits(this.x, this.y - 12, 5, BB.grassLight);
    await engine.wait(0.4);
    this.react('surprised', 'bang');
    // Out they tumble, one after another, fanning out in front.
    const outs = [];
    for (let i = 0; i < count; i++) {
      const baby = scene.add(new BabyPuff(this.babyImgs[i % this.babyImgs.length], this.door.x, this.door.y, i % 2 ? -1 : 1));
      this.babies.push(baby);
      const dx = (i - (count - 1) / 2) * 10;
      outs.push(this.tumbleOut(baby, this.x + dx, this.y + 5 + (i % 2) * 4));
      await engine.wait(0.18);
    }
    await Promise.all(outs);
    await [this.scatter, this.ring, this.together][game].call(this);
    this.react('cheer', 'heart');
    // Back in they go, one by one.
    for (const baby of [...this.babies]) {
      await this.hopIn(baby);
    }
  }

  // Rolls out of the doorway, head over heels, growing to full size.
  async tumbleOut(baby, x, y) {
    const { engine } = this.scene;
    engine.audio.play('squeak');
    await engine.tweens.to(baby, { x, y, scale: 1, spin: 2 }, 0.5, ease.outQuad);
    baby.spin = 0;
    this.scene.dust(x, y);
  }

  // One hop from where it is to (x, y).
  async hop(baby, x, y, height = 6, dur = 0.3) {
    const { tweens } = this.scene.engine;
    baby.facing = x < baby.x ? -1 : x > baby.x ? 1 : baby.facing;
    const up = tweens.to(baby, { lift: height }, dur / 2, ease.outQuad).then(() => tweens.to(baby, { lift: 0 }, dur / 2, ease.inQuad));
    await Promise.all([tweens.to(baby, { x, y }, dur, ease.linear), up]);
  }

  // Hops back to the doorway and shrinks away inside.
  async hopIn(baby) {
    const { engine } = this.scene;
    await this.hop(baby, this.door.x, this.door.y + 3, 6, 0.3);
    engine.audio.play('hide');
    await engine.tweens.to(baby, { y: this.door.y, scale: 0.3 }, 0.15, ease.inQuad);
    this.babies = this.babies.filter((b) => b !== baby);
    this.scene.remove(baby);
    this.boing(0.4);
  }

  // Game one: they bounce off every which way, squeaking.
  async scatter() {
    const { engine } = this.scene;
    for (let round = 0; round < 2; round++) {
      await Promise.all(this.babies.map((b, i) => {
        engine.audio.play('squeak');
        const x = b.x + (Math.random() - 0.5) * 24;
        const y = Math.max(this.y + 3, Math.min(this.y + 14, b.y + (Math.random() - 0.5) * 8));
        return engine.wait(i * 0.08).then(() => this.hop(b, x, y, 8, 0.35));
      }));
    }
  }

  // Game two: follow-the-leader in a ring round in front of the burrow.
  async ring() {
    const { engine } = this.scene;
    const cx = this.x;
    const cy = this.y + 9;
    const n = this.babies.length;
    for (let step = 1; step <= n; step++) {
      engine.audio.play('squeak');
      await Promise.all(this.babies.map((b, i) => {
        const a = ((i + step) / n) * Math.PI * 2;
        return this.hop(b, cx + Math.cos(a) * 16, cy + Math.sin(a) * 5, 5, 0.28);
      }));
    }
  }

  // Game three: all together, bouncing higher and higher, then hearts.
  async together() {
    const { scene } = this;
    for (const height of [6, 10, 16]) {
      scene.engine.audio.play('squeak');
      await Promise.all(this.babies.map((b) => this.hop(b, b.x, b.y, height, 0.25 + height * 0.015)));
    }
    scene.hearts(this.x, this.y - 10, 3);
    scene.sparkles(this.x, this.y, 6);
  }

  // The puffball (when it's free to come) has a nap in it; it's busy anyway
  // during the babies.
  accepts(item) {
    return item.kind === 'critter' && !this.napper && !this.revealing && !item.busy;
  }

  // In it wriggles, out of sight, and nods off.
  async receive(puffball) {
    const { scene } = this;
    const { engine } = scene;
    hold(puffball); // (while it drops in)
    this.napper = puffball;
    await scene.putDown(puffball, this.door.x, this.door.y + 4);
    puffball.napIn();
    engine.audio.play('rustle');
    this.boing(1);
    scene.bits(this.x, this.y - 12, 4, BB.grassLight);
    scene.girl.faceToward(this.x);
    scene.girl.say('heart', 1.2);
    this.napLeft = NAP_TIME;
    this.snoreIn = 0.8;
  }

  // Pops back out, wide awake, with a hop.
  wake() {
    const { scene } = this;
    const side = herSide(scene, this.x);
    this.napper.wakeOut(this.x + side * 6, this.y + 6, side);
    this.napper = null;
    scene.sparkles(this.x, this.y - 6, 5);
  }

  update(dt) {
    this.rumble = Math.max(0, this.rumble - dt * 1.5);
    if (!this.napper?.napping) {
      return;
    }
    this.snoreIn -= dt;
    if (this.snoreIn <= 0) {
      this.scene.engine.audio.play('snore');
      this.snoreIn = SNORE_EVERY;
    }
    this.napLeft -= dt;
    if (this.napLeft <= 0) {
      this.wake();
    }
  }

  draw(r) {
    const t = this.scene.engine.time;
    const asleep = this.napper?.napping;
    const shake = this.rumble > 0 ? Math.round(Math.sin(t * 40) * this.rumble * 1.5) : 0;
    const breathe = asleep ? Math.sin(t * 2.6) * 0.03 : 0; // gently rising and falling with each snore
    r.image(this.imgs[asleep ? 'asleep' : 'empty'], this.x + shake, this.y + 1, {
      scaleX: this.bounce + breathe, scaleY: 2 - this.bounce + breathe,
    });
  }

  // zzzs drift up off the sleeping puffball.
  drawOver(r) {
    if (!this.napper?.napping) {
      return;
    }
    const t = this.scene.engine.time;
    for (let i = 0; i < 2; i++) {
      const k = (t * 0.5 + i * 0.5) % 1;
      r.image(this.text('Z', '#ffffff'), this.x + 4 + k * 8, this.y - 10 - k * 12, { alpha: 1 - k });
    }
  }
}
