import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BED_NOOK, DRESSER, PULL_CORD, POD, STAR_WINDOW, WALK, distanceScale } from '../layout.js';
import { isFriend, makeCarryable } from '../kinds.js';
import { defaultWorld, normalizeWorld, stash } from '../world.js';
import { Local, PottedBluebell } from './bluebell.js';
import { Girl } from './girl.js';
import { DRAWER_THINGS, PANTRY_SNACKS, Snack, Trinket, isSnack } from './items.js';
import {
  BedNook, BubbleBath, Dresser, Kettle, LIGHT_COLORS, LightCord, MAX_PANTRY_SNACKS, Pantry, PhotoFrame, SeedTray, Telescope,
  drawerMemory, normalizePod,
} from './pod.js';

const assets = {
  local: {}, snacks: { nectar: {}, seedcookie: {} }, bubbleBath: {}, telescope: {}, seedTray: [], bedNook: { quilt: [] },
  pantry: {}, kettle: {}, steam: {}, dresser: [], trinkets: { sock: {}, seedpacket: {}, plushie: {} },
  pullCord: {}, photoFrame: {}, pottedBell: {}, girl: () => ({}), emotes: {},
};

// Just enough of the pod for its things (and the pink alien to bring in).
function setup() {
  const scene = {
    engine: {
      audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve(),
    },
    entities: [],
    busy: false,
    scripted: vi.fn((run) => run()),
    interact: vi.fn(),
    persist: vi.fn(),
    settle: vi.fn(),
    dust: vi.fn(),
    putDown: vi.fn(() => Promise.resolve()),
    spawn: vi.fn((kind, x, y) => {
      const item = makeCarryable(assets, { id: `${kind}${scene.entities.length}`, kind, x, y });
      item.scene = scene;
      scene.entities.push(item);
      return item;
    }),
    toast: vi.fn(),
    hearts: vi.fn(),
    sparkles: vi.fn(),
    bits: vi.fn(),
    musicNote: vi.fn(),
    findSticker: vi.fn(),
    memories: [],
    remember: vi.fn((memory) => {
      scene.memories = [...scene.memories, memory];
    }),
    savePod: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  const local = new Local(assets, { id: 'local', kind: 'local', x: 60, y: 136 });
  for (const e of [girl, local]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  Object.assign(scene, { girl });
  const make = (Kind, state) => Object.assign(new Kind(assets, state), { scene });
  return { scene, girl, local, make };
}

const played = (scene, sound) => scene.engine.audio.play.mock.calls.filter(([s]) => s === sound);

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the bubble bath', () => {
  it('swished, fills up with bubbles that float off and pop', async () => {
    const { scene, make } = setup();
    const bath = make(BubbleBath);
    await bath.use();
    expect(played(scene, 'splash')).toHaveLength(1);
    const n = bath.bubbles.length;
    expect(n).toBeGreaterThanOrEqual(3);
    expect(bath.swishing).toBe(false);
    for (let i = 0; i < 100; i++) {
      bath.update(0.1);
    }
    expect(bath.bubbles).toHaveLength(0);
    expect(played(scene, 'pop')).toHaveLength(n);
  });

  it('takes friends, not other things', () => {
    const { local, make } = setup();
    const bath = make(BubbleBath);
    expect(bath.accepts(local)).toBe(true);
    expect(bath.accepts(make(Snack, { id: 'c', kind: 'cookie', x: 0, y: 0 }))).toBe(false);
  });

  it('has a friend splash about in it, then hop back out', async () => {
    const { scene, local, make } = setup();
    const bath = make(BubbleBath);
    const done = bath.receive(local);
    expect(bath.accepts(local)).toBe(false); // already busy with it
    await done;
    expect(scene.putDown.mock.calls[0][0]).toBe(local);
    expect(played(scene, 'splash').length).toBeGreaterThanOrEqual(1);
    expect(bath.friend).toBe(null);
    expect(local.seat).toBe(null);
    expect(local.busy).toBe(false);
    expect(local.draggable).toBe(true);
  });
});

