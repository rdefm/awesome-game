import { ease } from '../../engine/tween.js';
import { BLANKET_W, BUNK_DECK, BUNK_FRAME } from '../art/shipRooms.js';
import { HER_BUNK, LIGHT_SWITCH } from '../layout.js';
import { isFriendItem } from './friends.js';
import { inRect } from './house.js';
import { Prop } from './props.js';

// A bed in the bunk room. Whoever's in it (its `sleeper`) is drawn lying
// down in it by the bed itself, tucked in under the blanket, with zzzs
// drifting up off them; `stretching` while they sit up for a big stretch
// and a yawn before getting out. `at`: where it is (see layout.js).
class Bunk extends Prop {
  constructor(assets, at, blankets) {
    super();
    this.assets = assets;
    this.at = at;
    this.x = at.x;
    this.y = at.y;
    this.spot = at.spot;
    this.blankets = blankets; // [flat, tucked in]
    this.sleeper = null;
    this.stretching = false;
    // Whoever's lying in it is turned on their side in here.
    this.comp = document.createElement('canvas');
    this.comp.width = 48;
    this.comp.height = 48;
    this.ctx = this.comp.getContext('2d');
  }

  // The top of the mattress.
  get top() {
    return this.at.y - this.at.deck;
  }

  // How far up off the floor a friend in it is (see Carryable.perch).
  get perch() {
    return this.at.deck;
  }

  // Fast asleep (not sitting up for a stretch).
  get asleep() {
    return Boolean(this.sleeper) && !this.stretching;
  }

  hitTest(px, py) {
    const { x, w, deck } = this.at;
    return inRect(px, py, x - w / 2, this.top - 16, w, 16 + Math.min(deck, 14), 1);
  }

  // How the sleeper looks right now: lying down, or sat up stretching.
  sleeperFrame() {
    const who = this.sleeper;
    if (who === this.scene.girl) {
      return who.frames[this.stretching ? 'sitCheer' : 'blink'];
    }
    return who.seatFrame();
  }

  draw(r) {
    const left = this.at.x - this.at.w / 2;
    this.drawBed(r);
    if (this.sleeper) {
      const img = this.sleeperFrame();
      if (this.stretching) {
        r.image(img, left + 24, this.top + 4); // legs under the blanket
      } else {
        this.drawLying(r, img, left);
      }
    }
    const s = this.bounce;
    r.image(this.blankets[this.sleeper ? 1 : 0], left + this.blanketEnd - BLANKET_W / 2, this.top + 4, {
      scaleX: s, scaleY: 2 - s,
    });
  }

  // Lying on their back, head on the pillow at the left: turned a quarter
  // turn (head to the left), resting on the mattress.
  drawLying(r, img, left) {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.comp.width, this.comp.height);
    c.setTransform(0, -1, 1, 0, 0, img.width);
    c.drawImage(img, 0, 0);
    c.setTransform(1, 0, 0, 1, 0, 0);
    // (Her picture has room for a hat above her head, and her middle's a
    // little left of its middle.)
    const girl = this.sleeper === this.scene.girl;
    const ix = girl ? left - 3 : left + 4;
    const iy = girl ? this.top - 16 : this.top + 3 - img.width;
    r.image(this.comp, ix, iy, { ax: 0, ay: 0 });
  }

  // zzzs drift up off a sleeper, over the dark at night.
  drawOver(r) {
    if (!this.asleep) {
      return;
    }
    const t = this.scene.engine.time;
    const x = this.at.x - this.at.w / 2 + 12;
    for (let i = 0; i < 2; i++) {
      const k = (t * 0.5 + i * 0.5) % 1;
      r.image(this.assets.text('Z', '#ffffff'), x + k * 8, this.top - 12 - k * 12, { alpha: 1 - k });
    }
  }
}

