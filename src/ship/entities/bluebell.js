import { ease } from '../../engine/tween.js';
import { BB, BUG_KINDS, STONE } from '../art/bluebell.js';
import { happened, offerChat } from '../chat.js';
import { MEADOW_SECRETS, WALK } from '../layout.js';
import { PINK_ALIEN } from '../talks/pinkAlien.js';
import { PUFFBALL } from '../talks/puffball.js';
import { Carryable } from './carryable.js';
import { hold, isFriendItem, letGo, play } from './friends.js';
import { feed, isSnack } from './items.js';
import { Secret } from './secret.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------- giant bluebell
// Tap one and its bells swing and chime. Each flower has its own note, so
// tapping along the row plays a little tune.
export class Bluebell extends Carryable {
  // `state.v` picks both the stem shape and the note it rings.
  constructor(assets, state) {
    super(state);
    this.stem = assets.stems[state.v ?? 0];
    this.bellImg = assets.bell;
    this.note = state.v ?? 0;
    this.ring = 0;
    this.phase = this.x * 0.37;
  }

  get height() {
    return this.stem.img.height;
  }

  hitTest(px, py) {
    return px >= this.x - 8 && px <= this.x + 26 && py >= this.y - this.height - 2 && py <= this.y + 2;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play(`bell${this.note}`);
    this.ring = 1;
    for (const h of this.stem.hang) {
      scene.musicNote(this.x + h.x, this.y + h.y + 6);
    }
    scene.girl.faceToward(this.x);
    scene.girl.say('note', 1);
  }

  update(dt) {
    this.ring = Math.max(0, this.ring - dt * 0.8);
  }

  draw(r) {
    const t = this.scene.engine.time;
    const img = this.stem.img;
    const sway = Math.round(Math.sin(t * 1.4 + this.phase) * 0.6);
    if (this.held || this.falling) {
      this.shadow(r, 14);
    }
    r.image(img, this.x, this.y + 1, { ax: 8 / img.width });
    this.stem.hang.forEach((h, i) => {
      const swing = Math.sin(t * 14 + i * 1.3) * this.ring * 3 + sway;
      r.image(this.bellImg, this.x + h.x + swing, this.y + h.y, { ay: 0 });
    });
  }
}

