import { describe, expect, it } from 'vitest';
import {
  STICKERS, allStickers, collect, hasFound, normalizeFound, shelf, tally,
} from './stickers.js';

const first = allStickers()[0].id;
const second = allStickers()[1].id;

describe('stickers', () => {
  it('lists every planet\'s stickers in one flat list, each knowing its planet', () => {
    const all = allStickers();
    expect(all.length).toBe(Object.values(STICKERS).flat().length);
    expect(all.every((s) => STICKERS[s.planet].some((d) => d.id === s.id))).toBe(true);
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length);
  });

  it('records a newly found sticker', () => {
    const found = collect([], first);
    expect(found).toEqual([first]);
    expect(hasFound(found, first)).toBe(true);
    expect(hasFound(found, second)).toBe(false);
  });

  it('never records the same sticker twice', () => {
    const found = collect([], first);
    expect(collect(found, first)).toBe(found);
  });

  it('ignores stickers that don\'t exist', () => {
    const found = [];
    expect(collect(found, 'nope')).toBe(found);
  });

  it('counts found out of the total', () => {
    expect(tally([])).toEqual({ found: 0, total: allStickers().length });
    expect(tally(collect(collect([], first), second))).toEqual({ found: 2, total: allStickers().length });
  });

  it('lays out the shelf with every sticker, found or not, in a fixed order', () => {
    const slots = shelf([second]);
    expect(slots.map((s) => s.id)).toEqual(allStickers().map((s) => s.id));
    expect(slots.filter((s) => s.found).map((s) => s.id)).toEqual([second]);
  });

  it('survives a save round-trip', () => {
    const found = collect(collect([], second), first);
    expect(normalizeFound(JSON.parse(JSON.stringify(found)))).toEqual(found);
  });

  it('cleans up junk saves: unknown ids, duplicates, non-strings', () => {
    expect(normalizeFound(undefined)).toEqual([]);
    expect(normalizeFound('junk')).toEqual([]);
    expect(normalizeFound([first, 'nope', 3, first, null, second])).toEqual([first, second]);
  });
});
