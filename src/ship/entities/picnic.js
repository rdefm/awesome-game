import { PICNIC } from '../layout.js';
import { hold, isFriendItem, letGo } from './friends.js';
import { clampToFloor } from './girl.js';
import { PICNIC_SNACKS } from './items.js';
import { Prop } from './props.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Lying flat, the blanket is drawn under everything (whoever's sat on it
// included); nearer still goes in front.
const BLANKET_DEPTH = -100;

// A quick soft squash, for a tap or a plop.
function squish(prop, amount) {
  prop.squash = amount;
  prop.scene.engine.tweens.to(prop, { squash: 0 }, 0.35);
}

// Which way (x, y) is from her: -1 if she's to the left of it, 1 if not.
const herSide = (scene, x) => (scene.girl.x < x ? -1 : 1);

// ------------------------------------------------------------- the blanket
// A checked picnic blanket out on Bluebell's far stretch. Tap it and she sits
// down on it (and stays sat till she's off somewhere else); drop a friend on
// it and it sits down too, and stays sat (see `picnicking`) till picked up,
// munching any snack it's given there.
export class Blanket extends Prop {
  constructor(assets) {
    super();
    Object.assign(this, PICNIC.blanket);
    this.img = assets.picnicBlanket;
    this.priority = -1; // anyone sat on it wins the tap
    this.sitToken = null; // her pose's token while she's sat on it
  }

  get depth() {
    return BLANKET_DEPTH + this.y / 1000;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) <= this.half && py >= this.y - this.h && py <= this.y + 2;
  }

  // Where she sits: on the half of the blanket nearest her.
  get spot() {
    return { x: this.x + herSide(this.scene, this.x) * 10, y: this.y - 4 };
  }

  get herSat() {
    const { pose } = this.scene.girl;
    return Boolean(pose) && pose.token === this.sitToken;
  }

  // Tapped while she's sat on it: a happy wriggle, but she stays put (walking
  // over to it would stand her up).
  onTap() {
    if (!this.herSat) {
      super.onTap();
      return;
    }
    squish(this, 0.5);
    this.scene.girl.say('heart', 1);
  }

  // The nearest spot on the blanket to (x, y), not too near its edges.
  nearestSpotOn(x, y) {
    return { x: clamp(x, this.x - this.half + 6, this.x + this.half - 6), y: clamp(y, this.y - this.h + 3, this.y - 1) };
  }

  // Down she sits, legs out, facing the middle.
  use() {
    const { scene } = this;
    const { girl } = scene;
    girl.faceToward(this.x);
    this.sitToken = {};
    girl.pose = { frame: 'picnic', token: this.sitToken };
    girl.mode = 'act'; // (until she walks off, or something else needs her)
    scene.engine.audio.play('poof');
    squish(this, 0.5);
    scene.dust(girl.x, girl.y);
    girl.say('heart', 1.2);
    scene.persist();
  }

  accepts(item) {
    return isFriendItem(item);
  }

  // A friend dropped on it plops down on the spot and has a happy little sit.
  async receive(friend) {
    const { scene } = this;
    const { engine } = scene;
    hold(friend);
    const at = this.nearestSpotOn(friend.x, friend.y);
    await scene.putDown(friend, at.x, at.y);
    engine.audio.play('poof');
    squish(this, 0.5);
    friend.boing(1.6);
    friend.pose?.('blink');
    scene.hearts(friend.x, friend.y - 22, 2);
    await engine.wait(0.6);
    letGo(friend);
    friend.picnicking = true;
    if (engine.scene === scene) {
      scene.settle(friend);
      scene.girl.faceToward(friend.x);
      scene.girl.say('heart', 1.2);
    }
  }

  // While she's sat on it, she blinks sitting down too.
  update() {
    const { girl } = this.scene;
    if (this.herSat) {
      girl.pose.frame = girl.blinkIn < 0 ? 'picnicBlink' : 'picnic';
    }
  }

  draw(r) {
    r.image(this.img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ------------------------------------------------------------- the basket
// A wicker picnic basket on the blanket's back corner. Tap it and the lid
// flips open and out pops a sandwich, then a berry juice next time, and so
// on (but only so many lying about the picnic at once).
export const MAX_PICNIC_SNACKS = 4;
const NEARBY = 48; // how far either side of the basket counts as at the picnic

export class Basket extends Prop {
  constructor(assets) {
    super();
    Object.assign(this, PICNIC.basket);
    this.imgs = assets.picnicBasket;
    this.open = false;
    this.giving = false;
    this.nextSnack = 0; // which of PICNIC_SNACKS comes out next
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) <= this.half && py >= this.y - this.h && py <= this.y + 2;
  }

  // Where she stands to open it: beside it, on whichever side she's on.
  get spot() {
    return clampToFloor(this.x + herSide(this.scene, this.x) * 14, this.y + 4, this.scene.width);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.giving) {
      return;
    }
    girl.faceToward(this.x);
    const about = scene.entities.filter((e) => PICNIC_SNACKS.includes(e.kind) && Math.abs(e.x - this.x) <= NEARBY);
    if (about.length >= MAX_PICNIC_SNACKS) {
      girl.say('heart', 1.2);
      scene.toast('PLENTY OF PICNIC!');
      return;
    }
    this.giving = true;
    girl.act('reach', 0.4);
    engine.audio.play('creak');
    this.open = true;
    squish(this, 1);
    await engine.wait(0.25);
    const kind = PICNIC_SNACKS[this.nextSnack % PICNIC_SNACKS.length];
    this.nextSnack += 1;
    const snack = scene.spawn(kind, this.x, this.y - 10);
    if (snack) {
      engine.audio.play('pop');
      scene.sparkles(this.x, this.y - 12, 5);
      await scene.putDown(snack, this.x + herSide(scene, this.x) * 10, this.y + 6);
    }
    girl.say('heart', 1.2);
    await engine.wait(0.3);
    this.open = false;
    this.giving = false;
  }

  draw(r) {
    r.rect(this.x - 8, this.y - 1, 16, 2, '#000000', 0.2);
    r.image(this.imgs[this.open ? 1 : 0], this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}