// ------------------------------------------------------------------ critter
// A puffball that bounces around the meadow in little hops.
export class Critter extends Carryable {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.critter;
    this.facing = 1;
    this.lift = 0;
    this.restIn = 1;
    this.hop = null;
    this.landed = 0;
    this.priority = 5;
    this.chase = null; // { ball, nudges, time } while chasing a ball about
    this.eating = false;
    this.busy = false; // saying hello to her, or playing with another friend
    this.napping = false; // curled up asleep in the burrow (out of sight; see burrow.js)
  }

  hitTest(px, py) {
    if (this.napping) {
      return false;
    }
    const y = this.y - this.perch;
    return Math.abs(px - this.x) < 11 && py > y - 18 - this.lift && py < y + 3;
  }

  onPickUp() {
    this.stayPut();
    this.chase = null;
    this.scene.engine.audio.play('squeak');
  }

  // Stops wherever it is, back down on the floor (cutting short any hop).
  stayPut() {
    this.hop = null;
    this.hopsLeft = 0;
    this.lift = 0;
  }

  // Curls up asleep in the burrow, out of sight (it can't be tapped or
  // dragged till it wakes).
  napIn() {
    hold(this);
    this.napping = true;
  }

  // Wakes and pops out of the burrow at (x, y), with a hop off towards `side`.
  wakeOut(x, y, side) {
    this.napping = false;
    letGo(this);
    Object.assign(this, { x, y, facing: side });
    this.hop = { fromX: x, fromY: y, toX: x + side * 8, toY: y + 2, p: 0, dur: 0.4, height: 10 };
    this.scene.engine.audio.play('squeak');
    this.scene.settle(this);
  }

  // Waving hello (while greeting her): it's all paws-less, so a happy squish.
  pose(frame) {
    if (frame.startsWith('wave')) {
      this.boing(0.7);
    }
  }

  // Drop a ball on it and it chases it about, nudging it along a few times.
  // Drop a snack on it and it gobbles it up. Drop a friend on it and they play.
  accepts(item) {
    const free = !this.chase && !this.eating && !this.busy && !this.held && !this.falling && !this.seat;
    return free && (item.kind === 'ball' || isSnack(item) || isFriendItem(item));
  }

  receive(item) {
    if (isFriendItem(item)) {
      return play(item, this);
    }
    if (isSnack(item)) {
      this.eat(item);
    } else {
      this.chaseBall(item);
    }
  }

  async eat(snack) {
    this.eating = true;
    this.draggable = false; // stay put until it's finished
    this.stayPut();
    await feed(this, snack);
    this.eating = false;
    this.draggable = true;
    this.restIn = 1.5 + Math.random() * 2;
  }

  // A squishy chomp with every bite.
  munch() {
    this.landed = 0.15;
  }

  chaseBall(ball) {
    const { scene } = this;
    const side = ball.x < this.x ? -1 : 1;
    scene.putDown(ball, this.x + side * 12, this.y);
    scene.engine.audio.play('squeak');
    scene.sparkles(this.x, this.y - 16, 4);
    this.stayPut();
    this.restIn = 0.4; // a beat to notice it
    this.chase = { ball, nudges: 3, time: 0 };
  }

  // One step of a ball chase: nudge the ball when right beside it (once it's
  // stopped rolling), otherwise hop after it.
  chaseStep() {
    const { scene } = this;
    const c = this.chase;
    const { ball } = c;
    if (!scene.entities.includes(ball) || ball.held || c.time > 10) {
      this.endChase();
      return;
    }
    if (ball.falling) {
      return;
    }
    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    const dir = dx < 0 ? -1 : 1;
    this.facing = dir;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 8) {
      if (ball.roll) {
        return;
      }
      if (c.nudges <= 0) {
        scene.remember('puffball.ball'); // a whole chase, booped all about
        this.endChase();
        return;
      }
      c.nudges -= 1;
      ball.kick(dir);
      ball.boing(1);
      this.hop = { fromX: this.x, fromY: this.y, toX: this.x, toY: this.y, p: 0, dur: 0.3, height: 7 };
      return;
    }
    this.hop = {
      fromX: this.x, fromY: this.y,
      toX: this.x + clamp(dx - dir * 11, -14, 14), toY: this.y + clamp(dy, -4, 4),
      p: 0, dur: 0.26, height: 6,
    };
  }

  endChase() {
    const { scene } = this;
    this.chase = null;
    this.restIn = 2 + Math.random() * 2;
    scene.engine.audio.play('squeak');
    scene.hearts(this.x, this.y - 22, 2);
    scene.settle(this);
  }

  onLand() {
    this.landed = 0.12;
    this.restIn = 1 + Math.random();
  }

  onTap() {
    const { scene } = this;
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (this.busy) {
      return;
    }
    scene.engine.audio.play('squeak');
    this.hop = { fromX: this.x, fromY: this.y, toX: this.x, toY: this.y, p: 0, dur: 0.6, height: 20 };
    scene.sparkles(this.x, this.y - 16, 6);
    scene.girl.faceToward(this.x);
    scene.girl.say('heart', 1.2);
    offerChat(scene, this, 0.6); // once it's landed
  }

  // Where its chat lines go.
  get headTop() {
    return this.y - this.perch - 16 - this.lift;
  }

  // What it has to say, and whether it's had a ball to chase yet.
  chat() {
    return { tree: PUFFBALL, facts: { chased: happened(this.scene, 'puffball.ball') } };
  }

  update(dt) {
    if (this.held || this.falling) {
      return;
    }
    if (this.eating || this.busy || this.seat || this.picnicking) {
      this.landed = Math.max(0, this.landed - dt);
      return;
    }
    if (this.chase) {
      this.chase.time += dt;
    }
    if (this.hop) {
      const h = this.hop;
      h.p = Math.min(1, h.p + dt / h.dur);
      this.x = h.fromX + (h.toX - h.fromX) * h.p;
      this.y = h.fromY + (h.toY - h.fromY) * h.p;
      this.lift = Math.sin(Math.PI * h.p) * h.height;
      if (h.p >= 1) {
        this.hop = null;
        this.lift = 0;
        this.landed = 0.12;
        if (this.chase) {
          this.restIn = 0.05;
          return;
        }
        this.hopsLeft = (this.hopsLeft ?? 1) - 1;
        this.restIn = this.hopsLeft > 0 ? 0.12 : 1.5 + Math.random() * 3;
        if (this.hopsLeft <= 0) {
          this.scene.settle(this); // remember where it wandered to
        }
      }
      return;
    }
    this.landed = Math.max(0, this.landed - dt);
    this.restIn -= dt;
    if (this.restIn <= 0 && this.chase) {
      this.chaseStep();
    } else if (this.restIn <= 0) {
      // Where it likes to roam (the meadow keeps it away from the ship).
      const { minX, maxX } = this.scene.roam ?? WALK;
      if (!(this.hopsLeft > 0)) {
        // Pick a new direction and a few hops to go that way.
        this.hopsLeft = 2 + Math.floor(Math.random() * 4);
        this.dir = Math.random() < 0.5 ? -1 : 1;
        if (this.x < minX + 8 || this.x > maxX - 8) {
          this.dir = this.x < minX + 8 ? 1 : -1;
        }
        this.dy = (Math.random() - 0.5) * 6;
      }
      this.facing = this.dir;
      // If she's put it down outside its patch, it hops back a step at a time.
      this.hop = {
        fromX: this.x, fromY: this.y,
        toX: clamp(this.x + this.dir * 12, Math.min(minX, this.x), Math.max(maxX, this.x)),
        toY: clamp(this.y + this.dy, 124, 154),
        p: 0, dur: 0.32, height: 5,
      };
    }
  }

  currentFrame() {
    // (Squished down comfy while it's sat on the picnic blanket.)
    const squish = this.landed > 0 || this.picnicking;
    return this.dressed(this.imgs[this.held || this.lift > 1 ? 'jump' : squish ? 'squish' : 'idle']);
  }

  // How it looks sitting in the pilot chair (which draws it, so it spins too).
  seatFrame() {
    return this.currentFrame();
  }

  draw(r) {
    if (this.seat || this.napping) {
      return;
    }
    this.shadow(r, 10);
    r.image(this.currentFrame(), this.x, this.y + 1 - this.lift, {
      flipX: this.facing < 0, scaleX: this.bounce * this.twirl, scaleY: 2 - this.bounce,
    });
  }
}

