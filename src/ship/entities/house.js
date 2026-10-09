import { ease } from '../../engine/tween.js';
import { HOUSE_DOOR } from '../layout.js';
import { letGo } from './friends.js';

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

// A friend napping in `bed` (a hammock, a nest...) wakes with a big stretch
// and hops back out, away from her, beside x.
export async function wakeAndHopOut(bed, friend, x) {
  const { scene } = bed;
  const { engine, girl } = scene;
  friend.pose?.('wave1'); // a big stretch
  engine.audio.play('giggle');
  await engine.wait(0.4);
  bed.friend = null;
  friend.seat = null;
  friend.facing = girl.x < x ? -1 : 1;
  friend.pose?.('hop');
  friend.lift = 10;
  await engine.tweens.to(friend, { lift: 0 }, 0.3, ease.inQuad);
  scene.hearts(friend.x, friend.y - 20, 2);
  girl.say('heart', 1.4);
  letGo(friend);
}

// Zzzs drifting up off a friend asleep at (x, y).
export function drawZzz(r, scene, x, y) {
  const t = scene.engine.time;
  for (let i = 0; i < 2; i++) {
    const k = (t * 0.5 + i * 0.5) % 1;
    r.image(scene.assets.text('Z', '#ffffff'), x + 8 + k * 6, y - 30 - k * 10, { alpha: 1 - k });
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
