import { drawBackdrop } from './backdrop.js';
import { Girl, clampToFloor } from './entities/girl.js';
import { ParkedShip } from './entities/outdoors.js';
import { PARKED_SHIP } from './layout.js';
import { BLOCK_INPUT, PlayScene } from './playScene.js';
import { loadSave, writeSave } from './save.js';
import { ShipScene } from './shipScene.js';

// What every planet she can walk about on has in common: its backdrop, our
// ship parked on the left to walk out of and back into, and remembering
// where she is. `where` is the planet's id (see planetScenes.js).
// Subclasses add their own things, then `addGirl()` last.
export class OutdoorScene extends PlayScene {
  // `fromShip`: she's just walked out of the door (rather than a reload).
  constructor(assets, where, { fromShip = true } = {}) {
    super(assets, where);
    this.backdrop = assets.backdrops[where];
    this.dustColor = this.backdrop.dust;
    this.roam = { minX: 92, maxX: 244 }; // where critters wander: clear of the ship
    this.fromShip = fromShip;
    this.ship = this.add(new ParkedShip(assets));
  }

  addGirl() {
    const save = loadSave();
    const start = this.fromShip ? PARKED_SHIP.spot : clampToFloor(save.bx ?? 90, save.by ?? 134);
    this.girl = this.add(new Girl(this.assets, start.x, start.y, this.look));
  }

  enter() {
    super.enter();
    this.persist();
    if (this.fromShip) {
      this.walkDownRamp();
    }
  }

  persist() {
    writeSave({ ...loadSave(), where: this.where, bx: Math.round(this.girl.x), by: Math.round(this.girl.y) });
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

  draw(r) {
    drawBackdrop(r, this.backdrop, this.engine.time);
    this.drawEntities(r);
    for (const e of this.entities) {
      e.drawOver?.(r);
    }
    this.drawParticles(r);
    this.modal?.draw(r);
    this.drawOverlay(r);
  }
}