describe('the bed nook', () => {
  it('has her climb in and snooze, the pod dimming', async () => {
    const { scene, girl, make } = setup();
    const nook = make(BedNook);
    await nook.use();
    expect(nook.sleeper).toBe(girl);
    expect(nook.asleep).toBe(true);
    expect(girl.riding).toBe(nook);
    expect(played(scene, 'yawn')).toHaveLength(1);
    nook.update(5);
    expect(nook.dim).toBe(1);
  });

  it('wakes her when she is tapped, and the pod brightens again', async () => {
    const { girl, make } = setup();
    const nook = make(BedNook);
    await nook.use();
    nook.update(5);
    girl.onTap();
    await vi.waitFor(() => expect(girl.mode).toBe('idle'));
    expect(nook.sleeper).toBe(null);
    expect(girl.riding).toBe(null);
    expect({ x: girl.x, y: girl.y }).toEqual(BED_NOOK.spot);
    nook.update(5);
    expect(nook.dim).toBe(0);
  });

  it('wakes her when the nook is tapped, rather than her walking over', async () => {
    const { scene, make } = setup();
    const nook = make(BedNook);
    await nook.use();
    nook.onTap();
    await vi.waitFor(() => expect(nook.sleeper).toBe(null));
    expect(scene.interact).not.toHaveBeenCalled();
  });

  it('tucks a friend in to nap (remembered on the floor beside it), without dimming', () => {
    const { scene, local, make } = setup();
    const nook = make(BedNook);
    expect(nook.accepts(local)).toBe(true);
    expect(nook.accepts(make(Snack, { id: 'c', kind: 'cookie', x: 0, y: 0 }))).toBe(false);
    nook.receive(local);
    expect(nook.sleeper).toBe(local);
    expect(local.seat).toBe(nook);
    expect(scene.settle).toHaveBeenCalledWith(local, BED_NOOK.spot.x, BED_NOOK.spot.y);
    nook.update(5);
    expect(nook.dim).toBe(0);
  });

  it('wakes a friend when it is picked up out of it', () => {
    const { scene, local, make } = setup();
    const nook = make(BedNook);
    nook.receive(local);
    expect(nook.draggable).toBe(true);
    nook.onDragStart({ x: nook.x, y: nook.top });
    expect(nook.sleeper).toBe(null);
    expect(local.seat).toBe(null);
    expect(local.held).toBe(true);
    expect(played(scene, 'yawn')).toHaveLength(1);
  });

  it('takes no friend while she is in it, and she is not picked up out of it', async () => {
    const { local, make } = setup();
    const nook = make(BedNook);
    await nook.use();
    expect(nook.accepts(local)).toBe(false);
    expect(nook.draggable).toBe(false);
  });

  it('has her pat a napping friend rather than climb in on top', async () => {
    const { girl, local, make } = setup();
    const nook = make(BedNook);
    nook.receive(local);
    await nook.use();
    expect(nook.sleeper).toBe(local);
    expect(girl.riding).toBe(null);
  });
});

describe('the telescope', () => {
  it('shows twinkling stars, all inside the window', () => {
    const { make } = setup();
    const scope = make(Telescope);
    expect(scope.stars.length).toBeGreaterThanOrEqual(5);
    for (const s of scope.stars) {
      expect(Math.hypot(s.x, s.y)).toBeLessThan(STAR_WINDOW.r);
    }
  });

  it('looked through, brings out the stars and a shooting star, then day again', async () => {
    const { scene, make } = setup();
    const scope = make(Telescope);
    await scope.use();
    expect(played(scene, 'tinkle')).toHaveLength(1);
    expect(played(scene, 'whoosh')).toHaveLength(1);
    expect(scope.looking).toBe(false);
  });
});

