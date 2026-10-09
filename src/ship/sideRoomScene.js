import { Girl, clampToFloor } from './entities/girl.js';
import { addRoomArrows, startBeyondWall, walkIn } from './entities/roomArrow.js';
import { WALK } from './layout.js';
import { PlayScene } from './playScene.js';
import { loadSave, writeSave } from './save.js';

// One of the ship's rooms either side of the cockpit (see shipRooms.js): a
// painted room of its own, an arrow back through the wall, and whatever's
// been left lying in it.
export class SideRoomScene extends PlayScene {
  // `room`: its painted walls and floor. `enter`: she's just come through
  // the wall on `enter.side` (rather than a reload). `fromLift`: she's just
  // come up or down in its lift (which it must have, as `this.lift`).
  constructor(assets, where, room, { enter = null, fromLift = false } = {}) {
    super(assets, where);
    this.room = room;
    this.entering = enter;
    this.fromLift = fromLift;
    this.hasWall = true; // for hanging wall decor on
    this.tune = 'cosy';
  }

  // Adds the arrows, what's lying about, and her. Call once the room's own
  // things are in.
  addGirl() {
    this.addPlaced();
    addRoomArrows(this);
    const save = loadSave();
    const start = this.fromLift ? { x: this.lift.x, y: WALK.minY }
      : this.entering ? startBeyondWall(this.entering) : clampToFloor(save.rx ?? 128, save.ry ?? 136);
    this.girl = this.add(new Girl(this.assets, start.x, start.y, this.look));
  }

  enter() {
    super.enter();
    this.persist();
    if (this.entering) {
      walkIn(this, this.entering);
    }
    if (this.fromLift) {
      this.lift.arrive();
    }
  }

  persist() {
    const { x, y } = clampToFloor(this.girl.x, this.girl.y);
    writeSave({ ...loadSave(), where: this.where, rx: Math.round(x), ry: Math.round(y) });
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
