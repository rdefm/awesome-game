import { describe, expect, it, vi } from 'vitest';
import { CROWN_MEMORY, DEFAULT_LOOK, LOOK_OPTIONS } from './look.js';
import { GIRL_W } from './art/girl.js';
import { WARDROBE } from './layout.js';
import { WardrobePicker } from './wardrobePicker.js';

// Just enough of a ship scene for the picker to work with (she's woven a
// flower crown, unless `memories` says otherwise).
function fakeScene(memories = [CROWN_MEMORY]) {
  const scene = {
    look: { ...DEFAULT_LOOK },
    memories,
    girl: { x: 109, y: 124, act: vi.fn() },
    engine: { audio: { play: vi.fn() } },
    sparkles: vi.fn(),
    saveLook: vi.fn((look) => {
      scene.look = look;
    }),
  };
  return scene;
}

// Middle of the swatch button for this part/option, found by scanning the panel.
function centreOf(picker, part, value) {
  for (let y = 0; y < 160; y++) {
    for (let x = 0; x < 256; x++) {
      const c = picker.cellAt({ x, y });
      if (c?.part === part && c.value === value) {
        return { x: x + 10, y: y + 10 };
      }
    }
  }
  return null;
}

describe('wardrobe picker', () => {
  it('has a button for every option of every part', () => {
    const picker = new WardrobePicker(fakeScene());
    for (const [part, options] of Object.entries(LOOK_OPTIONS)) {
      for (const value of options) {
        expect(centreOf(picker, part, value), `${part} ${value}`).not.toBeNull();
      }
    }
  });

  it('keeps every button on screen', () => {
    const picker = new WardrobePicker(fakeScene());
    for (const [part, options] of Object.entries(LOOK_OPTIONS)) {
      for (const value of options) {
        const p = centreOf(picker, part, value);
        expect(p.x).toBeLessThan(256);
        expect(p.y).toBeLessThan(160);
      }
    }
  });

  it('keeps clear of her, standing at the wardrobe', () => {
    const picker = new WardrobePicker(fakeScene());
    expect(picker.panel.x).toBeGreaterThan(WARDROBE.spot.x + GIRL_W / 2);
  });

  it('has no flower crown button till she has woven one', () => {
    const picker = new WardrobePicker(fakeScene([]));
    expect(centreOf(picker, 'hat', 'flowers')).toBeNull();
    expect(centreOf(picker, 'hat', 'party')).not.toBeNull();
  });

  it('changes just that part of her look when a button is tapped', () => {
    const scene = fakeScene();
    const picker = new WardrobePicker(scene);
    picker.show = 1;
    const p = centreOf(picker, 'hat', 'crown');
    picker.pointerDown(p);
    picker.pointerUp(p);
    expect(scene.saveLook).toHaveBeenCalledWith({ ...DEFAULT_LOOK, hat: 'crown' });
  });

  it('does not change anything when a press slides off onto another button', () => {
    const scene = fakeScene();
    const picker = new WardrobePicker(scene);
    picker.show = 1;
    picker.pointerDown(centreOf(picker, 'suit', 'pink'));
    picker.pointerUp(centreOf(picker, 'suit', 'green'));
    expect(scene.saveLook).not.toHaveBeenCalled();
  });
});

describe('wardrobe picker for a friend', () => {
  function friendPicker() {
    const scene = fakeScene();
    scene.saveHat = vi.fn((friend, hat) => {
      friend.hat = hat;
    });
    const friend = { x: 80, y: 130, hat: 'none', boing: vi.fn(), pose: vi.fn() };
    const picker = WardrobePicker.forFriends(scene);
    picker.friend = friend;
    picker.show = 1;
    return { scene, friend, picker };
  }

  it('offers just the hats', () => {
    const { picker } = friendPicker();
    for (const hat of LOOK_OPTIONS.hat) {
      expect(centreOf(picker, 'hat', hat), hat).not.toBeNull();
    }
    expect(centreOf(picker, 'hair', LOOK_OPTIONS.hair[0])).toBeNull();
    expect(centreOf(picker, 'suit', LOOK_OPTIONS.suit[0])).toBeNull();
  });

  it('puts the tapped hat on the friend, not on her', () => {
    const { scene, friend, picker } = friendPicker();
    const p = centreOf(picker, 'hat', 'party');
    picker.pointerDown(p);
    picker.pointerUp(p);
    expect(scene.saveHat).toHaveBeenCalledWith(friend, 'party');
    expect(friend.hat).toBe('party');
    expect(scene.saveLook).not.toHaveBeenCalled();
  });

  it('can put her flower crown on a friend', () => {
    const { scene, friend, picker } = friendPicker();
    const p = centreOf(picker, 'hat', 'flowers');
    picker.pointerDown(p);
    picker.pointerUp(p);
    expect(scene.saveHat).toHaveBeenCalledWith(friend, 'flowers');
  });
});
