import { describe, expect, it } from 'vitest';
import { parseColor } from '../../engine/pixmap.js';
import { drawGirl, girlFrames } from './girl.js';
import { HAIR_COLORS } from './palette.js';

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

describe('girl art', () => {
  it('paints her hair in the colour of her look', () => {
    const pink = drawGirl({}, { hair: 'pink' });
    expect(uses(pink, HAIR_COLORS.pink.hair)).toBe(true);
    expect(uses(pink, HAIR_COLORS.red.hair)).toBe(false);
  });

  it('defaults to red hair', () => {
    expect(uses(drawGirl(), HAIR_COLORS.red.hair)).toBe(true);
  });

  it('gives every frame of a look the same hair colour', () => {
    const frames = girlFrames({ hair: 'blue' });
    const all = Object.values(frames).flat();
    expect(all.every((pm) => uses(pm, HAIR_COLORS.blue.hair))).toBe(true);
  });
});
