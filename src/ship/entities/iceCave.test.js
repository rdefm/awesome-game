import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CAMPFIRE, ICE_CAVE, ICICLES, distanceScale } from '../layout.js';
import { BabyYeti, MumYeti } from './frosty.js';
import { Girl } from './girl.js';
import { Campfire, FurNest, Icicles, PondWindow } from './iceCave.js';
import { Snack } from './items.js';

const assets = {
  mumYeti: {}, babyYeti: {}, snacks: {}, icicles: [], iceFish: [], furNest: {}, campfire: [],
  girl: () => ({}), emotes: {},
};

// Just enough of the ice cave for its things (and the yetis to bring in).
function setup() {
  const scene = {
    engine: {
      audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve(),
    },
    entities: [],
    putDown: vi.fn(() => Promise.resolve()),
    hearts: vi.fn(),
    sparkles: vi.fn(),
    bits: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  const mum = new MumYeti(assets, { id: 'mumYeti', kind: 'mumYeti', x: 60, y: 136 });
  const baby = new BabyYeti(assets, { id: 'babyYeti', kind: 'babyYeti', x: 80, y: 140 });
  for (const e of [girl, mum, baby]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  const make = (Kind, state) => Object.assign(new Kind(assets, state), { scene });
  return { scene, girl, mum, baby, make };
}

const played = (scene, sound) => scene.engine.audio.play.mock.calls.filter(([s]) => s === sound);

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the icicles', () => {
  it('chime along the row and back to the first', async () => {
    const { scene, make } = setup();
    const icicles = make(Icicles);
    await icicles.use();
    expect(played(scene, 'plink')).toHaveLength(ICICLES.lengths.length + 1);
    expect(icicles.playing).toBe(false);
  });

  it('each ring a different note, the shortest highest', async () => {
    const { scene, make } = setup();
    await make(Icicles).use();
    const notes = played(scene, 'plink').slice(0, -1).map(([, { note }]) => note);
    expect(new Set(notes).size).toBe(ICICLES.lengths.length);
    const shortest = ICICLES.lengths.indexOf(Math.min(...ICICLES.lengths));
    expect(notes[shortest]).toBe(Math.max(...notes));
  });
});

describe('the pond window', () => {
  it('has the fish swim to and fro under the ice, staying in the window', () => {
    const { make } = setup();
    const pond = make(PondWindow);
    const xs = [];
    for (let i = 0; i < 200; i++) {
      pond.update(0.1);
      xs.push(pond.fish.x);
    }
    expect(Math.min(...xs)).toBeLessThan(0);
    expect(Math.max(...xs)).toBeGreaterThan(0);
    expect(Math.max(...xs.map(Math.abs))).toBeLessThanOrEqual(11);
  });

  it('knocked on, brings the fish up to blow bubbles, then lets it swim on', async () => {
    const { scene, make } = setup();
    const pond = make(PondWindow);
    await pond.use();
    expect(played(scene, 'plop')).toHaveLength(3);
    expect(pond.bubbles).toHaveLength(3);
    expect(pond.visiting).toBe(false);
    pond.update(2);
    expect(pond.bubbles).toHaveLength(0);
  });
});

describe('the fur-rug nest', () => {
  it('takes friends, not other things', () => {
    const { mum, make } = setup();
    const nest = make(FurNest);
    expect(nest.accepts(mum)).toBe(true);
    expect(nest.accepts(make(Snack, { id: 'c', kind: 'cookie', x: 0, y: 0 }))).toBe(false);
  });

  it('has a friend nap in it, then hop back out', async () => {
    const { scene, baby, make } = setup();
    const nest = make(FurNest);
    const done = nest.receive(baby);
    expect(nest.accepts(baby)).toBe(false); // already busy with it
    await done;
    expect(scene.putDown.mock.calls[0][0]).toBe(baby);
    expect(played(scene, 'lullaby')).toHaveLength(1);
    expect(nest.friend).toBe(null);
    expect(baby.seat).toBe(null);
    expect(baby.busy).toBe(false);
    expect(baby.draggable).toBe(true);
  });
});

describe('the campfire', () => {
  it('flares up and brings the yetis to huddle round it', async () => {
    const { scene, mum, baby, make } = setup();
    const fire = make(Campfire);
    await fire.use();
    expect(played(scene, 'flare')).toHaveLength(1);
    expect(mum.walk).toMatchObject(CAMPFIRE.seats[0]);
    expect(baby.walk).toMatchObject(CAMPFIRE.seats[1]);
    expect(fire.warming).toBe(false);
    expect(fire.flare).toBe(0);
  });

  it('leaves a friend that\'s busy where it is', async () => {
    const { mum, baby, make } = setup();
    mum.busy = true;
    await make(Campfire).use();
    expect(mum.walk).toBe(null);
    expect(baby.walk).toMatchObject(CAMPFIRE.seats[0]);
  });

  it('warms her up even with no friends about', async () => {
    const { scene, girl, make } = setup();
    scene.entities = [girl];
    await make(Campfire).use();
    expect(scene.hearts).toHaveBeenCalled();
  });
});

describe('the path to the ice cave', () => {
  const { path, far } = ICE_CAVE;

  it('is full size at the near end and smallest at the door', () => {
    expect(distanceScale(path[0].y, ICE_CAVE)).toBe(1);
    expect(distanceScale(path.at(-1).y, ICE_CAVE)).toBe(far);
  });

  it('gets steadily smaller the further up it she goes', () => {
    const scales = path.map((p) => distanceScale(p.y, ICE_CAVE));
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeLessThan(scales[i - 1]);
    }
  });

  it('starts where she can walk to', () => {
    expect(path[0].y).toBeGreaterThanOrEqual(122);
  });
});
