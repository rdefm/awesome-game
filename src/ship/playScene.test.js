import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DECOR, STARTERS } from './decor.js';
import { PlayScene } from './playScene.js';

const locked = DECOR.find((kind) => !STARTERS.includes(kind));

// A place, as freshly loaded from the save, with just enough engine.
function load() {
  const scene = new PlayScene({}, 'ship');
  scene.engine = { audio: { play: vi.fn() } };
  return scene;
}

describe('unlocking decor', () => {
  beforeEach(() => {
    const store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts an old save with just the starters', () => {
    localStorage.setItem('awesome-game.ship.v1', JSON.stringify({ stickers: [] }));
    expect(load().decor.unlocked).toEqual(STARTERS);
  });

  it('plays a fanfare and remembers it across a reload', () => {
    const scene = load();
    expect(scene.unlockDecor(locked)).toBe(true);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('fanfare');
    expect(scene.toastMsg.text).toContain(`${STARTERS.length + 1}/${DECOR.length}`);
    const later = load();
    expect(later.decor.unlocked).toContain(locked);
    expect(later.decor.fresh).toEqual([locked]);
  });

  it('does nothing for a piece she already has', () => {
    const scene = load();
    expect(scene.unlockDecor(STARTERS[0])).toBe(false);
    expect(scene.engine.audio.play).not.toHaveBeenCalled();
  });

  it('stops it being new once the picker has shown it, across a reload too', () => {
    load().unlockDecor(locked);
    load().sawNewDecor();
    const later = load();
    expect(later.decor.unlocked).toContain(locked);
    expect(later.decor.fresh).toEqual([]);
  });
});
