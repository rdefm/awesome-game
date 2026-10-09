import { describe, expect, it } from 'vitest';
import { LIFT_STOPS, isShipRoom, roomBeside } from './shipRooms.js';

describe('roomBeside', () => {
  it('has the store room to the left of the cockpit and the playroom to the right', () => {
    expect(roomBeside('ship', -1)).toBe('storeroom');
    expect(roomBeside('ship', 1)).toBe('playroom');
  });

  it('goes back to the cockpit from either side room', () => {
    expect(roomBeside('storeroom', 1)).toBe('ship');
    expect(roomBeside('playroom', -1)).toBe('ship');
  });

  it('has nothing beyond the end rooms', () => {
    expect(roomBeside('storeroom', -1)).toBe(null);
    expect(roomBeside('playroom', 1)).toBe(null);
  });

  it('has no rooms beside places that aren\'t in the ship', () => {
    expect(roomBeside('candy', 1)).toBe(null);
    expect(isShipRoom('candy')).toBe(false);
    expect(isShipRoom('playroom')).toBe(true);
  });
});

describe('the lift', () => {
  it('goes between the store room and the bunk room', () => {
    expect(LIFT_STOPS).toContain('storeroom');
    expect(LIFT_STOPS).toContain('bunkroom');
  });

  it('is the only way into the bunk room: no rooms through its walls', () => {
    expect(isShipRoom('bunkroom')).toBe(true);
    expect(roomBeside('bunkroom', -1)).toBe(null);
    expect(roomBeside('bunkroom', 1)).toBe(null);
  });
});

describe('the galley', () => {
  it('is a stop on the lift, between the bunk room and the store room', () => {
    expect(LIFT_STOPS).toEqual(['bunkroom', 'galley', 'storeroom']);
    expect(isShipRoom('galley')).toBe(true);
  });

  it('is only reached by the lift: no rooms through its walls', () => {
    expect(roomBeside('galley', -1)).toBe(null);
    expect(roomBeside('galley', 1)).toBe(null);
  });
});
