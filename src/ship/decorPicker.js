import { DECOR } from './decor.js';
import { MAX_COPIES, canPrint } from './entities/decor.js';
import { iconFor } from './kinds.js';
import { H, W } from './layout.js';
import { Picker } from './picker.js';
import { countKind } from './world.js';

// The decor printer's panel: one big button per piece, in rows. Tap one and
// the panel slides away and it's printed. A row of pips under each says how
// many more of it there's room for; once there's none left it's greyed out.
const CELL = 28;
const GAP = 4;
const COLS = 5;
const ROW_PITCH = CELL + 9; // a button and its pips
const ROWS = Math.ceil(DECOR.length / COLS);
const PANEL = { w: 6 + COLS * CELL + (COLS - 1) * GAP, h: 16 + ROWS * ROW_PITCH };
PANEL.x = W - 4 - PANEL.w;
PANEL.y = H - PANEL.h - 3;
const GRID = { x: PANEL.x + 3, y: PANEL.y + 16 };
const ICON = CELL - 6; // the biggest a piece's picture is shown

export class DecorPicker extends Picker {
  constructor(scene) {
    super(scene, PANEL);
  }

  // The button under a point, as { key, kind }, if any.
  cellAt(p) {
    const row = Math.floor((p.y - GRID.y) / ROW_PITCH);
    if (row < 0 || p.y - GRID.y - row * ROW_PITCH >= CELL) {
      return null;
    }
    const col = Math.floor((p.x - GRID.x + GAP / 2) / (CELL + GAP));
    if (col < 0 || col >= COLS) {
      return null;
    }
    const kind = DECOR[row * COLS + col];
    return kind ? { key: kind, kind } : null;
  }

  pick(cell) {
    const { scene } = this;
    if (!canPrint(scene.world, cell.kind)) {
      scene.engine.audio.play('denied');
      return;
    }
    scene.engine.audio.play('select');
    this.result = cell.kind;
    this.close();
  }

  draw(r) {
    if (this.show <= 0) {
      return;
    }
    const { dy, scene } = this;
    this.drawFrame(r, 'DECOR', '#7cf28a');
    DECOR.forEach((kind, i) => {
      const x = GRID.x + (i % COLS) * (CELL + GAP);
      const y = GRID.y + Math.floor(i / COLS) * ROW_PITCH + dy;
      this.drawButton(r, x, y, CELL, kind);
      const left = MAX_COPIES - countKind(scene.world, kind);
      this.drawIcon(r, iconFor(this.assets, { kind }), kind, x, y, this.popScale(kind), left > 0 ? 1 : 0.35);
      for (let n = 0; n < MAX_COPIES; n++) {
        r.rect(x + CELL / 2 - MAX_COPIES * 2 + n * 4 + 1, y + CELL + 3, 2, 2, n < left ? '#7cf28a' : '#4b5784');
      }
    });
  }

  // A piece's picture, centred on its button.
  drawIcon(r, icon, kind, x, y, scale, alpha) {
    const s = scale * Math.min(1, ICON / icon.width, ICON / icon.height);
    r.image(icon, x + CELL / 2, y + CELL / 2 + (this.pressed(kind) ? 1 : 0), {
      ay: 0.5, scaleX: s, scaleY: s, alpha,
    });
  }
}
