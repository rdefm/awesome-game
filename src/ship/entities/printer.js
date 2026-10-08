import { ease } from '../../engine/tween.js';
import { DecorPicker } from '../decorPicker.js';
import { PRINTER } from '../layout.js';
import { inRect } from './house.js';
import { Prop } from './props.js';

// The decor printer in the store room. Tap it and she walks over; the
// picker slides up, and whatever she picks is printed with a whirr and
// pops out onto the floor in front (or hops up onto the wall beside it).
export class DecorPrinter extends Prop {
  constructor(assets) {
    super();
    this.imgs = assets.printer;
    this.x = PRINTER.x;
    this.y = PRINTER.y;
    this.spot = PRINTER.spot;
    this.printing = false;
  }

  hitTest(px, py) {
    return inRect(px, py, this.x - PRINTER.w / 2, this.y - PRINTER.h, PRINTER.w, PRINTER.h);
  }

  wobble(amount) {
    this.squash = amount;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.35, ease.outElastic);
  }

  use() {
    const { scene } = this;
    if (scene.busy) {
      return;
    }
    scene.scripted(() => this.choose());
  }

  async choose() {
    const { scene } = this;
    scene.girl.faceToward(this.x);
    scene.girl.act('reach', 0.4);
    this.picker ??= new DecorPicker(scene);
    const kind = await this.picker.open();
    if (kind) {
      await this.print(kind);
    }
  }

  async print(kind) {
    const { scene } = this;
    const { engine, girl } = scene;
    this.printing = true;
    engine.audio.play('whirr');
    for (let i = 0; i < 4; i++) {
      this.wobble(0.5);
      await engine.wait(0.22);
    }
    this.printing = false;
    engine.audio.play('pop');
    const item = scene.spawn(kind, this.x, this.y - 10);
    if (!item) {
      return;
    }
    scene.sparkles(this.x, this.y - 12, 8);
    // Wall pieces hop up beside it, so they aren't hung out of sight behind it.
    const to = item.hangsOnWall ? { x: this.x + PRINTER.w / 2 + 16, y: PRINTER.out.y } : PRINTER.out;
    await scene.putDown(item, to.x, to.y);
    girl.say('star', 1.2);
    await girl.act('cheer', 0.6);
  }

  draw(r) {
    r.image(this.imgs[this.printing ? 1 : 0], this.x, this.y, { scaleX: 2 - this.bounce, scaleY: this.bounce });
  }
}
