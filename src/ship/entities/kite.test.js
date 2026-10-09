import { describe, expect, it, vi } from 'vitest';
import { KITE } from '../layout.js';
import { Kite } from './kite.js';

const assets = { kite: { fly: {}, lying: {}, bow: {}, reel: {} } };

// Just enough of the meadow for the kite. Tweens finish at once (landing on
// their targets), so a whole flight plays straight through; `seen` keeps the
// highest the kite (and a friend riding it) got, how far round its loop it
// went, and where she ran to.
function setup() {
  const seen = { kiteY: Infinity, riderLift: 0, loop: 0, ranTo: null };
  const girl = {
    x: KITE.x - 16, y: KITE.y + 2, lift: 0, scale: 1, mode: 'idle', onFeet: true, facing: 1,
    faceToward: vi.fn(), walkTo: vi.fn(() => Promise.resolve(true)), say: vi.fn(), act: vi.fn(() => Promise.resolve()), hop: vi.fn(() => Promise.resolve()),
  };
  const scene = {
    width: 512,
    busy: false,
    engine: {
      time: 0,
      audio: { play: vi.fn() },
      tweens: { to: null },
      wait: () => Promise.resolve(),
    },
    girl,
    interact: vi.fn(),
    scripted: vi.fn((run) => run()),
    putDown: vi.fn((item, x, y) => Object.assign(item, { x, y }) && Promise.resolve()),
    settle: vi.fn(),
    sparkles: vi.fn(),
    hearts: vi.fn(),
    dust: vi.fn(),
  };
  scene.engine.scene = scene;
  const kite = Object.assign(new Kite(assets), { scene });
  scene.engine.tweens.to = vi.fn((o, props) => {
    Object.assign(o, props);
    kite.update(0);
    if (kite.flight) {
      seen.kiteY = Math.min(seen.kiteY, kite.at.y);
    }
    seen.loop = Math.max(seen.loop, kite.loop);
    if (kite.rider) {
      seen.riderLift = Math.max(seen.riderLift, kite.rider.lift);
    }
    if (o === girl && 'x' in props) {
      seen.ranTo = props.x;
    }
    return Promise.resolve();
  });
  return { scene, girl, kite, seen };
}

function friend() {
  return { kind: 'critter', x: 200, y: 140, lift: 0, busy: false, draggable: true, seatFrame: () => ({}), pose: vi.fn() };
}

describe('the kite', () => {
  it('lies in the grass on the far stretch of the meadow', () => {
    const { kite } = setup();
    expect(kite.x).toBe(KITE.x);
    expect(kite.x).toBeGreaterThan(256);
    expect(kite.flight).toBeNull();
  });

  it('tapped: she walks over', () => {
    const { scene, kite } = setup();
    kite.onTap();
    expect(scene.interact).toHaveBeenCalledWith(kite);
  });

  it('she runs a few steps and it swoops up into the sky, loops, and floats back down into the grass', async () => {
    const { scene, girl, kite, seen } = setup();
    const from = girl.x;
    await kite.use();
    expect(Math.abs(seen.ranTo - from)).toBeGreaterThan(10); // she ran
    expect(seen.kiteY).toBeLessThan(80); // up in the sky
    expect(seen.loop).toBe(1); // round the loop
    expect(kite.flight).toBeNull(); // back down, lying in the grass
    expect(scene.scripted).toHaveBeenCalled();
    expect(girl.act).toHaveBeenCalledWith('cheer', expect.anything());
    expect(girl.walkTo).toHaveBeenCalled(); // back to put the reel down by it
    expect(kite.holder).toBeNull();
  });

  it('takes a friend dropped on it, but nothing else, and not while flying', () => {
    const { kite } = setup();
    expect(kite.accepts(friend())).toBe(true);
    expect(kite.accepts({ kind: 'ball', x: 0, y: 0 })).toBe(false);
    expect(kite.accepts({ ...friend(), busy: true })).toBe(false);
    kite.flight = { x: 0, y: 0 };
    expect(kite.accepts(friend())).toBe(false);
    kite.flight = null;
    kite.rider = friend();
    expect(kite.accepts(friend())).toBe(false);
    kite.rider = null;
    kite.revealing = true;
    expect(kite.accepts(friend())).toBe(false);
  });

  it('a friend dropped on it rides it up round a loop-the-loop and lands back down, delighted', async () => {
    const { scene, kite, seen } = setup();
    const pal = friend();
    await kite.receive(pal);
    expect(scene.putDown).toHaveBeenCalledWith(pal, expect.any(Number), expect.any(Number));
    expect(seen.riderLift).toBeGreaterThan(40); // way up in the sky
    expect(seen.loop).toBe(1);
    expect(kite.flight).toBeNull();
    expect(kite.rider).toBeNull();
    expect(pal.lift).toBe(0); // landed safely
    expect(pal.x).toBeCloseTo(kite.x, 0);
    expect(pal.busy).toBe(false);
    expect(pal.draggable).toBe(true);
    expect(scene.hearts).toHaveBeenCalled();
    expect(scene.settle).toHaveBeenCalledWith(pal);
  });

  it("can't be flown while a friend's riding it", async () => {
    const { scene, kite } = setup();
    kite.rider = friend();
    kite.onTap();
    expect(scene.interact).not.toHaveBeenCalled();
    await kite.use();
    expect(scene.scripted).not.toHaveBeenCalled();
  });
});
