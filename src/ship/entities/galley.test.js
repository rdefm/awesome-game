import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MIXING_POT } from '../layout.js';
import { RECIPES } from '../recipes.js';
import { MumYeti } from './frosty.js';
import { MixingPot } from './galley.js';
import { Girl } from './girl.js';
import { Snack } from './items.js';

const assets = {
  mixingPot: [{}, {}], snowball: {}, firebloom: [[{}]], teddy: {}, mumYeti: {}, snacks: {}, girl: () => ({}), emotes: {},
};

// Just enough of the galley for its pot.
function setup() {
  const scene = {
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve() },
    entities: [],
    world: { placed: {}, bag: [] },
    scripted: vi.fn((run) => run()),
    settle: vi.fn(),
    remove: vi.fn(),
    add: vi.fn(),
    useUp: vi.fn(),
    putDown: vi.fn(() => Promise.resolve()),
    spawn: vi.fn((kind, x, y) => ({ id: `${kind}0`, kind, x, y })),
    learnRecipe: vi.fn(),
    toast: vi.fn(),
    sparkles: vi.fn(),
    bits: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  girl.scene = scene;
  scene.girl = girl;
  const pot = Object.assign(new MixingPot(assets), { scene });
  return { scene, pot };
}

const thing = (kind, n = 0) => ({ id: `${kind}${n}`, kind, x: MIXING_POT.x, y: MIXING_POT.y - 20 });
const played = (scene, sound) => scene.engine.audio.play.mock.calls.filter(([s]) => s === sound);

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the mixing pot', () => {
  it('takes one thing and waits for a second', () => {
    const { scene, pot } = setup();
    const snowball = thing('snowball');
    expect(pot.accepts(snowball)).toBe(true);
    pot.receive(snowball);
    expect(scene.remove).toHaveBeenCalledWith(snowball);
    expect(scene.settle).toHaveBeenCalledWith(snowball, MIXING_POT.out.x, MIXING_POT.out.y);
    expect(pot.inside).toHaveLength(1);
    expect(scene.scripted).not.toHaveBeenCalled();
    expect(played(scene, 'plop')).toHaveLength(1);
  });

  it('won\'t take friends', () => {
    const { pot } = setup();
    expect(pot.accepts(new MumYeti(assets, { id: 'mumYeti', kind: 'mumYeti', x: 0, y: 0 }))).toBe(false);
  });

  it('makes the new food from a recipe: both things are used up, and the recipe is learned', async () => {
    const { scene, pot } = setup();
    const [snowball, flower] = [thing('snowball'), thing('firebloom')];
    pot.receive(snowball);
    expect(pot.accepts(flower)).toBe(true);
    await pot.receive(flower);
    const cocoa = RECIPES.find((r) => r.id === 'cocoa');
    expect(scene.useUp).toHaveBeenCalledWith(snowball);
    expect(scene.useUp).toHaveBeenCalledWith(flower);
    expect(scene.spawn).toHaveBeenCalledWith('cocoa', expect.any(Number), expect.any(Number));
    expect(scene.putDown).toHaveBeenCalledWith(expect.objectContaining({ kind: 'cocoa' }), MIXING_POT.out.x, MIXING_POT.out.y);
    expect(scene.learnRecipe).toHaveBeenCalledWith(cocoa, expect.any(Number), expect.any(Number));
    expect(played(scene, 'burp')).toHaveLength(1);
    expect(pot.inside).toEqual([]);
    expect(pot.bubbling).toBe(false);
  });

  it('fizzles a mix that isn\'t a recipe, and gives both things back', async () => {
    const { scene, pot } = setup();
    const [snowball, teddy] = [thing('snowball'), thing('teddy')];
    pot.receive(snowball);
    await pot.receive(teddy);
    expect(played(scene, 'fizzle')).toHaveLength(1);
    expect(scene.useUp).not.toHaveBeenCalled();
    expect(scene.spawn).not.toHaveBeenCalled();
    expect(scene.add).toHaveBeenCalledWith(snowball);
    expect(scene.add).toHaveBeenCalledWith(teddy);
    expect(scene.putDown).toHaveBeenCalledTimes(2);
    expect(pot.inside).toEqual([]);
    expect(pot.accepts(thing('snowball', 1))).toBe(true);
  });

  it('takes nothing more while it\'s bubbling', () => {
    const { pot } = setup();
    pot.bubbling = true;
    expect(pot.accepts(thing('snowball'))).toBe(false);
  });
});

describe('galley foods', () => {
  it('can be fed to friends', () => {
    const { scene } = setup();
    const yeti = Object.assign(new MumYeti(assets, { id: 'mumYeti', kind: 'mumYeti', x: 0, y: 0 }), { scene });
    for (const { makes } of RECIPES) {
      expect(yeti.accepts(new Snack(assets, { id: `${makes}0`, kind: makes, x: 0, y: 0 }))).toBe(true);
    }
  });
});
