import { describe, expect, it } from 'vitest';
import { centreOn, clampCam, easeCam, followCam, nudgeCam, EDGE } from './camera.js';
import { WALK, floorMaxX } from './layout.js';

const VIEW = 256;
const WIDE = 512;

describe('floorMaxX', () => {
  it('reaches as far right in a wide place as it falls short of the edge in a one-screen one', () => {
    expect(floorMaxX()).toBe(WALK.maxX);
    expect(floorMaxX(WIDE)).toBe(WIDE - (VIEW - WALK.maxX));
  });
});

describe('clampCam', () => {
  it('never shows past either end of the place', () => {
    expect(clampCam(-30, WIDE, VIEW)).toBe(0);
    expect(clampCam(400, WIDE, VIEW)).toBe(WIDE - VIEW);
    expect(clampCam(100, WIDE, VIEW)).toBe(100);
  });

  it('keeps a one-screen place still', () => {
    expect(clampCam(50, VIEW, VIEW)).toBe(0);
  });
});

describe('centreOn', () => {
  it('puts x in the middle of the view, within the ends', () => {
    expect(centreOn(300, WIDE, VIEW)).toBe(300 - VIEW / 2);
    expect(centreOn(40, WIDE, VIEW)).toBe(0);
    expect(centreOn(500, WIDE, VIEW)).toBe(WIDE - VIEW);
  });
});

describe('followCam', () => {
  it('stays put while she is well inside the view', () => {
    expect(followCam(100, 100 + VIEW / 2, WIDE, VIEW)).toBe(100);
  });

  it('moves so she stays EDGE away from the right side', () => {
    expect(followCam(0, VIEW - EDGE + 20, WIDE, VIEW)).toBe(20);
  });

  it('moves so she stays EDGE away from the left side', () => {
    expect(followCam(200, 200 + EDGE - 30, WIDE, VIEW)).toBe(170);
  });

  it('stops at the ends of the place', () => {
    expect(followCam(0, 10, WIDE, VIEW)).toBe(0);
    expect(followCam(WIDE - VIEW, WIDE - 5, WIDE, VIEW)).toBe(WIDE - VIEW);
  });
});

describe('easeCam', () => {
  it('moves part of the way toward where it wants to be', () => {
    const x = easeCam(0, 100, 1 / 60);
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(100);
  });

  it('settles exactly on the target once close', () => {
    expect(easeCam(99.8, 100, 1 / 60)).toBe(100);
  });

  it('gets there in the end', () => {
    let x = 0;
    for (let i = 0; i < 120; i++) {
      x = easeCam(x, 100, 1 / 60);
    }
    expect(x).toBe(100);
  });
});

describe('nudgeCam', () => {
  it('leaves the view alone while the finger is away from the edges', () => {
    expect(nudgeCam(100, VIEW / 2, 0.1, WIDE, VIEW)).toBe(100);
  });

  it('creeps right with the finger near the right edge', () => {
    expect(nudgeCam(100, VIEW - 2, 0.1, WIDE, VIEW)).toBeGreaterThan(100);
  });

  it('creeps left with the finger near the left edge', () => {
    expect(nudgeCam(100, 2, 0.1, WIDE, VIEW)).toBeLessThan(100);
  });

  it('creeps faster the closer to the edge', () => {
    expect(nudgeCam(100, VIEW - 1, 0.1, WIDE, VIEW)).toBeGreaterThan(nudgeCam(100, VIEW - 15, 0.1, WIDE, VIEW));
  });

  it('stops at the ends of the place', () => {
    expect(nudgeCam(0, 2, 0.1, WIDE, VIEW)).toBe(0);
    expect(nudgeCam(WIDE - VIEW, VIEW - 2, 0.1, WIDE, VIEW)).toBe(WIDE - VIEW);
  });
});
