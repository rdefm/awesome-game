import { POSY_PATCH } from '../layout.js';
import { Carryable } from './carryable.js';
import { clampToFloor, herSide } from './girl.js';
import { Prop } from './props.js';

// ---------------------------------------------------------------- a posy
// A little bunch of bluebells, picked from the patch. Tap it and she has a
// sniff. Drop three on her, one at a time, and she weaves them into a flower
// crown (see crown.js); drop one on the pink alien and it keeps it.
export class Posy extends Carryable {
  constructor(assets, state) {
    super(state);
    this.img = assets.posy;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) < 8 && py > this.y - 14 && py < this.y + 3;
  }

  use() {
    const { scene } = this;
    scene.girl.faceToward(this.x);
    scene.engine.audio.play('tap');
    this.boing(1.4);
    scene.sparkles(this.x, this.y - 10, 3);
    scene.girl.say('heart');
  }

  draw(r) {
    this.shadow(r, 8);
    r.image(this.img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// ----------------------------------------------------------- the posy patch
// A patch of little bluebells out on the far stretch. Tap it and she picks a
// posy (but only so many lie about the patch at once).
export const MAX_POSIES = 4;
const NEARBY = 40; // how far either side of the patch counts as by it

export class PosyPatch extends Prop {
  constructor(assets) {
    super();
    Object.assign(this, POSY_PATCH);
    this.img = assets.posyPatch;
    this.picking = false;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) <= this.half && py >= this.y - this.h && py <= this.y + 2;
  }

  // Where she stands to pick: beside it, on whichever side she's on.
  get spot() {
    return clampToFloor(this.x + herSide(this.scene, this.x) * (this.half + 4), this.y + 2, this.scene.width);
  }

  async use() {
    const { scene } = this;
    const { engine, girl } = scene;
    if (this.picking) {
      return;
    }
    girl.faceToward(this.x);
    const about = scene.entities.filter((e) => e.kind === 'posy' && Math.abs(e.x - this.x) <= NEARBY);
    if (about.length >= MAX_POSIES) {
      girl.say('heart', 1.2);
      scene.toast('LOTS OF POSIES!');
      return;
    }
    this.picking = true;
    girl.act('reach', 0.4);
    engine.audio.play('pop');
    this.squash = 1;
    engine.tweens.to(this, { squash: 0 }, 0.35);
    const posy = scene.spawn('posy', this.x + herSide(scene, this.x) * 6, this.y - 6);
    if (posy) {
      scene.sparkles(posy.x, posy.y - 8, 4);
      await scene.putDown(posy, this.x + herSide(scene, this.x) * (this.half - 2), this.y + 4);
    }
    girl.say('heart', 1.2);
    this.picking = false;
  }

  draw(r) {
    r.image(this.img, this.x, this.y + 1, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}
