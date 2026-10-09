import { ease } from '../../engine/tween.js';
import { MG } from '../art/mushroomGrove.js';
import { MUSHROOM_GROVE, W, spooks } from '../layout.js';
import { clampToFloor } from './girl.js';

// The things at the mushroom grove on Bluebell. None of them can be picked
// up, but they all do something when tapped.

// ---------------------------------------------------------- bounce mushroom
// A giant spotted mushroom. Tap it and she hops up on the cap and bounces,
// higher each time, the cap squashing down under her and puffing out glowing
// spores; every third go the bounces are bigger. She hops off the side with
// a cheer.
export class BounceShroom {
  constructor(assets, variant) {
    this.img = assets.bounceShrooms[variant];
    this.variant = variant;
    const { x, y, top, rx } = MUSHROOM_GROVE.shrooms[variant];
    Object.assign(this, { x, y, top, rx });
    this.squash = 0; // how far the cap is squashed down, 0..1
    this.bounces = 0;
  }

  get depth() {
    return this.y;
  }

  // Beside it, on whichever side she's on.
  get spot() {
    const side = this.scene.girl.x < this.x ? -1 : 1;
    return clampToFloor(this.x + side * (this.rx + 8), this.y + 2);
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) <= this.rx + 2 && py >= this.y - this.top - 10 && py <= this.y + 2;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tap');
    this.dip(0.5);
    if (!scene.busy) {
      scene.interact(this);
    }
  }

  dip(amount) {
    const { tweens } = this.scene.engine;
    tweens.cancel(this);
    this.squash = amount;
    return tweens.to(this, { squash: 0 }, 0.5, ease.outElastic);
  }

  // Glowing spores puffed up off the cap.
  puff(n) {
    const { scene } = this;
    scene.bits(this.x, this.y - this.top, n, MG.glow);
    scene.sparkles(this.x, this.y - this.top - 4, Math.ceil(n / 2));
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    const { tweens } = engine;
    this.bounces += 1;
    const big = this.bounces % 3 === 0;
    const heights = big ? [16, 26, 38, 54] : [14, 22, 32];
    const off = this.spot;
    await scene.scripted(async () => {
      // Up onto the cap.
      girl.mode = 'act';
      girl.pose = { frame: 'cheer', token: {} };
      girl.faceToward(this.x);
      tweens.to(girl, { x: this.x, y: this.y + 1 }, 0.35, ease.linear);
      await tweens.to(girl, { lift: this.top + 10 }, 0.17, ease.outQuad);
      await tweens.to(girl, { lift: this.top }, 0.18, ease.inQuad);
      for (const height of heights) {
        this.dip(1);
        engine.audio.play('boing');
        this.puff(3);
        await engine.wait(0.08);
        await tweens.to(girl, { lift: this.top + height }, 0.22 + height / 160, ease.outQuad);
        await tweens.to(girl, { lift: this.top }, 0.2 + height / 200, ease.inQuad);
      }
      this.dip(1);
      engine.audio.play('boing');
      this.puff(big ? 12 : 6);
      await engine.wait(0.1);
      // And off the side.
      girl.faceToward(off.x);
      tweens.to(girl, { x: off.x, y: off.y }, 0.3, ease.linear);
      await tweens.to(girl, { lift: this.top + 6 }, 0.12, ease.outQuad);
      await tweens.to(girl, { lift: 0 }, 0.18 + this.top / 300, ease.inQuad);
      engine.audio.play('land');
      scene.dust(girl.x, girl.y);
      girl.pose = null;
      girl.mode = 'idle';
    });
    scene.persist();
    girl.say(big ? 'heart' : 'star', 1.4);
    girl.act('cheer', 0.8);
    scene.hearts(girl.x, girl.headTop - 2, big ? 5 : 2);
  }

  draw(r) {
    r.image(this.img, this.x, this.y + 1, { scaleX: 1 + this.squash * 0.1, scaleY: 1 - this.squash * 0.14 });
  }
}

