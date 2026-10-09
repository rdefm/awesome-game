import { describe, expect, it, vi } from 'vitest';
import { DANDELION } from '../layout.js';
import { Dandelion, REGROW_TIME } from './dandelion.js';

const assets = { dandelion: { stalk: {}, fluff: {}, seed: {} } };

// Just enough of the meadow for the dandelion. Tweens finish at once (landing
// on their targets), so a whole blow plays straight through; `seen.lift` is
// the highest she got.
function setup() {
  const seen = { lift: 0 };
  const girl = {
    x: DANDELION.x - 14, y: DANDELION.y + 2, lift: 0, scale: 1, mode: 'idle', onFeet: true,
    faceToward: vi.fn(), say: vi.fn(), act: vi.fn(() => Promise.resolve()), hop: vi.fn(() => Promise.resolve()),
  };
  const scene = {
    width: 512,
    busy: false,
    engine: {
      time: 0,
      audio: { play: vi.fn() },
      tweens: {
        to: vi.fn((o, props) => {
          Object.assign(o, props);
          seen.lift = Math.max(seen.lift, girl.lift);
          return Promise.resolve();
        }),
      },
      wait: () => Promise.resolve(),
    },
    girl,
    interact: vi.fn(),
    scripted: vi.fn((run) => run()),
    persist: vi.fn(),
    sparkles: vi.fn(),
    hearts: vi.fn(),
    bits: vi.fn(),
    dust: vi.fn(),
  };
  const dandelion = Object.assign(new Dandelion(assets), { scene });
  return { scene, girl, dandelion, seen };
}

describe('the giant dandelion clock', () => {
  it('stands on the far stretch of the meadow, taller than she is', () => {
    const { dandelion } = setup();
    expect(dandelion.x).toBe(DANDELION.x);
    expect(dandelion.x).toBeGreaterThan(256);
    expect(dandelion.h).toBeGreaterThan(30);
  });

  it('tapped: she walks over', () => {
    const { scene, dandelion } = setup();
    dandelion.onTap();
    expect(scene.interact).toHaveBeenCalledWith(dandelion);
  });

  it('she blows: the seeds puff off, and one lifts her up and lets her gently down', async () => {
    const { scene, girl, dandelion, seen } = setup();
    await dandelion.use();
    expect(dandelion.fluff).toBe(0);
    expect(dandelion.seeds.length).toBeGreaterThan(5);
    expect(seen.lift).toBeGreaterThan(10);
    expect(girl.lift).toBe(0);
    expect(scene.scripted).toHaveBeenCalled();
    expect(scene.dust).toHaveBeenCalled(); // landed
    expect(scene.persist).toHaveBeenCalled(); // somewhere new
  });

  it('the seeds drift off up out of the sky', async () => {
    const { dandelion } = setup();
    await dandelion.use();
    for (let i = 0; i < 40; i++) {
      dandelion.update(0.5);
    }
    expect(dandelion.seeds.length).toBe(0);
  });

  it('tapped while bald: just a little "nothing left" wiggle, no walking over', async () => {
    const { scene, girl, dandelion } = setup();
    await dandelion.use();
    scene.interact.mockClear();
    dandelion.onTap();
    expect(scene.interact).not.toHaveBeenCalled();
    expect(dandelion.wiggle).toBeGreaterThan(0);
    expect(girl.say).toHaveBeenLastCalledWith('question', expect.anything());
  });

  it('grows its fluff back after a little while', async () => {
    const { scene, dandelion } = setup();
    await dandelion.use();
    dandelion.update(REGROW_TIME / 2);
    expect(dandelion.fluff).toBe(0);
    dandelion.update(REGROW_TIME / 2 + 0.1);
    expect(dandelion.fluff).toBe(1);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('grow');
    await Promise.resolve();
    scene.interact.mockClear();
    dandelion.onTap();
    expect(scene.interact).toHaveBeenCalledWith(dandelion);
  });

  it("can't be blown again until it's quite grown back", async () => {
    const { scene, dandelion } = setup();
    await dandelion.use();
    scene.engine.tweens.to.mockImplementationOnce(() => new Promise(() => {})); // still growing
    dandelion.update(REGROW_TIME + 0.1);
    scene.interact.mockClear();
    dandelion.onTap();
    expect(scene.interact).not.toHaveBeenCalled();
    await dandelion.use();
    expect(dandelion.grown).toBe(false);
  });
});
