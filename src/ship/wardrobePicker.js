import { H } from './layout.js';
import { LOOK_OPTIONS, restyle } from './look.js';
import { Picker } from './picker.js';

// A chunky panel that slides up beside the open wardrobe: one row of big
// buttons each for hair colour, suit colour and hat. Every tap changes her on
// the spot. Sits to the right of the lockers so she stays in view.
// Opened for a friend dropped on the wardrobe, it's just the hats row, and
// they go on that friend instead.
const ROWS = ['hair', 'suit', 'hat'];
const FRIEND_ROWS = ['hat'];
const CELL = 22; // swatch button size
const GAP = 2;
const ROW_H = CELL + 3;

export class WardrobePicker extends Picker {
  constructor(scene, rows = ROWS) {
    const panel = { x: 130, w: 124, h: 16 + rows.length * ROW_H + 3 };
    panel.y = H - panel.h - 3;
    super(scene, panel);
    this.rows = rows;
    this.grid = { x: panel.x + 3, y: panel.y + 16 };
    this.friend = null; // whose hat it's choosing, if not hers
  }

  // The picker for dressing a friend.
  static forFriends(scene) {
    return new WardrobePicker(scene, FRIEND_ROWS);
  }

  // Slides up for `friend` (or for her, if none).
  open(friend = null) {
    this.friend = friend;
    return super.open();
  }

  // What's being worn right now by whoever is being dressed.
  get wearing() {
    return this.friend ?? this.scene.look;
  }

  // The button under a point, as { key, part, value, row, col }, if any.
  cellAt(p) {
    const { grid } = this;
    const row = Math.floor((p.y - grid.y) / ROW_H);
    const col = Math.floor((p.x - grid.x + GAP / 2) / (CELL + GAP));
    const part = this.rows[row];
    const value = LOOK_OPTIONS[part]?.[col];
    return value ? { key: `${part}:${value}`, part, value, row, col } : null;
  }

  pick(cell) {
    const { scene } = this;
    const { engine, girl } = scene;
    const { friend } = this;
    if (this.wearing[cell.part] === cell.value) {
      engine.audio.play('boop');
      return;
    }
    engine.audio.play('select');
    if (friend) {
      // It pops onto its head with a little hop.
      scene.saveHat(friend, cell.value);
      scene.sparkles(friend.x, friend.y - 18, 6);
      friend.boing?.(0.8);
      friend.pose?.('hop');
      return;
    }
    scene.saveLook(restyle(scene.look, cell.part, cell.value));
    scene.sparkles(girl.x, girl.y - 16, 6);
    girl.act('cheer', 0.6);
  }

  draw(r) {
    if (this.show <= 0) {
      return;
    }
    const { dy } = this;
    this.drawFrame(r, this.friend ? 'HATS' : 'WARDROBE', '#ff8fc8');
    const look = this.scene.look;
    const worn = this.wearing;
    const { grid } = this;
    this.rows.forEach((part, row) => {
      LOOK_OPTIONS[part].forEach((value, col) => {
        const key = `${part}:${value}`;
        const x = grid.x + col * (CELL + GAP);
        const y = grid.y + row * ROW_H + dy;
        // Framed in gold: what she's (or the friend's) wearing.
        this.drawButton(r, x, y, CELL, key, worn[part] === value);
        const icon = part === 'hat' ? this.assets.swatches.hat[look.hair][value] : this.assets.swatches[part][value];
        const s = this.popScale(key);
        r.image(icon, x + CELL / 2, y + CELL / 2 + (this.pressed(key) ? 1 : 0), { ay: 0.5, scaleX: s, scaleY: s });
      });
    });
  }
}