// ------------------------------------------------------------------ secrets
// A rock that rolls over to show something wriggly living underneath.
export class Rock extends Secret {
  constructor(assets) {
    const { x, y } = MEADOW_SECRETS.rock;
    super(x, y, { w: 18, h: 11, reach: 18 });
    this.imgs = assets.rock;
    this.bugImgs = assets.bugs;
    this.flip = 0; // 0 = sitting on its patch, 1 = rolled over beside it
    this.side = 1; // which way it rolls (away from her)
    this.bug = null; // { kind, dx } while one's showing
  }

  async reveal(n) {
    const { scene } = this;
    const { engine } = scene;
    this.side = scene.girl.x < this.x ? 1 : -1;
    engine.audio.play('scrape');
    await engine.tweens.to(this, { flip: 1 }, 0.4, ease.inOutSine);
    scene.dust(this.x + this.side * 14, this.y);
    // A different little creature each time.
    this.bug = { i: n % this.bugImgs.length, dx: 0 }; // index into BUG_KINDS
    engine.audio.play('wriggle');
    this.react('surprised', 'bang');
    scene.findSticker('bluebell.rock', this.x + this.side * 14, this.y - 8); // stuck to its underside
    if (BUG_KINDS[this.bug.i] !== 'worm') {
      // Beetles scurry about; the worm just wriggles where it is.
      await engine.tweens.to(this.bug, { dx: -4 * this.side }, 0.6, ease.inOutSine);
      engine.audio.play('wriggle');
      await engine.tweens.to(this.bug, { dx: 3 * this.side }, 0.6, ease.inOutSine);
    } else {
      await engine.wait(0.6);
      engine.audio.play('wriggle');
      await engine.wait(0.6);
    }
    this.react('cheer', 'heart');
    await engine.wait(0.5);
    engine.audio.play('scrape');
    await engine.tweens.to(this, { flip: 0 }, 0.4, ease.inOutSine);
    this.bug = null;
  }

