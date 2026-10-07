import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOOK, LOOK_OPTIONS } from './look.js';
import { WardrobePicker } from './wardrobePicker.js';

// Just enough of a ship scene for the picker to work with.
function fakeScene() {
  const scene = {
    look: { ...DEFAULT_LOOK },
    girl: { x: 109, y: 124, act: vi.fn() },
    engine: { audio: { play: vi.fn() } },
    sparkles: vi.fn(),
    saveLook: vi.fn((look) => {
      scene.look = look;
    }),
  };
  return scene;
}

// Middle of the swatch button for this part/option, found by scanning the panel.
function centreOf(picker, part, value) {
  for (let y = 0; y < 160; y++) {
    for (let x = 0; x < 256; x++) {
      const c = picker.cellAt({ x, y });
      if (c?.part === part && c.value === value) {
        return { x: x + 10, y: y + 10 };
      }
    }
  }
  return null;
}

describe('wardrobe picker', () => {
  it('has a button for every option of every part', () => {
    const picker = new WardrobePicker(fakeScene());
    for (const [part, options] of Object.entries(LOOK_OPTIONS)) {
      for (const value of options) {
        expect(centreOf(picker, part, value), `${part} ${value}`).not.toBeNull();
      }
    }
  });

  it('keeps every button on screen', () => {
    const picker = new WardrobePicker(fakeScene());
    for (const [part, options] of Object.entries(LOOK_OPTIONS)) {
      for (const value of options) {
        const p = centreOf(picker, part, value);
        expect(p.x).toBeLessThan(256);
        expect(p.y).toBeLessThan(160);
      }
    }
  });

  it('changes just that part of her look when a button is tapped', () => {
    const scene = fakeScene();
    const picker = new WardrobePicker(scene);
    picker.show = 1;
    const p = centreOf(picker, 'hat', 'crown');
    picker.pointerDown(p);
    picker.pointerUp(p);
    expect(scene.saveLook).toHaveBeenCalledWith({ ...DEFAULT_LOOK, hat: 'crown' });
  });

  it('does not change anything when a press slides off onto another button', () => {
    const scene = fakeScene();
    const picker = new WardrobePicker(scene);
    picker.show = 1;
    picker.pointerDown(centreOf(picker, 'suit', 'pink'));
    picker.pointerUp(centreOf(picker, 'suit', 'green'));
    expect(scene.saveLook).not.toHaveBeenCalled();
  });
});
