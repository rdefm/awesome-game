import { describe, expect, it } from 'vitest';
import { HATS } from './art/girl.js';
import { HAT_SPOTS, hatPlacement, hatSpot } from './friendHats.js';
import { KINDS } from './kinds.js';

describe('friend hats', () => {
  it('knows where every friend wears a hat', () => {
    const friends = Object.keys(KINDS).filter((kind) => KINDS[kind].friend);
    expect(friends.length).toBeGreaterThan(0);
    for (const kind of friends) {
      expect(hatSpot(kind), kind).not.toBeNull();
    }
    for (const kind of Object.keys(HAT_SPOTS)) {
      expect(KINDS[kind]?.friend, kind).toBe(true);
    }
  });

  it('has no spot for things that are not friends', () => {
    expect(hatSpot('ball')).toBeNull();
  });

  it('grows the picture upwards so the hat fits, keeping its bottom and middle', () => {
    const p = hatPlacement({ x: 0, y: 3, scale: 1 }, 20, 20, { w: 16, h: 8, dx: 0 });
    expect(p.height).toBe(25); // 5 above the old top
    expect(p.imgY).toBe(5);
    expect(p.hatY).toBe(0);
    expect(p.hatX + p.hatW / 2).toBe(p.width / 2);
    expect(p.imgX * 2 + 20).toBe(p.width);
  });

  it('does not grow a picture that already has room', () => {
    const p = hatPlacement({ x: 0, y: 8, scale: 0.5 }, 30, 30, { w: 16, h: 8, dx: 0 });
    expect(p).toMatchObject({ width: 30, height: 30, imgX: 0, imgY: 0, hatY: 4 });
  });

  it('shifts the hat with the head, and the bow to the side', () => {
    const plain = hatPlacement({ x: 0, y: 4, scale: 1 }, 24, 24, { w: 8, h: 6, dx: 0 });
    const moved = hatPlacement({ x: 3, y: 4, scale: 1 }, 24, 24, { w: 8, h: 6, dx: 0 });
    expect(moved.hatX - plain.hatX).toBe(3);
  });

  it('keeps every hat on a friend inside a picture centred on the friend', () => {
    for (const [kind, spot] of Object.entries(HAT_SPOTS)) {
      for (const hat of Object.keys(HATS).filter((h) => h !== 'none')) {
        const spec = HATS[hat];
        const p = hatPlacement(spot, 20, 20, { w: spec.rows[0].length + 2, h: spec.rows.length + 2, dx: 0 });
        expect(p.width, `${kind} ${hat}`).toBe(20 + p.imgX * 2);
        expect(p.hatX).toBeGreaterThanOrEqual(0);
        expect(p.hatX + p.hatW).toBeLessThanOrEqual(p.width);
        expect(p.hatY).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
