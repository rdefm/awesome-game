import { describe, expect, it } from 'vitest';
import { Pixmap } from './pixmap.js';
import { measureText, textPixmap } from './font.js';
import { Tweens } from './tween.js';

describe('Pixmap', () => {
  it('builds sprites from character grids', () => {
    const pm = Pixmap.fromGrid(['a.', '.b'], { a: '#ff0000', b: '#00ff00' });
    expect(pm.get(0, 0)).toEqual([255, 0, 0, 255]);
    expect(pm.isSet(1, 0)).toBe(false);
    expect(pm.get(1, 1)).toEqual([0, 255, 0, 255]);
  });

  it('outlines only the empty pixels touching a shape', () => {
    const pm = new Pixmap(3, 3);
    pm.set(1, 1, '#ffffff');
    pm.outline('#000000');
    expect(pm.get(1, 1)).toEqual([255, 255, 255, 255]);
    expect(pm.get(0, 1)).toEqual([0, 0, 0, 255]);
    expect(pm.isSet(0, 0)).toBe(false); // diagonals stay clear
  });

  it('ignores drawing outside its bounds', () => {
    const pm = new Pixmap(2, 2);
    expect(() => pm.rect(-5, -5, 20, 20, '#123456')).not.toThrow();
    expect(pm.get(1, 1)).toEqual([0x12, 0x34, 0x56, 255]);
  });
});

describe('font', () => {
  it('measures 3px glyphs with 1px spacing', () => {
    expect(measureText('HI')).toBe(7);
    expect(textPixmap('HI', '#fff').width).toBe(7);
  });
});

describe('Tweens', () => {
  it('moves values over game time and resolves when done', async () => {
    const tw = new Tweens();
    const obj = { x: 0 };
    const done = tw.to(obj, { x: 10 }, 1, (t) => t);
    tw.update(0.5);
    expect(obj.x).toBe(5);
    tw.update(0.5);
    await done;
    expect(obj.x).toBe(10);
  });
});
