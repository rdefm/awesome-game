import { H, W } from './layout.js';
import { Picker } from './picker.js';
import { LIFT_STOPS, ROOM_NAMES } from './shipRooms.js';

// The lift's panel of floors: one big button per stop, top to bottom. Tap
// one and the panel slides away with it; the floor she's on is marked.
const ROW = 18;
const GAP = 4;
const BUTTON_W = 104;

export class LiftPicker extends Picker {
  // `here`: the stop she's at now.
  constructor(scene, here) {
    const panel = { w: BUTTON_W + 10, h: 18 + LIFT_STOPS.length * (ROW + GAP) };
    panel.x = Math.round((W - panel.w) / 2);
    panel.y = H - panel.h - 3;
    super(scene, panel);
    this.here = here;
    this.stops = LIFT_STOPS;
    this.list = { x: panel.x + 5, y: panel.y + 17 };
  }

  // The button under a point, as { key, where }, if any.
  cellAt(p) {
    const { x, y } = this.list;
    const i = Math.floor((p.y - y) / (ROW + GAP));
    if (p.x < x || p.x > x + BUTTON_W || i < 0 || i >= this.stops.length || p.y - y - i * (ROW + GAP) >= ROW) {
      return null;
    }
    const where = this.stops[i];
    return { key: where, where };
  }

  pick(cell) {
    this.scene.engine.audio.play('select');
    this.result = cell.where;
    this.close();
  }

  draw(r) {
    if (this.show <= 0) {
      return;
    }
    const { dy, list } = this;
    this.drawFrame(r, 'LIFT', '#8fd2ff');
    this.stops.forEach((where, i) => {
      const y = list.y + i * (ROW + GAP) + dy;
      const here = where === this.here;
      r.rect(list.x, y, BUTTON_W, ROW, this.pressed(where) ? '#4b5784' : '#2a3150');
      r.rect(list.x, y, 3, ROW, here ? '#ffe066' : '#64729f');
      const s = this.popScale(where);
      r.image(this.assets.text(ROOM_NAMES[where], here ? '#ffe066' : '#e1e6f2'), list.x + 8, y + ROW / 2 + (this.pressed(where) ? 1 : 0), {
        ax: 0, ay: 0.5, scaleX: s, scaleY: s,
      });
      if (here) {
        r.image(this.assets.text('HERE', '#ffe066'), list.x + BUTTON_W - 4, y + ROW / 2, { ax: 1, ay: 0.5 });
      }
    });
  }
}
