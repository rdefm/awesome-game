import { Girl, clampToFloor } from './entities/girl.js';
import { HouseDoor } from './entities/house.js';
import { HOUSE_DOOR } from './layout.js';
import { BLOCK_INPUT, PlayScene } from './playScene.js';
import { loadSave, writeSave } from './save.js';

// What every house she can go inside on a planet has in common (the
// gingerbread house, the lava family's house): its room, the front door on
// the left wall to go back out of, and remembering where she is. `where` is
// the house's place name (see planetScenes.js); `outside()` builds the
// planet scene she comes out into. Subclasses add their own things, then
// `addGirl()` last.
export class IndoorScene extends PlayScene {
  // `fromDoor`: she's just walked in from outside (rather than a reload).
  constructor(assets, where, { room, door, dust, outside, fromDoor = false }) {
    super(assets, where);
    this.room = room;
    this.dustColor = dust;
    this.outside = outside;
    this.fromDoor = fromDoor;
    this.door = this.add(new HouseDoor(door));
  }

  addGirl() {
    const save = loadSave();
    const start = this.fromDoor ? HOUSE_DOOR.spot : clampToFloor(save.bx ?? 128, save.by ?? 136);
    this.girl = this.add(new Girl(this.assets, start.x, start.y, this.look));
  }

  enter() {
    super.enter();
    this.persist();
    if (this.fromDoor) {
      this.walkInFromDoor();
    }
  }

  persist() {
    writeSave({ ...loadSave(), where: this.where, bx: Math.round(this.girl.x), by: Math.round(this.girl.y) });
  }

  async walkInFromDoor() {
    const { engine, girl, door } = this;
    this.busy = true;
    door.open = 1;
    girl.alpha = 0;
    girl.facing = 1;
    await engine.tweens.to(girl, { alpha: 1 }, 0.4);
    this.busy = false;
    girl.walkTo(HOUSE_DOOR.spot.x + 26, HOUSE_DOOR.spot.y + 4);
    await door.swing(0);
  }

  async leaveHouse() {
    const { engine, girl, door } = this;
    if (this.busy) {
      return;
    }
    this.busy = true;
    this.modal = BLOCK_INPUT;
    girl.faceToward(HOUSE_DOOR.x);
    await door.swing(1);
    girl.say('heart', 1);
    engine.tweens.to(girl, { y: HOUSE_DOOR.spot.y - 6 }, 0.5);
    await engine.tweens.to(girl, { alpha: 0 }, 0.5);
    await this.leaveTo(() => this.outside());
  }

  draw(r) {
    r.image(this.room, 0, 0, { ax: 0, ay: 0 });
    this.drawEntities(r);
    for (const e of this.entities) {
      e.drawOver?.(r);
    }
    this.drawParticles(r);
    this.modal?.draw(r);
    this.drawOverlay(r);
  }
}
