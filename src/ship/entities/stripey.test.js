import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Critter } from './bluebell.js';
import { Geode } from './ember.js';
import { FrostFlower } from './frosty.js';
import { Girl } from './girl.js';
import { Snack } from './items.js';
import { StripeCactus, StripeStone, Zig } from './stripey.js';

const zigFrames = () => ({ idle: {} });
const assets = {
  zig: [zigFrames(), zigFrames(), zigFrames(), zigFrames(), zigFrames()], critter: {}, geode: [{}, {}],
  frostFlower: [{}, {}, {}], stripeStone: [{}, {}, {}], stripeCactus: [{}, {}], snacks: {}, girl: () => ({}), emotes: {},
};

// Just enough of Stripey for Zig, the cacti and things dropped on them.
function setup() {
  const scene = {
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve() },
    entities: [],
    settle: vi.fn(),
    saveStage: vi.fn(),
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
  const zig = new Zig(assets, { id: 'zig', kind: 'zig', x: 180, y: 138 });
  for (const e of [girl, zig]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  scene.engine.scene = scene;
  const make = (Kind, state) => Object.assign(new Kind(assets, state), { scene });
  return { scene, girl, zig, make };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Zig the stripey alien', () => {
  it('takes snacks and friends, like every friend', () => {
    const { zig, make } = setup();
    expect(zig.accepts(make(Snack, { id: 'c', kind: 'cookie', x: 0, y: 0 }))).toBe(true);
    expect(zig.accepts(make(Critter, { id: 'critter', kind: 'critter', x: 0, y: 0 }))).toBe(true);
  });

  it('plays a tune on its stripes with a stripe stone, and says thank you', async () => {
    const { scene, zig, make } = setup();
    const stone = make(StripeStone, { id: 'stripestone0', kind: 'stripestone', x: 170, y: 140, v: 0 });
    expect(zig.accepts(stone)).toBe(true);
    await zig.receive(stone);
    expect(scene.putDown.mock.calls[0][0]).toBe(stone);
    expect(scene.findSticker).toHaveBeenCalledWith('stripey.tune', expect.any(Number), expect.any(Number));
    expect(zig.busy).toBe(false);
    expect(zig.draggable).toBe(true);
  });

  it('gets new stripes from a thing from another planet, and they are remembered', async () => {
    const { scene, zig, make } = setup();
    const flower = make(FrostFlower, { id: 'frostflower0', kind: 'frostflower', x: 170, y: 140 });
    expect(zig.accepts(flower)).toBe(true);
    await zig.receive(flower);
    expect(zig.stripes).toBe(3);
    expect(zig.imgs).toBe(assets.zig[3]);
    expect(scene.saveStage).toHaveBeenCalledWith(zig, 3);
    expect(scene.findSticker).toHaveBeenCalledWith('stripey.stripes', expect.any(Number), expect.any(Number));
    expect(zig.turn).toBe(0);
    expect(zig.busy).toBe(false);
  });

  it('comes back in the stripes it was last given', () => {
    const zig = new Zig(assets, { id: 'zig', kind: 'zig', x: 0, y: 0, stage: 4 });
    expect(zig.stripes).toBe(4);
    expect(zig.imgs).toBe(assets.zig[4]);
  });

  it('is not interested in a geode, nor anything while busy', () => {
    const { zig, make } = setup();
    expect(zig.accepts(make(Geode, { id: 'g', kind: 'geode', x: 0, y: 0 }))).toBe(false);
    zig.busy = true;
    expect(zig.accepts(make(StripeStone, { id: 's', kind: 'stripestone', x: 0, y: 0 }))).toBe(false);
  });
});

describe('the stripe cactus', () => {
  it('drinks a juice and bursts into flower for good, with a sticker in it', async () => {
    const { scene, make } = setup();
    const cactus = make(StripeCactus, { id: 'stripecactus0', kind: 'stripecactus', x: 120, y: 130 });
    const juice = make(Snack, { id: 'juice0', kind: 'juice', x: 110, y: 130 });
    expect(cactus.accepts(juice)).toBe(true);
    await cactus.receive(juice);
    expect(scene.useUp).toHaveBeenCalledWith(juice);
    expect(scene.remove).toHaveBeenCalledWith(juice);
    expect(cactus.bloomed).toBe(true);
    expect(scene.saveStage).toHaveBeenCalledWith(cactus, 1);
    expect(scene.findSticker).toHaveBeenCalledWith('stripey.bloom', expect.any(Number), expect.any(Number));
    expect(cactus.draggable).toBe(true);
  });

  it('only wants juice, and only until it has flowered', () => {
    const { make } = setup();
    const cactus = make(StripeCactus, { id: 'c', kind: 'stripecactus', x: 0, y: 0 });
    expect(cactus.accepts(make(Snack, { id: 'k', kind: 'cookie', x: 0, y: 0 }))).toBe(false);
    const bloomed = make(StripeCactus, { id: 'b', kind: 'stripecactus', x: 0, y: 0, stage: 1 });
    expect(bloomed.accepts(make(Snack, { id: 'j', kind: 'juice', x: 0, y: 0 }))).toBe(false);
  });
});
