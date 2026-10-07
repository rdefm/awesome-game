import { describe, expect, it, vi } from 'vitest';
import { Scene, findReceiver } from '../../engine/scene.js';
import { Secret } from './secret.js';

// Just enough of a scene for a secret to tap, walk and reveal in.
function fakeScene() {
  return {
    engine: { audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()) } },
    interact: vi.fn(),
    girl: { x: 20, faceToward: vi.fn() },
  };
}

// A secret whose reveal waits until the test lets it finish.
class TestSecret extends Secret {
  constructor() {
    super(100, 140, { w: 20, h: 12 });
    this.reveals = [];
  }

  reveal(n) {
    return new Promise((done) => this.reveals.push({ n, done }));
  }
}

function setup() {
  const secret = new TestSecret();
  secret.scene = fakeScene();
  return secret;
}

describe('Secret', () => {
  it('squashes straight away when tapped, and sends her over to it', () => {
    const secret = setup();
    secret.onTap();
    expect(secret.squash).toBeGreaterThan(0);
    expect(secret.scene.interact).toHaveBeenCalledWith(secret);
    expect(secret.reveals).toHaveLength(0); // the surprise waits until she arrives
  });

  it('reveals its surprise once she gets there, with a new variation each time', async () => {
    const secret = setup();
    const first = secret.use();
    secret.reveals[0].done();
    await first;
    const second = secret.use();
    secret.reveals[1].done();
    await second;
    expect(secret.reveals.map((r) => r.n)).toEqual([0, 1]);
  });

  it('still squashes when tapped mid-reveal, but does not start another', async () => {
    const secret = setup();
    secret.use();
    secret.squash = 0;
    secret.onTap();
    expect(secret.squash).toBeGreaterThan(0);
    secret.use();
    expect(secret.reveals).toHaveLength(1);
  });

  it('is not carryable and never takes things dropped on it', () => {
    const secret = setup();
    const ball = { kind: 'ball', hitTest: () => true };
    expect(secret.draggable).toBeFalsy();
    expect(findReceiver([secret, ball], ball, 100, 136)).toBe(null);
  });

  it('lets a carryable lying over it take the press', () => {
    const scene = new Scene();
    const secret = scene.add(new TestSecret());
    const ball = scene.add({ y: 130, hitTest: () => true }); // behind it, but overlapping
    expect(scene.pick(100, 136)).toBe(ball);
    expect(scene.pick(100, 136)).not.toBe(secret);
  });

  it('only answers taps on its own small patch', () => {
    const secret = setup();
    expect(secret.hitTest(100, 136)).toBe(true);
    expect(secret.hitTest(100, 120)).toBe(false);
    expect(secret.hitTest(120, 136)).toBe(false);
  });

  it('has her stand beside it, on whichever side she is on', () => {
    const secret = setup();
    expect(secret.spot.x).toBeLessThan(secret.x);
    secret.scene.girl.x = 200;
    expect(secret.spot.x).toBeGreaterThan(secret.x);
  });
});
