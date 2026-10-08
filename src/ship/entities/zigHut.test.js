import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GOGGLE_COLORS, HUT_WALLS } from '../art/zigHut.js';
import { ZIG_HUT, distanceScale } from '../layout.js';
import { Girl } from './girl.js';
import { Snack } from './items.js';
import { Zig } from './stripey.js';
import { Easel, GoggleShelf, Hammock, SandTimer, TIMER_RUN } from './zigHut.js';

const assets = {
  zig: [{}], snacks: {}, zigRoom: HUT_WALLS.map((_, v) => ({ v })), easel: [], sandTimer: {}, goggles: [], sling: {},
  girl: () => ({}), emotes: {},
};

// Just enough of Zig's hut for its things (and a friend to nap in the hammock).
function setup() {
  const scene = {
    engine: {
      audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve(),
    },
    entities: [],
    room: assets.zigRoom[0],
    putDown: vi.fn(() => Promise.resolve()),
    hearts: vi.fn(),
    sparkles: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  const zig = new Zig(assets, { id: 'zig', kind: 'zig', x: 150, y: 136 });
  for (const e of [girl, zig]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  const make = (Kind, state) => Object.assign(new Kind(assets, state), { scene });
  return { scene, girl, zig, make };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the easel', () => {
  it('paints the walls in the next planet\'s stripes, round and round', async () => {
    const { scene, make } = setup();
    const easel = make(Easel);
    const seen = [];
    for (let i = 0; i < HUT_WALLS.length; i++) {
      await easel.use();
      seen.push(scene.room.v);
    }
    expect(seen).toEqual([...HUT_WALLS.keys()].map((v) => (v + 1) % HUT_WALLS.length));
    expect(easel.painting).toBe(false);
  });
});

describe('the sand timer', () => {
  it('starts with all its sand run through', () => {
    const { make } = setup();
    expect(make(SandTimer).sandUp).toBe(0);
  });

  it('turned over, runs its sand through and dings', async () => {
    const { scene, make } = setup();
    const timer = make(SandTimer);
    await timer.use();
    expect(timer.sandUp).toBe(1);
    timer.update(TIMER_RUN / 2);
    expect(timer.sandUp).toBeCloseTo(0.5);
    expect(scene.engine.audio.play).not.toHaveBeenCalledWith('ding');
    timer.update(TIMER_RUN);
    expect(timer.sandUp).toBe(0);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('ding');
  });

  it('turned over halfway, has the sand that had run through on top', async () => {
    const { make } = setup();
    const timer = make(SandTimer);
    await timer.use();
    timer.update(TIMER_RUN * 0.25);
    await timer.use();
    expect(timer.sandUp).toBeCloseTo(0.25);
  });

  it('dings just once when it runs out', async () => {
    const { scene, make } = setup();
    const timer = make(SandTimer);
    await timer.use();
    timer.update(TIMER_RUN * 2);
    timer.update(1);
    expect(scene.engine.audio.play.mock.calls.filter(([s]) => s === 'ding')).toHaveLength(1);
  });
});

describe('the goggle shelf', () => {
  it('has her try on each pair in turn, then put them back', () => {
    const { make } = setup();
    const shelf = make(GoggleShelf);
    const worn = [];
    for (let i = 0; i <= GOGGLE_COLORS.length; i++) {
      shelf.use();
      worn.push(shelf.worn);
    }
    expect(worn).toEqual([...GOGGLE_COLORS.keys(), null]);
  });
});

describe('the hammock', () => {
  it('takes friends, not other things', () => {
    const { zig, make } = setup();
    const hammock = make(Hammock);
    expect(hammock.accepts(zig)).toBe(true);
    expect(hammock.accepts(make(Snack, { id: 'c', kind: 'cookie', x: 0, y: 0 }))).toBe(false);
  });

  it('swings when tapped', async () => {
    const { scene, make } = setup();
    const hammock = make(Hammock);
    await hammock.swing(2);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('creak');
    expect(hammock.swinging).toBe(false);
    expect(hammock.rock).toBe(0);
  });

  it('swings a friend off to sleep, then lets it hop back out', async () => {
    const { scene, zig, make } = setup();
    const hammock = make(Hammock);
    const done = hammock.receive(zig);
    expect(hammock.accepts(zig)).toBe(false); // already busy with it
    await done;
    expect(scene.putDown.mock.calls[0][0]).toBe(zig);
    expect(hammock.friend).toBe(null);
    expect(hammock.swinging).toBe(false);
    expect(zig.seat).toBe(null);
    expect(zig.busy).toBe(false);
    expect(zig.draggable).toBe(true);
  });
});

describe('the path to Zig\'s hut', () => {
  const { path, far } = ZIG_HUT;

  it('is full size at the near end and smallest at the door', () => {
    expect(distanceScale(path[0].y, ZIG_HUT)).toBe(1);
    expect(distanceScale(path.at(-1).y, ZIG_HUT)).toBe(far);
  });

  it('gets steadily smaller the further up it she goes', () => {
    const scales = path.map((p) => distanceScale(p.y, ZIG_HUT));
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeLessThan(scales[i - 1]);
    }
  });

  it('starts where she can walk to', () => {
    expect(path[0].y).toBeGreaterThanOrEqual(122);
  });
});
