import { describe, expect, it } from 'vitest';
import { isShipRoom, roomBeside } from './shipRooms.js';

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
