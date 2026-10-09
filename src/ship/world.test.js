import { describe, expect, it } from 'vitest';
import {
  add, bagContents, defaultWorld, discard, find, freshId, normalizeWorld, place, placedIn, setHat, setStage, stash,
} from './world.js';

const isFriend = (kind) => kind === 'critter';

describe('world', () => {
  it('puts a hat on a friend and keeps it through the bag and back out', () => {
    let w = setHat(defaultWorld(), 'critter', 'crown');
    expect(find(w, 'critter')).toMatchObject({ kind: 'critter', hat: 'crown' });
    w = stash(w, 'critter');
    expect(w.bag[0]).toEqual({ id: 'critter', kind: 'critter', hat: 'crown' });
    w = place(w, 'critter', 'ship', 90, 130);
    expect(find(w, 'critter')).toEqual({ id: 'critter', kind: 'critter', hat: 'crown', x: 90, y: 130 });
  });

  it('takes a hat off again with "none"', () => {
    const w = setHat(setHat(defaultWorld(), 'critter', 'bow'), 'critter', 'none');
    expect(find(w, 'critter')).not.toHaveProperty('hat');
  });

  it('leaves the world alone for a hat on something that is not there', () => {
    const w = defaultWorld();
    expect(setHat(w, 'nobody', 'bow')).toBe(w);
  });

  it('loads an old save with friends bareheaded', () => {
    const w = normalizeWorld(JSON.parse(JSON.stringify(defaultWorld())));
    expect(find(w, 'critter')).not.toHaveProperty('hat');
  });
  it('stashes a placed thing at the front of the bag', () => {
    let w = defaultWorld();
    w = stash(w, 'ball');
    w = stash(w, 'plant');
    expect(placedIn(w, 'ship').map((e) => e.id)).toEqual(['teddy', 'monkey', 'gonzo']);
    expect(w.bag).toEqual([{ id: 'plant', kind: 'plant' }, { id: 'ball', kind: 'ball' }]);
  });

  it('places a thing from the bag into another place', () => {
    let w = stash(defaultWorld(), 'critter');
    w = place(w, 'critter', 'ship', 100.4, 140.6);
    expect(w.bag).toEqual([]);
    expect(find(w, 'critter')).toEqual({ id: 'critter', kind: 'critter', x: 100, y: 141 });
    expect(placedIn(w, 'ship').some((e) => e.id === 'critter')).toBe(true);
    expect(placedIn(w, 'bluebell').some((e) => e.id === 'critter')).toBe(false);
  });

  it('moves a thing within a place without duplicating it', () => {
    const w = place(defaultWorld(), 'plant', 'ship', 50, 130);
    expect(placedIn(w, 'ship').filter((e) => e.id === 'plant')).toHaveLength(1);
    expect(find(w, 'plant')).toMatchObject({ x: 50, y: 130 });
  });

  it('keeps variants when stashing and placing', () => {
    let w = stash(defaultWorld(), 'bluebell2');
    expect(w.bag[0]).toEqual({ id: 'bluebell2', kind: 'bluebell', v: 2 });
    w = place(w, 'bluebell2', 'ship', 90, 130);
    expect(find(w, 'bluebell2')).toEqual({ id: 'bluebell2', kind: 'bluebell', v: 2, x: 90, y: 130 });
  });

  it('sets a growth stage on a thing wherever it is', () => {
    let w = setStage(defaultWorld(), 'plant', 1);
    expect(find(w, 'plant')).toEqual({ id: 'plant', kind: 'plant', stage: 1, x: 152, y: 120 });
    w = setStage(stash(w, 'plant'), 'plant', 2);
    expect(w.bag[0]).toEqual({ id: 'plant', kind: 'plant', stage: 2 });
    expect(setStage(w, 'nope', 1)).toBe(w);
  });

  it('keeps the growth stage through bag trips and reloads', () => {
    let w = setStage(defaultWorld(), 'plant', 2);
    w = stash(w, 'plant');
    expect(w.bag[0]).toEqual({ id: 'plant', kind: 'plant', stage: 2 });
    w = place(w, 'plant', 'bluebell', 80, 140);
    expect(find(w, 'plant')).toEqual({ id: 'plant', kind: 'plant', stage: 2, x: 80, y: 140 });
    w = normalizeWorld(JSON.parse(JSON.stringify(w)));
    expect(find(w, 'plant')).toMatchObject({ stage: 2 });
    expect(placedIn(w, 'ship').some((e) => e.id === 'plant')).toBe(false);
  });

  it('splits the bag into items and friends', () => {
    let w = stash(defaultWorld(), 'critter');
    w = stash(w, 'ball');
    expect(bagContents(w, isFriend, true).map((e) => e.id)).toEqual(['critter']);
    expect(bagContents(w, isFriend, false).map((e) => e.id)).toEqual(['ball']);
  });

  it('ignores unknown ids', () => {
    const w = defaultWorld();
    expect(stash(w, 'nope')).toBe(w);
    expect(place(w, 'nope', 'ship', 0, 0)).toBe(w);
    expect(discard(w, 'nope')).toBe(w);
  });

  it('discards a thing for good, wherever it is', () => {
    let w = discard(defaultWorld(), 'ball');
    expect(find(w, 'ball')).toBeNull();
    expect(placedIn(w, 'ship').map((e) => e.id)).toEqual(['plant', 'teddy', 'monkey', 'gonzo']);
    w = discard(stash(w, 'teddy'), 'teddy');
    expect(w.bag).toEqual([]);
    expect(find(w, 'teddy')).toBeNull();
  });

  it('adds a new thing to a place', () => {
    const w = add(defaultWorld(), 'ship', { id: 'cookie0', kind: 'cookie', x: 90.6, y: 130.2 });
    expect(find(w, 'cookie0')).toEqual({ id: 'cookie0', kind: 'cookie', x: 91, y: 130 });
    expect(placedIn(w, 'ship').at(-1).id).toBe('cookie0');
  });

  it('never adds a second thing with an id already in use', () => {
    const w = stash(defaultWorld(), 'ball');
    expect(add(w, 'ship', { id: 'ball', kind: 'cookie', x: 0, y: 0 })).toBe(w);
  });

  it('makes fresh ids that nothing in the world (or the bag) already has', () => {
    let w = defaultWorld();
    const first = freshId(w, 'cookie');
    expect(first).toBe('cookie0');
    w = add(w, 'ship', { id: first, kind: 'cookie', x: 90, y: 130 });
    expect(freshId(w, 'cookie')).toBe('cookie1');
    w = stash(add(w, 'ship', { id: 'cookie1', kind: 'cookie', x: 90, y: 130 }), 'cookie1');
    expect(freshId(w, 'cookie')).toBe('cookie2');
    // A used-up id can come round again: nothing has it any more.
    w = discard(w, 'cookie0');
    expect(freshId(w, 'cookie')).toBe('cookie0');
    // ...unless it's still in use somewhere outside the world.
    expect(freshId(w, 'cookie', ['cookie0', 'ball'])).toBe('cookie2');
  });

  it('restocking over and over never duplicates an id', () => {
    let w = defaultWorld();
    for (let i = 0; i < 20; i++) {
      w = add(w, 'ship', { id: freshId(w, 'juice'), kind: 'juice', x: 100, y: 130 });
      if (i % 3 === 0) {
        w = stash(w, `juice${i}`);
      }
    }
    const ids = [...Object.values(w.placed).flat(), ...w.bag].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id.startsWith('juice'))).toHaveLength(20);
  });

  it('falls back to the default world for junk saves', () => {
    expect(normalizeWorld(null)).toEqual(defaultWorld());
    expect(normalizeWorld('junk')).toEqual(defaultWorld());
  });

  it('keeps saved positions but adds things an old save has never seen', () => {
    const saved = { placed: { ship: [{ id: 'plant', kind: 'plant', x: 40, y: 130 }] }, bag: [{ id: 'ball', kind: 'ball' }] };
    const w = normalizeWorld(saved);
    expect(find(w, 'plant')).toMatchObject({ x: 40, y: 130 });
    expect(w.bag).toEqual([{ id: 'ball', kind: 'ball' }]);
    expect(placedIn(w, 'ship').filter((e) => e.id === 'ball')).toHaveLength(0);
    expect(find(w, 'critter')).toMatchObject({ x: 160, y: 132 });
  });

  it('gives an old save the bluebells along the far stretch of the meadow', () => {
    const saved = { placed: { bluebell: [{ id: 'bluebell0', kind: 'bluebell', x: 60, y: 140, v: 0 }] }, bag: [] };
    const w = normalizeWorld(saved);
    expect(find(w, 'bluebell0')).toMatchObject({ x: 60, y: 140 });
    const far = placedIn(w, 'bluebell').filter((e) => e.kind === 'bluebell' && e.x > 256);
    expect(far.map((e) => e.id)).toEqual(['bluebell4', 'bluebell5', 'bluebell6']);
  });

  it('gives an old save Ember\'s things, keeping her progress everywhere else', () => {
    const saved = {
      placed: {
        ship: [{ id: 'plant', kind: 'plant', x: 40, y: 130, stage: 2 }, { id: 'critter', kind: 'critter', x: 90, y: 140 }],
        bluebell: [{ id: 'crystal', kind: 'crystal', x: 120, y: 140 }],
      },
      bag: [{ id: 'bluebell1', kind: 'bluebell', v: 1 }],
    };
    const w = normalizeWorld(saved);
    expect(placedIn(w, 'ember').map((e) => e.id).sort()).toEqual(placedIn(defaultWorld(), 'ember').map((e) => e.id).sort());
    expect(find(w, 'plant')).toMatchObject({ x: 40, y: 130, stage: 2 });
    expect(find(w, 'critter')).toMatchObject({ x: 90, y: 140 });
    expect(placedIn(w, 'bluebell').some((e) => e.id === 'critter')).toBe(false);
    expect(w.bag).toEqual([{ id: 'bluebell1', kind: 'bluebell', v: 1 }]);
  });

  it('has a friend and things to carry lying about on Ember', () => {
    const kinds = placedIn(defaultWorld(), 'ember').map((e) => e.kind);
    expect(kinds).toContain('newt');
    expect(kinds).toContain('firebloom');
    expect(kinds).toContain('geode');
  });

  it('carries Ember things to the ship and to Bluebell, and home again', () => {
    let w = stash(stash(defaultWorld(), 'geode'), 'newt');
    expect(placedIn(w, 'ember').some((e) => e.id === 'geode' || e.id === 'newt')).toBe(false);
    w = place(w, 'geode', 'ship', 90, 130);
    w = place(w, 'newt', 'bluebell', 120, 140);
    w = setStage(w, 'geode', 1);
    w = place(stash(w, 'geode'), 'geode', 'ember', 150, 146);
    expect(find(w, 'geode')).toEqual({ id: 'geode', kind: 'geode', stage: 1, x: 150, y: 146 });
    expect(placedIn(w, 'bluebell').some((e) => e.id === 'newt')).toBe(true);
    w = normalizeWorld(JSON.parse(JSON.stringify(w)));
    expect(placedIn(w, 'ember').filter((e) => e.id === 'geode')).toHaveLength(1);
    expect(placedIn(w, 'ember').some((e) => e.id === 'newt')).toBe(false);
  });

  it('gives an old save Frosty\'s yetis and things, keeping her progress everywhere else', () => {
    const saved = {
      placed: { ship: [{ id: 'newt', kind: 'newt', x: 90, y: 140 }], ember: [{ id: 'geode', kind: 'geode', x: 150, y: 146, stage: 1 }] },
      bag: [{ id: 'firebloom0', kind: 'firebloom', v: 0 }],
    };
    const w = normalizeWorld(saved);
    expect(placedIn(w, 'frosty').map((e) => e.id).sort()).toEqual(placedIn(defaultWorld(), 'frosty').map((e) => e.id).sort());
    expect(find(w, 'newt')).toMatchObject({ x: 90, y: 140 });
    expect(find(w, 'geode')).toMatchObject({ stage: 1 });
    expect(w.bag).toEqual([{ id: 'firebloom0', kind: 'firebloom', v: 0 }]);
  });

  it('has a mum and baby yeti and things to carry lying about on Frosty', () => {
    const kinds = placedIn(defaultWorld(), 'frosty').map((e) => e.kind);
    expect(kinds).toEqual(expect.arrayContaining(['mumYeti', 'babyYeti', 'snowball', 'frostflower']));
  });

  it('gives an old save Candy\'s things and Ginger in her house, keeping her progress everywhere else', () => {
    const saved = {
      placed: { frosty: [{ id: 'mumYeti', kind: 'mumYeti', x: 120, y: 140 }] },
      bag: [{ id: 'snowball0', kind: 'snowball' }],
    };
    const w = normalizeWorld(saved);
    expect(placedIn(w, 'candy').map((e) => e.id).sort()).toEqual(placedIn(defaultWorld(), 'candy').map((e) => e.id).sort());
    expect(placedIn(w, 'gingerbread').map((e) => e.id)).toEqual(['ginger']);
    expect(find(w, 'mumYeti')).toMatchObject({ x: 120, y: 140 });
    expect(w.bag).toEqual([{ id: 'snowball0', kind: 'snowball' }]);
  });

  it('has Monkey and Gonzo on the ship from the start, and gives them to old saves', () => {
    expect(placedIn(defaultWorld(), 'ship').map((e) => e.kind)).toEqual(expect.arrayContaining(['monkey', 'gonzo']));
    const old = normalizeWorld({ placed: { ship: [{ id: 'teddy', kind: 'teddy', x: 60, y: 134 }] }, bag: [] });
    expect(find(old, 'monkey')).toMatchObject({ kind: 'monkey' });
    expect(find(old, 'gonzo')).toMatchObject({ kind: 'gonzo' });
  });

  it('has a gummy bear and sweets on Candy, and Ginger at home', () => {
    const kinds = placedIn(defaultWorld(), 'candy').map((e) => e.kind);
    expect(kinds).toEqual(expect.arrayContaining(['gummy', 'lollipop', 'gumdrop']));
    expect(placedIn(defaultWorld(), 'gingerbread').map((e) => e.kind)).toEqual(['ginger']);
  });

  it('gives an old save Stripey\'s things, keeping her progress everywhere else', () => {
    const saved = {
      placed: { candy: [{ id: 'gummy', kind: 'gummy', x: 120, y: 140 }] },
      bag: [{ id: 'lollipop0', kind: 'lollipop', v: 0 }],
    };
    const w = normalizeWorld(saved);
    expect(placedIn(w, 'stripey').map((e) => e.id).sort()).toEqual(placedIn(defaultWorld(), 'stripey').map((e) => e.id).sort());
    expect(find(w, 'gummy')).toMatchObject({ x: 120, y: 140 });
    expect(w.bag).toEqual([{ id: 'lollipop0', kind: 'lollipop', v: 0 }]);
  });

  it('has Zig and stripy things to carry lying about on Stripey', () => {
    const kinds = placedIn(defaultWorld(), 'stripey').map((e) => e.kind);
    expect(kinds).toEqual(expect.arrayContaining(['zig', 'stripestone', 'stripecactus']));
  });

  it('has the lava family at home in their house on Ember', () => {
    expect(placedIn(defaultWorld(), 'lavahouse').map((e) => e.kind)).toEqual(['lavaDad', 'lavaMum', 'lavaBaby']);
  });

  it('has the tree family and Sprout, their pet, at home in their tree on Mr Monkey', () => {
    expect(placedIn(defaultWorld(), 'treehouse').map((e) => e.kind)).toEqual(['treeDad', 'treeMum', 'treeKid', 'sprout']);
  });

  it('gives an old save the tree family, keeping her progress everywhere else', () => {
    const saved = { placed: { ship: [{ id: 'monkey', kind: 'monkey', x: 60, y: 140 }] }, bag: [] };
    const w = normalizeWorld(saved);
    expect(placedIn(w, 'treehouse').map((e) => e.id)).toEqual(['treeDad', 'treeMum', 'treeKid', 'sprout']);
    expect(find(w, 'monkey')).toMatchObject({ x: 60, y: 140 });
  });

  it('gives an old save the lava family, keeping her progress everywhere else', () => {
    const saved = {
      placed: { ember: [{ id: 'newt', kind: 'newt', x: 120, y: 140 }] },
      bag: [{ id: 'geode', kind: 'geode', stage: 1 }],
    };
    const w = normalizeWorld(saved);
    expect(placedIn(w, 'lavahouse').map((e) => e.id)).toEqual(['lavaDad', 'lavaMum', 'lavaBaby']);
    expect(find(w, 'newt')).toMatchObject({ x: 120, y: 140 });
    expect(w.bag).toEqual([{ id: 'geode', kind: 'geode', stage: 1 }]);
  });

  it('drops malformed entries', () => {
    const w = normalizeWorld({ placed: { ship: [{ id: 'plant', kind: 'plant', x: 'a', y: 1 }] }, bag: [{ kind: 'x' }] });
    expect(find(w, 'plant')).toMatchObject({ x: 152, y: 120 });
    expect(w.bag).toEqual([]);
  });
});
