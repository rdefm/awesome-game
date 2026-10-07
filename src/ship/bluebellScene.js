import { Bluebell, Butterfly, Critter, Local, ParkedShip } from './entities/bluebell.js';
import { Girl, clampToFloor } from './entities/girl.js';
import { PARKED_SHIP, W } from './layout.js';
import { BLOCK_INPUT, PlayScene } from './playScene.js';
import { loadSave, writeSave } from './save.js';
import { ShipScene } from './shipScene.js';

// Planet Bluebell: a sunny meadow of giant ringing bluebells, a hopping
// puffball, butterflies and a friendly local, with our ship parked on the left.
export class BluebellScene extends PlayScene {
  // `fromShip`: she's just walked out of the door (rather than a reload).
  constructor(assets, { fromShip = true } = {}) {
    super(assets);
    this.dustColor = '#c9f0b0';
    this.fromShip = fromShip;
    const save = loadSave();
    const start = fromShip ? PARKED_SHIP.spot : clampToFloor(save.bx ?? 90, save.by ?? 134);

    this.ship = this.add(new ParkedShip(assets));
    [[104, 121, 0], [140, 148, 1], [176, 119, 2], [244, 127, 3]].forEach(([x, y, stem], i) => {
      this.add(new Bluebell(assets, x, y, stem, i));
    });
    this.add(new Local(assets, 214, 138));
    this.add(new Critter(assets, 160, 132));
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets, i));
    }
    this.girl = this.add(new Girl(assets, start.x, start.y));
  }

  enter() {
    super.enter();
    this.persist();
    if (this.fromShip) {
      this.walkDownRamp();
    }
  }

  persist() {
    writeSave({ ...loadSave(), where: 'bluebell', bx: Math.round(this.girl.x), by: Math.round(this.girl.y) });
  }

  async walkDownRamp() {
    const { engine, girl } = this;
    this.busy = true;
    girl.alpha = 0;
    girl.y = PARKED_SHIP.spot.y - 6;
    engine.tweens.to(girl, { alpha: 1 }, 0.4);
    await engine.tweens.to(girl, { y: PARKED_SHIP.spot.y }, 0.4);
    this.busy = false;
    await girl.walkTo(PARKED_SHIP.spot.x + 22, PARKED_SHIP.spot.y + 10);
    girl.say('heart');
    girl.act('cheer', 0.8);
  }

  async boardShip() {
    const { engine, girl } = this;
    if (this.busy) {
      return;
    }
    this.busy = true;
    this.modal = BLOCK_INPUT;
    engine.audio.play('door');
    engine.tweens.to(girl, { y: PARKED_SHIP.spot.y - 8 }, 0.5);
    await engine.tweens.to(girl, { alpha: 0 }, 0.5);
    await this.leaveTo(() => new ShipScene(this.assets, { fromDoor: true }));
  }

  musicNote(x, y) {
    const colors = ['#6fb2ff', '#ff8fc8', '#ffe066', '#ffffff'];
    this.particles.push({
      x, y, vx: (Math.random() - 0.5) * 16, vy: -22 - Math.random() * 10, gravity: 0, life: 1.1, age: 0,
      note: true, color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  draw(r) {
    const t = this.engine.time;
    r.image(this.assets.meadow, 0, 0, { ax: 0, ay: 0 });
    this.assets.clouds.forEach((img, i) => {
      r.image(img, ((i * 130 + 20 + t * (3 + i)) % (W + 50)) - 40, 14 + i * 12, { ax: 0, ay: 0 });
    });
    this.drawEntities(r);
    for (const e of this.entities) {
      e.drawOver?.(r);
    }
    this.drawParticles(r);
    this.modal?.draw(r);
    this.drawOverlay(r);
  }
}