// ------------------------------------------------------------------ her bunk
// Her own bed. Tap it and she climbs in, stretches, yawns and snoozes until
// she's woken (a tap on her, her bed, or anywhere else).
export class HerBunk extends Bunk {
  constructor(assets) {
    super(assets, HER_BUNK, assets.blankets.her);
    this.img = assets.bed.her;
    this.blanketEnd = HER_BUNK.w - 5; // up against the footboard
  }

  drawBed(r) {
    r.image(this.img, this.at.x, this.at.y + 2, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }

  onTap(p) {
    if (this.sleeper) {
      this.scene.engine.audio.play('tap');
      this.wakeUp();
      return;
    }
    super.onTap(p);
  }

  use() {
    if (!this.sleeper && !this.scene.busy) {
      return this.scene.scripted(() => tuckHerIn(this));
    }
  }

  wakeUp() {
    return wakeHer(this);
  }
}

// In she climbs into `bed` (a bed she sleeps in, like her bunk): a sit up, a
// yawn, and down she snuggles. It draws her from then on.
export async function tuckHerIn(bed) {
  const { scene } = bed;
  const { engine, girl } = scene;
  girl.cancelWalk();
  girl.mode = 'act';
  girl.pose = null;
  girl.draggable = false;
  girl.riding = bed;
  girl.x = bed.at.x;
  girl.y = bed.at.y + 1;
  bed.sleeper = girl;
  bed.stretching = true;
  engine.audio.play('yawn');
  await engine.wait(0.8);
  bed.stretching = false;
  engine.audio.play('rustle');
  scene.persist();
}

// She sits up in `bed` for a big stretch and a yawn, then hops out of it.
export async function wakeHer(bed) {
  const { scene } = bed;
  if (bed.sleeper !== scene.girl || bed.stretching) {
    return;
  }
  await scene.scripted(async () => {
    const { engine, girl } = scene;
    bed.stretching = true;
    engine.audio.play('yawn');
    await engine.wait(0.9);
    bed.sleeper = null;
    bed.stretching = false;
    girl.riding = null;
    girl.draggable = true;
    girl.x = bed.spot.x;
    girl.y = bed.spot.y;
    girl.facing = 1;
    girl.pose = { frame: 'cheer', token: {} };
    girl.lift = 12;
    await engine.tweens.to(girl, { lift: 0 }, 0.25, ease.inQuad);
    engine.audio.play('land');
    scene.dust(girl.x, girl.y);
    girl.pose = null;
    girl.mode = 'idle';
    girl.say('heart', 1.2);
    scene.persist();
  });
}

// ---------------------------------------------------------------- friend bunk
// A bunk of the bunk bed, for friends. Drop one on it and they're tucked in
// and fall fast asleep; pick them up out of it and they wake. While someone's
// in it, it's the bed that's picked up (it hands them over), so a sleeper's
// easy to grab wherever they're lying.
export class FriendBunk extends Bunk {
  // `upper`: the top bunk (the lower one draws the bunk bed's frame too).
  // `blankets`: [flat, tucked in], if not the bunk's own.
  constructor(assets, at, upper, blankets = assets.blankets[upper ? 'upper' : 'lower']) {
    super(assets, at, blankets);
    this.imgs = assets.bed;
    this.upper = upper;
    this.blanketEnd = at.w - 1;
    this.dragged = null; // the sleeper being lifted out
  }

  get priority() {
    return this.sleeper ? 6 : 0; // over friends standing in front, under her
  }

  get draggable() {
    return Boolean(this.sleeper) && !this.stretching;
  }

  drawBed(r) {
    if (!this.upper) {
      r.image(this.imgs.frame, BUNK_FRAME.x, this.at.y + 2, { ax: 0 });
    }
    r.image(this.imgs.deck, this.at.x + 0.5, this.top - BUNK_DECK.top, { ay: 0, scaleX: this.bounce });
  }

  // She pats the bed smooth.
  async use() {
    const { engine, girl } = this.scene;
    girl.faceToward(this.at.x);
    engine.audio.play('rustle');
    await girl.act('reach', 0.4);
  }

  onTap(p) {
    if (this.sleeper) {
      this.spin();
      return;
    }
    super.onTap(p);
  }

