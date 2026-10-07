import { describe, expect, it } from 'vitest';
import { bagContents, defaultWorld, find, normalizeWorld, place, placedIn, stash } from './world.js';

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
