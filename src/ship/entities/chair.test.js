import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Chair } from './props.js';
import { Critter } from './bluebell.js';
import { Girl } from './girl.js';
import { Teddy } from './items.js';
import { CHAIR } from '../layout.js';

const assets = { chair: {}, critter: {}, teddy: {}, girl: () => ({}), emotes: {} };

// Just enough of the ship for the chair, the girl and a friend to play in.
function setup() {
  const scene = {
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve() },
    entities: [],
    persist: vi.fn(),
    settle: vi.fn(),
    putDown: vi.fn(),
    dust: vi.fn(),
  };
  const chair = new Chair(assets);
  const girl = new Girl(assets, 100, 136, {});
  const friend = new Critter(assets, { id: 'critter', kind: 'critter', x: 150, y: 132 });
  for (const e of [chair, girl, friend]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { chair, girl });
  return { scene, chair, girl, friend };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Chair', () => {
  it('takes a friend dropped on it, and sits them in the seat', () => {
    const { chair, friend } = setup();
    expect(chair.accepts(friend)).toBe(true);
    chair.receive(friend);
    expect(chair.occupant).toBe(friend);
    expect(friend.seat).toBe(chair);
    expect(friend.x).toBe(chair.x);
  });

  it('only takes friends, not other things', () => {
    const { chair } = setup();
    expect(chair.accepts(new Teddy(assets, { id: 't', kind: 'teddy', x: 0, y: 0 }))).toBe(false);
  });

  it('remembers the friend on the floor beside the chair, not in the seat', () => {
    const { scene, chair, friend } = setup();
    chair.receive(friend);
    expect(scene.settle).toHaveBeenCalledWith(friend, CHAIR.hopOut.x, CHAIR.hopOut.y);
  });

  it('when she needs the pilot seat, the friend in it hops down beside it', () => {
    const { scene, chair, girl, friend } = setup();
    chair.receive(friend);
    chair.seat();
    expect(chair.occupant).toBe(girl);
    expect(friend.seat).toBe(null);
    expect(scene.putDown).toHaveBeenCalledWith(friend, CHAIR.hopOut.x, CHAIR.hopOut.y);
  });

  it('turns a friend away when she is already sitting in it', () => {
    const { chair, girl, friend } = setup();
    chair.seat();
    expect(chair.occupant).toBe(girl);
    expect(chair.accepts(friend)).toBe(false);
  });

  it('will not seat her when a friend is in it: she falls beside it instead', async () => {
    const { chair, girl, friend } = setup();
    chair.receive(friend);
    girl.onDragStart();
    girl.x = chair.x;
    girl.y = chair.y;
    await girl.onDrop();
    expect(girl.mode).toBe('idle');
    expect(chair.occupant).toBe(friend);
  });

  it('frees the seat when the friend is dragged out', () => {
    const { chair, friend } = setup();
    chair.receive(friend);
    friend.onDragStart({ x: friend.x, y: friend.y - 8 });
    expect(chair.occupant).toBe(null);
    expect(friend.seat).toBe(null);
    expect(chair.accepts(friend)).toBe(true);
  });

  it('spins with the friend aboard when the friend is tapped', () => {
    const { chair, friend } = setup();
    chair.receive(friend);
    friend.onTap();
    expect(chair.spinning).toBe(true);
    expect(chair.occupant).toBe(friend);
  });

  it('just spins (without fetching her) when tapped with a friend aboard', async () => {
    const { chair, girl, friend } = setup();
    chair.receive(friend);
    await chair.use();
    expect(chair.occupant).toBe(friend);
    expect(girl.mode).toBe('idle');
  });
});
