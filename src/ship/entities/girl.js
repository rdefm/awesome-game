import { ease } from '../../engine/tween.js';
import { hatHeight } from '../art/girl.js';
import { W, WALK, floorMaxX } from '../layout.js';
import { weave, weavesPosies } from './crown.js';
import { greet, isFriendItem } from './friends.js';

const WALK_SPEED = 72; // game px per second
const HOLD_OFFSET = 16; // when carried, the finger holds her by the shoulders

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// The nearest spot on the floor to (x, y), in a place `width` wide (one
// screen unless it says otherwise: see PlayScene.width).
// Which way x is from her: -1 if she's to the left of it, 1 if not.
export const herSide = (scene, x) => (scene.girl.x < x ? -1 : 1);

export function clampToFloor(x, y, width = W) {
  return { x: clamp(x, WALK.minX, floorMaxX(width)), y: clamp(y, WALK.minY, WALK.maxY) };
}

// The player character. Mostly a small state machine:
//   idle -> walk -> idle, act (a timed pose), held (being dragged), seated (in the chair).
export class Girl {
  // `look` is how she looks (see ../look.js).
  constructor(assets, x, y, look) {
    this.assets = assets;
    this.wear(look);
    this.emotes = assets.emotes;
    this.x = x;
    this.y = y;
    this.facing = 1;
    this.lift = 0; // visual hop height above her feet
    this.alpha = 1; // fades out/in when going through a door
    this.scale = 1; // smaller when she's far off in the distance
    this.mode = 'idle';
    this.anim = 0;
    this.blinkIn = 2;
    this.boredIn = 10;
    this.pose = null;
    this.walkJob = null;
    this.emote = null;
    this.dizzy = 0;
    this.priority = 10;
    this.hugging = false;
    this.greeting = false; // saying hello to a friend dropped on her
    this.weaving = false; // weaving a posy into her flower crown
    this.riding = null; // what's drawing her (playground kit, the lift, her bed)
    this.draggable = true;
  }

  wear(look) {
    this.look = look;
    this.frames = this.assets.girl(look);
  }

  get depth() {
    return this.mode === 'held' ? 1000 : this.y;
  }

  // Resolves true on arrival, false if something else interrupted the walk.
  walkTo(x, y) {
    this.cancelWalk();
    if (this.mode === 'seated') {
      this.scene.chair.release();
    }
    const target = clampToFloor(x, y, this.scene.width);
    return new Promise((resolve) => {
      this.walkJob = { ...target, resolve };
      this.mode = 'walk';
      this.pose = null;
    });
  }

  cancelWalk() {
    if (this.walkJob) {
      this.walkJob.resolve(false);
      this.walkJob = null;
    }
  }

  // Holds a named pose (or an alternating pair) for `seconds`.
  async act(frame, seconds) {
    const token = {};
    this.pose = { frame, token };
    if (this.mode !== 'seated') {
      this.mode = 'act';
    }
    await this.scene.engine.wait(seconds);
    if (this.pose?.token === token) {
      this.pose = null;
      if (this.mode === 'act') {
        this.mode = 'idle';
      }
    }
  }

  say(kind, seconds = 1.6) {
    this.emote = { kind, t: 0, life: seconds };
  }

  faceToward(x) {
    if (Math.abs(x - this.x) > 2) {
      this.facing = x > this.x ? 1 : -1;
    }
  }

  async hop(height = 8) {
    await this.scene.engine.tweens.to(this, { lift: height }, 0.12, ease.outQuad);
    await this.scene.engine.tweens.to(this, { lift: 0 }, 0.18, ease.inQuad);
  }

