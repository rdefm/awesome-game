import { describe, expect, it, vi } from 'vitest';
import { findReceiver } from '../../engine/scene.js';
import { PUFF_BURROW } from '../layout.js';
import { Critter } from './bluebell.js';
import { NAP_TIME, PuffBurrow } from './burrow.js';
import { Teddy } from './items.js';

const assets = { critter: {}, teddy: {}, burrow: {}, babyPuff: [{}, {}], text: () => ({}) };

// The babies out in the meadow (as entities of their own) right now.
const babiesOut = (scene) => scene.entities.filter((e) => !(e instanceof PuffBurrow) && !(e instanceof Critter)).length;

// Just enough of the meadow for the burrow. `peak` is the most babies seen
// out at once (tweens finish at once, so the whole reveal plays straight through).
function setup() {
  const seen = { peak: 0 };
  const scene = {
    width: 512,
    engine: {
      audio: { play: vi.fn() },
      tweens: {
        to: vi.fn(() => {
          seen.peak = Math.max(seen.peak, babiesOut(scene));
          return Promise.resolve();
        }),
      },
      wait: () => Promise.resolve(),
    },
    entities: [],
    add: (e) => Object.assign(e, { scene }) && scene.entities.push(e) && e,
    remove: (e) => {
      scene.entities = scene.entities.filter((o) => o !== e);
    },
    girl: { x: 260, y: 140, mode: 'idle', faceToward: vi.fn(), say: vi.fn(), act: vi.fn() },
    interact: vi.fn(),
    putDown: vi.fn((item, x, y) => Object.assign(item, { x, y }) && Promise.resolve()),
    settle: vi.fn(),
    sparkles: vi.fn(),
    hearts: vi.fn(),
    bits: vi.fn(),
    dust: vi.fn(),
  };
  scene.engine.scene = scene;
  const burrow = scene.add(new PuffBurrow(assets));
  const puffball = scene.add(new Critter(assets, { id: 'critter', kind: 'critter', x: 200, y: 140 }));
  return { scene, burrow, puffball, seen };
}

describe('the puffball burrow', () => {
  it('sits on the far stretch of the meadow', () => {
    const { burrow } = setup();
    expect(burrow.x).toBe(PUFF_BURROW.x);
    expect(burrow.x).toBeGreaterThan(256);
  });

  it('tapped: a tumble of babies rolls out, plays, and they all go back in', async () => {
    const { scene, burrow, seen } = setup();
    await burrow.use();
    expect(seen.peak).toBeGreaterThanOrEqual(3);
    expect(babiesOut(scene)).toBe(0);
  });

  it('tapping again gives a variation (a different number of babies)', async () => {
    const { burrow, seen } = setup();
    const peaks = [];
    for (let i = 0; i < 3; i++) {
      seen.peak = 0;
      await burrow.use();
      peaks.push(seen.peak);
    }
    expect(new Set(peaks).size).toBe(3);
  });

  it('takes the puffball dropped on it, but nothing else', () => {
    const { burrow, puffball } = setup();
    expect(burrow.accepts(puffball)).toBe(true);
    expect(burrow.accepts(new Teddy(assets, { id: 't', kind: 'teddy', x: 0, y: 0 }))).toBe(false);
  });

  it('a dropped teddy falls through to whatever else is there', () => {
    const { scene, burrow } = setup();
    const teddy = new Teddy(assets, { id: 't', kind: 'teddy', x: burrow.x, y: burrow.y });
    expect(findReceiver(scene.entities, teddy, burrow.x, burrow.y - 4)).toBe(null);
  });

  it('only its own small patch answers taps, so she walks right past', () => {
    const { burrow } = setup();
    expect(burrow.hitTest(burrow.x, burrow.y - 4)).toBe(true);
    expect(burrow.hitTest(burrow.x + 40, burrow.y - 4)).toBe(false);
    expect(burrow.priority).toBeLessThan(0);
  });

  it('the puffball wriggles in for a nap: out of sight, and snoring', async () => {
    const { scene, burrow, puffball } = setup();
    await burrow.receive(puffball);
    expect(burrow.napper).toBe(puffball);
    expect(puffball.napping).toBe(true);
    expect(puffball.hitTest(puffball.x, puffball.y - 4)).toBe(false);
    expect(puffball.draggable).toBe(false);
    expect(burrow.accepts(puffball)).toBe(false);
    burrow.update(3);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('snore');
  });

  it('tapping the burrow wakes it: it pops back out', async () => {
    const { scene, burrow, puffball } = setup();
    await burrow.receive(puffball);
    burrow.onTap();
    await Promise.resolve();
    expect(burrow.napper).toBe(null);
    expect(puffball.napping).toBe(false);
    expect(puffball.draggable).toBe(true);
    expect(puffball.busy).toBe(false);
    expect(scene.interact).not.toHaveBeenCalled(); // no babies, no walking over
    expect(scene.settle).toHaveBeenCalledWith(puffball);
  });

  it('wakes up on its own after a while', async () => {
    const { burrow, puffball } = setup();
    await burrow.receive(puffball);
    burrow.update(NAP_TIME / 2);
    expect(puffball.napping).toBe(true);
    burrow.update(NAP_TIME);
    expect(puffball.napping).toBe(false);
  });

  it('no babies come out while the puffball naps, and no nap mid-babies', async () => {
    const { burrow, puffball } = setup();
    const playing = burrow.use();
    expect(burrow.accepts(puffball)).toBe(false);
    await playing;
    await burrow.receive(puffball);
    burrow.use();
    expect(burrow.babies).toHaveLength(0);
  });

  it('tapped while it is still dropping in: not woken yet', async () => {
    const { scene, burrow, puffball } = setup();
    let land;
    scene.putDown = vi.fn(() => new Promise((done) => {
      land = done;
    }));
    const dropping = burrow.receive(puffball);
    burrow.onTap();
    expect(burrow.napper).toBe(puffball);
    land();
    await dropping;
    expect(puffball.napping).toBe(true);
  });

  it('nothing about the nap is saved: a puffball saved at the burrow door loads awake', () => {
    const { door } = setup().burrow;
    const puffball = new Critter(assets, { id: 'critter', kind: 'critter', x: door.x, y: door.y + 4 });
    expect(puffball.napping).toBe(false);
    expect(puffball.hitTest(puffball.x, puffball.y - 4)).toBe(true);
  });
});
