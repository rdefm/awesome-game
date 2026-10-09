import { ease } from '../../engine/tween.js';
import { HOUSE_DOOR } from '../layout.js';
import { hold, isFriendItem, letGo } from './friends.js';

export const inRect = (px, py, x, y, w, h, pad = 3) => px >= x - pad && px <= x + w + pad && py >= y - pad && py <= y + h + pad;

// ------------------------------------------------------------- far house
// A house far off at the back of a planet, with its path winding up to the
// door. Tap it and she walks to the path, then up it to go inside (see
// OutdoorScene). `layout` is its spot and path (e.g. GINGERBREAD_HOUSE);
// `imgs` its pictures (shut, open, and the path as a full-screen overlay);
// smoke curls from its chimney at `chimney` (from the doorstep), if it has one.
export class FarHouse {
  constructor(imgs, layout, { chimney, smoke = '#ffffff' } = {}) {
    this.imgs = imgs;
    this.layout = layout;
    this.x = layout.x;
    this.y = layout.y;
    this.spot = layout.path[0];
    this.chimney = chimney;
    this.smoke = smoke;
    this.depth = 0; // the path's on the ground: everything stands in front of it
    this.open = false;
    this.squash = 0;
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }

  hitTest(px, py) {
    const { width: w, height: h } = this.imgs.shut;
    return px >= this.x - w / 2 - 2 && px <= this.x + w / 2 + 2 && py >= this.y - h - 2 && py <= this.y + 2;
  }

  onTap() {
    const { scene } = this;
    if (scene.busy) {
      return;
    }
    scene.engine.audio.play('tap');
    this.squash = 0.6;
    scene.engine.tweens.to(this, { squash: 0 }, 0.5, ease.outElastic);
    scene.interact(this);
  }

  use() {
    this.scene.enterHouse();
  }

  draw(r) {
    r.image(this.imgs.path, 0, 0, { ax: 0, ay: 0 });
    r.image(this.open ? this.imgs.open : this.imgs.shut, this.x, this.y, { scaleX: this.bounce, scaleY: 2 - this.bounce });
    if (!this.chimney) {
      return;
    }
    const t = this.scene.engine.time;
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.4 + i / 3) % 1;
      r.rect(this.x + this.chimney.x + Math.sin(k * 6 + i) * 2, this.y + this.chimney.y - k * 16, 2, 2, this.smoke, 0.7 * (1 - k));
    }
  }
}

// ----------------------------------------------------------- inside house
// Shared "you touched me" feedback for the things in a house that stay put.
export class HouseProp {
  constructor() {
    this.squash = 0;
    this.depth = -10;
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }

  onTap() {
    this.scene.engine.audio.play('tap');
    this.squash = 1;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.35, ease.outElastic);
    this.scene.interact(this);
  }
}

// Something in a house a friend can be dropped into (a nest, a hammock, a
// bath...): in it goes (sat in it, so it's drawn here), `stay`s a while,
// then hops back out. Tapped, it does its own thing (`play`), unless it's
// already busy. `at`: where a friend in it is put down. Subclasses say when
// they're `inUse` with something of their own, and draw the friend with
// `drawFriend`.
export class FriendBed extends HouseProp {
  constructor(at) {
    super();
    this.at = at;
    this.friend = null; // in it
    this.settling = false; // a friend's being put down in it
    this.sleepy = false; // the friend in it is asleep (zzz)
  }

  get inUse() {
    return false;
  }

  accepts(item) {
    return isFriendItem(item) && !this.friend && !this.settling && !this.inUse;
  }

  async use() {
    if (!this.settling && !this.inUse) {
      await this.play();
    }
  }

  // A friend in it is tapped (it's sat in us, like a seat).
  spin() {
    this.use();
  }

  // A friend in it can't be picked up (it's held), but if it were, it'd
  // simply leave.
  release() {
    this.friend = null;
  }

  async receive(friend) {
    hold(friend);
    this.settling = true;
    await this.scene.putDown(friend, this.at.x, this.at.y);
    friend.seat = this;
    this.friend = friend;
    this.settling = false;
    await this.stay(friend);
    await this.hopOut(friend);
  }

  // The friend in it wakes with a big stretch and hops back out, away from her.
  async hopOut(friend) {
    const { scene } = this;
    const { engine, girl } = scene;
    friend.pose?.('wave1'); // a big stretch
    engine.audio.play('giggle');
    await engine.wait(0.4);
    this.friend = null;
    friend.seat = null;
    friend.facing = girl.x < this.at.x ? -1 : 1;
    friend.pose?.('hop');
    friend.lift = 10;
    await engine.tweens.to(friend, { lift: 0 }, 0.3, ease.inQuad);
    scene.hearts(friend.x, friend.y - 20, 2);
    girl.say('heart', 1.4);
    letGo(friend);
  }

  // The friend in it (if any), its feet `lift` above (x, y), with zzzs
  // drifting up off it while it's asleep.
  drawFriend(r, x, y, lift) {
    const { friend } = this;
    if (!friend) {
      return;
    }
    r.image(friend.seatFrame(), x, y - lift, { flipX: friend.facing < 0 });
    if (this.sleepy) {
      const t = this.scene.engine.time;
      for (let i = 0; i < 2; i++) {
        const k = (t * 0.5 + i * 0.5) % 1;
        r.image(this.scene.assets.text('Z', '#ffffff'), x + 8 + k * 6, y - 30 - k * 10, { alpha: 1 - k });
      }
    }
  }
}

// The front door, inside: tap it and she goes back out (see IndoorScene). It
// swings open on its left-hand hinge. `imgs`: shut, and open onto outside.
export class HouseDoor extends HouseProp {
  constructor(imgs) {
    super();
    this.imgs = imgs;
    this.spot = HOUSE_DOOR.spot;
    this.open = 0; // 0 = shut, 1 = swung wide
  }

  hitTest(px, py) {
    const { x, y, w, h } = HOUSE_DOOR;
    return inRect(px, py, x, y, w, h);
  }

  onTap(p) {
    if (!this.scene.busy) {
      super.onTap(p);
    }
  }

  use() {
    this.scene.leaveHouse();
  }

  async swing(to) {
    this.scene.engine.audio.play('creak');
    await this.scene.engine.tweens.to(this, { open: to }, 0.4, to ? ease.outCubic : ease.inQuad);
  }

  draw(r) {
    const { x, y, w, h } = HOUSE_DOOR;
    r.image(this.imgs.open, x, y + h, { ax: 0 });
    const shut = 1 - this.open;
    if (shut > 0.05) {
      r.image(this.imgs.shut, x, y + h, { ax: 0, scaleX: shut * this.bounce });
    }
  }
}
