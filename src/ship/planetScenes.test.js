import { describe, expect, it } from 'vitest';
import { PLANETS } from './art/props.js';
import { landedOn } from './planetScenes.js';

describe('landedOn', () => {
  it('finds the planet she was out on when the save was made', () => {
    expect(landedOn({ where: 'bluebell', landed: true })).toBe('bluebell');
    expect(landedOn({ where: 'ember', landed: true })).toBe('ember');
  });

  it('puts her back in the ship otherwise', () => {
    expect(landedOn({})).toBe(null);
    expect(landedOn({ where: 'ship', landed: true })).toBe(null);
    expect(landedOn({ where: 'bluebell', landed: false })).toBe(null);
  });

  it('ignores a place with no scene to go to', () => {
    expect(landedOn({ where: 'nowhere', landed: true })).toBe(null);
  });

  it('has a scene for exactly the planets she can land on', () => {
    for (const p of PLANETS) {
      expect(landedOn({ where: p.id, landed: true }), p.id).toBe(p.landable ? p.id : null);
    }
  });
});