describe('the seed tray', () => {
  it('watered, sprouts a stage at a time up to flowers', async () => {
    const { scene, make } = setup();
    const tray = make(SeedTray);
    expect(tray.stage).toBe(0);
    const stages = [];
    for (let i = 0; i < 3; i++) {
      await tray.use();
      stages.push(tray.stage);
    }
    expect(stages).toEqual([1, 2, 3]);
    expect(played(scene, 'grow')).toHaveLength(3);
  });

  it('in flower, rings its flowers, gives her one in a pot, and blows its seeds off to start again', async () => {
    const { scene, make } = setup();
    const tray = make(SeedTray);
    for (let i = 0; i < 4; i++) {
      await tray.use();
    }
    expect(tray.stage).toBe(0);
    expect(played(scene, 'plink').length).toBeGreaterThanOrEqual(3);
    expect(played(scene, 'poof')).toHaveLength(1);
    expect(tray.tending).toBe(false);
    expect(scene.spawn.mock.calls.map(([kind]) => kind)).toEqual(['pottedbell']);
    const potted = scene.spawn.mock.results[0].value;
    expect(potted).toBeInstanceOf(PottedBluebell);
    expect(scene.putDown.mock.calls[0][0]).toBe(potted);
  });

  it('gives a potted bluebell every time round', async () => {
    const { scene, make } = setup();
    const tray = make(SeedTray);
    for (let i = 0; i < 8; i++) {
      await tray.use();
    }
    expect(scene.spawn.mock.calls.map(([kind]) => kind)).toEqual(['pottedbell', 'pottedbell']);
  });
});

describe('a potted bluebell', () => {
  const potted = (v) => makeCarryable(assets, { id: 'pottedbell0', kind: 'pottedbell', x: 150, y: 140, ...(v === undefined ? {} : { v }) });

  it('is a carryable thing, not a friend, and goes in the bag (keeping its note)', () => {
    expect(potted(2)).toBeInstanceOf(PottedBluebell);
    expect(isFriend('pottedbell')).toBe(false);
    const world = stash(normalizeWorld({ placed: { pod: [{ id: 'pottedbell0', kind: 'pottedbell', x: 150, y: 140, v: 2 }] }, bag: [] }), 'pottedbell0');
    expect(world.bag).toEqual([{ id: 'pottedbell0', kind: 'pottedbell', v: 2 }]);
    expect(normalizeWorld(world).bag).toEqual(world.bag);
  });

  it('rings its note when tapped, wherever it is', () => {
    const { scene } = setup();
    const item = Object.assign(potted(3), { scene });
    item.onTap();
    expect(played(scene, 'bell3')).toHaveLength(1);
    expect(scene.musicNote).toHaveBeenCalled();
    expect(item.ring).toBe(1);
    item.update(5);
    expect(item.ring).toBe(0);
  });

  it('rings the first note if it has none', () => {
    const { scene } = setup();
    const item = Object.assign(potted(), { scene });
    item.onTap();
    expect(played(scene, 'bell0')).toHaveLength(1);
  });

  it('is a present the pink alien keeps beside it, ringing it (no crystal sticker for it)', async () => {
    const { scene, local } = setup();
    const item = Object.assign(potted(1), { scene });
    expect(local.accepts(item)).toBe(true);
    await local.receive(item);
    expect(scene.putDown.mock.calls[0][0]).toBe(item);
    expect(played(scene, 'bell1')).toHaveLength(1);
    expect(played(scene, 'cheer')).toHaveLength(1);
    expect(scene.findSticker).not.toHaveBeenCalled();
    expect(local.busy).toBe(false);
  });
});