  draw(r) {
    const t = this.scene.engine.time;
    const { x, y, flip, side } = this;
    if (flip > 0) {
      r.image(this.imgs.soil, x, y + 1);
    }
    if (this.bug) {
      const frames = this.bugImgs[this.bug.i];
      r.image(frames[Math.floor(t * 6) % 2], x + this.bug.dx, y, { flipX: side < 0 });
    }
    // Rolling over: it narrows to an edge, then widens again upside down.
    const roll = flip < 0.5 ? 1 - flip * 2 : flip * 2 - 1;
    const img = flip < 0.5 ? this.imgs.top : this.imgs.under;
    if (flip === 0) {
      r.rect(x - 8, y - 1, 16, 2, '#000000', 0.18);
    }
    r.image(img, x + flip * side * 14, y - Math.sin(Math.PI * flip) * 6, {
      scaleX: Math.max(0.1, roll) * this.bounce, scaleY: 2 - this.bounce,
    });
  }
}

// A bush that rustles, then a little bird flutters out, loops about and
// dives back in (and sometimes it's two birds).
export class Bush extends Secret {
  constructor(assets) {
    const { x, y } = MEADOW_SECRETS.bush;
    super(x, y, { w: 26, h: 18, reach: 18 });
    this.imgs = assets.bush;
    this.birdImgs = assets.birds;
    this.rustle = 0;
    this.birds = [];
  }

  async reveal(n) {
    const { scene } = this;
    const { engine } = scene;
    engine.audio.play('rustle');
    this.rustle = 1;
    scene.bits(this.x, this.y - 12, 6, BB.grassLight);
    await engine.wait(0.5);
    const count = n % 3 === 2 ? 2 : 1;
    const flights = [];
    for (let i = 0; i < count; i++) {
      flights.push(this.fly((n + i) % this.birdImgs.length, i ? -1 : 1, i * 0.25));
    }
    this.react('surprised', 'bang');
    if (count === 2) {
      // Two birds at once shake loose the sticker hidden in the leaves.
      scene.findSticker('bluebell.bush', this.x, this.y - 16);
    }
    await Promise.all(flights);
    engine.audio.play('rustle');
    this.rustle = 0.6;
    scene.bits(this.x, this.y - 12, 3, BB.grassLight);
    this.react('cheer', 'heart');
  }

  // One bird's trip: out of the bush, a loop through the air, back in.
  async fly(color, dir, delay) {
    const { engine } = this.scene;
    await engine.wait(delay);
    const bird = { color, x: this.x, y: this.y - 10, facing: dir };
    this.birds.push(bird);
    engine.audio.play('flutter');
    engine.audio.play('tweet');
    await engine.tweens.to(bird, { x: this.x + dir * 30, y: this.y - 50 }, 0.6, ease.outQuad);
    await engine.tweens.to(bird, { x: this.x + dir * 55, y: this.y - 62 }, 0.5, ease.inOutSine);
    bird.facing = -dir;
    engine.audio.play('tweet');
    await engine.tweens.to(bird, { x: this.x - dir * 10, y: this.y - 70 }, 0.9, ease.inOutSine);
    bird.facing = dir;
    await engine.tweens.to(bird, { x: this.x, y: this.y - 10 }, 0.6, ease.inQuad);
    this.birds = this.birds.filter((b) => b !== bird);
  }

  update(dt) {
    this.rustle = Math.max(0, this.rustle - dt * 1.5);
  }

  draw(r) {
    const t = this.scene.engine.time;
    const shake = this.rustle > 0 ? Math.round(Math.sin(t * 40) * this.rustle * 1.5) : 0;
    const img = this.imgs[this.rustle > 0 && Math.floor(t * 12) % 2 ? 1 : 0];
    r.rect(this.x - 12, this.y - 1, 24, 2, '#000000', 0.18);
    r.image(img, this.x + shake, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }

  // Birds fly above everything else in the meadow.
  drawOver(r) {
    const t = this.scene.engine.time;
    for (const b of this.birds) {
      const frames = this.birdImgs[b.color];
      r.image(frames[Math.floor(t * 12) % 2], b.x, b.y, { ay: 0.5, flipX: b.facing < 0 });
    }
  }
}

// A molehill: a little mole pops up out of it to see who's there.
export class MoleHole extends Secret {
  constructor(assets) {
    const { x, y } = MEADOW_SECRETS.hole;
    super(x, y, { w: 18, h: 10, reach: 18 });
    this.imgs = assets.hole;
    this.moleImgs = assets.mole;
    this.rise = 0; // how many rows of mole show above the hole
    this.blink = false;
    this.facing = 1;
  }

