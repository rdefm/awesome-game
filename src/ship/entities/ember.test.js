import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Bluebell, Critter } from './bluebell.js';
import { Firebloom, Geode, Newt } from './ember.js';
import { Girl } from './girl.js';
import { Snack } from './items.js';

const assets = {
  newt: {}, critter: {}, geode: [{}, {}], firebloom: [[{}, {}], [{}, {}]], stems: [{ img: {}, hang: [] }], bell: {},
  snacks: {}, girl: () => ({}), emotes: {},
};

// Just enough of Ember for the newt and things dropped on it.
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
  const newt = new Newt(assets, { id: 'newt', kind: 'newt', x: 150, y: 140 });
  for (const e of [girl, newt]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  scene.engine.scene = scene;
  const make = (Kind, state) => Object.assign(new Kind(assets, state), { scene });
  return { scene, girl, newt, make };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the newt', () => {
  it('takes snacks and friends, like every friend', () => {
    const { newt, make } = setup();
    expect(newt.accepts(make(Snack, { id: 'c', kind: 'cookie', x: 0, y: 0 }))).toBe(true);
    expect(newt.accepts(make(Critter, { id: 'critter', kind: 'critter', x: 0, y: 0 }))).toBe(true);
  });

  it('is not interested in its own firebloom', () => {
    const { newt, make } = setup();
    expect(newt.accepts(make(Firebloom, { id: 'f', kind: 'firebloom', x: 0, y: 0 }))).toBe(false);
  });

  it('cools off in the shade of a giant bluebell brought from Bluebell, and says thank you', async () => {
    const { scene, newt, make } = setup();
    const bell = make(Bluebell, { id: 'bluebell0', kind: 'bluebell', x: 140, y: 140, v: 0 });
    expect(newt.accepts(bell)).toBe(true);
    await newt.receive(bell);
    const [item, x] = scene.putDown.mock.calls[0];
    expect(item).toBe(bell);
    expect(Math.abs(x - newt.x)).toBeGreaterThan(4);
    expect(scene.findSticker).toHaveBeenCalledWith('ember.newt', expect.any(Number), expect.any(Number));
    expect(newt.busy).toBe(false);
    expect(newt.draggable).toBe(true);
  });

  it('cracks a geode open with its tail, and that is remembered', async () => {
    const { scene, newt, make } = setup();
    const geode = make(Geode, { id: 'geode', kind: 'geode', x: 140, y: 140 });
    expect(newt.accepts(geode)).toBe(true);
    await newt.receive(geode);
    expect(geode.open).toBe(true);
    expect(scene.saveStage).toHaveBeenCalledWith(geode, 1);
    expect(scene.findSticker).toHaveBeenCalledWith('ember.geode', expect.any(Number), expect.any(Number));
  });

  it('leaves a geode alone once it is already open', () => {
    const { newt, make } = setup();
    expect(newt.accepts(make(Geode, { id: 'geode', kind: 'geode', x: 0, y: 0, stage: 1 }))).toBe(false);
  });

  it('takes nothing else while it is busy', () => {
    const { newt, make } = setup();
    newt.busy = true;
    expect(newt.accepts(make(Geode, { id: 'geode', kind: 'geode', x: 0, y: 0 }))).toBe(false);
  });
});
