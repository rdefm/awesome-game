import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Girl } from './girl.js';
import { Ball, Snack } from './items.js';
import { Gonzo, Monkey } from './shipFriends.js';

const assets = { monkey: {}, gonzo: {}, ball: {}, snacks: {}, girl: () => ({}), emotes: {} };

// Just enough of the ship for Monkey and Gonzo.
function setup() {
  const scene = {
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve() },
    entities: [],
    settle: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    useUp: vi.fn(),
    putDown: vi.fn(() => Promise.resolve()),
    hearts: vi.fn(),
    sparkles: vi.fn(),
    bits: vi.fn(),
    dust: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  const monkey = new Monkey(assets, { id: 'monkey', kind: 'monkey', x: 180, y: 140 });
  const gonzo = new Gonzo(assets, { id: 'gonzo', kind: 'gonzo', x: 60, y: 140 });
  for (const e of [girl, monkey, gonzo]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  scene.engine.scene = scene;
  const make = (Kind, state) => Object.assign(new Kind(assets, state), { scene });
  return { scene, girl, monkey, gonzo, make };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Monkey and Gonzo', () => {
  it('play together, and gobble snacks', () => {
    const { monkey, gonzo, make } = setup();
    expect(monkey.accepts(gonzo)).toBe(true);
    expect(gonzo.accepts(monkey)).toBe(true);
    for (const friend of [monkey, gonzo]) {
      expect(friend.accepts(make(Snack, { id: 'c', kind: 'cookie', x: 0, y: 0 }))).toBe(true);
    }
  });

  it('Monkey backflips when tapped, and is free again after', async () => {
    const { scene, monkey } = setup();
    await monkey.backflip();
    expect(scene.engine.audio.play).toHaveBeenCalledWith('oohooh');
    expect(scene.engine.tweens.to.mock.calls.some(([who, to]) => who === monkey && 'turn' in to)).toBe(true);
    expect(monkey.busy).toBe(false);
    expect(monkey.draggable).toBe(true);
  });

  it('Monkey boots a ball dropped on him; Gonzo leaves it be', async () => {
    const { monkey, gonzo, make } = setup();
    const ball = make(Ball, { id: 'ball', kind: 'ball', x: 170, y: 140 });
    expect(gonzo.accepts(ball)).toBe(false);
    expect(monkey.accepts(ball)).toBe(true);
    await monkey.receive(ball);
    expect(ball.roll?.dir).toBe(-1);
    expect(monkey.busy).toBe(false);
  });

  it('Gonzo does a stunt when tapped, ta-da!', async () => {
    const { scene, gonzo } = setup();
    await gonzo.stunt();
    expect(scene.engine.audio.play).toHaveBeenCalledWith('tada');
    expect(scene.hearts).toHaveBeenCalled();
    expect(gonzo.busy).toBe(false);
  });
});
