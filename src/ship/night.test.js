import { describe, expect, it, vi } from 'vitest';
import { MOONFLOWER } from './layout.js';
import { Moonflower } from './entities/moonflower.js';
import { isNight, nightFalls } from './night.js';

describe('night on Bluebell', () => {
  it("is day in an old save, and night once it's been saved as night", () => {
    expect(isNight({})).toBe(false);
    expect(isNight({ night: 'yes' })).toBe(false);
    expect(isNight({ night: false })).toBe(false);
    expect(isNight({ night: true })).toBe(true);
  });

  it('falls in the meadow and the grove, and nowhere else out of doors', () => {
    expect(nightFalls('bluebell')).toBe(true);
    expect(nightFalls('mushroomgrove')).toBe(true);
    expect(nightFalls('candy')).toBe(false);
    expect(nightFalls('frosty')).toBe(false);
  });
});

// Just enough of the meadow for the moonflower: fading the night in or out
// happens at once.
function setup(night) {
  const girl = { x: MOONFLOWER.x - 14, y: MOONFLOWER.y + 2, mode: 'idle', faceToward: vi.fn(), say: vi.fn(), act: vi.fn() };
  const scene = {
    width: 512,
    night,
    dusk: night ? 1 : 0,
    girl,
    engine: { time: 0, audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()) }, wait: () => Promise.resolve() },
    interact: vi.fn(),
    sparkles: vi.fn(),
    fadeNight: vi.fn(async (n) => Object.assign(scene, { night: n, dusk: n ? 1 : 0 })),
  };
  const flower = Object.assign(new Moonflower({ moonflower: { closed: {}, open: {} } }), { scene });
  return { scene, flower };
}

describe('the moonflower', () => {
  it('stands in the meadow, and she walks over to it when tapped', () => {
    const { scene, flower } = setup(false);
    expect(flower.hitTest(MOONFLOWER.x, MOONFLOWER.y - 6)).toBe(true);
    flower.onTap();
    expect(scene.interact).toHaveBeenCalledWith(flower);
  });

  it('brings dusk by day, and the sun back up by night', async () => {
    const { scene, flower } = setup(false);
    await flower.use();
    expect(scene.fadeNight).toHaveBeenLastCalledWith(true);
    expect(scene.night).toBe(true);
    await flower.use();
    expect(scene.fadeNight).toHaveBeenLastCalledWith(false);
    expect(scene.night).toBe(false);
  });

  it("does nothing while it's still turning", async () => {
    const { scene, flower } = setup(false);
    let finish;
    scene.fadeNight = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    const first = flower.use();
    await Promise.resolve();
    await flower.use();
    expect(scene.fadeNight).toHaveBeenCalledTimes(1);
    finish();
    await first;
  });
});
