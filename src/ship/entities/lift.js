import { ease } from '../../engine/tween.js';
import { LIFT, WALK } from '../layout.js';
import { LiftPicker } from '../liftPicker.js';
import { shipRoomScene } from '../shipRooms.js';
import { inRect } from './house.js';
import { Prop } from './props.js';

const BUTTON = { w: 9, h: 13 };

// The lift, a door in the back wall up to (or down from) the ship's other
// decks. Tap it and she walks over and presses the call button: ding, the
// doors slide open. Tap it again and in she steps, the doors shut, and the
// panel of floors slides up: pick one and off she goes (or, picking nothing,
// back out she steps).
export class Lift extends Prop {
  constructor(assets) {
    super();
    this.imgs = assets.lift;
    this.x = LIFT.x;
    this.y = LIFT.y; // behind everything on the floor
    this.spot = LIFT.spot;
    this.open = 0; // how far the doors have slid apart, 0..1
    this.called = false; // the call button's lit
    this.rider = null; // her, while she's in it (it draws her)
    this.closing = false; // the doors are sliding shut by themselves
  }

  get isOpen() {
    return this.open > 0.99;
  }

  hitTest(px, py) {
    const { x, y, w, h, button } = LIFT;
    return inRect(px, py, x - w / 2, y - h, w, h) || inRect(px, py, button.x - BUTTON.w / 2, button.y - BUTTON.h / 2, BUTTON.w, BUTTON.h);
  }

  use() {
    const { scene } = this;
    if (scene.busy) {
      return;
    }
    return scene.scripted(() => (this.isOpen ? this.ride() : this.call()));
  }

  async slide(to) {
    const { engine } = this.scene;
    engine.audio.play('liftDoors');
    await engine.tweens.to(this, { open: to }, 0.5, ease.inOutSine);
  }

  // She presses the call button: it lights, ding, and the doors open.
  async call() {
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(LIFT.button.x);
    girl.act('reach', 0.4);
    engine.audio.play('click');
    this.called = true;
    await engine.wait(0.5);
    engine.audio.play('ding');
    this.called = false;
    await this.slide(1);
  }

  // In she steps, the doors shut and she picks a floor.
  async ride() {
    const { scene } = this;
    const { engine } = scene;
    await this.stepIn();
    this.picker ??= new LiftPicker(scene, scene.where);
    const to = await this.picker.open();
    if (!to || to === scene.where) {
      await this.slide(1);
      await this.stepOut();
      return;
    }
    engine.audio.play('liftHum');
    await engine.wait(0.4);
    await scene.leaveTo(() => shipRoomScene(to, scene.assets, { fromLift: true }));
  }

  async stepIn() {
    const { girl } = this.scene;
    await girl.walkTo(this.x, WALK.minY);
    girl.facing = 1;
    girl.x = this.x;
    girl.mode = 'act';
    girl.pose = null;
    this.rider = girl;
    girl.riding = this;
    await this.slide(0);
  }

  // She's just come up (or down) in it: the doors open and out she steps.
  async arrive() {
    const { scene } = this;
    await scene.scripted(async () => {
      this.rider = scene.girl;
      scene.girl.riding = this;
      scene.girl.mode = 'act';
      await scene.engine.wait(0.3);
      scene.engine.audio.play('ding');
      await this.slide(1);
      await this.stepOut();
    });
  }

  async stepOut() {
    const { scene } = this;
    const { girl } = scene;
    this.rider = null;
    girl.riding = null;
    girl.x = this.x;
    girl.y = WALK.minY;
    girl.mode = 'idle';
    await girl.walkTo(this.x, LIFT.spot.y + 8);
    scene.persist();
    await this.slide(0);
  }

  // Left open with nobody about, the doors slide shut again by themselves.
  update() {
    const { scene } = this;
    const away = Math.abs(scene.girl.x - this.x) > 40;
    if (this.isOpen && away && !this.rider && !scene.busy && !this.closing) {
      this.closing = true;
      this.slide(0).then(() => {
        this.closing = false;
      });
    }
  }

  draw(r) {
    const { x, y, w, h, button } = LIFT;
    const left = x - w / 2;
    // The car: a little lit room behind the doors.
    const top = y - h + 1;
    r.rect(left, top, w, h, '#2a3150');
    r.rect(left + 4, top + 2, w - 8, 2, '#ffe9b0');
    r.rect(left, y - 14, w, 1, '#4b5784');
    const who = this.rider;
    if (who) {
      r.image(who.currentFrame(), x, y + 1, { flipX: who.facing < 0 });
    }
    // The doors, each sliding away into the wall beside it.
    const half = w / 2;
    const shut = Math.round(half * (1 - this.open));
    if (shut > 0) {
      for (const [dx, edge] of [[left, left + shut - 1], [x + half - shut, x + half - shut]]) {
        r.rect(dx, top, shut, h, '#7d88ab');
        r.rect(edge, top, 1, h, '#b4bdd6');
        r.rect(dx, y - h / 2 - 2, shut, 2, '#ffe066');
      }
    }
    r.image(this.imgs.frame, x, y + 1);
    r.image(this.imgs.button[this.called ? 1 : 0], button.x, button.y, { ay: 0.5, scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}