describe('the pantry snacks', () => {
  it('are snacks like any other: carryable, feedable, and not friends', () => {
    const { local } = setup();
    for (const kind of PANTRY_SNACKS) {
      const item = makeCarryable(assets, { id: `${kind}0`, kind, x: 100, y: 140 });
      expect(item, kind).toBeInstanceOf(Snack);
      expect(isSnack(item)).toBe(true);
      expect(isFriend(kind)).toBe(false);
      expect(local.accepts(item)).toBe(true);
    }
  });

  it('keep in the bag, and old saves load fine without them', () => {
    const world = normalizeWorld({ placed: {}, bag: [{ id: 'nectar0', kind: 'nectar' }, { id: 'seedcookie0', kind: 'seedcookie' }] });
    expect(world.bag.map((e) => e.kind)).toEqual(['nectar', 'seedcookie']);
    const old = normalizeWorld({ placed: { ship: [] }, bag: [{ id: 'juice0', kind: 'juice' }] });
    expect(old.bag).toEqual([{ id: 'juice0', kind: 'juice' }]);
    expect(old.placed.pod ?? []).toEqual(defaultWorld().placed.pod ?? []);
  });
});

describe('the pantry cupboard', () => {
  it('opens and gives a nectar pot, then a seed cookie, then a nectar pot...', async () => {
    const { scene, make } = setup();
    const pantry = make(Pantry);
    let openWhenOut = null;
    scene.spawn.mockImplementationOnce((kind, x, y) => {
      openWhenOut = pantry.open;
      const item = makeCarryable(assets, { id: 'n', kind, x, y });
      item.scene = scene;
      scene.entities.push(item);
      return item;
    });
    for (let i = 0; i < 3; i++) {
      await pantry.use();
    }
    expect(scene.spawn.mock.calls.map(([kind]) => kind)).toEqual(['nectar', 'seedcookie', 'nectar']);
    expect(openWhenOut).toBe(true);
    expect(pantry.open).toBe(false);
    expect(pantry.giving).toBe(false);
    expect(scene.putDown).toHaveBeenCalledTimes(3);
  });

  it('stops giving once there are plenty of its snacks about the pod', async () => {
    const { scene, make } = setup();
    const pantry = make(Pantry);
    for (let i = 0; i < MAX_PANTRY_SNACKS + 2; i++) {
      await pantry.use();
    }
    expect(scene.spawn).toHaveBeenCalledTimes(MAX_PANTRY_SNACKS);
    expect(scene.toast).toHaveBeenCalled();
    scene.entities = scene.entities.filter((e) => e.kind !== 'nectar'); // some eaten or bagged
    await pantry.use();
    expect(scene.spawn).toHaveBeenCalledTimes(MAX_PANTRY_SNACKS + 1);
  });

  it('has her stand where she can walk to', () => {
    const { make } = setup();
    const { spot } = make(Pantry);
    expect(spot.y).toBeGreaterThanOrEqual(WALK.minY);
  });
});

describe('the drawer finds', () => {
  it('are carryable things, not snacks or friends', () => {
    const { local } = setup();
    for (const kind of DRAWER_THINGS) {
      const item = makeCarryable(assets, { id: `${kind}0`, kind, x: 100, y: 140 });
      expect(item, kind).toBeInstanceOf(Trinket);
      expect(isSnack(item)).toBe(false);
      expect(isFriend(kind)).toBe(false);
      expect(local.accepts(item)).toBe(false);
    }
  });

  it('keep in the bag', () => {
    const bag = DRAWER_THINGS.map((kind) => ({ id: `${kind}0`, kind }));
    expect(normalizeWorld({ placed: {}, bag }).bag).toEqual(bag);
  });

  it('give a little jiggle when tapped', () => {
    const { scene, make } = setup();
    const sock = make(Trinket, { id: 'sock0', kind: 'sock', x: 100, y: 140 });
    sock.onTap();
    expect(scene.engine.audio.play).toHaveBeenCalled();
  });
});

