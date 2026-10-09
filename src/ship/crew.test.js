import { describe, expect, it, vi } from 'vitest';
import { CREW_BODIES, CREW_EARS, CREW_EYES } from './art/crew.js';
import { CREW_OPTIONS, DEFAULT_CREW, MAX_CREW, canMakeCrew, normalizeCrew, reshape } from './crew.js';
import { CrewPicker } from './crewPicker.js';
import { Crew } from './entities/crew.js';
import { isFriend, makeCarryable } from './kinds.js';
import { LOOK_OPTIONS } from './look.js';
import { TALKS } from './talks/index.js';
import { add, defaultWorld, find, place, setHat, stash } from './world.js';

describe('crew options', () => {
  it('offers every body colour, eyes, ears and hat, starting with the first of each', () => {
    expect(CREW_OPTIONS.body).toEqual(Object.keys(CREW_BODIES));
    expect(CREW_OPTIONS.eyes).toEqual(CREW_EYES);
    expect(CREW_OPTIONS.ears).toEqual(CREW_EARS);
    expect(CREW_OPTIONS.hat).toEqual(LOOK_OPTIONS.hat);
    expect(DEFAULT_CREW).toEqual({ body: 'mint', eyes: 'round', ears: 'antennae', hat: 'none' });
  });

  it('fills in anything missing or odd from a saved crewmate', () => {
    expect(normalizeCrew(undefined)).toEqual({ body: 'mint', eyes: 'round', ears: 'antennae' });
    expect(normalizeCrew({ body: 'lilac', eyes: 'nope', ears: 'cat' })).toEqual({ body: 'lilac', eyes: 'round', ears: 'cat' });
  });

  it('changes one part at a time, ignoring things that are not options', () => {
    const crew = reshape(DEFAULT_CREW, 'ears', 'bunny');
    expect(crew).toEqual({ ...DEFAULT_CREW, ears: 'bunny' });
    expect(reshape(crew, 'ears', 'wings')).toBe(crew);
    expect(reshape(crew, 'tail', 'long')).toBe(crew);
  });

  it('caps the crew, counting those in the bag too', () => {
    let w = defaultWorld();
    expect(canMakeCrew(w)).toBe(true);
    for (let i = 0; i < MAX_CREW; i++) {
      w = add(w, 'storeroom', { id: `crew${i}`, kind: 'crew', crew: DEFAULT_CREW, x: 100, y: 130 });
    }
    expect(canMakeCrew(w)).toBe(false);
    w = stash(w, 'crew0');
    expect(canMakeCrew(w)).toBe(false);
  });
});

describe('a crewmate in the world', () => {
  const entry = { id: 'crew0', kind: 'crew', crew: { body: 'coral', eyes: 'big', ears: 'cat' }, hat: 'crown', x: 90, y: 130 };

  it('keeps its look and hat through the bag and back out', () => {
    let w = add(defaultWorld(), 'storeroom', entry);
    expect(find(w, 'crew0')).toEqual(entry);
    w = stash(w, 'crew0');
    expect(w.bag[0]).toEqual({ id: 'crew0', kind: 'crew', crew: entry.crew, hat: 'crown' });
    w = place(w, 'crew0', 'ship', 50, 140);
    expect(find(w, 'crew0')).toEqual({ ...entry, x: 50, y: 140 });
  });

  it('can be given a different hat later', () => {
    const w = setHat(add(defaultWorld(), 'ship', entry), 'crew0', 'bow');
    expect(find(w, 'crew0')).toMatchObject({ crew: entry.crew, hat: 'bow' });
  });

  it('is a friend, built from its entry', () => {
    const crewFrames = vi.fn(() => ({}));
    expect(isFriend('crew')).toBe(true);
    const friend = makeCarryable({ crewFrames }, entry);
    expect(friend).toBeInstanceOf(Crew);
    expect(crewFrames).toHaveBeenCalledWith(entry.crew);
    expect(friend.hat).toBe('crown');
    expect(friend.seatFrame).toBeTypeOf('function');
  });

  it('has a chat of its own', () => {
    expect(TALKS.crew.nodes.start).toBeDefined();
  });
});

describe('crew pod picker', () => {
  function setup() {
    const scene = {
      look: { hair: 'red' },
      engine: { audio: { play: vi.fn() } },
    };
    const picker = new CrewPicker(scene);
    picker.show = 1;
    picker.close = vi.fn();
    return { picker, scene };
  }

  function centreOf(picker, key) {
    for (let y = 0; y < 160; y++) {
      for (let x = 0; x < 256; x++) {
        if (picker.cellAt({ x, y })?.key === key) {
          return { x: x + 4, y: y + 4 };
        }
      }
    }
    return null;
  }

  const tap = (picker, key) => {
    const p = centreOf(picker, key);
    picker.pointerDown(p);
    picker.pointerUp(p);
  };

  it('has a button for every option and one for Done, all on screen', () => {
    const { picker } = setup();
    for (const [part, options] of Object.entries(CREW_OPTIONS)) {
      for (const value of options) {
        const p = centreOf(picker, `${part}:${value}`);
        expect(p, `${part} ${value}`).not.toBeNull();
        expect(p.x).toBeLessThan(256);
        expect(p.y).toBeLessThan(160);
      }
    }
    expect(centreOf(picker, 'done')).not.toBeNull();
  });

  it('changes the crewmate on the spot as buttons are tapped', () => {
    const { picker } = setup();
    tap(picker, 'body:coral');
    tap(picker, 'eyes:star');
    tap(picker, 'ears:bunny');
    tap(picker, 'hat:party');
    expect(picker.crew).toEqual({ body: 'coral', eyes: 'star', ears: 'bunny', hat: 'party' });
  });

  it('hands back what she made on Done, and nothing if she backs out', () => {
    const { picker } = setup();
    tap(picker, 'ears:cat');
    tap(picker, 'done');
    expect(picker.result).toEqual({ ...DEFAULT_CREW, ears: 'cat' });
    expect(picker.close).toHaveBeenCalled();
    picker.result = null;
    picker.pointerDown({ x: 250, y: 5 });
    picker.pointerUp({ x: 250, y: 5 });
    expect(picker.result).toBeNull();
  });
});