  async reveal(n) {
    const { scene } = this;
    const { engine } = scene;
    const big = n % 3 === 2; // every third time it pops right out
    this.facing = scene.girl.x < this.x ? -1 : 1;
    engine.audio.play('pop');
    scene.bits(this.x, this.y - 4, big ? 8 : 5, STONE.dirt);
    await engine.tweens.to(this, { rise: big ? this.moleImgs[0].length - 1 : 9 }, 0.25, ease.outBack);
    this.react('surprised', 'bang');
    if (big) {
      engine.audio.play('squeak');
      scene.sparkles(this.x, this.y - 14, 6);
      scene.hearts(this.x, this.y - 18, 2);
      scene.findSticker('bluebell.mole', this.x, this.y - 20); // it was keeping one safe
      await engine.wait(0.8);
    } else if (n % 3 === 1) {
      // Looks one way, then the other.
      for (const dir of [-1, 1]) {
        this.facing = dir;
        engine.audio.play('sniff');
        await engine.wait(0.5);
      }
    } else {
      engine.audio.play('sniff');
      for (let i = 0; i < 2; i++) {
        await engine.wait(0.35);
        this.blink = true;
        await engine.wait(0.12);
        this.blink = false;
      }
    }
    this.react('cheer', 'heart');
    await engine.wait(0.3);
    engine.audio.play('hide');
    await engine.tweens.to(this, { rise: 0 }, 0.25, ease.inQuad);
  }

  // Tapping the mole while it's up counts too.
  hitTest(px, py) {
    return super.hitTest(px, py) || (Math.abs(px - this.x) <= 7 && py >= this.y - 2 - this.rise && py <= this.y);
  }

  draw(r) {
    const { x, y } = this;
    const opts = { scaleX: this.bounce, scaleY: 2 - this.bounce };
    r.image(this.imgs.back, x, y + 1, opts);
    const rows = Math.round(this.rise);
    if (rows > 0) {
      r.image(this.moleImgs[this.blink ? 1 : 0][rows], x, y - 2, { ...opts, flipX: this.facing < 0 });
    }
    r.image(this.imgs.front, x, y + 1, opts);
  }
}

// ---------------------------------------------------------- friendly local
// The memory that it's been given a posy.
export const POSY_MEMORY = 'bluebell.posy';

export class Local extends Carryable {
  constructor(assets, state) {
    super(state);
    this.imgs = assets.local;
    this.reach = 24;
    this.frame = 'idle';
    this.lift = 0;
    this.blinkIn = 2;
    this.busy = false;
  }

  hitTest(px, py) {
    const y = this.y - this.perch;
    return Math.abs(px - this.x) < 12 && py > y - 24 - this.lift && py < y + 2;
  }

  onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (this.busy) {
      return;
    }
    this.scene.engine.audio.play('tap');
    this.boing(0.8);
    this.frame = 'wave1';
    this.scene.interact(this);
  }

  onPickUp() {
    this.frame = 'hop';
    this.scene.engine.audio.play('giggle');
  }

  onLand() {
    if (!this.busy) {
      this.frame = 'idle';
    }
  }

  // Say hello: they wave at each other, then it does a happy hop.
  async use() {
    if (this.busy) {
      return;
    }
    this.busy = true;
    const { engine, girl } = this.scene;
    girl.faceToward(this.x);
    engine.audio.play('boop');
    girl.act('wave', 1.6);
    for (let i = 0; i < 8; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      await engine.wait(0.2);
    }
    this.frame = 'hop';
    engine.audio.play('giggle');
    await engine.tweens.to(this, { lift: 12 }, 0.18, ease.outQuad);
    this.scene.sparkles(this.x, this.y - 22, 8);
    await engine.tweens.to(this, { lift: 0 }, 0.22, ease.inQuad);
    this.frame = 'idle';
    girl.say('heart');
    this.busy = false;
    offerChat(this.scene, this);
  }

  // Where its chat lines go.
  get headTop() {
    return this.y - this.perch - 24 - this.lift;
  }

  // What it has to say, and whether she's given it the crystal (and a
  // posy) yet.
  chat() {
    const { scene } = this;
    return { tree: PINK_ALIEN, facts: { gotCrystal: happened(scene, 'bluebell.local'), gotPosy: happened(scene, POSY_MEMORY) } };
  }