describe('the dresser', () => {
  // Taps it on drawer `i`, and she uses it.
  const pull = (dresser, i) => {
    dresser.onTap({ x: DRESSER.x, y: dresser.drawerY(i) });
    return dresser.use();
  };

  it('works out which drawer was tapped', () => {
    const { make } = setup();
    const dresser = make(Dresser);
    DRAWER_THINGS.forEach((_, i) => {
      expect(dresser.drawerAt(dresser.drawerY(i))).toBe(i);
      expect(dresser.hitTest(DRESSER.x, dresser.drawerY(i))).toBe(true);
    });
    expect(dresser.drawerAt(0)).toBe(0);
    expect(dresser.drawerAt(DRESSER.y)).toBe(DRAWER_THINGS.length - 1);
  });

  it('has a different thing in each drawer, and remembers it has been taken', async () => {
    const { scene, make } = setup();
    const dresser = make(Dresser);
    let openWhenOut = null;
    scene.spawn.mockImplementationOnce((kind, x, y) => {
      openWhenOut = dresser.open;
      const item = makeCarryable(assets, { id: 'x', kind, x, y });
      item.scene = scene;
      scene.entities.push(item);
      return item;
    });
    for (let i = 0; i < DRAWER_THINGS.length; i++) {
      await pull(dresser, i);
    }
    expect(openWhenOut).toBe(0);
    expect(scene.spawn.mock.calls.map(([kind]) => kind)).toEqual(DRAWER_THINGS);
    expect(scene.memories).toEqual(DRAWER_THINGS.map(drawerMemory));
    expect(scene.putDown).toHaveBeenCalledTimes(DRAWER_THINGS.length);
    expect(dresser.open).toBe(-1);
    expect(dresser.pulling).toBe(false);
  });

  it('comes up empty once a drawer has been emptied: a puff of dust and a sneeze', async () => {
    const { scene, make } = setup();
    const dresser = make(Dresser);
    await pull(dresser, 1);
    await pull(dresser, 1);
    expect(scene.spawn).toHaveBeenCalledTimes(1);
    expect(played(scene, 'sneeze')).toHaveLength(1);
    expect(scene.bits).toHaveBeenCalled();
    expect(dresser.open).toBe(-1);
  });

  it('remembers what has been taken across a reload', async () => {
    const { scene, make } = setup();
    scene.memories = [drawerMemory('plushie')];
    const dresser = make(Dresser);
    await pull(dresser, 2);
    expect(scene.spawn).not.toHaveBeenCalled();
    await pull(dresser, 0);
    expect(scene.spawn.mock.calls.map(([kind]) => kind)).toEqual(['sock']);
  });

  it('pays no mind to another tap while a drawer is out', async () => {
    const { scene, make } = setup();
    const dresser = make(Dresser);
    const first = pull(dresser, 0);
    await pull(dresser, 1);
    await first;
    expect(scene.spawn).toHaveBeenCalledTimes(1);
  });

  it('has her stand where she can walk to', () => {
    const { make } = setup();
    const { spot } = make(Dresser);
    expect(spot.y).toBeGreaterThanOrEqual(WALK.minY);
    expect(spot.x).toBeGreaterThanOrEqual(WALK.minX);
  });
});

describe('the kettle', () => {
  it('heats up and rattles, then whistles a tune with a puff of steam', async () => {
    const { scene, make } = setup();
    const kettle = make(Kettle);
    await kettle.use();
    expect(played(scene, 'rattle').length).toBeGreaterThanOrEqual(1);
    expect(played(scene, 'whistle')).toHaveLength(1);
    expect(kettle.boiling).toBe(false);
    expect(kettle.heat).toBe(1);
    kettle.update(0.1);
    expect(kettle.puffs.length).toBeGreaterThan(0);
    for (let i = 0; i < 100; i++) {
      kettle.update(0.1);
    }
    expect(kettle.puffs).toHaveLength(0);
    expect(kettle.heat).toBe(0);
  });

  it('pays no mind to another tap while it is on the boil', async () => {
    const { scene, make } = setup();
    const kettle = make(Kettle);
    const first = kettle.use();
    await kettle.use();
    await first;
    expect(played(scene, 'whistle')).toHaveLength(1);
  });
});

