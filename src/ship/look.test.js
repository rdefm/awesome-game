import { describe, expect, it } from 'vitest';
import { HAIR_COLORS } from './art/palette.js';
import { HAIRS, nextLook, normalizeLook } from './look.js';

describe('look', () => {
  it('starts with red hair when a save has no look', () => {
    expect(normalizeLook(undefined)).toEqual({ hair: 'red' });
    expect(normalizeLook(null)).toEqual({ hair: 'red' });
  });

  it('falls back to red for a hair colour it does not know', () => {
    expect(normalizeLook({ hair: 'plaid' })).toEqual({ hair: 'red' });
    expect(normalizeLook('pink')).toEqual({ hair: 'red' });
  });

  it('keeps a saved hair colour', () => {
    expect(normalizeLook({ hair: 'pink' })).toEqual({ hair: 'pink' });
  });

  it('has about five hair colours, starting with red, all in the palette', () => {
    expect(HAIRS[0]).toBe('red');
    expect(HAIRS.length).toBeGreaterThanOrEqual(5);
    expect(HAIRS.every((h) => HAIR_COLORS[h])).toBe(true);
  });

  it('cycles to the next hair colour, wrapping back round to red', () => {
    let look = normalizeLook(undefined);
    const seen = [];
    for (let i = 0; i < HAIRS.length; i++) {
      look = nextLook(look);
      seen.push(look.hair);
    }
    expect(seen).toEqual([...HAIRS.slice(1), 'red']);
  });
});
