import { ease } from '../../engine/tween.js';
import { EM } from '../art/ember.js';
import { LAMP_COLORS, LAMP_GLASS } from '../art/lavaHouse.js';
import { happened, offerChat } from '../chat.js';
import { CRADLE, HEARTH, LAVA_HOUSE, LAVA_LAMP } from '../layout.js';
import { LAVA_BABY, LAVA_DAD, LAVA_MUM } from '../talks/lavaFamily.js';
import { cuddle, hold, isFriendItem, letGo, play } from './friends.js';
import { clampToFloor } from './girl.js';
import { FarHouse, HouseProp, inRect } from './house.js';
import { isSnack } from './items.js';
import { Stroller } from './stroller.js';

const isParent = (item) => item.kind === 'lavaDad' || item.kind === 'lavaMum';

// What the family's chats remember: a cuddle with the baby, and its nap in
// the cradle.
const familyFacts = (scene) => ({ cuddled: happened(scene, 'lava.cuddle'), napped: happened(scene, 'lava.nap') });

// ---------------------------------------------------------------- the house
// The lava family's house, dug into the foot of the volcano at the back, with
// its stepping-stone path up to the door. Tap it and she walks up the path
// and goes inside (see EmberScene).
export class LavaHouse extends FarHouse {
  constructor(assets) {
    super(assets.lavaHouse, LAVA_HOUSE, { chimney: { x: 11, y: -37 }, smoke: EM.smokeLight });
  }
}

// --------------------------------------------------------------- the family
// Mum and dad: they love snacks and playing like every friend, and bring
// them the baby for a big cuddle. Each has their own tap fun.
class LavaParent extends Stroller {
  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item));
  }

  receive(item) {
    if (item.kind === 'lavaBaby') {
      return cuddle(this, item, { sound: 'hum', memory: 'lava.cuddle' });
    }
    return isFriendItem(item) ? play(item, this) : this.eat(item);
  }

  async onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (this.free) {
      await this.tapFun();
      offerChat(this.scene, this);
    }
  }

  // What they have to say (`chatTree` is dad's or mum's).
  chat() {
    return { tree: this.chatTree, facts: familyFacts(this.scene) };
  }
}

// Dad: a big jolly lava man with a bushy moustache. Tap him and he has a
// great big belly laugh, bouncing and puffing sparks.
export class LavaDad extends LavaParent {
  constructor(assets, state) {
    super(state, assets.lavaDad, { speed: 11, wander: 60, width: 20, height: 28 });
    this.chatTree = LAVA_DAD;
  }

  async tapFun() {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    this.facing = girl.x < this.x ? -1 : 1;
    girl.faceToward(this.x);
    engine.audio.play('hoho');
    for (let i = 0; i < 3; i++) {
      this.frame = 'blink'; // eyes screwed up laughing
      this.boing(1.2);
      scene.bits(this.x, this.y - 28, 3, EM.lavaLight);
      await engine.tweens.to(this, { lift: 3 }, 0.12, ease.outQuad);
      await engine.tweens.to(this, { lift: 0 }, 0.14, ease.inQuad);
      this.frame = 'idle';
      await engine.wait(0.08);
    }
    scene.hearts(this.x, this.y - 30, 2);
    girl.say('heart', 1.2);
    letGo(this);
  }
}

// Mum: her flame hair flickers in a bun. Tap her and she sways and hums a
// little tune, her hair flaring up.
export class LavaMum extends LavaParent {
  constructor(assets, state) {
    super(state, assets.lavaMum, { speed: 13, wander: 60, width: 18, height: 26 });
    this.chatTree = LAVA_MUM;
  }

  async tapFun() {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    this.facing = girl.x < this.x ? -1 : 1;
    girl.faceToward(this.x);
    engine.audio.play('hum');
    girl.say('note', 1.6);
    for (let i = 0; i < 6; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      this.boing(0.4);
      scene.bits(this.x + 1, this.y - 26, 2, i % 2 ? EM.lavaHi : EM.lavaLight);
      await engine.wait(0.22);
    }
    scene.hearts(this.x, this.y - 28, 2);
    letGo(this);
  }
}

// The baby: toddles after mum and dad. Tap it and it giggles and hops, its
// little flame flaring. Bring it to mum or dad for a cuddle, or tuck it into
// its cradle for a lullaby.
export class LavaBaby extends Stroller {
  constructor(assets, state) {
    super(state, assets.lavaBaby, { speed: 18, wander: 50, width: 12, height: 16 });
    this.tucked = false; // in the cradle (which draws it)
  }

  // Mum or dad, whoever's about.
  get parent() {
    const parents = this.scene.entities.filter((e) => isParent(e) && !e.held && !e.seat);
    return parents[Math.floor(Math.random() * parents.length)] ?? null;
  }