// ------------------------------------------------------------------- spores
// Glowing spores drifting up among the mushrooms, twinkling. Tap one and it
// pops with a chime, a note and a burst of sparkles, lighting up the ones
// near it; a new one drifts up from the moss in its place.
export class Spores {
  constructor() {
    this.depth = 400; // over most things
    this.priority = -2; // but anything else under the finger wins
    this.motes = Array.from({ length: 16 }, (_, i) => this.fresh(i / 16));
  }

  // A mote at `k` (0..1) of the way up from the moss to the treetops.
  fresh(k = 0) {
    return {
      x: 12 + Math.random() * (W - 24),
      base: 118 + Math.random() * 38,
      k,
      speed: 0.04 + Math.random() * 0.04,
      phase: Math.random() * 6,
      note: Math.floor(Math.random() * 4),
      lit: 0,
    };
  }

  pos(m, t) {
    return { x: m.x + Math.sin(t * 0.8 + m.phase) * 5, y: m.base - m.k * 70 };
  }

  nearest(px, py) {
    const t = this.scene.engine.time;
    let best = null;
    for (const m of this.motes) {
      const p = this.pos(m, t);
      const d = Math.hypot(p.x - px, p.y - py);
      if (d <= 10 && (!best || d < best.d)) {
        best = { m, d };
      }
    }
    return best?.m ?? null;
  }

  hitTest(px, py) {
    return this.nearest(px, py) !== null;
  }

  onTap(p) {
    const { scene } = this;
    const { engine, girl } = scene;
    const mote = this.nearest(p.x, p.y);
    if (!mote) {
      return;
    }
    const at = this.pos(mote, engine.time);
    engine.audio.play(['plink', 'tinkle', 'ding', 'chime'][mote.note]);
    scene.sparkles(at.x, at.y, 6);
    scene.musicNote(at.x, at.y);
    girl.faceToward(at.x);
    girl.say('note', 1);
    // The ones near it flare up too.
    for (const m of this.motes) {
      const q = this.pos(m, engine.time);
      if (m !== mote && Math.hypot(q.x - at.x, q.y - at.y) < 40) {
        m.lit = 1;
      }
    }
    Object.assign(mote, this.fresh(0));
  }

  update(dt) {
    for (const m of this.motes) {
      m.k += m.speed * dt;
      m.lit = Math.max(0, m.lit - dt * 0.8);
      if (m.k > 1) {
        Object.assign(m, this.fresh(0));
      }
    }
  }

  draw(r) {
    const t = this.scene.engine.time;
    for (const m of this.motes) {
      const { x, y } = this.pos(m, t);
      const fade = Math.min(1, m.k * 6, (1 - m.k) * 4);
      const twinkle = 0.55 + 0.45 * Math.sin(t * 3 + m.phase * 2);
      const px = Math.round(x);
      const py = Math.round(y);
      const glow = Math.max(twinkle, m.lit);
      r.rect(px - 1, py - 1, 3, 3, MG.glowDeep, 0.3 * fade * glow);
      r.rect(px, py, 1, 1, MG.glow, fade * (0.6 + 0.4 * glow));
      if (m.lit > 0) {
        r.rect(px - 2, py, 5, 1, '#ffffff', m.lit * 0.8);
        r.rect(px, py - 2, 1, 5, '#ffffff', m.lit * 0.8);
      }
    }
  }
}

