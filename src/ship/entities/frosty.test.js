import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Critter } from './bluebell.js';
import { Firebloom, Geode } from './ember.js';
import { BabyYeti, MumYeti, Snowball } from './frosty.js';
import { Girl } from './girl.js';
import { Snack } from './items.js';

const assets = {
  mumYeti: {}, babyYeti: {}, critter: {}, snowball: {}, geode: [{}, {}], firebloom: [[{}, {}, {}]],
  snacks: {}, girl: () => ({}), emotes: {},
};

// Just enough of Frosty for the yetis and things dropped on them.
function setup() {
  const scene = {
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve() },
    entities: [],
    settle: vi.fn(),
    stickers: [],
    memories: [],
    remember: vi.fn(),
    add: vi.fn(),
    findSticker: vi.fn(),
    useUp: vi.fn(),
    remove: vi.fn(),
    putDown: vi.fn(() => Promise.resolve()),
    hearts: vi.fn(),
    sparkles: vi.fn(),
    bits: vi.fn(),
    dust: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  const mum = new MumYeti(assets, { id: 'mumYeti', kind: 'mumYeti', x: 180, y: 134 });
  const baby = new BabyYeti(assets, { id: 'babyYeti', kind: 'babyYeti', x: 210, y: 140 });
  for (const e of [girl, mum, baby]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  scene.engine.scene = scene;
  const make = (Kind, state) => Object.assign(new Kind(assets, state), { scene });
  return { scene, girl, mum, baby, make };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the yetis', () => {
  it('take snacks and friends, like every friend', () => {
    const { mum, baby, make } = setup();
    for (const yeti of [mum, baby]) {
      expect(yeti.accepts(make(Snack, { id: 'c', kind: 'cookie', x: 0, y: 0 }))).toBe(true);
      expect(yeti.accepts(make(Critter, { id: 'critter', kind: 'critter', x: 0, y: 0 }))).toBe(true);
    }
  });

  it('cuddle when baby is brought back to mum', async () => {
    const { scene, mum, baby } = setup();
    expect(mum.accepts(baby)).toBe(true);
    await mum.receive(baby);
    expect(scene.findSticker).toHaveBeenCalledWith('frosty.cuddle', expect.any(Number), expect.any(Number));
    expect(baby.lift).toBe(0);
    expect(mum.busy || baby.busy).toBe(false);
    expect(mum.draggable && baby.draggable).toBe(true);
  });

  it('cuddle when mum is brought to baby, too', async () => {
    const { scene, mum, baby } = setup();
    await baby.receive(mum);
    expect(scene.findSticker).toHaveBeenCalledWith('frosty.cuddle', expect.any(Number), expect.any(Number));
  });

  it('baby plays with a snowball, and it ends up back on the ground', async () => {
    const { scene, baby, make } = setup();
    const ball = make(Snowball, { id: 'snowball0', kind: 'snowball', x: 200, y: 140 });
    expect(baby.accepts(ball)).toBe(true);
    await baby.receive(ball);
    expect(scene.findSticker).toHaveBeenCalledWith('frosty.snowball', expect.any(Number), expect.any(Number));
    expect(ball.draggable).toBe(true);
    expect(baby.busy).toBe(false);
  });

  it('mum warms her paws at a fire flower from Ember, and says thank you', async () => {
    const { scene, mum, make } = setup();
    const flower = make(Firebloom, { id: 'firebloom0', kind: 'firebloom', x: 170, y: 134, v: 0 });
    expect(mum.accepts(flower)).toBe(true);
    await mum.receive(flower);
    expect(scene.putDown.mock.calls[0][0]).toBe(flower);
    expect(scene.findSticker).toHaveBeenCalledWith('frosty.warm', expect.any(Number), expect.any(Number));
    expect(mum.busy).toBe(false);
  });

  it('only baby wants snowballs, and neither wants a geode', () => {
    const { mum, baby, make } = setup();
    expect(mum.accepts(make(Snowball, { id: 's', kind: 'snowball', x: 0, y: 0 }))).toBe(false);
    expect(baby.accepts(make(Geode, { id: 'g', kind: 'geode', x: 0, y: 0 }))).toBe(false);
  });

  it('baby toddles back to mum', () => {
    const { mum, baby } = setup();
    for (let i = 0; i < 20; i++) {
      expect(Math.abs(baby.nextStroll().x - mum.x)).toBeLessThanOrEqual(26);
    }
  });

  it('take nothing while busy', () => {
    const { mum, baby } = setup();
    mum.busy = true;
    expect(mum.accepts(baby)).toBe(false);
  });
});
