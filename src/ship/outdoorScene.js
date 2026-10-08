import { ease } from '../engine/tween.js';
import { drawBackdrop, drawWeather } from './backdrop.js';
import { Girl, clampToFloor } from './entities/girl.js';
import { ParkedShip } from './entities/outdoors.js';
import { PARKED_SHIP, distanceScale } from './layout.js';
import { BLOCK_INPUT, PlayScene } from './playScene.js';
import { loadSave, writeSave } from './save.js';
import { ShipScene } from './shipScene.js';

const PATH_SPEED = 44; // game px per second up a house's path, at full size (slower when far off)

// What every planet she can walk about on has in common: its backdrop, our
// ship parked on the left to walk out of and back into, and remembering
// where she is. `where` is the planet's id (see planetScenes.js). Some
// planets have a house far off at the back to visit (see `addHouse`).
// Subclasses add their own things, then `addGirl()` last.
export class OutdoorScene extends PlayScene {
  // `fromShip`: she's just walked out of the door (rather than a reload).
  // `fromHouse`: she's just come out of the house's front door.
  constructor(assets, where, { fromShip = true, fromHouse = false } = {}) {
    super(assets, where);
    this.backdrop = assets.backdrops[where];
    this.dustColor = this.backdrop.dust;
    this.roam = { minX: 92, maxX: 244 }; // where critters wander: clear of the ship
    this.fromShip = fromShip && !fromHouse;
    this.fromHouse = fromHouse;
    this.ship = this.add(new ParkedShip(assets));
    this.house = null;
  }

  // A house far off at the back (a FarHouse); `inside(opts)` builds the scene
  // for inside it.
  addHouse(house, inside) {
    this.house = this.add(house);
    this.inside = inside;
  }

  addGirl() {
    const save = loadSave();
    const start = this.fromShip ? PARKED_SHIP.spot : clampToFloor(save.bx ?? 90, save.by ?? 134);
    this.girl = this.add(new Girl(this.assets, start.x, start.y, this.look));
    if (this.fromHouse) {
      const { layout } = this.house;
      const door = layout.path.at(-1);
      Object.assign(this.girl, { x: door.x, y: door.y, scale: distanceScale(door.y, layout), alpha: 0 });
    }
  }

  enter() {
    super.enter();
    this.persist();
    if (this.fromShip) {
      this.walkDownRamp();
    }
    if (this.fromHouse) {
      this.walkOutOfHouse();
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

  // Walks her along `points` (off the usual floor, so not with walkTo),
  // shrinking or growing with the distance up the house's path as she goes.
  async walkPath(points) {
    const { engine, girl, house } = this;
    girl.mode = 'walk';
    girl.pose = null;
    for (const p of points) {
      girl.faceToward(p.x);
      const scale = distanceScale(p.y, house.layout);
      const dist = Math.hypot(p.x - girl.x, p.y - girl.y);
      const speed = PATH_SPEED * (girl.scale + scale) / 2;
      await engine.tweens.to(girl, { x: p.x, y: p.y, scale }, dist / speed, ease.linear);
    }
    girl.mode = 'idle';
  }

  // She's at the near end of the house's path: up the path to the door,
  // which opens, and in she goes.
  async enterHouse() {
    const { engine, girl, house } = this;
    if (this.busy) {
      return;
    }
    this.busy = true;
    this.modal = BLOCK_INPUT;
    girl.say('heart', 1);
    await this.walkPath(house.layout.path.slice(1));
    house.open = true;
    engine.audio.play('creak');
    await engine.wait(0.25);
    engine.tweens.to(girl, { y: girl.y - 2 }, 0.4);
    await engine.tweens.to(girl, { alpha: 0 }, 0.4);
    await this.leaveTo(() => this.inside({ fromDoor: true }));
  }

  // Out of the door and back down the path, growing as she comes nearer.
  async walkOutOfHouse() {
    const { engine, girl, house } = this;
    await this.scripted(async () => {
      house.open = true;
      await engine.tweens.to(girl, { alpha: 1 }, 0.4);
      engine.audio.play('creak');
      house.open = false;
      await this.walkPath([...house.layout.path].reverse().slice(1));
    });
    girl.scale = 1;
    this.persist();
    girl.say('heart');
  }

  draw(r) {
    drawBackdrop(r, this.backdrop, this.engine.time);
    this.drawEntities(r);
    for (const e of this.entities) {
      e.drawOver?.(r);
    }
    this.drawParticles(r);
    drawWeather(r, this.backdrop, this.engine.time);
    this.modal?.draw(r);
    this.drawOverlay(r);
  }
}
