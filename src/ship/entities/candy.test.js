import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GINGERBREAD_HOUSE, distanceScale } from '../layout.js';
import { Critter } from './bluebell.js';
import { Ginger, Gumdrop, GummyBear, Lollipop, MAX_CUPCAKES, Oven } from './candy.js';
import { Snowball } from './frosty.js';
import { Girl } from './girl.js';
import { Snack } from './items.js';

const assets = {
  gummy: {}, ginger: {}, critter: {}, snowball: {}, lollipop: [[{}, {}, {}, {}]], gumdrop: [{}], oven: [{}, {}],
  snacks: {}, girl: () => ({}), emotes: {},
};

// Just enough of Candy (or the gingerbread house) for the friends and the oven.
function setup() {
  const scene = {
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve() },
    entities: [],
    settle: vi.fn(),
    stickers: [],
    memories: [],
    remember: vi.fn(),
    add: vi.fn(),
    findSticker: vi.fn(() => true),
    useUp: vi.fn(),
    remove: vi.fn(),
    putDown: vi.fn(() => Promise.resolve()),
    spawn: vi.fn((kind, x, y) => ({ id: `${kind}0`, kind, x, y })),
    toast: vi.fn(),
    hearts: vi.fn(),
    sparkles: vi.fn(),
    bits: vi.fn(),
    dust: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  const gummy = new GummyBear(assets, { id: 'gummy', kind: 'gummy', x: 180, y: 134 });
  const ginger = new Ginger(assets, { id: 'ginger', kind: 'ginger', x: 210, y: 140 });
  for (const e of [girl, gummy, ginger]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  scene.engine.scene = scene;
  const make = (Kind, state) => Object.assign(new Kind(assets, state), { scene });
  return { scene, girl, gummy, ginger, make };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the gummy bear and Ginger', () => {
  it('take snacks (cupcakes too) and friends, like every friend', () => {
    const { gummy, ginger, make } = setup();
    for (const friend of [gummy, ginger]) {
      expect(friend.accepts(make(Snack, { id: 'c', kind: 'cupcake', x: 0, y: 0 }))).toBe(true);
      expect(friend.accepts(make(Critter, { id: 'critter', kind: 'critter', x: 0, y: 0 }))).toBe(true);
    }
  });

  it('the gummy bear licks a lollipop, and says thank you', async () => {
    const { scene, gummy, make } = setup();
    const lolly = make(Lollipop, { id: 'lollipop0', kind: 'lollipop', x: 170, y: 134, v: 0 });
    expect(gummy.accepts(lolly)).toBe(true);
    await gummy.receive(lolly);
    expect(scene.putDown.mock.calls[0][0]).toBe(lolly);
    expect(scene.findSticker).toHaveBeenCalledWith('candy.lolly', expect.any(Number), expect.any(Number));
    expect(gummy.busy).toBe(false);
    expect(gummy.draggable).toBe(true);
  });

  it('Ginger is thrilled with a snowball from Frosty, and it stays about', async () => {
    const { scene, ginger, make } = setup();
    const ball = make(Snowball, { id: 'snowball0', kind: 'snowball', x: 200, y: 140 });
    expect(ginger.accepts(ball)).toBe(true);
    await ginger.receive(ball);
    expect(scene.findSticker).toHaveBeenCalledWith('candy.snow', expect.any(Number), expect.any(Number));
    expect(scene.useUp).not.toHaveBeenCalled();
    expect(ginger.busy).toBe(false);
    expect(ginger.turn).toBe(0);
  });

  it('only the gummy bear wants lollipops, and neither wants a gumdrop', () => {
    const { gummy, ginger, make } = setup();
    expect(ginger.accepts(make(Lollipop, { id: 'l', kind: 'lollipop', x: 0, y: 0 }))).toBe(false);
    expect(gummy.accepts(make(Snowball, { id: 's', kind: 'snowball', x: 0, y: 0 }))).toBe(false);
    expect(gummy.accepts(make(Gumdrop, { id: 'g', kind: 'gumdrop', x: 0, y: 0 }))).toBe(false);
  });

  it('Ginger dances when tapped, and is free again after', async () => {
    const { ginger } = setup();
    await ginger.dance();
    expect(ginger.busy).toBe(false);
    expect(ginger.draggable).toBe(true);
  });

  it('Ginger offers a chat after her dance, wondering about snow until she has had some', async () => {
    const { scene, ginger } = setup();
    await ginger.dance();
    expect(scene.add).toHaveBeenCalledWith(expect.objectContaining({ speaker: ginger }));
    expect(ginger.chat().facts).toEqual({ snow: false });
    scene.stickers = ['candy.snow'];
    expect(ginger.chat().facts).toEqual({ snow: true });
  });
});

describe('the oven', () => {
  it('bakes a cupcake, with a sticker baked into it', async () => {
    const { scene, make } = setup();
    const oven = make(Oven, {});
    await oven.use();
    expect(scene.spawn).toHaveBeenCalledWith('cupcake', expect.any(Number), expect.any(Number));
    expect(scene.findSticker).toHaveBeenCalledWith('candy.bake', expect.any(Number), expect.any(Number));
    expect(oven.baking).toBe(false);
  });

  it('stops once there are plenty of cupcakes about', async () => {
    const { scene, make } = setup();
    for (let i = 0; i < MAX_CUPCAKES; i++) {
      scene.entities.push({ kind: 'cupcake' });
    }
    await make(Oven, {}).use();
    expect(scene.spawn).not.toHaveBeenCalled();
  });
});

describe('the path to the gingerbread house', () => {
  const { path, far } = GINGERBREAD_HOUSE;

  it('is full size at the near end and smallest at the door', () => {
    expect(distanceScale(path[0].y)).toBe(1);
    expect(distanceScale(path.at(-1).y)).toBe(far);
  });

  it('gets steadily smaller the further up it she goes', () => {
    const scales = path.map((p) => distanceScale(p.y));
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeLessThan(scales[i - 1]);
    }
  });

  it('starts where she can walk to', () => {
    expect(path[0].y).toBeGreaterThanOrEqual(122);
  });
});
