import { ease } from '../../engine/tween.js';
import { FO } from '../art/mrMonkey.js';
import { SPROUT } from '../art/treeHouse.js';
import { happened, offerChat } from '../chat.js';
import { FIREFLY_JAR, W } from '../layout.js';
import { TREE_DAD, TREE_KID, TREE_MUM } from '../talks/treeFamily.js';
import { cuddle, hold, isFriendItem, letGo, play } from './friends.js';
import { clampToFloor } from './girl.js';
import { HouseProp, inRect } from './house.js';
import { isSnack } from './items.js';
import { Stroller } from './stroller.js';

const isParent = (item) => item.kind === 'treeDad' || item.kind === 'treeMum';

// What the family's chats remember: a cuddle with the little one, her swing
// across the rope, and Monkey or Gonzo smacking into a tree.
const familyFacts = (scene) => ({
  cuddled: happened(scene, 'mrmonkey.cuddle'),
  swung: happened(scene, 'mrmonkey.swing'),
  smacked: happened(scene, 'mrmonkey.smack'),
});

// Someone nearby from `kinds` (not being carried or sat down), or null.
function nearby(scene, kinds) {
  const them = scene.entities.filter((e) => kinds.includes(e.kind) && !e.held && !e.seat);
  return them[Math.floor(Math.random() * them.length)] ?? null;
}

// Strolls to somewhere beside `who` (to follow them about).
function besides(scene, who, gap) {
  const side = Math.random() < 0.5 ? -1 : 1;
  return clampToFloor(who.x + side * (gap + Math.random() * 10), who.y + 2 + (Math.random() - 0.5) * 8, scene.width);
}

// --------------------------------------------------------------- the family
// Dad and mum: they love snacks and playing like every friend, and bring
// them their little one for a big cuddle. Each has their own tap fun.
class TreeParent extends Stroller {
  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item));
  }

  receive(item) {
    if (item.kind === 'treeKid') {
      return cuddle(this, item, { sound: 'hum', sticker: 'mrmonkey.cuddle' });
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

  chat() {
    return { tree: this.chatTree, facts: familyFacts(this.scene) };
  }
}

// Dad: a big old oak, with mossy eyebrows and a great round crown of
// leaves. Tap him and he has a big creaky stretch, his leaves rustling...
// and an acorn drops out of them, BONK, on his head. He laughs it off.
export class TreeDad extends TreeParent {
  constructor(assets, state) {
    super(state, assets.treeDad, { speed: 9, wander: 60, width: 20, height: 32 });
    this.chatTree = TREE_DAD;
    this.acorn = null; // { x, y } while one's falling on his head
  }

  async tapFun() {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    this.facing = girl.x < this.x ? -1 : 1;
    girl.faceToward(this.x);
    engine.audio.play('creak');
    this.frame = 'wave1';
    await engine.tweens.to(this, { lift: 2 }, 0.4, ease.outQuad);
    engine.audio.play('rustle');
    scene.bits(this.x, this.headTop + 4, 5, FO.leafLight);
    await engine.tweens.to(this, { lift: 0 }, 0.2, ease.inQuad);
    // Bonk!
    this.acorn = { x: this.x + this.facing * 3, y: this.headTop - 30 };
    await engine.tweens.to(this.acorn, { y: this.headTop }, 0.35, ease.inQuad);
    engine.audio.play('boing');
    this.boing(1.5);
    this.frame = 'blink';
    girl.say('bang', 1);
    await engine.tweens.to(this.acorn, { x: this.acorn.x + this.facing * 14, y: this.y }, 0.35, ease.inQuad);
    this.acorn = null;
    engine.audio.play('hoho');
    for (let i = 0; i < 3; i++) {
      this.boing(0.8);
      await engine.wait(0.22);
    }
    scene.hearts(this.x, this.headTop - 2, 2);
    girl.say('heart', 1.2);
    letGo(this);
  }

  draw(r) {
    super.draw(r);
    if (this.acorn) {
      r.rect(this.acorn.x - 1, this.acorn.y - 3, 3, 3, '#a86a3a');
      r.rect(this.acorn.x - 1, this.acorn.y - 4, 3, 1, '#6a4022');
    }
  }
}

// Mum: a willow, her long leaves trailing, a flower tucked in them. Tap her
// and she sways and hums, her leaves fluttering and petals drifting off.
export class TreeMum extends TreeParent {
  constructor(assets, state) {
    super(state, assets.treeMum, { speed: 11, wander: 60, width: 18, height: 30 });
    this.chatTree = TREE_MUM;
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
      this.facing = -this.facing;
      this.boing(0.4);
      scene.bits(this.x, this.headTop + 2, 2, i % 2 ? '#ff8fc8' : FO.leafLight);
      await engine.wait(0.22);
    }
    scene.hearts(this.x, this.headTop - 2, 2);
    letGo(this);
  }
}

