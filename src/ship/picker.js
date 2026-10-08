import { ease } from '../engine/tween.js';

// A chunky panel of big buttons that slides up from the bottom of the screen
// (the wardrobe's, the decor printer's). While open it's the scene's modal,
// so it gets every tap. Subclasses say where the buttons are (`cellAt(p)`,
// giving each a unique `key`), what tapping one does (`pick(cell)`), and draw
// the buttons over `drawFrame()`.
export class Picker {
  // `panel`: { x, y, w, h } on screen.
  constructor(scene, panel) {
    this.scene = scene;
    this.panel = panel;
    this.closeBox = { x: panel.x + panel.w - 15, y: panel.y + 3, s: 11 };
    this.show = 0; // slide, 0..1
    this.closing = false;
    this.press = null;
    this.pop = null; // { key, t }: the button just picked, for a little bounce
    this.result = null; // what `open()` resolves with
  }

  get assets() {
    return this.scene.assets;
  }

  // Slides up; resolves (with `result`) once it has been closed again.
  open() {
    this.closing = false;
    this.result = null;
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
    this.done(this.result);
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
    if (press?.cell && cell && cell.key === press.cell.key) {
      this.pop = { key: cell.key, t: 1 };
      this.pick(cell);
      return;
    }
    const { panel, closeBox } = this;
    const inPanel = p.x >= panel.x && p.x <= panel.x + panel.w && p.y >= panel.y && p.y <= panel.y + panel.h;
    const onClose = Math.abs(p.x - (closeBox.x + closeBox.s / 2)) < 12 && Math.abs(p.y - (closeBox.y + closeBox.s / 2)) < 12;
    if (onClose || !inPanel) {
      this.close();
    }
  }

  // Is the button with this key being pressed right now?
  pressed(key) {
    return this.press?.cell?.key === key;
  }

  // How big the button with this key's picture is: a bounce just after it's picked.
  popScale(key) {
    return this.pop?.key === key ? 1 + Math.sin(this.pop.t * Math.PI) * 0.2 : 1;
  }

  update(dt) {
    if (this.pop) {
      this.pop.t -= dt * 4;
      if (this.pop.t <= 0) {
        this.pop = null;
      }
    }
  }

  // How far down it's slid (0 once fully open), for drawing everything on it.
  get dy() {
    return (1 - this.show) * (this.panel.h + 6);
  }

  // The panel, its title and the close button.
  drawFrame(r, title, color) {
    const { panel, closeBox, dy } = this;
    r.rect(panel.x, panel.y + dy, panel.w, panel.h, '#1b1427', 0.92);
    r.rect(panel.x, panel.y + dy, panel.w, 1, '#64729f');
    r.rect(panel.x, panel.y + dy, 1, panel.h, '#64729f');
    r.rect(panel.x + panel.w - 1, panel.y + dy, 1, panel.h, '#64729f');
    r.image(this.assets.text(title, color), panel.x + 5, panel.y + dy + 5, { ax: 0, ay: 0 });
    r.rect(closeBox.x, closeBox.y + dy, closeBox.s, closeBox.s, '#b8323f');
    r.image(this.assets.text('X', '#ffffff'), closeBox.x + closeBox.s / 2 + 0.5, closeBox.y + dy + 8, { ay: 1 });
  }

  // A button's square, with a gently pulsing gold frame if it's `lit`.
  drawButton(r, x, y, size, key, lit) {
    r.rect(x, y, size, size, this.pressed(key) ? '#4b5784' : '#2a3150');
    if (lit) {
      const a = 0.75 + 0.25 * Math.sin(this.scene.engine.time * 5);
      r.rect(x, y, size, 2, '#ffe066', a);
      r.rect(x, y + size - 2, size, 2, '#ffe066', a);
      r.rect(x, y, 2, size, '#ffe066', a);
      r.rect(x + size - 2, y, 2, size, '#ffe066', a);
    }
  }
}
