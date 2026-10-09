import { describe, expect, it, vi } from 'vitest';
import { findReceiver } from '../../engine/scene.js';
import { STREAM, WALK, floorMaxX, inStream, streamAt } from '../layout.js';
import { Critter } from './bluebell.js';
import { Teddy } from './items.js';
import { Stream, besideStream, streamStones } from './stream.js';

const assets = { critter: {}, teddy: {}, stream: {}, streamStone: [{}, {}] };

// Just enough of the meadow for the stream. Tweens jump straight to the end.
function setup() {
  const scene = {
    width: 512,
    busy: false,
    engine: {
      time: 0,
      audio: { play: vi.fn() },
      tweens: { to: vi.fn((obj, props) => Object.assign(obj, props) && Promise.resolve()), cancel: vi.fn() },
      wait: () => Promise.resolve(),
    },
    entities: [],
    add: (e) => Object.assign(e, { scene }) && scene.entities.push(e) && e,
    remove: (e) => {
      scene.entities = scene.entities.filter((o) => o !== e);
    },
    girl: { x: 440, y: 140, lift: 0, headTop: 110, mode: 'idle', faceToward: vi.fn(), say: vi.fn(), act: vi.fn() },
    interact: vi.fn(),
    scripted: (run) => run(),
    putDown: vi.fn((item, x, y) => Object.assign(item, { x, y }) && Promise.resolve()),
    settle: vi.fn(),
    sparkles: vi.fn(),
    hearts: vi.fn(),
    bits: vi.fn(),
    dust: vi.fn(),
    ripple: vi.fn(),
  };
  const stream = scene.add(new Stream(assets));
  scene.stones = streamStones(assets).map((s) => scene.add(s));
  return { scene, stream };
}

// A thing let go over the stream at height y (in the left half of it,
// below the stepping stones).
function dropIn(scene, item, y = 148) {
  const { x } = streamAt(y);
  Object.assign(item, { x: x - 3, y });
  scene.add(item);
  return findReceiver(scene.entities, item, item.x, item.y);
}

const notes = (scene) => scene.engine.audio.play.mock.calls.filter(([name]) => name === 'plink').map(([, o]) => o.note);

describe('the stream', () => {
  it('runs across the far end of the meadow, with ground either side to stand on', () => {
    for (const y of [WALK.minY, WALK.maxY]) {
      const { x, half } = streamAt(y);
      expect(x - half).toBeGreaterThan(256);
      expect(x + half).toBeLessThan(floorMaxX(512));
    }
  });

  it('a thing dropped in floats off and washes up on the bank nearby: never lost', async () => {
    const { scene, stream } = setup();
    const teddy = new Teddy(assets, { id: 't', kind: 'teddy', x: 0, y: 0 });
    expect(dropIn(scene, teddy)).toBe(stream);
    const done = stream.receive(teddy);
    // Remembered on the bank straight away, and out of reach while it floats.
    const [, bx, by] = scene.settle.mock.calls[0];
    expect(inStream(bx, by)).toBe(false);
    expect(Math.abs(bx - streamAt(by).x)).toBeLessThan(30);
    expect(scene.entities).not.toContain(teddy);
    await done;
    expect(scene.entities).toContain(teddy);
    expect(scene.putDown).toHaveBeenCalledWith(teddy, bx, by);
    expect(inStream(teddy.x, teddy.y)).toBe(false);
    expect(teddy.x).toBeLessThan(streamAt(teddy.y).x); // on the side it went in
    expect(scene.engine.audio.play).toHaveBeenCalledWith('splash');
  });

  it('a friend dropped in paddles across to the far bank and shakes itself dry', async () => {
    const { scene, stream } = setup();
    const puffball = new Critter(assets, { id: 'critter', kind: 'critter', x: 0, y: 0 });
    expect(dropIn(scene, puffball)).toBe(stream);
    const done = stream.receive(puffball);
    expect(puffball.busy).toBe(true);
    await done;
    expect(scene.entities).toContain(puffball);
    expect(inStream(puffball.x, puffball.y)).toBe(false);
    expect(puffball.x).toBeGreaterThan(streamAt(puffball.y).x); // across
    expect(scene.engine.audio.play).toHaveBeenCalledWith('shake');
    expect(puffball.busy).toBe(false);
    expect(puffball.draggable).toBe(true);
    expect(puffball.squash).toBe(0);
  });

  it('only the water takes drops: not the banks, nor the stepping stones', () => {
    const { scene, stream } = setup();
    const teddy = new Teddy(assets, { id: 't', kind: 'teddy', x: 0, y: 0 });
    const { x, half } = streamAt(130);
    expect(findReceiver(scene.entities, teddy, x - half - 4, 130)).toBe(null);
    const stone = STREAM.stones[1];
    expect(findReceiver(scene.entities, teddy, stone.x, stone.y - 2)).toBe(null);
    expect(stream.priority).toBeLessThan(0);
  });

  it('the stepping stones: she hops across with rising notes, there and back', async () => {
    const { scene } = setup();
    const [first, , last] = scene.stones;
    const start = first.spot;
    expect(inStream(start.x, start.y)).toBe(false);
    Object.assign(scene.girl, start);
    await first.use();
    expect(notes(scene)).toEqual([1, 2, 3]);
    expect(scene.girl.x).toBeGreaterThan(streamAt(scene.girl.y).x);
    expect(inStream(scene.girl.x, scene.girl.y)).toBe(false);
    // And back again, from the far bank.
    scene.engine.audio.play.mockClear();
    expect(last.spot.x).toBeGreaterThan(last.x);
    await last.use();
    expect(notes(scene)).toEqual([1, 2, 3]);
    expect(scene.girl.x).toBeLessThan(streamAt(scene.girl.y).x);
  });

  it('anything put down in the water (not dropped right in) rests on the nearer bank', () => {
    for (const y of [WALK.minY, 138, WALK.maxY]) {
      const { x } = streamAt(y);
      const left = besideStream({ x: x - 1, y }, 512);
      const right = besideStream({ x: x + 1, y }, 512);
      expect(inStream(left.x, left.y)).toBe(false);
      expect(left.x).toBeLessThan(x);
      expect(inStream(right.x, right.y)).toBe(false);
      expect(right.x).toBeGreaterThan(x);
    }
    expect(besideStream({ x: 300, y: 140 }, 512)).toEqual({ x: 300, y: 140 });
  });
});
