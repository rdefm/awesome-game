import { ease } from '../../engine/tween.js';
import { PARKED_SHIP } from '../layout.js';

// Things every planet she can walk about on has: our ship parked on the left,
// and little fluttery things to chase.

// ------------------------------------------------------------- parked ship
export class ParkedShip {
  constructor(assets) {
    this.img = assets.shipOutside.open;
    this.x = PARKED_SHIP.x;
    this.y = PARKED_SHIP.y;
    this.spot = PARKED_SHIP.spot;
    this.depth = 0; // always behind the girl, even as she climbs the ramp
    this.squash = 0;
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }

  hitTest(px, py) {
    return px >= this.x - 32 && px <= this.x + 32 && py >= this.y - 44 && py <= this.y + 4;
  }

  onTap() {
    if (this.scene.busy) {
      return;
    }
    this.scene.engine.audio.play('tap');
    this.squash = 0.6;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.5, ease.outElastic);
    this.scene.interact(this);
  }

  use() {
    this.scene.boardShip();
  }

  draw(r) {
    r.rect(this.x - 24, this.y - 2, 48, 3, '#000000', 0.18);
    r.image(this.img, this.x, this.y, { scaleX: this.bounce, scaleY: 2 - this.bounce });
  }
}

// --------------------------------------------------------------- flutterers
// A butterfly (or moth) drifting about. `kinds` is the set of two-frame
// pictures to pick from; tap one three times and it shakes off `sticker`.
export class Butterfly {
  constructor(kinds, i, sticker) {
    this.imgs = kinds[i % kinds.length];
    this.sticker = sticker;
    this.x = 100 + i * 50;
    this.y = 80 + i * 12;
    this.depth = 500;
    this.speed = 18;
    this.flap = Math.random();
    this.taps = 0;
    this.pickTarget();
  }

  pickTarget() {
    this.target = { x: 80 + Math.random() * 170, y: 64 + Math.random() * 64 };
  }

  hitTest(px, py) {
    return Math.hypot(px - this.x, py - this.y) < 10;
  }

  onTap() {
    this.scene.engine.audio.play('flutter');
    this.target = { x: this.x + (Math.random() - 0.5) * 60, y: 20 + Math.random() * 20 };
    this.speed = 60;
    this.scene.sparkles(this.x, this.y, 4);
    this.taps += 1;
    if (this.taps === 3) {
      this.scene.findSticker(this.sticker, this.x, this.y); // shaken off its wing
    }
  }

  update(dt) {
    this.flap += dt;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) {
      this.speed = 18;
      this.pickTarget();
      return;
    }
    this.x += (dx / d) * this.speed * dt;
    this.y += (dy / d) * this.speed * dt + Math.sin(this.flap * 9) * 0.5;
  }

  draw(r) {
    r.image(this.imgs[Math.floor(this.flap * 10) % 2], this.x, this.y, { ay: 0.5 });
  }
}