  nextStroll() {
    const { parent } = this;
    if (!parent) {
      return super.nextStroll();
    }
    const side = Math.random() < 0.5 ? -1 : 1;
    return clampToFloor(parent.x + side * (16 + Math.random() * 10), parent.y + 2 + (Math.random() - 0.5) * 8, this.scene.width);
  }

  hitTest(px, py) {
    return !this.tucked && super.hitTest(px, py);
  }

  onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (!this.free) {
      return;
    }
    const { scene } = this;
    scene.engine.audio.play('giggle');
    this.boing(0.8);
    this.hopUp(8);
    scene.bits(this.x, this.y - 16, 4, EM.lavaHi);
    scene.girl.faceToward(this.x);
    scene.girl.say('heart', 1.2);
    offerChat(scene, this, 0.4); // once it's landed
  }

  // What it babbles about: its cuddles and its naps.
  chat() {
    return { tree: LAVA_BABY, facts: familyFacts(this.scene) };
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item));
  }

  receive(item) {
    if (isParent(item)) {
      return cuddle(item, this, { sound: 'hum', memory: 'lava.cuddle' });
    }
    return isFriendItem(item) ? play(item, this) : this.eat(item);
  }

  draw(r) {
    if (!this.tucked) {
      super.draw(r);
    }
  }
}

// ------------------------------------------------------------ inside house
// The lava lamp on its little table: blobs bob slowly up and down in it.
// Tap it and they bubble up fast and change colour.
export class LavaLamp extends HouseProp {
  constructor(assets) {
    super();
    this.img = assets.lavaLamp;
    this.spot = LAVA_LAMP.spot;
    this.v = 0; // which colours (LAMP_COLORS)
    this.phase = 0;
    this.fast = 0; // seconds of fast bubbling left
  }

  hitTest(px, py) {
    return inRect(px, py, LAVA_LAMP.x - 6, LAVA_LAMP.y - LAMP_GLASS.h, 12, LAMP_GLASS.h);
  }

  use() {
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(LAVA_LAMP.x);
    girl.act('reach', 0.4);
    this.v = (this.v + 1) % LAMP_COLORS.length;
    this.fast = 1.5;
    engine.audio.play('blorp');
    engine.audio.play('chime');
    scene.sparkles(LAVA_LAMP.x, LAVA_LAMP.y - 14, 5);
    girl.say('star', 1.2);
  }

  update(dt) {
    this.phase += dt * (this.fast > 0 ? 4 : 0.7);
    this.fast = Math.max(0, this.fast - dt);
  }

  draw(r) {
    const { x, y } = LAVA_LAMP;
    const s = this.bounce;
    r.image(this.img, x, y, { scaleX: s, scaleY: 2 - s });
    const top = y - LAMP_GLASS.h;
    const [blob, hi] = LAMP_COLORS[this.v];
    r.rect(x - 9, y - 1, 18, 1, blob, 0.5); // its light on the table
    for (let i = 0; i < 3; i++) {
      const p = 0.5 + 0.5 * Math.sin(this.phase * (0.7 + i * 0.23) + i * 2.1);
      const by = Math.round(top + LAMP_GLASS.top + 1 + p * (LAMP_GLASS.bottom - LAMP_GLASS.top - 2));
      const bx = Math.round(x + Math.sin(this.phase * 0.5 + i) * 0.8);
      if (i === 0) {
        r.rect(bx - 2, by, 3, 1, blob);
        r.rect(bx - 1, by - 1, 1, 3, blob);
        r.pixel(bx - 1, by - 1, hi);
      } else {
        r.rect(bx - 1, by, 2, 2, blob);
        r.pixel(bx - 1, by, hi);
      }
    }
  }
}

// The hearth: tap it and the lava in the grate flares, the pot bubbles, and
// out comes a fresh lava cake. It won't cook more than a few at a time.
export const MAX_LAVACAKES = 3;

