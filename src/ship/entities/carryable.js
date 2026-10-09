import { ease } from '../../engine/tween.js';
import { dress } from '../friendHats.js';
import { CHAIR } from '../layout.js';
import { LOOK_OPTIONS } from '../look.js';
import { clampToFloor } from './girl.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Anything she can pick up: drag it about the scene, drop it anywhere on the
// floor, or drop it on the bag to carry it to another place. Subclasses draw
// themselves standing at (x, y) (bottom-centre) and add their own tap fun.
// `state` is the thing's entry in the world ({ id, kind, x, y, v? }).
export class Carryable {
  constructor(state) {
    this.id = state.id;
    this.kind = state.kind;
    this.x = state.x;
    this.y = state.y;
    this.squash = 0;
    this.held = false;
    this.falling = false;
    this.draggable = true;
    this.grab = { x: 0, y: 0 };
    this.reach = 16; // how far to the side the girl stands to use it
    this.seat = null; // the chair it's sitting in, if any (friends only)
    this.turn = 0; // how far round a twirl it is, 0..1 (friends only)
    this.hat = LOOK_OPTIONS.hat.includes(state.hat) ? state.hat : 'none'; // (friends only)
  }

  // A picture of this friend, wearing its hat (if it has one).
  dressed(img) {
    return this.hat === 'none' ? img : dress(img, this.kind, this.hat, this.scene.assets.hats[this.hat]);
  }

  // Lifted things float above everything else.
  get depth() {
    return this.held || this.falling ? 1000 : this.y;
  }

  // How far it's raised up off the floor: onto the cushion, while sat in the chair.
  get perch() {
    return this.seat ? CHAIR.cushion : 0;
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }

  // Horizontal scale partway through a twirl: it narrows to an edge, turns
  // its back, and comes round again.
  get twirl() {
    return Math.cos(this.turn * Math.PI * 2);
  }

  boing(amount = 1) {
    this.squash = amount;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.5, ease.outElastic);
  }

  // Where the girl stands to use it: beside it, on whichever side she's on.
  get spot() {
    const side = this.scene.girl.x < this.x ? -1 : 1;
    return clampToFloor(this.x + side * this.reach, this.y + 4);
  }

  // Default tap: a squash, then the girl walks over and uses it (if it has a use).
  onTap() {
    this.scene.engine.audio.play('tap');
    this.boing();
    if (this.use) {
      this.scene.interact(this);
    }
  }

  // Shadow on the floor, which stays put on the floor while it's lifted.
  shadow(r, w) {
    const lifted = this.held || this.falling;
    const floorY = lifted ? clampToFloor(this.x, this.y + 30).y : this.y;
    r.rect(this.x - w / 2, floorY - 1, lifted ? w * 0.7 : w, 2, '#000000', lifted ? 0.15 : 0.2);
  }

  onDragStart(p) {
    if (this.seat) {
      this.y -= this.perch; // lifted straight up off the cushion
      this.seat.release();
    }
    this.held = true;
    this.grab = { x: this.x - p.x, y: this.y - p.y };
    this.scene.carried = this;
    this.scene.engine.audio.play('pickup');
    this.onPickUp?.();
  }

  onDrag(p) {
    this.x = clamp(p.x + this.grab.x, 6, 250);
    this.y = clamp(p.y + this.grab.y, 20, 158);
  }

  onDrop(p) {
    this.held = false;
    this.scene.carried = null;
    this.scene.dropCarryable(this, p);
  }

  // Drops down (or hops up) onto the floor at `floor`.
  async fall(floor) {
    this.x = floor.x;
    if (Math.abs(floor.y - this.y) > 1) {
      this.falling = true;
      await this.scene.engine.tweens.to(this, { y: floor.y }, 0.08 + Math.abs(floor.y - this.y) / 300, ease.inQuad);
    }
    this.y = floor.y;
    this.falling = false;
    this.scene.engine.audio.play('land');
    this.scene.dust(this.x, this.y);
    this.boing(0.8);
    this.onLand?.();
  }
}