// Their little one: a sapling with two leaves on top, who toddles after mum
// and dad. Tap it and it giggles and spins round, its leaves twirling. Bring
// it to mum or dad for a cuddle.
export class TreeKid extends Stroller {
  constructor(assets, state) {
    super(state, assets.treeKid, { speed: 18, wander: 50, width: 12, height: 20 });
  }

  nextStroll() {
    const parent = nearby(this.scene, ['treeDad', 'treeMum']);
    return parent ? besides(this.scene, parent, 16) : super.nextStroll();
  }

  async onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (!this.free) {
      return;
    }
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(this.x);
    engine.audio.play('giggle');
    this.frame = 'hop';
    this.turn = 0;
    await Promise.all([
      engine.tweens.to(this, { lift: 8 }, 0.2, ease.outQuad).then(() => engine.tweens.to(this, { lift: 0 }, 0.2, ease.inQuad)),
      engine.tweens.to(this, { turn: 1 }, 0.4, ease.inOutSine),
    ]);
    this.turn = 0;
    scene.bits(this.x, this.headTop + 2, 3, FO.leafLight);
    scene.hearts(this.x, this.headTop - 2, 2);
    girl.say('heart', 1.2);
    letGo(this);
    offerChat(scene, this);
  }

  chat() {
    return { tree: TREE_KID, facts: familyFacts(this.scene) };
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item));
  }

  receive(item) {
    if (isParent(item)) {
      return cuddle(item, this, { sound: 'hum', sticker: 'mrmonkey.cuddle' });
    }
    return isFriendItem(item) ? play(item, this) : this.eat(item);
  }
}

// ------------------------------------------------------------------ the pet
// Sprout, the family's pet leaf dragon. It pads about after the little one,
// flapping its leaf wings. Tap it and it flaps up into the air, loops the
// loop and sneezes out a great puff of flower petals; every third time it
// sneezes so hard it shoots up to the ceiling, and a sticker comes out with
// the petals. Feed it a snack, or drop a friend on it to play.
export class Sprout extends Stroller {
  constructor(assets, state) {
    super(state, assets.sprout, { speed: 24, wander: 70, width: 18, height: 16 });
    this.flap = 0; // its wings flutter now and then as it walks about
    this.tricks = 0;
  }

  nextStroll() {
    const kid = nearby(this.scene, ['treeKid']);
    return kid && Math.random() < 0.7 ? besides(this.scene, kid, 14) : super.nextStroll();
  }

  onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (this.free) {
      this.trick();
    }
  }

  async trick() {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    const { tweens } = engine;
    girl.faceToward(this.x);
    this.tricks += 1;
    const big = this.tricks % 3 === 0;
    // Flap, flap, up it goes...
    engine.audio.play('flutter');
    const up = tweens.to(this, { lift: 22 }, 0.6, ease.outQuad);
    for (let i = 0; i < 6; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      await engine.wait(0.1);
    }
    await up;
    // ...round the loop...
    engine.audio.play('wheee');
    this.turn = 0;
    await tweens.to(this, { turn: 1 }, 0.5, ease.inOutSine);
    this.turn = 0;
    // ...and a great big sneeze of petals.
    engine.audio.play('sneeze');
    this.frame = 'blink';
    await engine.wait(0.55);
    this.frame = 'hop';
    const nose = { x: this.x + this.facing * 10, y: this.y - this.lift - 10 };
    scene.bits(nose.x, nose.y, big ? 16 : 8, '#ff8fc8');
    scene.bits(nose.x, nose.y, big ? 10 : 5, '#ffe066');
    scene.bits(nose.x, nose.y, 4, SPROUT.light);
    if (big) {
      // So hard it shoots right up!
      await tweens.to(this, { lift: 50 }, 0.25, ease.outQuad);
      scene.sparkles(this.x, this.y - this.lift - 8, 8);
      scene.findSticker('mrmonkey.pet', this.x, this.y - this.lift - 10);
      girl.say('star', 1.4);
      girl.act('cheer', 0.8);
    } else {
      girl.say('heart', 1.2);
    }
    // Gently back down, wings out.
    this.frame = 'hop';
    await tweens.to(this, { lift: 0 }, big ? 1 : 0.6, ease.inOutSine);
    engine.audio.play('land');
    this.boing(1);
    this.frame = 'idle';
    scene.hearts(this.x, this.headTop - 2, 2);
    letGo(this);
  }

  onPickUp() {
    super.onPickUp();
    this.scene.engine.audio.play('flutter');
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item));
  }

  receive(item) {
    return isFriendItem(item) ? play(item, this) : this.eat(item);
  }

  update(dt) {
    super.update(dt);
    if (!this.busy && !this.held && this.walk) {
      // A happy flutter of its wings as it pads along.
      this.flap += dt;
      if (Math.floor(this.flap * 3) % 4 === 0) {
        this.frame = Math.floor(this.flap * 12) % 2 ? 'wave1' : 'wave2';
      }
    }
  }
}