export class Hearth extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.hearth;
    this.spot = HEARTH.spot;
    this.glow = 0;
    this.cooking = false;
  }

  hitTest(px, py) {
    return inRect(px, py, HEARTH.x, HEARTH.y, HEARTH.w, HEARTH.h);
  }

  get pot() {
    return { x: HEARTH.x + HEARTH.w / 2, y: HEARTH.y + 50 };
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.cooking) {
      return;
    }
    const { pot } = this;
    girl.faceToward(pot.x);
    const cakes = scene.entities.filter((e) => e.kind === 'lavacake').length;
    if (cakes >= MAX_LAVACAKES) {
      girl.say('heart', 1.2);
      scene.toast('PLENTY OF LAVA CAKES!');
      return;
    }
    this.cooking = true;
    girl.act('reach', 0.4);
    engine.audio.play('flare');
    await engine.tweens.to(this, { glow: 1 }, 0.3);
    for (let i = 0; i < 3; i++) {
      engine.audio.play('blorp');
      scene.bits(pot.x, pot.y, 3, EM.lavaLight);
      await engine.wait(0.3);
    }
    engine.audio.play('ding');
    const cake = scene.spawn('lavacake', pot.x, pot.y);
    if (cake) {
      scene.sparkles(pot.x, pot.y - 4, 5);
      await scene.putDown(cake, pot.x, this.spot.y + 6);
    }
    girl.say('heart', 1.2);
    await engine.tweens.to(this, { glow: 0 }, 0.4);
    this.cooking = false;
  }

  draw(r) {
    const s = this.bounce;
    r.image(this.imgs[this.glow > 0.5 ? 1 : 0], HEARTH.x + HEARTH.w / 2, HEARTH.y + HEARTH.h, { scaleX: s, scaleY: 2 - s });
    // The stew in the pot bloops now and then.
    const t = this.scene.engine.time;
    const { pot } = this;
    for (let i = 0; i < 2; i++) {
      const k = (t * 0.7 + i * 0.5) % 1;
      if (k < 0.3) {
        r.pixel(pot.x - 3 + i * 6, pot.y - 1 - Math.round(k * 10), EM.lavaLight, 1 - k * 3);
      }
    }
  }
}

// The baby's cradle: tap it and it rocks to a lullaby. Tuck the baby in (drop
// it on the cradle) and it rocks the baby off to sleep, then out it hops.
export class Cradle extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.cradle;
    this.spot = CRADLE.spot;
    this.rock = 0; // how far over it's rocked, -1..1
    this.rocking = false;
    this.baby = null;
    this.sleepy = false;
  }

  hitTest(px, py) {
    return inRect(px, py, CRADLE.x - CRADLE.w / 2, CRADLE.y - 16, CRADLE.w, 16);
  }

  accepts(item) {
    return item.kind === 'lavaBaby' && !this.rocking && !this.baby;
  }

  use() {
    if (!this.rocking) {
      this.lullaby(4);
    }
  }

  // Rocks gently to and fro `n` times to a lullaby.
  async lullaby(n) {
    const { scene } = this;
    const { engine, girl } = scene;
    this.rocking = true;
    girl.faceToward(CRADLE.x);
    engine.audio.play('lullaby');
    girl.say('note', 1.6);
    for (let i = 0; i < n; i++) {
      await engine.tweens.to(this, { rock: 1 }, 0.35, ease.inOutSine);
      await engine.tweens.to(this, { rock: -1 }, 0.35, ease.inOutSine);
      if (i % 2) {
        scene.hearts(CRADLE.x, CRADLE.y - 20, 1);
      }
    }
    await engine.tweens.to(this, { rock: 0 }, 0.2, ease.inOutSine);
    this.rocking = false;
  }

  // The baby dropped on it: in it goes, rocked to sleep (zzz), then it
  // wakes with a stretch and hops back out.
  async receive(baby) {
    const { scene } = this;
    const { engine, girl } = scene;
    hold(baby);
    this.rocking = true;
    await scene.putDown(baby, CRADLE.x, CRADLE.spot.y);
    baby.tucked = true;
    scene.remember('lava.nap');
    baby.frame = 'idle';
    this.baby = baby;
    this.rocking = false;
    const rocked = this.lullaby(5);
    await engine.wait(1);
    this.sleepy = true;
    baby.frame = 'blink';
    await rocked;
    await engine.wait(0.6);
    this.sleepy = false;
    baby.frame = 'wave1'; // a big stretch
    engine.audio.play('giggle');
    await engine.wait(0.4);
    this.baby = null;
    baby.tucked = false;
    baby.facing = girl.x < CRADLE.x ? -1 : 1;
    baby.frame = 'hop';
    baby.lift = 10;
    await engine.tweens.to(baby, { lift: 0 }, 0.3, ease.inQuad);
    scene.hearts(baby.x, baby.y - 18, 2);
    girl.say('heart', 1.4);
    letGo(baby);
  }

  draw(r) {
    const dx = Math.round(this.rock);
    const s = this.bounce;
    const x = CRADLE.x + dx;
    r.image(this.imgs.back, x, CRADLE.y, { scaleX: s, scaleY: 2 - s });
    const { baby } = this;
    if (baby) {
      r.image(baby.seatFrame(), x, CRADLE.y - 5, { flipX: baby.facing < 0 });
      if (this.sleepy) {
        const t = this.scene.engine.time;
        for (let i = 0; i < 2; i++) {
          const k = (t * 0.5 + i * 0.5) % 1;
          r.image(this.scene.assets.text('Z', '#ffffff'), x + 6 + k * 6, CRADLE.y - 20 - k * 10, { alpha: 1 - k });
        }
      }
    }
    r.image(this.imgs.front, x, CRADLE.y, { scaleX: s, scaleY: 2 - s });
  }
}
