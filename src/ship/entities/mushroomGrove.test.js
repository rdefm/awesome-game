import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isFriend, makeCarryable } from '../kinds.js';
import { TALKS } from '../talks/index.js';
import { defaultWorld, find, normalizeWorld } from '../world.js';
import { isFriendItem } from './friends.js';
import { Girl } from './girl.js';
import { MushroomCreature } from './mushroomGrove.js';

const assets = { shroomCreature: {}, girl: () => ({}), emotes: {}, snacks: {} };

// Just enough of the mushroom grove for the creature (tweens jump straight to
// where they're going).
function setup(stage) {
  const scene = {
    where: 'mushroomgrove',
    engine: {
      audio: { play: vi.fn() },
      tweens: { to: vi.fn((obj, props) => Promise.resolve(Object.assign(obj, props))), cancel: vi.fn() },
      wait: () => Promise.resolve(),
    },
    entities: [],
    busy: false,
    width: 320,
    stickers: [],
    memories: [],
    bits: vi.fn(),
    sparkles: vi.fn(),
    musicNote: vi.fn(),
    hearts: vi.fn(),
    settle: vi.fn(),
    saveStage: vi.fn(),
    interact: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  };
  scene.engine.scene = scene;
  const girl = new Girl(assets, 60, 140, {});
  const shroom = new MushroomCreature(assets, { id: 'shroom', kind: 'shroom', x: 156, y: 128, ...(stage === undefined ? {} : { stage }) });
  for (const e of [girl, shroom]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  scene.girl = girl;
  return { scene, girl, shroom };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the shy mushroom creature', () => {
  it('lives in the mushroom grove, and turns up there in an old save', () => {
    expect(find(defaultWorld(), 'shroom')).toMatchObject({ kind: 'shroom' });
    const old = { placed: { bluebell: [], mushroomgrove: [] }, bag: [] };
    expect(normalizeWorld(old).placed.mushroomgrove.map((e) => e.id)).toContain('shroom');
    expect(isFriend('shroom')).toBe(true);
    expect(makeCarryable(assets, find(defaultWorld(), 'shroom'))).toBeInstanceOf(MushroomCreature);
  });

  it("can't be picked up, fed or played with before its first dance", () => {
    const { shroom } = setup();
    expect(shroom.friendly).toBe(false);
    expect(shroom.draggable).toBe(false);
    expect(shroom.free).toBe(false);
    expect(shroom.accepts({ kind: 'cookie', seatFrame: undefined })).toBe(false);
  });

  it('hides when she comes near, and pops out again when she steps away', () => {
    const { girl, shroom } = setup();
    girl.x = shroom.x - 10;
    girl.y = shroom.y;
    shroom.update(0.1);
    expect(shroom.hidden).toBe(true);
    girl.x = shroom.x - 120;
    shroom.update(1);
    shroom.update(1);
    expect(shroom.hidden).toBe(false);
  });

  it('only peeks the first two times, then dances and becomes a friend for good', async () => {
    const { scene, shroom } = setup();
    await shroom.use();
    await shroom.use();
    expect(shroom.friendly).toBe(false);
    expect(scene.saveStage).not.toHaveBeenCalled();
    await shroom.use();
    expect(shroom.friendly).toBe(true);
    expect(shroom.draggable).toBe(true);
    expect(scene.saveStage).toHaveBeenCalledWith(shroom, 1);
  });

  it('is a friend straight away once it has danced (in the save)', () => {
    const { girl, shroom } = setup(1);
    expect(shroom.friendly).toBe(true);
    expect(shroom.draggable).toBe(true);
    expect(shroom.free).toBe(true);
    expect(isFriendItem(shroom)).toBe(true);
    // ...and doesn't hide from her any more.
    girl.x = shroom.x - 10;
    girl.y = shroom.y;
    shroom.update(0.1);
    expect(shroom.hidden).toBe(false);
  });

  it('as a friend, takes snacks and other friends', () => {
    const { shroom } = setup(1);
    expect(shroom.accepts({ kind: 'cookie' })).toBe(true);
    expect(shroom.accepts({ kind: 'ball' })).toBe(false);
    expect(shroom.accepts({ kind: 'monkey', seatFrame: () => null })).toBe(true);
  });

  it('as a friend, giggles and dances when tapped and then offers a chat', async () => {
    const { scene, shroom } = setup(1);
    await shroom.onTap();
    expect(scene.interact).not.toHaveBeenCalled();
    expect(shroom.busy).toBe(false);
    expect(shroom.chat().tree).toBe(TALKS.shroom);
    expect(shroom.chat().facts).toEqual({ home: true });
    expect(scene.add).toHaveBeenCalled(); // the chat bubble
  });
});
