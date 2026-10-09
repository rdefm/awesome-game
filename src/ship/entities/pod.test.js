import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POD, STAR_WINDOW, distanceScale } from '../layout.js';
import { Local } from './bluebell.js';
import { Girl } from './girl.js';
import { Snack } from './items.js';
import { BubbleBath, SeedTray, Telescope } from './pod.js';

const assets = {
  local: {}, snacks: {}, bubbleBath: {}, telescope: {}, seedTray: [],
  girl: () => ({}), emotes: {},
};

// Just enough of the pod for its things (and the pink alien to bring in).
function setup() {
  const scene = {
    engine: {
      audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve(),
    },
    entities: [],
    putDown: vi.fn(() => Promise.resolve()),
    hearts: vi.fn(),
    sparkles: vi.fn(),
    bits: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  const local = new Local(assets, { id: 'local', kind: 'local', x: 60, y: 136 });
  for (const e of [girl, local]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  const make = (Kind, state) => Object.assign(new Kind(assets, state), { scene });
  return { scene, girl, local, make };
}

const played = (scene, sound) => scene.engine.audio.play.mock.calls.filter(([s]) => s === sound);

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the bubble bath', () => {
  it('swished, fills up with bubbles that float off and pop', async () => {
    const { scene, make } = setup();
    const bath = make(BubbleBath);
    await bath.use();
    expect(played(scene, 'splash')).toHaveLength(1);
    const n = bath.bubbles.length;
    expect(n).toBeGreaterThanOrEqual(3);
    expect(bath.swishing).toBe(false);
    for (let i = 0; i < 100; i++) {
      bath.update(0.1);
    }
    expect(bath.bubbles).toHaveLength(0);
    expect(played(scene, 'pop')).toHaveLength(n);
  });

  it('takes friends, not other things', () => {
    const { local, make } = setup();
    const bath = make(BubbleBath);
    expect(bath.accepts(local)).toBe(true);
    expect(bath.accepts(make(Snack, { id: 'c', kind: 'cookie', x: 0, y: 0 }))).toBe(false);
  });

  it('has a friend splash about in it, then hop back out', async () => {
    const { scene, local, make } = setup();
    const bath = make(BubbleBath);
    const done = bath.receive(local);
    expect(bath.accepts(local)).toBe(false); // already busy with it
    await done;
    expect(scene.putDown.mock.calls[0][0]).toBe(local);
    expect(played(scene, 'splash').length).toBeGreaterThanOrEqual(1);
    expect(bath.friend).toBe(null);
    expect(local.seat).toBe(null);
    expect(local.busy).toBe(false);
    expect(local.draggable).toBe(true);
  });
});

describe('the telescope', () => {
  it('shows twinkling stars, all inside the window', () => {
    const { make } = setup();
    const scope = make(Telescope);
    expect(scope.stars.length).toBeGreaterThanOrEqual(5);
    for (const s of scope.stars) {
      expect(Math.hypot(s.x, s.y)).toBeLessThan(STAR_WINDOW.r);
    }
  });

  it('looked through, brings out the stars and a shooting star, then day again', async () => {
    const { scene, make } = setup();
    const scope = make(Telescope);
    await scope.use();
    expect(played(scene, 'tinkle')).toHaveLength(1);
    expect(played(scene, 'whoosh')).toHaveLength(1);
    expect(scope.looking).toBe(false);
  });
});

describe('the seed tray', () => {
  it('watered, sprouts a stage at a time up to flowers', async () => {
    const { scene, make } = setup();
    const tray = make(SeedTray);
    expect(tray.stage).toBe(0);
    const stages = [];
    for (let i = 0; i < 3; i++) {
      await tray.use();
      stages.push(tray.stage);
    }
    expect(stages).toEqual([1, 2, 3]);
    expect(played(scene, 'grow')).toHaveLength(3);
  });

  it('in flower, rings its flowers and blows its seeds off to start again', async () => {
    const { scene, make } = setup();
    const tray = make(SeedTray);
    for (let i = 0; i < 4; i++) {
      await tray.use();
    }
    expect(tray.stage).toBe(0);
    expect(played(scene, 'plink').length).toBeGreaterThanOrEqual(3);
    expect(played(scene, 'poof')).toHaveLength(1);
    expect(tray.tending).toBe(false);
  });
});

describe('the path to the pod', () => {
  const { path, far } = POD;

  it('is full size at the near end and smallest at the door', () => {
    expect(distanceScale(path[0].y, POD)).toBe(1);
    expect(distanceScale(path.at(-1).y, POD)).toBe(far);
  });

  it('gets steadily smaller the further up it she goes', () => {
    const scales = path.map((p) => distanceScale(p.y, POD));
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeLessThan(scales[i - 1]);
    }
  });

  it('starts where she can walk to', () => {
    expect(path[0].y).toBeGreaterThanOrEqual(122);
  });
});
