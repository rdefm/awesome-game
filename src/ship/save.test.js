import { describe, expect, it } from 'vitest';
import { musicOn } from './save.js';

describe('musicOn', () => {
  it('is on for an old save with no setting', () => {
    expect(musicOn({})).toBe(true);
  });

  it('remembers being switched off and on', () => {
    expect(musicOn({ music: false })).toBe(false);
    expect(musicOn({ music: true })).toBe(true);
  });
});
