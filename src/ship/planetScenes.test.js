import { describe, expect, it } from 'vitest';
import { PLANETS } from './art/props.js';
import { landedOn } from './planetScenes.js';

describe('landedOn', () => {
  it('finds the planet she was out on when the save was made', () => {
    expect(landedOn({ where: 'bluebell', landed: true })).toBe('bluebell');
    expect(landedOn({ where: 'ember', landed: true })).toBe('ember');
    expect(landedOn({ where: 'frosty', landed: true })).toBe('frosty');
    expect(landedOn({ where: 'candy', landed: true })).toBe('candy');
    expect(landedOn({ where: 'stripey', landed: true })).toBe('stripey');
  });

  it('puts her back inside the gingerbread house if that\'s where she was', () => {
    expect(landedOn({ where: 'gingerbread', landed: true })).toBe('gingerbread');
    expect(landedOn({ where: 'gingerbread', landed: false })).toBe(null);
  });

  it('puts her back inside the lava family\'s house if that\'s where she was', () => {
    expect(landedOn({ where: 'lavahouse', landed: true })).toBe('lavahouse');
    expect(landedOn({ where: 'lavahouse', landed: false })).toBe(null);
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