describe('the path to the pod', () => {
  const { path, far } = POD;

  it('is full size at the near end and smallest at the door', () => {
    expect(distanceScale(path[0].y, POD)).toBe(1);
    expect(distanceScale(path.at(-1).y, POD)).toBe(far);
  });

  it('gets steadily smaller the further up it she goes', () => {
    const scales = path.map((p) => distanceScale(p.y, POD));
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeLessThan(scales[i - 1]);
    }
  });

  it('starts where she can walk to', () => {
    expect(path[0].y).toBeGreaterThanOrEqual(122);
  });
});

describe('the light cord', () => {
  it('changes the lights to the next colour with each pull, round and back to pink, and saves it', async () => {
    const { scene, make } = setup();
    const cord = make(LightCord, 'pink');
    const seen = [];
    for (let i = 0; i < LIGHT_COLORS.length; i++) {
      await cord.use();
      seen.push(cord.lights);
    }
    expect(seen).toEqual(['gold', 'blue', 'green', 'rainbow', 'pink']);
    expect(scene.savePod.mock.calls.map(([patch]) => patch.lights)).toEqual(seen);
    expect(played(scene, 'pullcord')).toHaveLength(LIGHT_COLORS.length);
  });

  it('has every bulb one colour, except rainbow, which has them all', () => {
    const { make } = setup();
    const bulbs = (lights) => new Set([0, 1, 2, 3, 4, 5].map((i) => make(LightCord, lights).colorOf(i, 0)));
    expect(bulbs('blue').size).toBe(1);
    expect(bulbs('rainbow').size).toBeGreaterThan(1);
  });

  it('pays no mind to another tap mid-pull', async () => {
    const { make } = setup();
    const cord = make(LightCord, 'pink');
    const first = cord.use();
    await cord.use();
    await first;
    expect(cord.lights).toBe('gold');
  });

  it('has her stand where she can walk to', () => {
    expect(PULL_CORD.spot.y).toBeGreaterThanOrEqual(WALK.minY);
  });
});

describe('the photo frame', () => {
  it('is empty until a friend comes in', () => {
    const { make } = setup();
    expect(make(PhotoFrame, null).photo).toBe(null);
  });

  it('snaps the friend brought in, hat and all, with a flash and a click, and saves it', () => {
    const { scene, make } = setup();
    const frame = make(PhotoFrame, null);
    frame.snap({ id: 'monkey', kind: 'monkey', hat: 'crown', x: 50, y: 130 });
    expect(frame.photo).toEqual({ kind: 'monkey', hat: 'crown' });
    expect(frame.flash).toBeGreaterThan(0);
    expect(played(scene, 'shutter')).toHaveLength(1);
    expect(scene.savePod).toHaveBeenCalledWith({ photo: { kind: 'monkey', hat: 'crown' } });
    frame.snap({ id: 'local', kind: 'local' });
    expect(frame.photo).toEqual({ kind: 'local' });
  });

  it('pays no mind to things that are not friends', () => {
    const { scene, make } = setup();
    const frame = make(PhotoFrame, { kind: 'gonzo' });
    frame.snap({ id: 'nectar0', kind: 'nectar' });
    expect(frame.photo).toEqual({ kind: 'gonzo' });
    expect(scene.savePod).not.toHaveBeenCalled();
  });
});

describe("the pod's saved touches", () => {
  it('load fine from an old save: gold lights and an empty frame', () => {
    expect(normalizePod(undefined)).toEqual({ lights: 'gold', photo: null });
    expect(normalizePod({})).toEqual({ lights: 'gold', photo: null });
  });

  it('keep the light colour and the photo', () => {
    const pod = { lights: 'rainbow', photo: { kind: 'zig', stage: 2, hat: 'bow' } };
    expect(normalizePod(pod)).toEqual(pod);
  });

  it('shrug off anything odd', () => {
    expect(normalizePod({ lights: 'plaid', photo: { kind: 'dragon' } })).toEqual({ lights: 'gold', photo: null });
    expect(normalizePod({ photo: { kind: 'nectar' } }).photo).toBe(null);
    expect(normalizePod({ photo: 'monkey' }).photo).toBe(null);
  });
});
