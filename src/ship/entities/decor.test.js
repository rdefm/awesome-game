import { describe, expect, it, vi } from 'vitest';
import { WALK, WALL_HANG } from '../layout.js';
import { makeCarryable } from '../kinds.js';
import { add, defaultWorld, stash } from '../world.js';
import { Critter } from './bluebell.js';
import { Girl } from './girl.js';
import { Teddy } from './items.js';
import { DECOR, MAX_COPIES, canPrint } from './decor.js';

const assets = {
  critter: {},
  teddy: {},
  decor: {
    rug: {}, lamp: [{}, {}], lampGlow: {}, beanbag: {}, wallposter: {},
  },
};

// Just enough of a place for decor to sit in.
function sceneFor({ hasWall = true } = {}) {
  const scene = {
    hasWall,
    busy: false,
    girl: { x: 100, y: 136, faceToward: vi.fn(), say: vi.fn() },
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()) }, wait: () => Promise.resolve() },
    saveStage: vi.fn(),
    putDown: vi.fn(() => Promise.resolve()),
    settle: vi.fn(),
    sparkles: vi.fn(),
    hearts: vi.fn(),
    dust: vi.fn(),
  };
  scene.engine.scene = scene;
  return scene;
}

function make(kind, extra = {}, scene = sceneFor()) {
  const item = makeCarryable(assets, { id: `${kind}0`, kind, x: 120, y: 140, ...extra });
  item.scene = scene;
  return item;
}