  // A tap on a sleeper (on the bunk, or on them: they're sat in it like a
  // seat): snuggled in a little deeper.
  spin() {
    const { scene } = this;
    scene.engine.audio.play('rustle');
    this.squash = 1;
    scene.engine.tweens.to(this, { squash: 0 }, 0.35, ease.outElastic);
    scene.hearts(this.at.x, this.top - 14, 1);
  }

  accepts(item) {
    return isFriendItem(item) && !this.sleeper;
  }

  // Tucked in, eyes shut. Only the floor beside it is remembered, not the
  // bunk itself (so it's up and about again after a reload).
  receive(friend) {
    const { scene } = this;
    friend.stayPut?.();
    friend.seat = this;
    friend.x = this.at.x;
    friend.y = this.at.y + 1;
    friend.lift = 0;
    friend.facing = 1;
    friend.pose?.('blink');
    this.sleeper = friend;
    scene.settle(friend, this.spot.x, this.spot.y);
    scene.engine.audio.play('rustle');
    this.squash = 0.8;
    scene.engine.tweens.to(this, { squash: 0 }, 0.35, ease.outElastic);
  }

  // Lifted out (see Carryable.onDragStart): awake again.
  release() {
    const friend = this.sleeper;
    if (!friend) {
      return;
    }
    this.sleeper = null;
    this.stretching = false;
    friend.seat = null;
    friend.pose?.('idle');
    this.scene.engine.audio.play('yawn');
  }

  onDragStart(p) {
    this.dragged = this.sleeper;
    this.dragged.onDragStart(p);
  }

  onDrag(p) {
    this.dragged?.onDrag(p);
  }

  onDrop(p) {
    const friend = this.dragged;
    this.dragged = null;
    friend?.onDrop(p);
  }

  // Morning: a big stretch and a yawn, then down onto the floor in front.
  async wakeUp() {
    const friend = this.sleeper;
    if (!friend || this.stretching) {
      return;
    }
    const { scene } = this;
    const { engine } = scene;
    this.stretching = true;
    friend.pose?.('wave1');
    engine.audio.play('yawn');
    await engine.wait(0.9);
    if (this.sleeper !== friend) {
      return; // picked up meanwhile
    }
    friend.y -= this.perch; // so it hops down off the bunk
    this.release();
    friend.pose?.('hop');
    await scene.putDown(friend, this.spot.x, this.spot.y);
    friend.pose?.('idle');
    scene.hearts(friend.x, friend.y - 20, 1);
  }
}

// -------------------------------------------------------------- light switch
// Flick it and the room goes dark for the night (or back to morning). She
// walks over and flicks it, unless she's tucked up in bed: then it simply
// flicks (somebody has to turn the light out).
export class LightSwitch extends Prop {
  constructor(assets) {
    super();
    this.imgs = assets.lightSwitch;
    this.x = LIGHT_SWITCH.x;
    this.y = 0; // on the wall, behind everything
    this.spot = LIGHT_SWITCH.spot;
  }

  hitTest(px, py) {
    return inRect(px, py, LIGHT_SWITCH.x - 4, LIGHT_SWITCH.y - 6, 9, 13);
  }

  onTap(p) {
    if (this.scene.herAsleep) {
      this.scene.engine.audio.play('tap');
      this.squash = 1;
      this.scene.engine.tweens.to(this, { squash: 0 }, 0.35, ease.outElastic);
      this.flick();
      return;
    }
    super.onTap(p);
  }

  async use() {
    const { girl } = this.scene;
    girl.faceToward(this.x);
    girl.act('reach', 0.4);
    this.flick();
  }

  flick() {
    this.scene.engine.audio.play('click');
    this.scene.setNight(!this.scene.night);
  }

  draw(r) {
    r.image(this.imgs[this.scene.night ? 0 : 1], LIGHT_SWITCH.x, LIGHT_SWITCH.y, {
      ay: 0.5, scaleX: this.bounce, scaleY: 2 - this.bounce,
    });
  }
}