  // It loves shiny crystals: drop one on it and it keeps it beside it. Drop
  // a posy on it and it has a sniff, sneezes and keeps that too. Drop a snack
  // on it and it eats it. Drop a friend on it and they play.
  accepts(item) {
    const free = !this.busy && !this.held && !this.falling && !this.seat;
    return free && (item.kind === 'crystal' || item.kind === 'posy' || isSnack(item) || isFriendItem(item));
  }

  async receive(item) {
    if (isFriendItem(item)) {
      return play(item, this);
    }
    if (item.kind === 'posy') {
      return this.sniff(item);
    }
    if (isSnack(item)) {
      this.busy = true;
      this.draggable = false;
      await feed(this, item);
      this.busy = false;
      this.draggable = true;
      return;
    }
    this.busy = true;
    this.draggable = false; // stay put until the cheering's done
    const { scene } = this;
    const { engine, girl } = scene;
    const side = item.x < this.x ? -1 : 1;
    scene.putDown(item, this.x + side * 13, this.y + 1);
    engine.audio.play('cheer');
    girl.faceToward(this.x);
    for (let i = 0; i < 2; i++) {
      this.frame = 'hop';
      await engine.tweens.to(this, { lift: 10 }, 0.16, ease.outQuad);
      scene.hearts(this.x, this.y - 26, i ? 2 : 3);
      scene.sparkles(this.x, this.y - 18, 6);
      await engine.tweens.to(this, { lift: 0 }, 0.2, ease.inQuad);
    }
    this.frame = 'idle';
    girl.say('heart', 1.4);
    scene.findSticker('bluebell.local', this.x, this.y - 26); // a thank-you present
    this.busy = false;
    this.draggable = true;
  }

  // A posy: set down beside it, a long sniff... ah... ah... a happy sneeze,
  // and it keeps it (remembered, for its chat).
  async sniff(posy) {
    this.busy = true;
    this.draggable = false;
    const { scene } = this;
    const { engine, girl } = scene;
    const side = posy.x < this.x ? -1 : 1;
    scene.putDown(posy, this.x + side * 13, this.y + 1);
    scene.remember(POSY_MEMORY); // (straight away, in case she's off before the sneeze)
    girl.faceToward(this.x);
    this.frame = 'blink'; // eyes shut, sniffing
    engine.audio.play('sneeze');
    await engine.tweens.to(this, { lift: 3 }, 0.5, ease.inOutSine);
    await engine.wait(0.05);
    this.frame = 'hop';
    this.boing(1.8);
    scene.bits(this.x + side * 6, this.y - 18, 5, '#ffffff');
    await engine.tweens.to(this, { lift: 10 }, 0.16, ease.outQuad);
    scene.hearts(this.x, this.y - 26, 3);
    await engine.tweens.to(this, { lift: 0 }, 0.2, ease.inQuad);
    engine.audio.play('giggle');
    this.frame = 'idle';
    girl.say('heart', 1.4);
    this.busy = false;
    this.draggable = true;
  }

  // A little hop of a chew with every bite.
  munch() {
    const { tweens } = this.scene.engine;
    tweens.to(this, { lift: 3 }, 0.1, ease.outQuad).then(() => tweens.to(this, { lift: 0 }, 0.12, ease.inQuad));
  }

  update(dt) {
    if (this.frame !== 'idle' && this.frame !== 'blink') {
      return;
    }
    this.blinkIn -= dt;
    this.frame = this.blinkIn < 0 ? 'blink' : 'idle';
    if (this.blinkIn < -0.15) {
      this.blinkIn = 2 + Math.random() * 3;
    }
  }

  // Shows one of its pictures (while greeting or playing).
  pose(frame) {
    this.frame = frame;
  }

  // How it looks sitting in the pilot chair (which draws it, so it spins too).
  seatFrame() {
    return this.dressed(this.imgs[this.frame]);
  }

  draw(r) {
    if (this.seat) {
      return;
    }
    const bob = this.frame === 'idle' ? Math.round(Math.sin(this.scene.engine.time * 3) * 0.6) : 0;
    this.shadow(r, 12);
    r.image(this.dressed(this.imgs[this.frame]), this.x, this.y + 1 - this.lift + bob, {
      scaleX: this.bounce * this.twirl, scaleY: 2 - this.bounce,
    });
  }
}
