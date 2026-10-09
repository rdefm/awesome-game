import { describe, expect, it, vi } from 'vitest';
import { LiftPicker } from './liftPicker.js';
import { LIFT_STOPS } from './shipRooms.js';

// Just enough of a room with a lift for the picker to work with.
function fakeScene() {
  return { modal: null, engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()) } } };
}

// Middle of the button for this stop, found by scanning the screen.
function centreOf(picker, where) {
  for (let y = 0; y < 160; y++) {
    for (let x = 0; x < 256; x++) {
      if (picker.cellAt({ x, y })?.where === where) {
        return { x: x + 8, y: y + 6 };
      }
    }
  }
  return null;
}

function tap(picker, p) {
  picker.pointerDown(p);
  picker.pointerUp(p);
}

describe('lift picker', () => {
  it('has a button for every stop, all on screen', () => {
    const picker = new LiftPicker(fakeScene(), 'storeroom');
    for (const where of LIFT_STOPS) {
      const p = centreOf(picker, where);
      expect(p, where).not.toBeNull();
      expect(p.y).toBeLessThan(160);
    }
  });

  it('closes with the floor that was tapped', async () => {
    const scene = fakeScene();
    const picker = new LiftPicker(scene, 'storeroom');
    const picked = picker.open();
    picker.show = 1;
    tap(picker, centreOf(picker, 'bunkroom'));
    await expect(picked).resolves.toBe('bunkroom');
    expect(scene.modal).toBeNull();
  });

  it('closes with nothing when tapped outside', async () => {
    const picker = new LiftPicker(fakeScene(), 'storeroom');
    const picked = picker.open();
    picker.show = 1;
    tap(picker, { x: 5, y: 5 });
    await expect(picked).resolves.toBeNull();
  });
});
