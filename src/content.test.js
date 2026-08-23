import { describe, it, expect } from 'vitest';
import { manifest } from './content.js';

describe('manifest', () => {
  it('gives every entity a stable id, name, type, and spriteKey', () => {
    for (const entity of manifest) {
      expect(typeof entity.id).toBe('string');
      expect(typeof entity.name).toBe('string');
      expect(['character', 'item']).toContain(entity.type);
      expect(typeof entity.spriteKey).toBe('string');
    }
  });

  it('has unique ids', () => {
    const ids = manifest.map((entity) => entity.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the v1 cast: 3 characters and 4 items', () => {
    const characters = manifest.filter((entity) => entity.type === 'character');
    const items = manifest.filter((entity) => entity.type === 'item');

    expect(characters).toHaveLength(3);
    expect(items).toHaveLength(4);
  });
});
