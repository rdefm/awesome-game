import { describe, expect, it } from 'vitest';
import { parseColor } from '../../engine/pixmap.js';
import { HATS, drawGirl, girlFrames } from './girl.js';
import { HAIR_COLORS, SUIT_COLORS } from './palette.js';

// Does the sprite use this colour anywhere?
function uses(pm, color) {
  const want = parseColor(color);
  for (let y = 0; y < pm.height; y++) {
    for (let x = 0; x < pm.width; x++) {
      if (pm.isSet(x, y) && pm.get(x, y).every((v, i) => v === want[i])) {
        return true;
      }
    }
  }
  return false;
}

// The topmost painted row.
function top(pm) {
  for (let y = 0; y < pm.height; y++) {
    for (let x = 0; x < pm.width; x++) {
      if (pm.isSet(x, y)) {
        return y;
      }
    }
  }
  return pm.height;
}

// The bottommost painted row.
function bottom(pm) {
  for (let y = pm.height - 1; y >= 0; y--) {
    for (let x = 0; x < pm.width; x++) {
      if (pm.isSet(x, y)) {
        return y;
      }
    }
  }
  return -1;
}

// Every frame of a look, flattened.
const allFrames = (look) => Object.values(girlFrames(look)).flat();

describe('girl art', () => {
  it('paints her hair in the colour of her look', () => {
    const pink = drawGirl({}, { hair: 'pink' });
    expect(uses(pink, HAIR_COLORS.pink.hair)).toBe(true);
    expect(uses(pink, HAIR_COLORS.red.hair)).toBe(false);
  });

  it('defaults to red hair and a blue suit', () => {
    expect(uses(drawGirl(), HAIR_COLORS.red.hair)).toBe(true);
    expect(uses(drawGirl(), SUIT_COLORS.blue.suit)).toBe(true);
  });

  it('paints her suit in the colour of her look', () => {
    const green = drawGirl({}, { suit: 'green' });
    expect(uses(green, SUIT_COLORS.green.suit)).toBe(true);
    expect(uses(green, SUIT_COLORS.green.dark)).toBe(true);
    expect(uses(green, SUIT_COLORS.blue.suit)).toBe(false);
    expect(uses(green, SUIT_COLORS.blue.dark)).toBe(false);
  });

  it('gives every frame of a look the same hair and suit colours', () => {
    const all = allFrames({ hair: 'blue', suit: 'pink' });
    expect(all.every((pm) => uses(pm, HAIR_COLORS.blue.hair))).toBe(true);
    expect(all.every((pm) => uses(pm, SUIT_COLORS.pink.dark))).toBe(true);
  });

  it('puts a hat on in every frame, seated ones included', () => {
    const bare = girlFrames({});
    const hatted = girlFrames({ hat: 'crown' });
    for (const name of Object.keys(bare)) {
      const b = [bare[name]].flat();
      const h = [hatted[name]].flat();
      h.forEach((pm, i) => {
        expect(top(pm), name).toBeLessThan(top(b[i]));
      });
    }
  });

  it('sits down low on the ground for a picnic, feet still on the ground', () => {
    const frames = girlFrames({});
    for (const name of ['picnic', 'picnicBlink']) {
      expect(top(frames[name]), name).toBeGreaterThan(top(frames.sit));
      expect(bottom(frames[name]), name).toBe(bottom(frames.blink));
    }
  });

  it('draws each hat differently, and no hat at all for "none"', () => {
    const sprites = Object.keys(HATS).map((hat) => drawGirl({}, { hat }));
    expect(top(sprites[0])).toBe(top(drawGirl()));
    const pictures = new Set(sprites.map((pm) => pm.data.join()));
    expect(pictures.size).toBe(sprites.length);
  });

  it('leaves room in the sprite for the tallest hat', () => {
    for (const hat of Object.keys(HATS)) {
      for (const pm of allFrames({ hat })) {
        expect(top(pm)).toBeGreaterThan(0);
      }
    }
  });
});
