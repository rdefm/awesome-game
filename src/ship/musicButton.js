import { W } from './layout.js';
import { loadSave, writeSave } from './save.js';

// A small music on/off button tucked in the top-right corner, out of the
// way but findable by a parent. Owned by PlayScene, which gives it first look
// at presses (like the bag).
const BTN = { x: W - 15, y: 2, w: 13, h: 13 };

export class MusicButton {
  constructor(scene) {
    this.scene = scene;
  }

  get visible() {
    return !this.scene.modal;
  }

  hitTest(p) {
    const pad = 3; // generous, for wobbly fingers
    return this.visible && p.x >= BTN.x - pad && p.x <= BTN.x + BTN.w + pad && p.y >= BTN.y - pad && p.y <= BTN.y + BTN.h + pad;
  }

  toggle() {
    const { music, audio } = this.scene.engine;
    music.setEnabled(!music.enabled);
    writeSave({ ...loadSave(), music: music.enabled });
    audio.play('tap');
  }

  draw(r) {
    if (!this.visible) {
      return;
    }
    const on = this.scene.engine.music.enabled;
    const { x, y } = BTN;
    const ink = on ? '#ffe066' : '#9aa3c2';
    r.rect(x, y, BTN.w, BTN.h, '#1b1427', 0.35);
    // A quaver: head, stem and flag.
    r.rect(x + 3, y + 8, 4, 3, ink);
    r.rect(x + 6, y + 2, 1, 7, ink);
    r.rect(x + 7, y + 2, 3, 1, ink);
    r.rect(x + 9, y + 3, 1, 2, ink);
    if (!on) {
      for (let i = 0; i < 11; i++) {
        r.rect(x + 1 + i, y + 11 - i, 2, 1, '#ff6b6b');
      }
    }
  }
}
