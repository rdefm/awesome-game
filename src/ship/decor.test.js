import { describe, expect, it } from 'vitest';
import { DECOR } from './decor.js';
import { KINDS } from './kinds.js';

describe('decor catalogue', () => {
  it('lists each piece once, every one a kind that can be made', () => {
    expect(new Set(DECOR).size).toBe(DECOR.length);
    for (const kind of DECOR) {
      expect(KINDS[kind], kind).toBeDefined();
    }
  });
});
