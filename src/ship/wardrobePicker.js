import { ease } from '../engine/tween.js';
import { H } from './layout.js';
import { LOOK_OPTIONS, restyle } from './look.js';

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
const CLOSE = { x: PANEL.x + PANEL.w - 15, y: PANEL.y + 3, s: 11 };

// While open it's the scene's modal, so it gets every tap.
export class WardrobePicker {
  constructor(scene) {
    this.scene = scene;
    this.show = 0; // slide, 0..1
    this.closing = false;
    this.press = null;
    this.pop = null; // the button just picked, for a little bounce
  }

  get assets() {
    return this.scene.assets;
  }

  // Slides up; resolves once it has been closed again.
  open() {
    this.closing = false;
    this.prevModal = this.scene.modal;
    this.scene.modal = this;
    this.scene.engine.audio.play('open');
    this.scene.engine.tweens.to(this, { show: 1 }, 0.3, ease.outBack);
    return new Promise((resolve) => {
      this.done = resolve;
    });
  }

  async close() {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.press = null;
    this.scene.engine.audio.play('close');
    await this.scene.engine.tweens.to(this, { show: 0 }, 0.18, ease.inQuad);
    this.scene.modal = this.prevModal;
    this.done();
  }

  // The button under a point, as { part, value, row, col }, if any.
  cellAt(p) {
    const row = Math.floor((p.y - GRID.y) / ROW_H);
    const col = Math.floor((p.x - GRID.x + GAP / 2) / (CELL + GAP));
    const part = ROWS[row];
    const value = LOOK_OPTIONS[part]?.[col];
    return value ? { part, value, row, col } : null;
  }

  pointerDown(p) {
    this.press = this.show > 0.9 && !this.closing ? { cell: this.cellAt(p), start: p } : null;
  }

  pointerUp(p) {
    const press = this.press;
    this.press = null;
    if (this.closing || this.show < 0.9) {
      return;
    }
    const cell = this.cellAt(p);
    if (press?.cell && cell && cell.part === press.cell.part && cell.value === press.cell.value) {
      this.pick(cell);
      return;
    }
    const inPanel = p.x >= PANEL.x && p.x <= PANEL.x + PANEL.w && p.y >= PANEL.y && p.y <= PANEL.y + PANEL.h;
    const onClose = Math.abs(p.x - (CLOSE.x + CLOSE.s / 2)) < 12 && Math.abs(p.y - (CLOSE.y + CLOSE.s / 2)) < 12;
    if (onClose || !inPanel) {
      this.close();
    }
  }

  pick(cell) {
    const { scene } = this;
    const { engine, girl } = scene;
    this.pop = { ...cell, t: 1 };
    if (scene.look[cell.part] === cell.value) {
      engine.audio.play('boop');
      return;
    }
    scene.saveLook(restyle(scene.look, cell.part, cell.value));
    engine.audio.play('select');
    scene.sparkles(girl.x, girl.y - 16, 6);
    girl.act('cheer', 0.6);
  }

  update(dt) {
    if (this.pop) {
      this.pop.t -= dt * 4;
      if (this.pop.t <= 0) {
        this.pop = null;
      }
    }
  }

  draw(r) {
    if (this.show <= 0) {
      return;
    }
    const t = this.scene.engine.time;
    const dy = (1 - this.show) * (PANEL.h + 6);
    r.rect(PANEL.x, PANEL.y + dy, PANEL.w, PANEL.h, '#1b1427', 0.92);
    r.rect(PANEL.x, PANEL.y + dy, PANEL.w, 1, '#64729f');
    r.rect(PANEL.x, PANEL.y + dy, 1, PANEL.h, '#64729f');
    r.rect(PANEL.x + PANEL.w - 1, PANEL.y + dy, 1, PANEL.h, '#64729f');
    r.image(this.assets.text('WARDROBE', '#ff8fc8'), PANEL.x + 5, PANEL.y + dy + 5, { ax: 0, ay: 0 });
    // Close button.
    r.rect(CLOSE.x, CLOSE.y + dy, CLOSE.s, CLOSE.s, '#b8323f');
    r.image(this.assets.text('X', '#ffffff'), CLOSE.x + CLOSE.s / 2 + 0.5, CLOSE.y + dy + 8, { ay: 1 });

    const look = this.scene.look;
    ROWS.forEach((part, row) => {
      LOOK_OPTIONS[part].forEach((value, col) => {
        const x = GRID.x + col * (CELL + GAP);
        const y = GRID.y + row * ROW_H + dy;
        const worn = look[part] === value;
        const pressed = this.press?.cell?.part === part && this.press.cell.value === value;
        r.rect(x, y, CELL, CELL, pressed ? '#4b5784' : '#2a3150');
        if (worn) {
          // A gently pulsing gold frame around what she's wearing.
          const a = 0.75 + 0.25 * Math.sin(t * 5);
          r.rect(x, y, CELL, 2, '#ffe066', a);
          r.rect(x, y + CELL - 2, CELL, 2, '#ffe066', a);
          r.rect(x, y, 2, CELL, '#ffe066', a);
          r.rect(x + CELL - 2, y, 2, CELL, '#ffe066', a);
        }
        const icon = part === 'hat' ? this.assets.swatches.hat[look.hair][value] : this.assets.swatches[part][value];
        const popped = this.pop?.part === part && this.pop.value === value;
        const s = popped ? 1 + Math.sin(this.pop.t * Math.PI) * 0.2 : 1;
        r.image(icon, x + CELL / 2, y + CELL / 2 + (pressed ? 1 : 0), { ay: 0.5, scaleX: s, scaleY: s });
      });
    });
  }
}
