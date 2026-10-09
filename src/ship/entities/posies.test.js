import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PINK_ALIEN } from '../talks/pinkAlien.js';
import { isFriend, makeCarryable } from '../kinds.js';
import { CROWN_MEMORY, DEFAULT_LOOK, normalizeLook, optionsFor } from '../look.js';
import { BYE, choose, current, next, startTalk } from '../talk.js';
import { defaultWorld, normalizeWorld, stash } from '../world.js';
import { Critter, Local, POSY_MEMORY } from './bluebell.js';
import { POSIES_FOR_CROWN, normalizePosies } from './crown.js';
import { Girl } from './girl.js';
import { Teddy } from './items.js';
import { MAX_POSIES, Posy, PosyPatch } from './posies.js';

const assets = {
  critter: {}, local: {}, teddy: {}, posy: {}, posyPatch: {},
  girl: () => ({}), emotes: {},
};

// Just enough of the meadow (and her save) for picking posies.
function setup() {
  const scene = {
    width: 512,
    busy: false,
    look: { ...DEFAULT_LOOK },
    memories: [],
    stickers: [],
    posies: 0,
    engine: {
      audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve(),
    },
    entities: [],
    putDown: vi.fn((item, x, y) => Object.assign(item, { x, y }) && Promise.resolve()),
    spawn: vi.fn((kind, x, y) => {
      const item = makeCarryable(assets, { id: `${kind}${scene.entities.length}`, kind, x, y });
      item.scene = scene;
      scene.entities.push(item);
      return item;
    }),
    remove: vi.fn((e) => {
      scene.entities = scene.entities.filter((o) => o !== e);
    }),
    useUp: vi.fn(),
    savePosies: vi.fn((n) => {
      scene.posies = n;
    }),
    saveLook: vi.fn((look) => {
      scene.look = look;
    }),
    remember: vi.fn((m) => {
      scene.memories = [...scene.memories, m];
    }),
    interact: vi.fn(),
    settle: vi.fn(),
    persist: vi.fn(),
    toast: vi.fn(),
    hearts: vi.fn(),
    sparkles: vi.fn(),
    bits: vi.fn(),
    dust: vi.fn(),
  };
  scene.engine.scene = scene;
  const girl = new Girl(assets, 300, 140, {});
  girl.act = vi.fn(() => Promise.resolve());
  const add = (e) => Object.assign(e, { scene }) && scene.entities.push(e) && e;
  add(girl);
  Object.assign(scene, { girl });
  const patch = add(new PosyPatch(assets));
  return { scene, girl, patch, add };
}

// Everything said in a chat, picking these choice texts in turn (then "Bye!").
function playThrough(tree, facts, picks = []) {
  const said = [];
  let talk = startTalk(tree, facts);
  for (let step = current(talk); step; step = current(talk)) {
    if (step.line) {
      said.push(step.line.text);
      talk = next(talk);
    } else {
      const pick = picks.shift() ?? BYE.text;
      talk = choose(talk, step.choices.findIndex((c) => c.text === pick));
    }
  }
  return said;
}

const posy = (id = 'posy0') => makeCarryable(assets, { id, kind: 'posy', x: 300, y: 140 });

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('a posy', () => {
  it('is a carryable thing, not a friend, and goes in the bag', () => {
    expect(posy()).toBeInstanceOf(Posy);
    expect(isFriend('posy')).toBe(false);
    const world = stash(normalizeWorld({ placed: { bluebell: [{ id: 'posy0', kind: 'posy', x: 300, y: 140 }] }, bag: [] }), 'posy0');
    expect(world.bag).toEqual([{ id: 'posy0', kind: 'posy' }]);
    expect(normalizeWorld(world).bag).toEqual([{ id: 'posy0', kind: 'posy' }]);
  });
});

