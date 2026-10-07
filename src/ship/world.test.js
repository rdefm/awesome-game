import { describe, expect, it } from 'vitest';
import {
  add, bagContents, defaultWorld, discard, find, freshId, normalizeWorld, place, placedIn, setStage, stash,
} from './world.js';

const isFriend = (kind) => kind === 'critter';

describe('world', () => {
  it('stashes a placed thing at the front of the bag', () => {
    let w = defaultWorld();
    w = stash(w, 'ball');
    w = stash(w, 'plant');
    expect(placedIn(w, 'ship').map((e) => e.id)).toEqual(['teddy']);
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
    expect(placedIn(w, 'ship').map((e) => e.id)).toEqual(['plant', 'teddy']);
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

  it('drops malformed entries', () => {
    const w = normalizeWorld({ placed: { ship: [{ id: 'plant', kind: 'plant', x: 'a', y: 1 }] }, bag: [{ kind: 'x' }] });
    expect(find(w, 'plant')).toMatchObject({ x: 152, y: 120 });
    expect(w.bag).toEqual([]);
  });
});
