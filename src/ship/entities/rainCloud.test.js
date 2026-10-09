import { describe, expect, it, vi } from 'vitest';
import { RAIN_CLOUD } from '../layout.js';
import { Bluebell } from './bluebell.js';
import { RAIN_TIME, RAINBOW_TIME, RainCloud } from './rainCloud.js';

const assets = {
  rainCloud: { fluffy: {}, grey: {}, rainbow: {}, puddle: {} },
  stems: [0, 1, 2].map(() => ({ img: { height: 40 }, hang: [{ x: 10, y: -30 }] })),
  bell: {},
};

// Just enough of the meadow for the cloud: one bluebell under it, one off
// along the meadow, and her.
function setup() {
  const girl = { x: 60, y: 130, mode: 'idle', faceToward: vi.fn(), say: vi.fn() };
  const scene = {
    engine: { time: 0, audio: { play: vi.fn() } },
    entities: [],
    girl,
    bits: vi.fn(),
    ripple: vi.fn(),
    musicNote: vi.fn(),
    sparkles: vi.fn(),
  };
  const add = (e) => {
    e.scene = scene;
    scene.entities.push(e);
    return e;
  };
  const under = add(new Bluebell(assets, { id: 'b0', kind: 'bluebell', x: RAIN_CLOUD.x - 10, y: 140, v: 1 }));
  const away = add(new Bluebell(assets, { id: 'b1', kind: 'bluebell', x: RAIN_CLOUD.x + 120, y: 140, v: 2 }));
  const cloud = add(new RainCloud(assets));
  // Runs the meadow on for `seconds`, a frame at a time.
  const run = (seconds, dt = 0.05) => {
    for (let t = 0; t < seconds; t += dt) {
      for (const e of scene.entities) {
        e.update(dt);
      }
    }
  };
  const played = (name) => scene.engine.audio.play.mock.calls.filter(([n]) => n === name).length;
  return { scene, girl, cloud, under, away, run, played };
}

describe('the rain cloud', () => {
  it('floats low over the near end of the meadow, not raining', () => {
    const { cloud } = setup();
    expect(cloud.x).toBe(RAIN_CLOUD.x);
    expect(cloud.x).toBeLessThan(256);
    expect(cloud.raining).toBe(false);
    expect(cloud.puddle).toBe(0);
    expect(cloud.hitTest(RAIN_CLOUD.x, RAIN_CLOUD.y)).toBe(true);
    expect(cloud.hitTest(RAIN_CLOUD.x, RAIN_CLOUD.y + 60)).toBe(false);
  });

  it('tapped, it rains, and she looks up at it', () => {
    const { cloud, girl, played } = setup();
    cloud.onTap();
    expect(cloud.raining).toBe(true);
    expect(played('rain')).toBe(1);
    expect(girl.faceToward).toHaveBeenCalledWith(cloud.x);
  });

  it('the bluebells under it ring over and over in the rain, faster than she could tap; the others stay still', () => {
    const { cloud, under, away, run, scene } = setup();
    cloud.onTap();
    run(RAIN_TIME * 0.9);
    const rings = (b) => scene.engine.audio.play.mock.calls.filter(([n]) => n === `bell${b.note}`).length;
    expect(rings(under)).toBeGreaterThan(4);
    expect(under.ring).toBeGreaterThan(0);
    expect(under.quick).toBeGreaterThan(0); // its bells swinging faster
    expect(rings(away)).toBe(0);
    expect(away.ring).toBe(0);
  });

  it('a puddle forms under it as it rains', () => {
    const { cloud, run } = setup();
    cloud.onTap();
    run(RAIN_TIME / 2);
    const half = cloud.puddle;
    expect(half).toBeGreaterThan(0);
    run(RAIN_TIME / 2);
    expect(cloud.puddle).toBeGreaterThan(half);
  });

  it("walking through the puddle, she splashes; standing in it or walking past, she doesn't", () => {
    const { cloud, girl, run, scene } = setup();
    cloud.onTap();
    run(RAIN_TIME * 0.9);
    Object.assign(girl, { x: RAIN_CLOUD.puddle.x, y: RAIN_CLOUD.puddle.y, mode: 'idle' });
    run(0.5);
    expect(scene.bits).not.toHaveBeenCalled();
    girl.mode = 'walk';
    run(0.5);
    expect(scene.bits).toHaveBeenCalled();
    scene.bits.mockClear();
    girl.x = RAIN_CLOUD.puddle.x + 60;
    run(0.5);
    expect(scene.bits).not.toHaveBeenCalled();
  });

  it('when the rain stops a rainbow arcs over the meadow for a while, the puddle drying up, then it is gone', () => {
    const { cloud, run, played } = setup();
    cloud.onTap();
    run(RAIN_TIME + 0.1);
    expect(cloud.raining).toBe(false);
    expect(cloud.rainbow).toBeGreaterThan(0);
    expect(played('rainbow')).toBe(1);
    const full = cloud.puddle;
    run(RAINBOW_TIME / 2);
    expect(cloud.puddle).toBeLessThan(full);
    run(RAINBOW_TIME);
    expect(cloud.rainbow).toBe(0);
    expect(cloud.puddle).toBe(0);
  });

  it("can't be set raining again until the rainbow's gone", () => {
    const { cloud, run, played } = setup();
    cloud.onTap();
    cloud.onTap();
    expect(played('rain')).toBe(1);
    run(RAIN_TIME + 0.1);
    cloud.onTap();
    expect(cloud.raining).toBe(false);
    run(RAINBOW_TIME + 1);
    cloud.onTap();
    expect(cloud.raining).toBe(true);
    expect(played('rain')).toBe(2);
  });
});
