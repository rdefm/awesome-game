import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CANOPY, deckSpot, ropeEnd } from '../layout.js';
import { Girl } from './girl.js';
import { SwingRope, deckAngle, smackAngle, smacksIntoTree } from './mrMonkey.js';
import { Gonzo, Monkey } from './shipFriends.js';
import { MumYeti } from './frosty.js';

const assets = { monkey: {}, gonzo: {}, mumYeti: {}, ropeBranch: {}, girl: () => ({}), emotes: {}, snacks: {} };

// Just enough of Mr Monkey's far stretch for the rope (tweens jump straight
// to where they're going).
function setup() {
  const scene = {
    engine: {
      audio: { play: vi.fn() },
      tweens: { to: vi.fn((obj, props) => Promise.resolve(Object.assign(obj, props))), cancel: vi.fn() },
      wait: () => Promise.resolve(),
    },
    entities: [],
    busy: false,
    width: 512,
    bits: vi.fn(),
    dust: vi.fn(),
    hearts: vi.fn(),
    settle: vi.fn(),
    findSticker: vi.fn(),
  };
  scene.engine.scene = scene;
  const girl = new Girl(assets, 300, 140, {});
  const rope = new SwingRope(assets);
  for (const e of [girl, rope]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  scene.girl = girl;
  const friend = (Kind, kind) => Object.assign(new Kind(assets, { id: kind, kind, x: 380, y: 90 }), { scene });
  return { scene, rope, friend };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the rope between the climbing trees', () => {
  it('reaches her hands up on either platform', () => {
    for (const i of [0, 1]) {
      const end = ropeEnd(deckAngle(i));
      expect(end.x).toBeCloseTo(deckSpot(i).x);
      expect(end.y + CANOPY.grip).toBeCloseTo(CANOPY.ground - CANOPY.deck);
    }
  });

  it('swings further than a platform to smack into the trunk beyond it', () => {
    expect(smackAngle(1)).toBeGreaterThan(deckAngle(1));
    expect(smackAngle(0)).toBeLessThan(deckAngle(0));
  });

  it('is too fast for Monkey and Gonzo, and nobody else', () => {
    expect(smacksIntoTree('monkey')).toBe(true);
    expect(smacksIntoTree('gonzo')).toBe(true);
    expect(smacksIntoTree('mumYeti')).toBe(false);
    expect(smacksIntoTree('crew')).toBe(false);
  });

  it('takes any friend dropped on it, one at a time', () => {
    const { rope, friend } = setup();
    expect(rope.accepts(friend(MumYeti, 'mumYeti'))).toBe(true);
    expect(rope.accepts({ kind: 'ball' })).toBe(false);
    rope.busy = true;
    expect(rope.accepts(friend(MumYeti, 'mumYeti'))).toBe(false);
  });

  it('swings a friend across to land on the other platform, then it hops down', async () => {
    const { scene, rope, friend } = setup();
    const yeti = friend(MumYeti, 'mumYeti');
    await rope.receive(yeti);
    expect(rope.side).toBe(1);
    expect(rope.angle).toBeCloseTo(deckAngle(1));
    expect(yeti.lift).toBe(0);
    expect(yeti.y).toBe(CANOPY.ground);
    expect(yeti.busy).toBe(false);
    expect(rope.busy).toBe(false);
    expect(scene.findSticker).not.toHaveBeenCalled();
    expect(scene.settle).toHaveBeenCalledWith(yeti);
  });

  it.each([[Monkey, 'monkey'], [Gonzo, 'gonzo']])('smacks %s into the far tree, and swings back without them', async (Kind, kind) => {
    const { scene, rope, friend } = setup();
    const who = friend(Kind, kind);
    await rope.receive(who);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('smack');
    expect(scene.findSticker).toHaveBeenCalledWith('mrmonkey.smack', expect.any(Number), expect.any(Number));
    expect(rope.side).toBe(0);
    expect(rope.angle).toBeCloseTo(deckAngle(0));
    expect(who.lift).toBe(0); // slid all the way down the trunk
    expect(who.busy).toBe(false);
    expect(rope.dizzy).toBe(null);
  });
});
