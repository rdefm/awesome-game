import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isFriend, makeCarryable } from '../kinds.js';
import { TALKS } from '../talks/index.js';
import { defaultWorld, find, normalizeWorld } from '../world.js';
import { isFriendItem } from './friends.js';
import { Girl } from './girl.js';
import { FairyRing, MushroomCreature, TINY } from './mushroomGrove.js';

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

describe('the fairy ring', () => {
  // The grove with a fairy ring in it; `steps` seconds of frames pass.
  function withRing(stage) {
    const s = setup(stage);
    const ring = new FairyRing({});
    ring.scene = s.scene;
    s.scene.entities.push(ring);
    const run = (seconds) => {
      for (let t = 0; t < seconds; t += 0.05) {
        ring.update(0.05);
      }
    };
    return { ...s, ring, run };
  }

  const into = (who, ring) => Object.assign(who, { x: ring.x, y: ring.y });

  it('shrinks her down tiny when she steps inside, and grows her back with a pop when she steps out', () => {
    const { scene, girl, ring, run } = withRing();
    girl.x = ring.x + ring.rx + 30;
    run(0.2); // settles in (she's outside)
    expect(girl.scale).toBe(1);
    into(girl, ring);
    run(1);
    expect(girl.scale).toBe(TINY);
    girl.x = ring.x - ring.rx - 20;
    run(1);
    expect(girl.scale).toBe(1);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('pop');
  });

  it('sends her to the middle when tapped, and back out (on her side) when tapped with her in it', () => {
    const { girl, ring } = withRing();
    girl.x = ring.x - 40;
    expect(ring.spot).toEqual({ x: ring.x, y: ring.y });
    into(girl, ring);
    girl.x -= 2;
    expect(ring.holds(ring.spot)).toBe(false);
    expect(ring.spot.x).toBeLessThan(ring.x);
  });

  it("doesn't shrink her while she's just walking through it on her way somewhere", () => {
    const { girl, ring, run } = withRing();
    girl.x = ring.x + ring.rx + 30;
    run(0.1);
    into(girl, ring);
    girl.mode = 'walk';
    run(1);
    expect(girl.scale).toBe(1);
  });

  it('makes her steps squeak while she is tiny', () => {
    const { scene, girl, ring, run } = withRing();
    into(girl, ring);
    run(1);
    scene.engine.audio.play.mockClear();
    girl.mode = 'walk';
    run(0.5);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('tinystep');
  });

  it('grows her back if she is picked up out of it', () => {
    const { girl, ring, run } = withRing();
    into(girl, ring);
    run(1);
    girl.mode = 'held';
    run(1);
    expect(girl.scale).toBe(1);
  });

  it('shrinks a friend dropped in it, and grows it back when it is picked up', () => {
    const { shroom, ring, run } = withRing(1);
    into(shroom, ring);
    run(1);
    expect(shroom.shrinkScale).toBe(TINY);
    shroom.held = true;
    run(1);
    expect(shroom.shrinkScale).toBe(1);
  });

  it("doesn't shrink a friend while it's still falling in", () => {
    const { shroom, ring, run } = withRing(1);
    into(shroom, ring);
    shroom.falling = true;
    run(1);
    expect(shroom.shrinkScale).toBe(1);
  });

  it('is already tiny on a reload inside it, and never saves anyone being tiny', () => {
    const { scene, girl, shroom, ring } = withRing(1);
    into(girl, ring);
    into(shroom, ring);
    ring.update(0.05);
    expect(girl.scale).toBe(TINY);
    expect(shroom.shrinkScale).toBe(TINY);
    expect(scene.saveStage).not.toHaveBeenCalled();
    expect(scene.settle).not.toHaveBeenCalled();
    // Anywhere else she's a new girl, full size.
    expect(new Girl(assets, ring.x, ring.y, {}).scale).toBe(1);
  });
});
