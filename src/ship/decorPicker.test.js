import { describe, expect, it, vi } from 'vitest';
import { DECOR, STARTERS, normalizeDecor, seen, unlock } from './decor.js';
import { DecorPicker } from './decorPicker.js';
import { MAX_COPIES } from './entities/decor.js';
import { add, defaultWorld } from './world.js';

const locked = DECOR.find((kind) => !STARTERS.includes(kind));

// Just enough of the store room for the picker to work with.
function fakeScene(world = defaultWorld(), decor = normalizeDecor(undefined)) {
  const scene = {
    world,
    decor,
    modal: null,
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()) } },
    sawNewDecor: vi.fn(() => {
      scene.decor = seen(scene.decor);
    }),
  };
  return scene;
}

// Middle of the button for this piece, found by scanning the screen.
function centreOf(picker, kind) {
  for (let y = 0; y < 160; y++) {
    for (let x = 0; x < 256; x++) {
      if (picker.cellAt({ x, y })?.kind === kind) {
        return { x: x + 8, y: y + 8 };
      }
    }
  }
  return null;
}

function tap(picker, p) {
  picker.pointerDown(p);
  picker.pointerUp(p);
}

describe('decor picker', () => {
  it('has a button for every decor piece, all on screen', () => {
    const picker = new DecorPicker(fakeScene());
    for (const kind of DECOR) {
      const p = centreOf(picker, kind);
      expect(p, kind).not.toBeNull();
      expect(p.x).toBeLessThan(256);
      expect(p.y).toBeLessThan(160);
    }
  });

  it('closes with the piece that was tapped, to be printed', async () => {
    const scene = fakeScene();
    const picker = new DecorPicker(scene);
    const picked = picker.open();
    picker.show = 1;
    tap(picker, centreOf(picker, 'lamp'));
    await expect(picked).resolves.toBe('lamp');
    expect(scene.modal).toBeNull();
  });

  it('closes with nothing when tapped outside', async () => {
    const picker = new DecorPicker(fakeScene());
    const picked = picker.open();
    picker.show = 1;
    tap(picker, { x: 5, y: 5 });
    await expect(picked).resolves.toBeNull();
  });

  it('stays open with a "no" sound for a piece there are already enough of', () => {
    let world = defaultWorld();
    for (let n = 0; n < MAX_COPIES; n++) {
      world = add(world, 'storeroom', { id: `rug${n}`, kind: 'rug', x: 100, y: 130 });
    }
    const scene = fakeScene(world);
    const picker = new DecorPicker(scene);
    picker.open();
    picker.show = 1;
    tap(picker, centreOf(picker, 'rug'));
    expect(picker.closing).toBe(false);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('denied');
  });

  it('stays open with a "no" sound for a piece not unlocked yet', () => {
    const scene = fakeScene();
    const picker = new DecorPicker(scene);
    picker.open();
    picker.show = 1;
    tap(picker, centreOf(picker, locked));
    expect(picker.closing).toBe(false);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('denied');
  });

  it('prints a piece once it is unlocked', async () => {
    const scene = fakeScene(defaultWorld(), unlock(normalizeDecor(undefined), locked));
    const picker = new DecorPicker(scene);
    const picked = picker.open();
    picker.show = 1;
    tap(picker, centreOf(picker, locked));
    await expect(picked).resolves.toBe(locked);
  });

  it('shows off newly unlocked pieces the next time it opens, and only then', async () => {
    const scene = fakeScene(defaultWorld(), unlock(normalizeDecor(undefined), locked));
    const picker = new DecorPicker(scene);
    picker.open();
    expect(picker.fresh).toEqual([locked]);
    expect(scene.decor.fresh).toEqual([]);
    await picker.close();
    picker.open();
    expect(picker.fresh).toEqual([]);
  });
});