// ------------------------------------------------------ mushroom creature
// A shy little mushroom creature. When she comes near it pulls its cap right
// down and is just another mushroom; step away and it pops back out. Tap it
// and she goes over: the first time it only peeks out and giggles, the second
// it looks all round and blushes, and the third it's so brave it comes right
// out and does a little dance in a cloud of spores (and stays out for a bit,
// even with her close by).
export class MushroomCreature {
  constructor(assets) {
    this.imgs = assets.shroomCreature;
    this.x = MUSHROOM_GROVE.creature.x;
    this.y = MUSHROOM_GROVE.creature.y;
    this.hidden = false;
    this.frame = 'out';
    this.facing = 1;
    this.lift = 0;
    this.brave = 0; // seconds left that it'll stay out however near she is
    this.away = 0; // seconds she's been far away
    this.blinkIn = 2;
    this.visits = 0;
    this.busy = false;
  }

  get depth() {
    return this.y;
  }

  // Beside it, on whichever side she's on.
  get spot() {
    const side = this.scene.girl.x < this.x ? -1 : 1;
    return clampToFloor(this.x + side * 22, this.y + 2);
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) <= 10 && py >= this.y - 22 && py <= this.y + 2;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tap');
    if (!this.busy && !scene.busy) {
      scene.interact(this);
    }
  }

  async use() {
    if (this.busy) {
      return;
    }
    this.busy = true;
    const { scene } = this;
    const { engine, girl } = scene;
    const n = this.visits;
    this.visits += 1;
    this.facing = girl.x < this.x ? -1 : 1;
    girl.faceToward(this.x);
    girl.act('reach', 0.6);
    await engine.wait(0.4);
    if (n % 3 === 2) {
      // Brave at last: out it comes, for a dance.
      this.hidden = false;
      this.brave = 8;
      engine.audio.play('pop');
      scene.bits(this.x, this.y - 12, 10, MG.glow);
      for (let i = 0; i < 6; i++) {
        this.frame = i % 2 ? 'dance2' : 'dance1';
        engine.audio.play(i % 2 ? 'plink' : 'tinkle');
        scene.sparkles(this.x, this.y - 18, 3);
        scene.musicNote(this.x, this.y - 22);
        await engine.tweens.to(this, { lift: 4 }, 0.12, ease.outQuad);
        await engine.tweens.to(this, { lift: 0 }, 0.12, ease.inQuad);
      }
      this.frame = 'out';
      girl.say('heart', 1.4);
      girl.act('cheer', 0.8);
      scene.hearts(this.x, this.y - 22, 4);
    } else {
      // Just a peek.
      this.frame = 'peek';
      engine.audio.play('peek');
      await engine.wait(0.5);
      if (n % 3 === 1) {
        for (const dir of [-1, 1]) {
          this.facing = dir;
          engine.audio.play('sniff');
          await engine.wait(0.45);
        }
      }
      engine.audio.play('giggle');
      scene.hearts(this.x, this.y - 22, n % 3 === 1 ? 2 : 1);
      girl.say('heart', 1);
      await engine.wait(0.5);
      engine.audio.play('hide');
      this.frame = 'out';
    }
    this.busy = false;
  }

  update(dt) {
    this.blinkIn -= dt;
    if (this.blinkIn < -0.15) {
      this.blinkIn = 2 + Math.random() * 3;
    }
    this.brave = Math.max(0, this.brave - dt);
    if (this.busy) {
      return;
    }
    const near = spooks(this.scene.girl, this);
    if (near && !this.hidden && this.brave <= 0) {
      this.hidden = true;
      this.away = 0;
      this.scene.engine.audio.play('hide');
    } else if (!near || this.brave > 0) {
      this.away += dt;
      if (this.hidden && this.away > 1.5) {
        this.hidden = false;
        this.scene.engine.audio.play('pop');
      }
    } else {
      this.away = 0;
    }
  }

  draw(r) {
    let frame = this.frame;
    if (this.hidden && frame === 'out') {
      frame = 'hide';
    } else if (frame === 'out' && this.blinkIn < 0) {
      frame = 'blink';
    }
    r.rect(this.x - 6, this.y, 12, 1, '#000000', 0.15);
    r.image(this.imgs[frame], this.x, this.y + 1 - this.lift, { flipX: this.facing < 0 });
  }
}