// ------------------------------------------------------------ inside house
// The jar of fireflies hanging from a branch. Tap it and she reaches up and
// pops the cork: out they all fly, twinkling round and round the room, and
// after a while they fly back home into the jar.
export class FireflyJar extends HouseProp {
  constructor(assets) {
    super();
    this.imgs = assets.fireflyJar; // [dim, lit]
    this.spot = FIREFLY_JAR.spot;
    this.flies = []; // { a, r, speed, cx, cy, home } while they're out
    this.out = false;
    this.swing = 0;
  }

  hitTest(px, py) {
    return inRect(px, py, FIREFLY_JAR.x - 7, FIREFLY_JAR.y, 14, 24);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.out) {
      return;
    }
    this.out = true;
    girl.faceToward(FIREFLY_JAR.x);
    girl.act('reach', 0.6);
    engine.audio.play('pop');
    this.swing = 1;
    engine.tweens.to(this, { swing: 0 }, 1.2, ease.outElastic);
    const jar = { x: FIREFLY_JAR.x, y: FIREFLY_JAR.y + 16 };
    this.flies = Array.from({ length: 7 }, (_, i) => ({
      a: (i / 7) * Math.PI * 2, r: 0, speed: 1 + Math.random(), cx: 60 + Math.random() * (W - 120), cy: 40 + Math.random() * 50, home: 0,
    }));
    engine.audio.play('tinkle');
    for (const f of this.flies) {
      engine.tweens.to(f, { r: 20 + Math.random() * 16 }, 1, ease.outQuad);
    }
    girl.say('star', 1.4);
    await engine.wait(5);
    // Home again, into the jar.
    engine.audio.play('chime');
    await Promise.all(this.flies.map((f) => engine.tweens.to(f, { home: 1 }, 1.2, ease.inOutSine)));
    this.flies = [];
    engine.audio.play('pop');
    scene.sparkles(jar.x, jar.y, 4);
    this.out = false;
  }

  update(dt) {
    for (const f of this.flies) {
      f.a += f.speed * dt;
    }
  }

  draw(r) {
    const { x, y } = FIREFLY_JAR;
    const sway = Math.sin(this.scene.engine.time * 8) * this.swing * 2;
    r.image(this.imgs[this.out ? 0 : 1], x + sway, y, { ay: 0 });
  }

  // The fireflies twinkling over everything as they fly about.
  drawOver(r) {
    const t = this.scene.engine.time;
    const jar = { x: FIREFLY_JAR.x, y: FIREFLY_JAR.y + 16 };
    this.flies.forEach((f, i) => {
      const fx = f.cx + Math.cos(f.a) * f.r;
      const fy = f.cy + Math.sin(f.a * 1.3) * f.r * 0.6;
      const x = fx + (jar.x - fx) * f.home;
      const y = fy + (jar.y - fy) * f.home;
      const twinkle = 0.5 + Math.sin(t * 7 + i) * 0.5;
      r.rect(x - 2, y - 2, 5, 5, '#ffe066', 0.25 + 0.25 * twinkle);
      r.rect(x - 1, y - 1, 3, 3, '#ffe066', 0.6 + 0.3 * twinkle);
      r.rect(x, y, 1, 1, '#ffffff');
    });
  }
}
