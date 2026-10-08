import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LAVA_HOUSE, distanceScale } from '../layout.js';
import { Critter } from './bluebell.js';
import { Girl } from './girl.js';
import { Snack } from './items.js';
import { Cradle, Hearth, LavaBaby, LavaDad, LavaLamp, LavaMum, MAX_LAVACAKES } from './lavaHouse.js';

const assets = {
  lavaDad: {}, lavaMum: {}, lavaBaby: {}, critter: {}, snacks: {}, hearth: [{}, {}], lavaLamp: {},
  cradle: { back: {}, front: {} }, girl: () => ({}), emotes: {},
};

// Just enough of the lava family's house for the family and its things.
function setup() {
  const scene = {
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve() },
    entities: [],
    settle: vi.fn(),
    findSticker: vi.fn(() => true),
    useUp: vi.fn(),
    remove: vi.fn(),
    putDown: vi.fn(() => Promise.resolve()),
    spawn: vi.fn((kind, x, y) => ({ id: `${kind}0`, kind, x, y })),
    toast: vi.fn(),
    hearts: vi.fn(),
    sparkles: vi.fn(),
    bits: vi.fn(),
    dust: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  const dad = new LavaDad(assets, { id: 'lavaDad', kind: 'lavaDad', x: 104, y: 136 });
  const mum = new LavaMum(assets, { id: 'lavaMum', kind: 'lavaMum', x: 170, y: 136 });
  const baby = new LavaBaby(assets, { id: 'lavaBaby', kind: 'lavaBaby', x: 186, y: 146 });
  for (const e of [girl, dad, mum, baby]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  scene.engine.scene = scene;
  const make = (Kind, state) => Object.assign(new Kind(assets, state), { scene });
  return { scene, girl, dad, mum, baby, make };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the lava family', () => {
  it('take snacks (lava cakes too) and friends, like every friend', () => {
    const { dad, mum, baby, make } = setup();
    for (const friend of [dad, mum, baby]) {
      expect(friend.accepts(make(Snack, { id: 'c', kind: 'lavacake', x: 0, y: 0 }))).toBe(true);
      expect(friend.accepts(make(Critter, { id: 'critter', kind: 'critter', x: 0, y: 0 }))).toBe(true);
    }
  });

  it('mum and dad each cuddle the baby when it is brought to them', async () => {
    for (const who of ['mum', 'dad']) {
      const { scene, baby, ...rest } = setup();
      const parent = rest[who];
      expect(parent.accepts(baby)).toBe(true);
      await parent.receive(baby);
      expect(scene.putDown.mock.calls[0][0]).toBe(baby);
      expect(scene.engine.audio.play).toHaveBeenCalledWith('hum');
      expect(parent.busy).toBe(false);
      expect(baby.busy).toBe(false);
    }
  });

  it('a parent brought to the baby cuddles it too', async () => {
    const { scene, dad, baby } = setup();
    await baby.receive(dad);
    expect(scene.putDown.mock.calls[0][0]).toBe(baby);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('hum');
  });

  it('dad laughs and mum hums when tapped, and both are free again after', async () => {
    const { scene, dad, mum } = setup();
    await dad.tapFun();
    expect(scene.engine.audio.play).toHaveBeenCalledWith('hoho');
    await mum.tapFun();
    expect(scene.engine.audio.play).toHaveBeenCalledWith('hum');
    for (const parent of [dad, mum]) {
      expect(parent.busy).toBe(false);
      expect(parent.draggable).toBe(true);
    }
  });

  it('the baby toddles off to mum or dad', () => {
    const { baby, dad, mum } = setup();
    for (let i = 0; i < 20; i++) {
      const to = baby.nextStroll();
      expect(Math.min(Math.abs(to.x - dad.x), Math.abs(to.x - mum.x))).toBeLessThanOrEqual(26);
    }
  });
});

describe('the cradle', () => {
  it('only takes the baby', () => {
    const { dad, baby, make } = setup();
    const cradle = make(Cradle, {});
    expect(cradle.accepts(baby)).toBe(true);
    expect(cradle.accepts(dad)).toBe(false);
  });

  it('rocks the baby to sleep, then lets it hop back out', async () => {
    const { scene, baby, make } = setup();
    const cradle = make(Cradle, {});
    const done = cradle.receive(baby);
    expect(cradle.accepts(baby)).toBe(false); // already busy with it
    await done;
    expect(scene.putDown.mock.calls[0][0]).toBe(baby);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('lullaby');
    expect(baby.tucked).toBe(false);
    expect(cradle.baby).toBe(null);
    expect(cradle.rocking).toBe(false);
    expect(baby.busy).toBe(false);
    expect(baby.draggable).toBe(true);
  });

  it('the baby can\'t be grabbed while tucked in', () => {
    const { baby } = setup();
    baby.tucked = true;
    expect(baby.hitTest(baby.x, baby.y - 4)).toBe(false);
  });
});

describe('the hearth', () => {
  it('cooks a lava cake', async () => {
    const { scene, make } = setup();
    const hearth = make(Hearth, {});
    await hearth.use();
    expect(scene.spawn).toHaveBeenCalledWith('lavacake', expect.any(Number), expect.any(Number));
    expect(hearth.cooking).toBe(false);
  });

  it('stops once there are plenty of lava cakes about', async () => {
    const { scene, make } = setup();
    for (let i = 0; i < MAX_LAVACAKES; i++) {
      scene.entities.push({ kind: 'lavacake' });
    }
    await make(Hearth, {}).use();
    expect(scene.spawn).not.toHaveBeenCalled();
  });
});

describe('the lava lamp', () => {
  it('changes colour each time, round and round', () => {
    const { make } = setup();
    const lamp = make(LavaLamp, {});
    const seen = new Set([lamp.v]);
    for (let i = 0; i < 3; i++) {
      lamp.use();
      seen.add(lamp.v);
    }
    expect(seen.size).toBe(4);
    lamp.use();
    expect(lamp.v).toBe(0);
  });
});

describe('the path to the lava family\'s house', () => {
  const { path, far } = LAVA_HOUSE;

  it('is full size at the near end and smallest at the door', () => {
    expect(distanceScale(path[0].y, LAVA_HOUSE)).toBe(1);
    expect(distanceScale(path.at(-1).y, LAVA_HOUSE)).toBe(far);
  });

  it('gets steadily smaller the further up it she goes', () => {
    const scales = path.map((p) => distanceScale(p.y, LAVA_HOUSE));
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeLessThan(scales[i - 1]);
    }
  });

  it('starts where she can walk to', () => {
    expect(path[0].y).toBeGreaterThanOrEqual(122);
  });
});
