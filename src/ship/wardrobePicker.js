import { H } from './layout.js';
import { LOOK_OPTIONS, restyle } from './look.js';
import { Picker } from './picker.js';

// A chunky panel that slides up beside the open wardrobe: one row of big
// buttons each for hair colour, suit colour and hat. Every tap changes her on
// the spot. Sits to the right of the lockers so she stays in view.
const ROWS = ['hair', 'suit', 'hat'];
const CELL = 22; // swatch button size
const GAP = 2;
const ROW_H = CELL + 3;
const PANEL = { x: 130, w: 124, h: 16 + ROWS.length * ROW_H + 3 };
PANEL.y = H - PANEL.h - 3;
const GRID = { x: PANEL.x + 3, y: PANEL.y + 16 };

export class WardrobePicker extends Picker {
  constructor(scene) {
    super(scene, PANEL);
  }

  // The button under a point, as { key, part, value, row, col }, if any.
  cellAt(p) {
    const row = Math.floor((p.y - GRID.y) / ROW_H);
    const col = Math.floor((p.x - GRID.x + GAP / 2) / (CELL + GAP));
    const part = ROWS[row];
    const value = LOOK_OPTIONS[part]?.[col];
    return value ? { key: `${part}:${value}`, part, value, row, col } : null;
  }

  pick(cell) {
    const { scene } = this;
    const { engine, girl } = scene;
    if (scene.look[cell.part] === cell.value) {
      engine.audio.play('boop');
      return;
    }
    scene.saveLook(restyle(scene.look, cell.part, cell.value));
    engine.audio.play('select');
    scene.sparkles(girl.x, girl.y - 16, 6);
    girl.act('cheer', 0.6);
  }

  draw(r) {
    if (this.show <= 0) {
      return;
    }
    const { dy } = this;
    this.drawFrame(r, 'WARDROBE', '#ff8fc8');
    const look = this.scene.look;
    ROWS.forEach((part, row) => {
      LOOK_OPTIONS[part].forEach((value, col) => {
        const key = `${part}:${value}`;
        const x = GRID.x + col * (CELL + GAP);
        const y = GRID.y + row * ROW_H + dy;
        // Framed in gold: what she's wearing.
        this.drawButton(r, x, y, CELL, key, look[part] === value);
        const icon = part === 'hat' ? this.assets.swatches.hat[look.hair][value] : this.assets.swatches[part][value];
        const s = this.popScale(key);
        r.image(icon, x + CELL / 2, y + CELL / 2 + (this.pressed(key) ? 1 : 0), { ay: 0.5, scaleX: s, scaleY: s });
      });
    });
  }
}