describe('the posy patch', () => {
  it('gives a posy each tap', async () => {
    const { scene, patch } = setup();
    await patch.use();
    await patch.use();
    expect(scene.spawn.mock.calls.map(([kind]) => kind)).toEqual(['posy', 'posy']);
    expect(scene.putDown).toHaveBeenCalledTimes(2);
  });

  it('stops giving once there are lots of posies lying about it', async () => {
    const { scene, patch } = setup();
    for (let i = 0; i < MAX_POSIES + 2; i++) {
      await patch.use();
    }
    expect(scene.spawn).toHaveBeenCalledTimes(MAX_POSIES);
    expect(scene.toast).toHaveBeenCalled();
  });

  it('has her stand beside it to pick', () => {
    const { patch } = setup();
    expect(Math.abs(patch.spot.x - patch.x)).toBeGreaterThan(patch.half);
  });
});

describe('weaving a flower crown', () => {
  it('she takes posies dropped on her', () => {
    const { girl } = setup();
    expect(girl.accepts(posy())).toBe(true);
    expect(girl.accepts(new Teddy(assets, { id: 't', kind: 'teddy', x: 0, y: 0 }))).toBe(true); // (as ever)
  });

  it('weaves each posy dropped on her in, and the third makes a crown she puts on', async () => {
    const { scene, girl } = setup();
    for (let i = 0; i < POSIES_FOR_CROWN - 1; i++) {
      const p = posy(`posy${i}`);
      await girl.receive(p);
      expect(scene.useUp).toHaveBeenCalledWith(p);
      expect(scene.posies).toBe(i + 1);
      expect(scene.look.hat).toBe('none');
    }
    await girl.receive(posy('posyLast'));
    expect(scene.look.hat).toBe('flowers');
    expect(scene.memories).toContain(CROWN_MEMORY);
    expect(scene.posies).toBe(0);
    expect(optionsFor('hat', scene.memories)).toContain('flowers');
  });

  it('once she has her crown, posies are just posies', async () => {
    const { scene, girl } = setup();
    scene.memories = [CROWN_MEMORY];
    expect(girl.accepts(posy())).toBe(false);
  });

  it('keeps her place in the weaving across saves', () => {
    expect(normalizePosies(undefined)).toBe(0);
    expect(normalizePosies(2)).toBe(2);
    expect(normalizePosies(POSIES_FOR_CROWN)).toBe(0);
    expect(normalizePosies('lots')).toBe(0);
  });
});

describe('the pink alien and a posy', () => {
  function alien() {
    const { scene, add } = setup();
    const local = add(new Local(assets, { id: 'local', kind: 'local', x: 200, y: 140 }));
    local.boing = vi.fn();
    return { scene, local };
  }

  it('sniffs it, sneezes happily and keeps it beside it', async () => {
    const { scene, local } = alien();
    const p = posy();
    expect(local.accepts(p)).toBe(true);
    await local.receive(p);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('sneeze');
    expect(scene.useUp).not.toHaveBeenCalled();
    expect(Math.abs(p.x - local.x)).toBeLessThan(20);
    expect(scene.memories).toContain(POSY_MEMORY);
    expect(local.busy).toBe(false);
  });

  it('talks about posies before, and its own posy after', async () => {
    const { local } = alien();
    expect(local.chat().facts.gotPosy).toBe(false);
    await local.receive(posy());
    expect(local.chat().facts.gotPosy).toBe(true);
    const said = (facts) => playThrough(PINK_ALIEN, facts, ['WHAT IS THIS PLACE?']).join(' ');
    expect(said({ gotPosy: false })).toMatch(/POSIES/);
    expect(said({ gotPosy: true })).toMatch(/MY POSY/);
  });
});

describe('friends', () => {
  it('can wear the flower crown', () => {
    const critter = new Critter(assets, { id: 'critter', kind: 'critter', x: 0, y: 0, hat: 'flowers' });
    expect(critter.hat).toBe('flowers');
  });
});

describe('old saves', () => {
  it('load fine without posies or a crown', () => {
    const old = { placed: { ship: [], bluebell: [{ id: 'local', kind: 'local', x: 200, y: 140 }] }, bag: [] };
    const world = normalizeWorld(old);
    expect(world.placed.bluebell.length).toBe(defaultWorld().placed.bluebell.length);
    expect(normalizeLook({ hair: 'gold', hat: 'crown' })).toEqual({ ...DEFAULT_LOOK, hair: 'gold', hat: 'crown' });
  });
});