  update(dt) {
    this.anim += dt;
    this.dizzy = Math.max(0, this.dizzy - dt);
    if (this.emote) {
      this.emote.t += dt;
      if (this.emote.t > this.emote.life) {
        this.emote = null;
      }
    }
    this.blinkIn -= dt;
    if (this.blinkIn < -0.12) {
      this.blinkIn = 2 + Math.random() * 3;
    }

    if (this.mode === 'walk' && this.walkJob) {
      const dx = this.walkJob.x - this.x;
      const dy = this.walkJob.y - this.y;
      const dist = Math.hypot(dx, dy);
      const step = WALK_SPEED * dt;
      this.faceToward(this.walkJob.x);
      if (dist <= step) {
        this.x = this.walkJob.x;
        this.y = this.walkJob.y;
        const job = this.walkJob;
        this.walkJob = null;
        this.mode = 'idle';
        this.scene.persist();
        job.resolve(true);
      } else {
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
    }

    // Left alone for a while, she potters about on her own and hums.
    if (this.mode === 'idle' && !this.scene.busy) {
      this.boredIn -= dt;
      if (this.boredIn <= 0) {
        this.boredIn = 8 + Math.random() * 8;
        const x = this.x + (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 50);
        this.say('note', 1.4);
        this.walkTo(x, this.y + (Math.random() - 0.5) * 16);
      }
    } else {
      this.boredIn = Math.max(this.boredIn, 6);
    }
  }

  currentFrame() {
    const f = this.frames;
    const blinking = this.blinkIn < 0;
    if (this.pose) {
      const p = f[this.pose.frame];
      return Array.isArray(p) ? p[Math.floor(this.anim * 5) % p.length] : p;
    }
    switch (this.mode) {
      case 'walk':
        return f.walk[Math.floor(this.anim * 8) % 4];
      case 'held':
        return f.held[Math.floor(this.anim * 6) % 2];
      case 'seated':
        if (this.dizzy > 0) {
          return f.sitDizzy;
        }
        return blinking ? f.sitBlink : f.sit;
      default:
        if (this.dizzy > 0) {
          return f.dizzy;
        }
        return blinking ? f.blink : f.idle[Math.floor(this.anim * 1.5) % 2];
    }
  }

  // The top of her head (hat and all), where bubbles and chat lines go.
  get headTop() {
    return this.mode === 'seated' ? this.y - 38 - this.hatHeight : this.y - (27 + this.lift + this.hatHeight) * this.scale;
  }

  // How far her hat (if any) pokes up above her hair.
  get hatHeight() {
    return hatHeight(this.look?.hat);
  }

  // Up and about (not being carried or sitting in the chair).
  get onFeet() {
    return ['idle', 'walk', 'act'].includes(this.mode);
  }

  hitTest(px, py) {
    const top = (this.mode === 'seated' ? this.y - 38 : this.y - 28 - this.lift) - this.hatHeight;
    const bottom = this.mode === 'seated' ? this.y - 12 : this.y + 2;
    return px >= this.x - 11 && px <= this.x + 11 && py >= top && py <= bottom;
  }

  onTap() {
    if (this.mode === 'seated') {
      this.scene.chair.spin();
      return;
    }
    if (this.riding?.wakeUp) {
      this.riding.wakeUp(); // tucked up in bed
      return;
    }
    this.cancelWalk();
    this.scene.engine.audio.play('giggle');
    this.say('heart');
    this.hop(10);
    this.act('cheer', 0.6);
  }

  onDragStart() {
    this.cancelWalk();
    if (this.mode === 'seated') {
      this.scene.chair.release();
    }
    this.pose = null;
    this.mode = 'held';
    this.lift = 0;
    this.scene.engine.audio.play('pickup');
  }

  onDrag(p) {
    this.faceToward(p.x);
    this.x = clamp(p.x, 8, this.scene.width - 8);
    this.y = clamp(p.y + HOLD_OFFSET, 30, 158);
  }

  // Drop the teddy on her and she gives it a big hug, then sets it down
  // beside her. Drop a friend on her and they say hello. Drop a posy on her
  // (till she's made her flower crown) and she weaves it in.
  accepts(item) {
    const free = !this.hugging && !this.greeting && !this.weaving && this.onFeet && !this.riding && !this.scene.busy;
    const posy = item.kind === 'posy' && weavesPosies(this.scene);
    return free && (item.kind === 'teddy' || isFriendItem(item) || posy);
  }

  receive(item) {
    if (item.kind === 'posy') {
      return weave(this, item);
    }
    return isFriendItem(item) ? greet(this, item) : this.hug(item);
  }

  async hug(teddy) {
    const { scene } = this;
    const { engine } = scene;
    this.hugging = true;
    this.cancelWalk();
    scene.remove(teddy); // she's holding it now (it's part of the hug pose)
    engine.tweens.cancel(teddy);
    engine.audio.play('squeak');
    scene.hearts(this.x, this.y - 30, 3);
    const hug = this.act('hug', 1.6);
    await engine.wait(0.7);
    engine.audio.play('squeak');
    scene.sparkles(this.x, this.y - 14, 5);
    await hug;
    this.hugging = false;
    if (engine.scene !== scene) {
      return; // she left mid-hug; the teddy stays where it last was
    }
    const x = this.x + this.facing * 14;
    scene.add(teddy);
    teddy.x = x;
    teddy.y = this.y - 6;
    scene.putDown(teddy, x, this.y + 2);
  }

  async onDrop() {
    if (this.scene.chair?.fits(this.x, this.y)) {
      this.scene.chair.seat();
      this.scene.engine.audio.play('land');
      return;
    }
    // Fall down to the floor (or stay put if dropped onto it).
    const floor = clampToFloor(this.x, this.y, this.scene.width);
    const fallFrom = this.y;
    this.mode = 'act';
    this.pose = { frame: 'held', token: {} };
    this.x = floor.x;
    this.y = floor.y;
    this.lift = Math.max(0, floor.y - fallFrom);
    await this.scene.engine.tweens.to(this, { lift: 0 }, 0.08 + this.lift / 300, ease.inQuad);
    this.scene.engine.audio.play('land');
    this.scene.dust(this.x, this.y);
    this.pose = null;
    this.mode = 'idle';
    this.scene.persist();
    await this.hop(3);
  }

  draw(r) {
    if (this.mode === 'seated' || this.riding) {
      return; // the chair draws her, so she spins with it (or the ball pit, so she can sink out of sight)
    }
    const s = this.scale;
    const shadowW = (this.mode === 'held' ? 8 : 12) * s;
    const shadowY = this.mode === 'held' ? clampToFloor(this.x, this.y + 30).y : this.y;
    r.rect(this.x - shadowW / 2, shadowY - 1, shadowW, Math.max(1, 2 * s), '#000000', 0.25 * this.alpha);
    r.image(this.currentFrame(), this.x, this.y + 1 - this.lift * s, {
      flipX: this.facing < 0, alpha: this.alpha, scaleX: s, scaleY: s,
    });
  }

  // Drawn after everything else so bubbles are never hidden behind props.
  drawOver(r) {
    const s = this.scale;
    const headY = this.headTop;
    if (this.emote) {
      const e = this.emote;
      const pop = Math.min(1, e.t / 0.15);
      const fade = Math.min(1, (e.life - e.t) / 0.25);
      r.image(this.emotes[e.kind], this.x + 6 * s, headY - 1 - pop * 3, { scaleX: pop, scaleY: pop, alpha: fade });
    }
    if (this.dizzy > 0) {
      for (let i = 0; i < 3; i++) {
        const a = this.anim * 6 + (i * Math.PI * 2) / 3;
        r.pixel(this.x + Math.cos(a) * 7, headY + 1 + Math.sin(a) * 2, i === 1 ? '#ffffff' : '#ffe066');
      }
    }
  }
}
