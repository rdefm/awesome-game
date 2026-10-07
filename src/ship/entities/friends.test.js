import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Critter, Local } from './bluebell.js';
import { Girl } from './girl.js';
import { Teddy } from './items.js';

const assets = { critter: {}, local: {}, teddy: {}, girl: () => ({}), emotes: {} };

// Just enough of a place for the girl and two friends to play in.
function setup() {
  const scene = {
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve() },
    entities: [],
    persist: vi.fn(),
    settle: vi.fn(),
    putDown: vi.fn(() => Promise.resolve()),
    hearts: vi.fn(),
    sparkles: vi.fn(),
    dust: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  const critter = new Critter(assets, { id: 'critter', kind: 'critter', x: 150, y: 132 });
  const local = new Local(assets, { id: 'local', kind: 'local', x: 60, y: 140 });
  for (const e of [girl, critter, local]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  scene.engine.scene = scene;
  return { scene, girl, critter, local };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('a friend dropped on the girl', () => {
  it('is welcomed by her', () => {
    const { girl, critter, local } = setup();
    expect(girl.accepts(critter)).toBe(true);
    expect(girl.accepts(local)).toBe(true);
  });

  it('lands on the floor beside her, and they greet each other with hearts', async () => {
    const { scene, girl, local } = setup();
    local.x = girl.x + 3;
    await girl.receive(local);
    const [item, x, y] = scene.putDown.mock.calls[0];
    expect(item).toBe(local);
    expect(Math.abs(x - girl.x)).toBeGreaterThan(8);
    expect(y).toBe(girl.y);
    expect(scene.hearts).toHaveBeenCalled();
    expect(girl.emote?.kind).toBe('heart');
  });

  it('is free to be picked up again once the greeting is over', async () => {
    const { girl, critter } = setup();
    const greeting = girl.receive(critter);
    expect(critter.draggable).toBe(false);
    expect(girl.accepts(critter)).toBe(false);
    await greeting;
    expect(critter.draggable).toBe(true);
    expect(critter.busy).toBe(false);
  });

  it('still leaves the teddy to her hug', () => {
    const { girl } = setup();
    expect(girl.accepts(new Teddy(assets, { id: 't', kind: 'teddy', x: 0, y: 0 }))).toBe(true);
  });
});

describe('a friend dropped on another friend', () => {
  it('is taken up for a game, whichever friends they are', () => {
    const { critter, local } = setup();
    expect(local.accepts(critter)).toBe(true);
    expect(critter.accepts(local)).toBe(true);
  });

  it('lands beside them, and both are remembered on the floor side by side', async () => {
    const { scene, critter, local } = setup();
    await local.receive(critter);
    const [item, x, y] = scene.putDown.mock.calls[0];
    expect(item).toBe(critter);
    expect(Math.abs(x - local.x)).toBeGreaterThan(8);
    expect(y).toBe(local.y);
    expect(scene.settle).toHaveBeenCalledWith(critter);
    expect(scene.settle).toHaveBeenCalledWith(local);
  });

  it('stops a hopping friend in its tracks to play', async () => {
    const { scene, critter, local } = setup();
    critter.hop = { fromX: 150, fromY: 132, toX: 162, toY: 132, p: 0.5, dur: 0.32, height: 5 };
    critter.lift = 4;
    await critter.receive(local);
    expect(critter.hop).toBe(null);
    expect(critter.lift).toBe(0);
    expect(scene.putDown.mock.calls[0][1]).toBe(critter.x - 16); // (beside where it stopped, on the local's side)
  });

  it('is not remembered by a place she has already left', async () => {
    const { scene, critter, local } = setup();
    const game = local.receive(critter);
    scene.engine.scene = {};
    await game;
    expect(scene.settle).not.toHaveBeenCalled();
    expect(critter.draggable).toBe(true);
  });

  it('they bounce and twirl together, giggling', async () => {
    const { scene, critter, local } = setup();
    await critter.receive(local);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('giggle');
    const twirled = scene.engine.tweens.to.mock.calls.filter(([, to]) => 'turn' in to).map(([who]) => who);
    expect(twirled).toContain(critter);
    expect(twirled).toContain(local);
  });

  it('neither joins another game until this one is over', async () => {
    const { scene, critter, local } = setup();
    const other = new Critter(assets, { id: 'critter2', kind: 'critter', x: 40, y: 140 });
    other.scene = scene;
    const game = local.receive(critter);
    expect(local.accepts(other)).toBe(false);
    expect(critter.accepts(other)).toBe(false);
    expect(critter.draggable).toBe(false);
    await game;
    expect(local.accepts(other)).toBe(true);
    expect(critter.accepts(other)).toBe(true);
  });
});
