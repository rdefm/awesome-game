import { CREW_BODIES } from './art/crew.js';
import { CREW_OPTIONS, DEFAULT_CREW, reshape } from './crew.js';
import { dress } from './friendHats.js';
import { H } from './layout.js';
import { Picker } from './picker.js';

// The crew pod's creator, Avatar World style: a row of big buttons each for
// body colour, eyes, ears and hat, with the crewmate itself beside them
// changing on the spot as she taps. "DONE" hands back what she's made (and
// the pod hatches it); the X cancels. Sits on the left, clear of the pod.
const ROWS = ['body', 'eyes', 'ears', 'hat'];
const CELL = 20; // button size
const GAP = 2;
const ROW_H = CELL + 3;
const GRID_W = 6 * CELL + 5 * GAP;
const PANEL = { x: 4, w: GRID_W + 3 + 3 + 3 + 52, h: 16 + ROWS.length * ROW_H + 3 };
PANEL.y = H - PANEL.h - 3;
const GRID = { x: PANEL.x + 3, y: PANEL.y + 16 };
// The crewmate's showing, drawn at twice its size, and the DONE button under it.
const SHOW = { x: GRID.x + GRID_W + 5, y: GRID.y, w: 46 };
const DONE = { x: SHOW.x, y: GRID.y + ROWS.length * ROW_H - 21, w: SHOW.w, h: 20 };
const SCALE = 1.5;

export class CrewPicker extends Picker {
  constructor(scene) {
    super(scene, PANEL);
    this.crew = { ...DEFAULT_CREW };
  }

  // Slides up with a fresh crewmate to make; resolves with { body, eyes, ears,
  // hat } once it's done, or null if she backed out.
  open() {
    this.crew = { ...DEFAULT_CREW };
    return super.open();
  }

  // The button under a point, as { key, part, value } (or { key: 'done' }), if any.
  cellAt(p) {
    if (p.x >= DONE.x && p.x <= DONE.x + DONE.w && p.y >= DONE.y && p.y <= DONE.y + DONE.h) {
      return { key: 'done' };
    }
    const row = Math.floor((p.y - GRID.y) / ROW_H);
    if (row < 0 || p.y - GRID.y - row * ROW_H >= CELL) {
      return null;
    }
    const col = Math.floor((p.x - GRID.x + GAP / 2) / (CELL + GAP));
    const part = ROWS[row];
    const value = CREW_OPTIONS[part]?.[col];
    return value ? { key: `${part}:${value}`, part, value } : null;
  }

  pick(cell) {
    const { scene } = this;
    if (cell.key === 'done') {
      scene.engine.audio.play('select');
      this.result = { ...this.crew };
      this.close();
      return;
    }
    if (this.crew[cell.part] === cell.value) {
      scene.engine.audio.play('boop');
      return;
    }
    this.crew = cell.part === 'hat' ? { ...this.crew, hat: cell.value } : reshape(this.crew, cell.part, cell.value);
    scene.engine.audio.play('select');
    this.hop = 1; // the crewmate bounces with every change
  }

  update(dt) {
    super.update(dt);
    this.hop = Math.max(0, (this.hop ?? 0) - dt * 3);
  }

  // The picture on a button.
  icon(part, value) {
    const { crewSwatches, swatches } = this.assets;
    if (part === 'ears') {
      return crewSwatches.ears[this.crew.body][value];
    }
    if (part === 'hat') {
      return swatches.hat[this.scene.look.hair][value];
    }
    return crewSwatches[part][value];
  }

  draw(r) {
    if (this.show <= 0) {
      return;
    }
    const { dy, assets } = this;
    this.drawFrame(r, 'NEW CREWMATE', '#5fd9a8');
    ROWS.forEach((part, row) => {
      CREW_OPTIONS[part].forEach((value, col) => {
        const key = `${part}:${value}`;
        const x = GRID.x + col * (CELL + GAP);
        const y = GRID.y + row * ROW_H + dy;
        this.drawButton(r, x, y, CELL, key, this.crew[part] === value);
        const icon = this.icon(part, value);
        const k = Math.min(1, (CELL - 4) / icon.width, (CELL - 4) / icon.height);
        const s = this.popScale(key) * k;
        r.image(icon, x + CELL / 2, y + CELL / 2 + (this.pressed(key) ? 1 : 0), { ay: 0.5, scaleX: s, scaleY: s });
      });
    });
    // The crewmate itself, on a little pad, bobbing and blinking.
    const t = this.scene.engine.time;
    r.rect(SHOW.x, SHOW.y + dy, SHOW.w, ROWS.length * ROW_H - 26, '#2a3150');
    const frames = assets.crewFrames(this.crew);
    const frame = this.hop > 0 ? 'hop' : Math.floor(t * 0.7) % 4 === 3 && t % 1 < 0.3 ? 'blink' : 'idle';
    const img = dress(frames[frame], 'crew', this.crew.hat, assets.hats[this.crew.hat]);
    const lift = this.hop > 0 ? Math.sin(this.hop * Math.PI) * 6 : 0;
    r.rect(SHOW.x + SHOW.w / 2 - 12, SHOW.y + ROWS.length * ROW_H - 29 + dy, 24, 2, '#000000', 0.3);
    r.image(img, SHOW.x + SHOW.w / 2, SHOW.y + ROWS.length * ROW_H - 28 + dy - lift, { scaleX: SCALE, scaleY: SCALE });
    // DONE.
    const on = this.pressed('done');
    r.rect(DONE.x, DONE.y + dy, DONE.w, DONE.h, on ? '#3a9a4a' : '#5fd96e');
    r.rect(DONE.x, DONE.y + dy + DONE.h - 2, DONE.w, 2, '#2f9e57');
    r.image(assets.text('DONE', '#1b1427'), DONE.x + DONE.w / 2, DONE.y + dy + DONE.h / 2 + (on ? 1 : 0), { ay: 0.5 });
  }
}
