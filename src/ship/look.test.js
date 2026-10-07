import { describe, expect, it } from 'vitest';
import { HAIR_COLORS, SUIT_COLORS } from './art/palette.js';
import { HATS } from './art/girl.js';
import { DEFAULT_LOOK, LOOK_OPTIONS, normalizeLook, restyle } from './look.js';

describe('look', () => {
  it('starts with red hair, a blue suit and no hat when a save has no look', () => {
    expect(DEFAULT_LOOK).toEqual({ hair: 'red', suit: 'blue', hat: 'none' });
    expect(normalizeLook(undefined)).toEqual(DEFAULT_LOOK);
    expect(normalizeLook(null)).toEqual(DEFAULT_LOOK);
    expect(normalizeLook('pink')).toEqual(DEFAULT_LOOK);
  });

  it('keeps hair from an older save that only knew about hair', () => {
    expect(normalizeLook({ hair: 'pink' })).toEqual({ ...DEFAULT_LOOK, hair: 'pink' });
  });

  it('falls back part by part for anything it does not know', () => {
    expect(normalizeLook({ hair: 'plaid', suit: 'green', hat: 'sombrero' }))
      .toEqual({ hair: 'red', suit: 'green', hat: 'none' });
  });

  it('keeps a full saved look', () => {
    const look = { hair: 'blue', suit: 'pink', hat: 'crown' };
    expect(normalizeLook(look)).toEqual(look);
  });

  it('offers every hair colour, suit colour and hat the art knows, defaults first', () => {
    expect(LOOK_OPTIONS.hair).toEqual(Object.keys(HAIR_COLORS));
    expect(LOOK_OPTIONS.suit).toEqual(Object.keys(SUIT_COLORS));
    expect(LOOK_OPTIONS.hat).toEqual(Object.keys(HATS));
    for (const [part, options] of Object.entries(LOOK_OPTIONS)) {
      expect(options[0]).toBe(DEFAULT_LOOK[part]);
      expect(options.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('changes one part of a look, leaving the rest', () => {
    const look = { hair: 'gold', suit: 'blue', hat: 'none' };
    expect(restyle(look, 'hat', 'bow')).toEqual({ hair: 'gold', suit: 'blue', hat: 'bow' });
    expect(look.hat).toBe('none');
  });

  it('ignores a change to something it does not know', () => {
    const look = { hair: 'gold', suit: 'blue', hat: 'none' };
    expect(restyle(look, 'hat', 'sombrero')).toEqual(look);
    expect(restyle(look, 'shoes', 'red')).toEqual(look);
  });
});
