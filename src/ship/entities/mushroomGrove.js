import { ease } from '../../engine/tween.js';
import { MG } from '../art/mushroomGrove.js';
import { offerChat } from '../chat.js';
import { MUSHROOM_GROVE, W, spooks } from '../layout.js';
import { SHROOM } from '../talks/shroom.js';
import { hold, isFriendItem, letGo, play } from './friends.js';
import { clampToFloor, herSide } from './girl.js';
import { isSnack } from './items.js';
import { Stroller } from './stroller.js';

// The things at the mushroom grove on Bluebell. They all do something when
// tapped; only the mushroom creature can ever be picked up (once it's her
// friend).

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
// near it; a new one drifts up from the moss in its place. One popped over
// the glow `pond` blooms a lily on the water below it.
export class Spores {
  constructor(pond = null) {
    this.pond = pond;
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
    if (this.pond?.over(at.x, at.y)) {
      this.pond.bloom(at.x);
    }
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

// ---------------------------------------------------------------- glow pond
// A dark little pond at the back, off the floor. Tap the water and ripples
// spread out from the finger and the glowing fish in it light up and dart
// about, slowing and fading out again. A spore popped over it (see Spores)
// blooms a glowing water-lily on the surface, which closes up and fades
// after a while. None of it is ever saved.
const FISH_COUNT = 4;
const FISH_GLOW = 4; // seconds a fish glows for
const RIPPLE_LIFE = 1.4;
const LILY_LIFE = 14;
export const MAX_LILIES = 3; // at once

export class GlowPond {
  constructor(assets) {
    this.img = assets.glowPond;
    this.lilyImg = assets.glowLily;
    Object.assign(this, MUSHROOM_GROVE.pond);
    this.depth = this.y - this.ry - 4; // flat on the floor, under anything near it
    this.priority = -3; // anything over it (spores too) wins a tap
    this.ripples = []; // { x, y, age }
    this.lilies = []; // { x, y, age }
    // Each fish swims round its own little loop of the pond (`a` round it,
    // `r` how big a loop, as a share of the widest it can swim; see
    // fishPos), faster while it glows.
    this.fish = Array.from({ length: FISH_COUNT }, (_, i) => ({
      a: (i / FISH_COUNT) * Math.PI * 2,
      r: 0.35 + (i % 2) * 0.35,
      dir: i % 2 ? 1 : -1,
      glow: 0,
    }));
  }

  holds({ x, y }) {
    return ((x - this.x) / this.rx) ** 2 + ((y - this.y) / this.ry) ** 2 <= 1;
  }

  // Whether (x, y) is somewhere above the water (a spore popped there drops onto it).
  over(x, y) {
    return Math.abs(x - this.x) <= this.rx - 4 && y <= this.y + this.ry;
  }

  hitTest(px, py) {
    return ((px - this.x) / (this.rx + 1)) ** 2 + ((py - this.y) / (this.ry + 2)) ** 2 <= 1;
  }

  fishPos(f) {
    return { x: this.x + Math.cos(f.a) * this.rx * 0.8 * f.r, y: this.y + Math.sin(f.a) * this.ry * 0.6 * f.r };
  }

  onTap(p) {
    const { scene } = this;
    const { engine, girl } = scene;
    engine.audio.play('bloop');
    this.ripples.push({ x: p.x, y: p.y, age: 0 });
    for (const f of this.fish) {
      f.glow = 1;
    }
    girl.faceToward(p.x);
    girl.say('star', 1);
  }

  // A lily opens on the water below `x`; the oldest goes if there are too many.
  bloom(x) {
    const { scene } = this;
    const at = { x: Math.max(this.x - this.rx + 6, Math.min(this.x + this.rx - 6, x)), y: this.y + 1 };
    scene.engine.audio.play('bloom');
    scene.sparkles(at.x, at.y - 4, 5);
    this.ripples.push({ ...at, age: 0 });
    this.lilies.push({ ...at, age: 0 });
    if (this.lilies.length > MAX_LILIES) {
      this.lilies.shift();
    }
  }

  update(dt) {
    for (const r of this.ripples) {
      r.age += dt;
    }
    this.ripples = this.ripples.filter((r) => r.age < RIPPLE_LIFE);
    for (const l of this.lilies) {
      l.age += dt;
    }
    this.lilies = this.lilies.filter((l) => l.age < LILY_LIFE);
    for (const f of this.fish) {
      f.a += f.dir * (0.3 + f.glow * 2.5) * dt;
      f.glow = Math.max(0, f.glow - dt / FISH_GLOW);
    }
  }

  draw(r) {
    const { img } = this;
    r.image(img, this.x, this.y, { ax: Math.floor(img.width / 2) / img.width, ay: Math.floor(img.height / 2) / img.height });
    // The fish, only to be seen while they glow: a bright body, a tail, and a soft halo.
    for (const f of this.fish) {
      if (f.glow <= 0) {
        continue;
      }
      const { x, y } = this.fishPos(f);
      const px = Math.round(x);
      const py = Math.round(y);
      const tail = Math.sign(Math.sin(f.a) * f.dir) || 1; // the way its tail points
      r.rect(px - 2, py - 1, 5, 3, MG.glowDeep, 0.35 * f.glow);
      r.rect(px - 1, py, 3, 1, MG.glow, f.glow);
      r.rect(px + tail * 2, py, 1, 1, MG.glowDeep, f.glow);
    }
    // Ripples: two rings after each other spreading out flat across the
    // water (no further than its edge) and fading.
    for (const ripple of this.ripples) {
      const room = Math.max(2, this.rx - 2 - Math.abs(ripple.x - this.x));
      for (const lag of [0, 0.3]) {
        const k = ripple.age / RIPPLE_LIFE - lag;
        if (k <= 0) {
          continue;
        }
        const rad = Math.min(room, 2 + k * 14);
        const alpha = (1 - k) * 0.7;
        const x = Math.round(ripple.x);
        const y = Math.round(ripple.y);
        r.rect(Math.round(x - rad), y, 2, 1, MG.glow, alpha);
        r.rect(Math.round(x + rad - 1), y, 2, 1, MG.glow, alpha);
        r.rect(Math.round(x - rad / 2), Math.round(y - rad / 5), Math.round(rad), 1, MG.glow, alpha * 0.6);
        r.rect(Math.round(x - rad / 2), Math.round(y + rad / 5), Math.round(rad), 1, MG.glow, alpha * 0.6);
      }
    }
    // Lilies open up out of nothing, glow, and close up and fade at the end.
    for (const l of this.lilies) {
      const open = Math.min(1, l.age * 2, (LILY_LIFE - l.age) / 1.5);
      const pulse = 0.85 + 0.15 * Math.sin(l.age * 3);
      r.rect(Math.round(l.x) - 4, Math.round(l.y) - 5, 9, 6, MG.glowDeep, 0.2 * open * pulse);
      r.image(this.lilyImg, l.x, l.y + 1, { scaleX: 0.4 + 0.6 * open, scaleY: open, alpha: Math.min(1, open * 1.5) });
    }
  }
}

// --------------------------------------------------------------- fairy ring
// A ring of tiny mushrooms on the floor. Whoever stands in it (her, or a
// friend dropped in) shrinks right down with a twinkle, so everything else
// looks giant, and her steps squeak; out of it (walked out, or picked up)
// they grow back with a pop. Tap it and she steps into the middle; tap it
// again with her in it and she steps out. Being tiny is never saved:
// anywhere else she's always full size.
export const TINY = 0.5;
const GROW_SPEED = 2.5; // scale per second

export class FairyRing {
  constructor(assets) {
    this.img = assets.fairyRing;
    Object.assign(this, MUSHROOM_GROVE.ring);
    this.depth = this.y - this.ry - 4; // flat on the floor, under anyone in it
    this.priority = -1; // anyone standing in it wins a tap
    this.tiny = new Set(); // who's shrunk down in it
    this.settled = false; // a reload in the ring starts out tiny, no fuss
    this.squeakIn = 0;
  }

  holds({ x, y }) {
    return ((x - this.x) / this.rx) ** 2 + ((y - this.y) / this.ry) ** 2 <= 1;
  }

  // The middle, or (with her in it) just outside, on her side.
  get spot() {
    const { girl } = this.scene;
    if (!this.holds(girl)) {
      return { x: this.x, y: this.y };
    }
    return clampToFloor(this.x + herSide(this.scene, this.x) * (this.rx + 8), girl.y, this.scene.width);
  }

  hitTest(px, py) {
    return ((px - this.x) / (this.rx + 3)) ** 2 + ((py - this.y) / (this.ry + 4)) ** 2 <= 1;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tinkle');
    if (!scene.busy) {
      scene.interact(this);
    }
  }

  // Nothing to do once she's there: stepping in (or out) is the thing (see update).
  use() {}

  // Whether `who` should be tiny: standing in the ring, feet on the floor.
  shrinks(who) {
    if (!this.holds(who)) {
      return false;
    }
    if (who === this.scene.girl) {
      // Only once she stops in it, not just walking through on her way somewhere.
      return who.onFeet && !who.perch && !who.riding && (who.mode !== 'walk' || this.tiny.has(who));
    }
    return !who.held && !who.falling && !who.seat;
  }

  shrink(who) {
    const { scene } = this;
    scene.engine.audio.play('shrink');
    scene.sparkles(who.x, who.y - 8, 6);
    if (who === scene.girl) {
      who.say('star', 1.2);
    }
  }

  grow(who) {
    const { scene } = this;
    scene.engine.audio.play('pop');
    scene.bits(who.x, who.y - 4, 6, MG.glow);
    if (who === scene.girl && who.onFeet) {
      who.hop(6);
    }
  }

  update(dt) {
    const { girl } = this.scene;
    for (const who of this.scene.entities) {
      if (who !== girl && !isFriendItem(who)) {
        continue;
      }
      const key = who === girl ? 'scale' : 'shrinkScale';
      const want = this.shrinks(who);
      if (want !== this.tiny.has(who)) {
        if (want) {
          this.tiny.add(who);
        } else {
          this.tiny.delete(who);
        }
        if (!this.settled) {
          who[key] = want ? TINY : 1;
        } else if (want) {
          this.shrink(who);
        } else {
          this.grow(who);
        }
      }
      const to = want ? TINY : 1;
      const step = GROW_SPEED * dt;
      who[key] = Math.abs(to - who[key]) <= step ? to : who[key] + Math.sign(to - who[key]) * step;
    }
    this.settled = true;
    // Squeak, squeak go her little feet.
    if (this.tiny.has(girl) && girl.mode === 'walk') {
      this.squeakIn -= dt;
      if (this.squeakIn <= 0) {
        this.squeakIn = 0.16;
        this.scene.engine.audio.play('tinystep');
      }
    } else {
      this.squeakIn = 0;
    }
  }

  draw(r) {
    const { img } = this;
    r.image(img, this.x, this.y, { ax: Math.floor(img.width / 2) / img.width, ay: (img.height - this.ry - 3) / img.height });
  }
}

// ------------------------------------------------------ mushroom creature
// A shy little mushroom creature. When she comes near it pulls its cap right
// down and is just another mushroom; step away and it pops back out. Tap it
// and she goes over: the first time it only peeks out and giggles, the second
// it looks all round and blushes, and the third it's so brave it comes right
// out and does a little dance in a cloud of spores. From then on (`stage` 1
// in its world entry) it's a friend like any other: it stays out, wanders
// about, and she can carry it, take it anywhere, sit it in chairs, feed it
// and give it hats. Tapped then, it hides its face in a giggle, peeks out and
// does its little dance, and has a whispery chat.
export class MushroomCreature extends Stroller {
  constructor(assets, state) {
    super(state, assets.shroomCreature, { speed: 12, wander: 50, width: 16, height: 21 });
    this.friendly = (state.stage ?? 0) >= 1;
    this.draggable = this.friendly;
    this.reach = this.friendly ? 16 : 22;
    this.facing = 1;
    this.hidden = false;
    this.away = 0; // seconds she's been far away
    this.visits = 0;
  }

  get free() {
    return this.friendly && super.free;
  }

  hitTest(px, py) {
    if (this.friendly) {
      return super.hitTest(px, py);
    }
    return Math.abs(px - this.x) <= 10 && py >= this.y - 22 && py <= this.y + 2;
  }

  async onTap() {
    const { scene } = this;
    if (!this.friendly) {
      scene.engine.audio.play('tap');
      if (!this.busy && !scene.busy) {
        scene.interact(this);
      }
      return;
    }
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (this.free) {
      await this.giggle();
    }
  }

  // Shy, still: she goes over to it (see onTap) and it peeks out, or dances.
  async use() {
    if (this.busy || this.friendly) {
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
      // Brave at last: out it comes, for a dance, and it's her friend now.
      this.hidden = false;
      engine.audio.play('pop');
      scene.bits(this.x, this.y - 12, 10, MG.glow);
      await this.dance(6);
      girl.say('heart', 1.4);
      girl.act('cheer', 0.8);
      scene.hearts(this.x, this.y - 22, 4);
      this.befriend();
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
      this.frame = 'idle';
    }
    this.busy = false;
  }

  befriend() {
    this.friendly = true;
    this.draggable = true;
    this.reach = 16;
    this.scene.saveStage(this, 1);
  }

  // `steps` bobs of its little dance, arms up, sparkles and notes all round.
  async dance(steps) {
    const { scene } = this;
    const { engine } = scene;
    for (let i = 0; i < steps; i++) {
      this.frame = i % 2 ? 'dance2' : 'dance1';
      engine.audio.play(i % 2 ? 'plink' : 'tinkle');
      scene.sparkles(this.x, this.headTop + 3, 3);
      scene.musicNote(this.x, this.headTop - 1);
      await engine.tweens.to(this, { lift: 4 }, 0.12, ease.outQuad);
      await engine.tweens.to(this, { lift: 0 }, 0.12, ease.inQuad);
    }
    this.frame = 'idle';
  }

  // A friend now, but still a bit shy: it ducks under its cap in a fit of
  // giggles, peeks out, then does its little dance for her.
  async giggle() {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    this.facing = girl.x < this.x ? -1 : 1;
    girl.faceToward(this.x);
    engine.audio.play('hide');
    this.frame = 'hide';
    await engine.wait(0.4);
    engine.audio.play('giggle');
    for (let i = 0; i < 3; i++) {
      this.boing(0.5);
      await engine.wait(0.18);
    }
    this.frame = 'peek';
    engine.audio.play('peek');
    await engine.wait(0.4);
    await this.dance(4);
    scene.hearts(this.x, this.headTop - 2, 2);
    girl.say('heart', 1.2);
    letGo(this);
    offerChat(scene, this);
  }

  // Whispery chat, and whether it's at home in the grove.
  chat() {
    return { tree: SHROOM, facts: { home: this.scene.where === 'mushroomgrove' } };
  }

  onPickUp() {
    super.onPickUp();
    this.scene.engine.audio.play('giggle');
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item));
  }

  receive(item) {
    return isFriendItem(item) ? play(item, this) : this.eat(item);
  }

  update(dt) {
    if (this.friendly) {
      super.update(dt);
      return;
    }
    this.blinkIn -= dt;
    if (this.blinkIn < -0.15) {
      this.blinkIn = 2 + Math.random() * 3;
    }
    if (this.busy) {
      return;
    }
    const near = spooks(this.scene.girl, this);
    if (near && !this.hidden) {
      this.hidden = true;
      this.away = 0;
      this.scene.engine.audio.play('hide');
    } else if (!near) {
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
    if (this.friendly) {
      super.draw(r);
      return;
    }
    let frame = this.frame;
    if (this.hidden && frame === 'idle') {
      frame = 'hide';
    } else if (frame === 'idle' && this.blinkIn < 0) {
      frame = 'blink';
    }
    this.shadow(r, 12);
    r.image(this.imgs[frame], this.x, this.y + 1 - this.lift, { flipX: this.facing < 0 });
  }
}
