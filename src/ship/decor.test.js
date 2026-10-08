import { describe, expect, it } from 'vitest';
import {
  DECOR, STARTERS, isUnlocked, normalizeDecor, seen, tally, unlock,
} from './decor.js';

const locked = DECOR.find((kind) => !STARTERS.includes(kind));
const otherLocked = DECOR.filter((kind) => !STARTERS.includes(kind))[1];

describe('decor catalogue', () => {
  it('lists each piece once, starters among them, with some still to unlock', () => {
    expect(new Set(DECOR).size).toBe(DECOR.length);
    expect(STARTERS.every((kind) => DECOR.includes(kind))).toBe(true);
    expect(DECOR.length).toBeGreaterThan(STARTERS.length);
  });

  it('starts out with just the starters unlocked, nothing new', () => {
    const decor = normalizeDecor(undefined);
    expect(decor.unlocked).toEqual(STARTERS);
    expect(decor.fresh).toEqual([]);
    expect(isUnlocked(decor, STARTERS[0])).toBe(true);
    expect(isUnlocked(decor, locked)).toBe(false);
  });

  it('unlocks a piece, marking it new', () => {
    const decor = unlock(normalizeDecor(undefined), locked);
    expect(isUnlocked(decor, locked)).toBe(true);
    expect(decor.fresh).toEqual([locked]);
  });

  it('gives the very same state back when nothing new is unlocked', () => {
    const decor = unlock(normalizeDecor(undefined), locked);
    expect(unlock(decor, locked)).toBe(decor);
    expect(unlock(decor, STARTERS[0])).toBe(decor);
    expect(unlock(decor, 'nope')).toBe(decor);
  });

  it('stops marking pieces new once seen', () => {
    const decor = unlock(unlock(normalizeDecor(undefined), locked), otherLocked);
    const after = seen(decor);
    expect(after.fresh).toEqual([]);
    expect(after.unlocked).toEqual(decor.unlocked);
    expect(seen(after)).toBe(after);
  });

  it('counts unlocked out of every piece', () => {
    expect(tally(normalizeDecor(undefined))).toEqual({ found: STARTERS.length, total: DECOR.length });
    expect(tally(unlock(normalizeDecor(undefined), locked)).found).toBe(STARTERS.length + 1);
  });

  it('survives a save round-trip', () => {
    const decor = unlock(normalizeDecor(undefined), locked);
    expect(normalizeDecor(JSON.parse(JSON.stringify(decor)))).toEqual(decor);
  });

  it('cleans up junk saves, always keeping the starters', () => {
    expect(normalizeDecor('junk')).toEqual(normalizeDecor(undefined));
    const decor = normalizeDecor({ unlocked: [locked, 'nope', 3, locked], fresh: [locked, otherLocked, 'nope'] });
    expect(decor.unlocked).toEqual([...STARTERS, locked]);
    expect(decor.fresh).toEqual([locked]);
  });
});