describe('decor', () => {
  it('has a rug, a lamp, a beanbag and a wall poster, all carryable', () => {
    expect(DECOR).toEqual(['rug', 'lamp', 'beanbag', 'wallposter']);
    for (const kind of DECOR) {
      const item = make(kind);
      expect(item, kind).not.toBeNull();
      expect(item.draggable).toBe(true);
    }
  });

  it('draws rugs under everything on the floor, even things right at the back', () => {
    const rug = make('rug', { y: WALK.maxY });
    const teddy = new Teddy(assets, { id: 'teddy', kind: 'teddy', x: 120, y: WALK.minY });
    expect(rug.depth).toBeLessThan(teddy.depth);
  });

  it('draws wall pieces behind everything on the floor, but over the wall fixtures', () => {
    const poster = make('wallposter', { y: WALL_HANG.maxY });
    const teddy = new Teddy(assets, { id: 'teddy', kind: 'teddy', x: 120, y: WALK.minY });
    expect(poster.depth).toBeLessThan(teddy.depth);
    expect(poster.depth).toBeGreaterThan(-10); // lockers, the door, the porthole...
  });

  it('lifts a rug above everything while it is being carried', () => {
    const rug = make('rug');
    rug.held = true;
    expect(rug.depth).toBeGreaterThan(WALK.maxY);
  });

  it('snaps wall pieces up onto the wall when dropped on the floor', () => {
    const poster = make('wallposter');
    const spot = poster.restingSpot(80, 140);
    expect(spot.x).toBe(80);
    expect(spot.y).toBe(WALL_HANG.maxY);
  });

  it('hangs wall pieces where they are dropped, if that is on the wall', () => {
    const poster = make('wallposter');
    expect(poster.restingSpot(80, 60)).toEqual({ x: 80, y: 60 });
    expect(poster.restingSpot(80, 2).y).toBe(WALL_HANG.minY);
  });

  it('leaves wall pieces on the floor where there is no wall (out on a planet)', () => {
    const poster = make('wallposter', {}, sceneFor({ hasWall: false }));
    const spot = poster.restingSpot(80, 60);
    expect(spot.y).toBe(WALK.minY);
  });

  it('puts everything else on the floor', () => {
    expect(make('rug').restingSpot(80, 60).y).toBe(WALK.minY);
    expect(make('lamp').restingSpot(80, 200).y).toBe(WALK.maxY);
  });

  it('switches the lamp on and off with a tap, remembering which', () => {
    const scene = sceneFor();
    const lamp = make('lamp', {}, scene);
    expect(lamp.on).toBe(false);
    lamp.onTap();
    expect(lamp.on).toBe(true);
    expect(scene.saveStage).toHaveBeenLastCalledWith(lamp, 1);
    lamp.onTap();
    expect(lamp.on).toBe(false);
    expect(scene.saveStage).toHaveBeenLastCalledWith(lamp, 0);
  });

  it('remembers a lamp left on', () => {
    expect(make('lamp', { stage: 1 }).on).toBe(true);
  });

  it('lets a friend flop onto the beanbag, then settles them beside it', async () => {
    const scene = sceneFor();
    const beanbag = make('beanbag', {}, scene);
    const friend = new Critter(assets, { id: 'critter', kind: 'critter', x: 60, y: 130 });
    friend.scene = scene;
    expect(beanbag.accepts(friend)).toBe(true);
    await beanbag.receive(friend);
    expect(scene.settle).toHaveBeenCalledWith(friend);
    expect(friend.busy).toBe(false);
    expect(friend.draggable).toBe(true);
  });

  it('lets her flop into the beanbag too, then hop out beside it', async () => {
    const scene = sceneFor();
    const girl = new Girl({ girl: () => ({}), emotes: {} }, 100, 136, {});
    girl.scene = scene;
    Object.assign(scene, { girl, persist: vi.fn(), scripted: (run) => run() });
    const beanbag = make('beanbag', { x: 120, y: 140 }, scene);
    expect(typeof beanbag.use).toBe('function'); // so tapping it walks her over
    await beanbag.use();
    expect(girl.mode).toBe('idle');
    expect(girl.lift).toBe(0);
    expect(girl.pose).toBeNull();
    expect(Math.abs(girl.x - beanbag.x)).toBeGreaterThan(10);
    expect(beanbag.sitter).toBeNull();
    expect(scene.persist).toHaveBeenCalled();
  });

  it('keeps her out of the beanbag while a friend is in it', async () => {
    const scene = sceneFor();
    const girl = new Girl({ girl: () => ({}), emotes: {} }, 100, 136, {});
    girl.scene = scene;
    Object.assign(scene, { girl, persist: vi.fn(), scripted: vi.fn() });
    const beanbag = make('beanbag', {}, scene);
    beanbag.sitter = new Critter(assets, { id: 'critter', kind: 'critter', x: 60, y: 130 });
    await beanbag.use();
    expect(scene.scripted).not.toHaveBeenCalled();
    expect(girl.emote?.kind).toBe('question');
  });

  it('only takes friends on the beanbag', () => {
    const beanbag = make('beanbag');
    expect(beanbag.accepts(new Teddy(assets, { id: 'teddy', kind: 'teddy', x: 0, y: 0 }))).toBe(false);
  });
});

describe('decor printer limits', () => {
  it('prints a piece until there are enough of it about', () => {
    let world = defaultWorld();
    for (let n = 0; n < MAX_COPIES; n++) {
      expect(canPrint(world, 'rug')).toBe(true);
      world = add(world, 'storeroom', { id: `rug${n}`, kind: 'rug', x: 100, y: 130 });
    }
    expect(canPrint(world, 'rug')).toBe(false);
    expect(canPrint(world, 'lamp')).toBe(true);
  });

  it('counts the ones in the bag and on planets too', () => {
    let world = add(defaultWorld(), 'bluebell', { id: 'lamp0', kind: 'lamp', x: 100, y: 130 });
    world = add(world, 'ship', { id: 'lamp1', kind: 'lamp', x: 100, y: 130 });
    world = add(world, 'ship', { id: 'lamp2', kind: 'lamp', x: 100, y: 130 });
    world = stash(world, 'lamp2');
    expect(canPrint(world, 'lamp')).toBe(false);
  });
});
