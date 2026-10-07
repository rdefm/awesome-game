import { describe, expect, it } from 'vitest';
import { findReceiver } from './scene.js';

// A box-shaped entity at (x, y) that hits within 10px and accepts `wants` kinds.
const thing = (name, x, y, wants = [], extra = {}) => ({
  name, x, y,
  hitTest: (px, py) => Math.abs(px - x) < 10 && Math.abs(py - y) < 10,
  ...(wants.length ? { accepts: (item) => wants.includes(item.kind) } : {}),
  ...extra,
});

describe('findReceiver', () => {
  const crystal = thing('crystal', 50, 50, [], { kind: 'crystal' });
  const ball = thing('ball', 50, 50, [], { kind: 'ball' });

  it('finds the entity under the drop point that accepts the item', () => {
    const alien = thing('alien', 50, 50, ['crystal']);
    expect(findReceiver([alien, crystal], crystal, 52, 48)).toBe(alien);
  });

  it('finds nothing when the entity under the point does not accept the item', () => {
    const alien = thing('alien', 50, 50, ['crystal']);
    expect(findReceiver([alien, ball], ball, 52, 48)).toBe(null);
  });

  it('finds nothing when no receiver is under the drop point', () => {
    const alien = thing('alien', 50, 50, ['crystal']);
    expect(findReceiver([alien, crystal], crystal, 90, 90)).toBe(null);
  });

  it('ignores entities that do not opt in, and never picks the item itself', () => {
    const self = thing('self', 50, 50, ['crystal'], { kind: 'crystal' });
    const plain = thing('plain', 50, 50);
    expect(findReceiver([plain, self], self, 50, 50)).toBe(null);
  });

  it('prefers the frontmost receiver when several overlap', () => {
    const back = thing('back', 50, 40, ['crystal']);
    const front = thing('front', 50, 45, ['crystal']);
    expect(findReceiver([front, back], crystal, 50, 44)).toBe(front);
  });

  it('looks past a non-accepting thing in front to a receiver behind it', () => {
    const alien = thing('alien', 50, 40, ['crystal']);
    const plant = thing('plant', 50, 45, ['teddy']);
    expect(findReceiver([alien, plant], crystal, 50, 44)).toBe(alien);
  });
});
