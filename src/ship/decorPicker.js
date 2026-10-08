import { DECOR, MAX_COPIES, canPrint } from './entities/decor.js';
import { iconFor } from './kinds.js';
import { H, W } from './layout.js';
import { Picker } from './picker.js';
import { countKind } from './world.js';

// The decor printer's panel: one big button per piece. Tap one and the panel
// slides away and it's printed. A row of pips under each says how many more
// of it there's room for; once there's none left it's greyed out.
const CELL = 28;
const GAP = 4;
const PANEL = { w: 6 + DECOR.length * CELL + (DECOR.length - 1) * GAP, h: 16 + CELL + 9 };
PANEL.x = W - 4 - PANEL.w;
PANEL.y = H - PANEL.h - 3;
const ROW = { x: PANEL.x + 3, y: PANEL.y + 16 };
const ICON = CELL - 6; // the biggest a piece's picture is shown

export class DecorPicker extends Picker {
  constructor(scene) {
    super(scene, PANEL);
  }

  // The button under a point, as { key, kind }, if any.
  cellAt(p) {
    if (p.y < ROW.y || p.y >= ROW.y + CELL) {
      return null;
    }
    const col = Math.floor((p.x - ROW.x + GAP / 2) / (CELL + GAP));
    const kind = DECOR[col];
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
    const { dy } = this;
    this.drawFrame(r, 'DECOR', '#7cf28a');
    DECOR.forEach((kind, col) => {
      const x = ROW.x + col * (CELL + GAP);
      const y = ROW.y + dy;
      const left = MAX_COPIES - countKind(this.scene.world, kind);
      this.drawButton(r, x, y, CELL, kind, false);
      const icon = iconFor(this.assets, { kind });
      const s = this.popScale(kind) * Math.min(1, ICON / icon.width, ICON / icon.height);
      r.image(icon, x + CELL / 2, y + CELL / 2 + (this.pressed(kind) ? 1 : 0), {
        ay: 0.5, scaleX: s, scaleY: s, alpha: left > 0 ? 1 : 0.35,
      });
      for (let i = 0; i < MAX_COPIES; i++) {
        r.rect(x + CELL / 2 - MAX_COPIES * 2 + i * 4 + 1, y + CELL + 3, 2, 2, i < left ? '#7cf28a' : '#4b5784');
      }
    });
  }
}
