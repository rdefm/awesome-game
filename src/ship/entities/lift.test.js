import { describe, expect, it, vi } from 'vitest';
import { LIFT } from '../layout.js';
import { Girl } from './girl.js';
import { Lift } from './lift.js';

const assets = { lift: {}, girl: () => ({}), emotes: {} };

// Just enough of a room with a lift for it (and her) to work in. Her walks
// get there straight away.
function setup(where = 'storeroom') {
  const scene = {
    where,
    assets,
    engine: {
      audio: { play: vi.fn() }, tweens: { to: vi.fn((obj, props) => Promise.resolve(Object.assign(obj, props))) }, wait: () => Promise.resolve(),
    },
    busy: false,
    scripted: vi.fn((run) => run()),
    persist: vi.fn(),
    leaveTo: vi.fn(() => Promise.resolve()),
  };
  const girl = new Girl(assets, LIFT.spot.x, LIFT.spot.y, {});
  girl.scene = scene;
  girl.walkTo = vi.fn((x, y) => Promise.resolve(Object.assign(girl, { x, y })).then(() => true));
  scene.girl = girl;
  const lift = Object.assign(new Lift(assets), { scene });
  return { scene, girl, lift };
}

const played = (scene, sound) => scene.engine.audio.play.mock.calls.filter(([s]) => s === sound);

describe('the lift', () => {
  it('opens its doors when she presses the call button', async () => {
    const { scene, lift } = setup();
    await lift.use();
    expect(played(scene, 'ding')).toHaveLength(1);
    expect(lift.isOpen).toBe(true);
  });

  it('once open, takes her in and off to the floor she picks', async () => {
    const { scene, girl, lift } = setup();
    lift.open = 1;
    lift.picker = { open: () => Promise.resolve('bunkroom') };
    await lift.use();
    expect(lift.rider).toBe(girl);
    expect(lift.open).toBe(0);
    expect(scene.leaveTo).toHaveBeenCalled();
  });

  it('lets her back out if she picks no floor, or the one she is on', async () => {
    for (const pick of [null, 'storeroom']) {
      const { scene, girl, lift } = setup();
      lift.open = 1;
      lift.picker = { open: () => Promise.resolve(pick) };
      await lift.use();
      expect(scene.leaveTo).not.toHaveBeenCalled();
      expect(lift.rider).toBe(null);
      expect(girl.riding).toBe(null);
      expect(lift.open).toBe(0);
    }
  });

  it('opens up and lets her out when she arrives in it', async () => {
    const { scene, girl, lift } = setup('bunkroom');
    await lift.arrive();
    expect(played(scene, 'ding')).toHaveLength(1);
    expect(girl.riding).toBe(null);
    expect(girl.y).toBeGreaterThan(LIFT.spot.y);
    expect(scene.persist).toHaveBeenCalled();
  });
});
