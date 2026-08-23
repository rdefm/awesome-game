import { describe, it, expect } from 'vitest';
import { createGameState, pickUp, place, moveWithinScene } from './gameState.js';

const manifest = [
  { id: 'cat', name: 'Cat', shape: 'circle', color: 0xff8800, x: 100, y: 150 },
  { id: 'ball', name: 'Ball', shape: 'rect', color: 0x2288ff, x: 300, y: 200 },
];

describe('createGameState', () => {
  it('places every manifest entity in the scene at its starting position', () => {
    const state = createGameState(manifest);

    expect(state.entities.cat).toEqual({ id: 'cat', location: 'scene', x: 100, y: 150 });
    expect(state.entities.ball).toEqual({ id: 'ball', location: 'scene', x: 300, y: 200 });
    expect(state.inventory).toEqual([]);
  });
});

describe('pickUp', () => {
  it('moves a placed entity from the scene into the inventory', () => {
    const state = createGameState(manifest);

    const next = pickUp(state, 'cat');

    expect(next.entities.cat.location).toBe('inventory');
    expect(next.entities.cat.x).toBeNull();
    expect(next.entities.cat.y).toBeNull();
    expect(next.inventory).toEqual(['cat']);
  });

  it('leaves other entities untouched', () => {
    const state = createGameState(manifest);

    const next = pickUp(state, 'cat');

    expect(next.entities.ball.location).toBe('scene');
    expect(next.entities.ball).toEqual({ id: 'ball', location: 'scene', x: 300, y: 200 });
  });

  it('is a no-op when the entity is already in the inventory', () => {
    const state = createGameState(manifest);
    const once = pickUp(state, 'cat');

    const twice = pickUp(once, 'cat');

    expect(twice.inventory).toEqual(['cat']);
  });

  it('is a no-op for an unknown entity id', () => {
    const state = createGameState(manifest);

    const next = pickUp(state, 'nope');

    expect(next).toEqual(state);
  });
});

describe('place', () => {
  it('moves an inventory entity back into the scene at the given position', () => {
    const state = createGameState(manifest);
    const held = pickUp(state, 'cat');

    const next = place(held, 'cat', 400, 500);

    expect(next.entities.cat).toEqual({ id: 'cat', location: 'scene', x: 400, y: 500 });
    expect(next.inventory).toEqual([]);
  });

  it('is a no-op when the entity is not in the inventory', () => {
    const state = createGameState(manifest);

    const next = place(state, 'cat', 400, 500);

    expect(next).toEqual(state);
  });

  it('is a no-op for an unknown entity id', () => {
    const state = createGameState(manifest);

    const next = place(state, 'nope', 400, 500);

    expect(next).toEqual(state);
  });
});

describe('moveWithinScene', () => {
  it('updates the position of an entity already placed in the scene', () => {
    const state = createGameState(manifest);

    const next = moveWithinScene(state, 'cat', 400, 500);

    expect(next.entities.cat).toEqual({ id: 'cat', location: 'scene', x: 400, y: 500 });
    expect(next.inventory).toEqual([]);
  });

  it('is a no-op when the entity is in the inventory', () => {
    const state = createGameState(manifest);
    const held = pickUp(state, 'cat');

    const next = moveWithinScene(held, 'cat', 400, 500);

    expect(next).toEqual(held);
  });

  it('is a no-op for an unknown entity id', () => {
    const state = createGameState(manifest);

    const next = moveWithinScene(state, 'nope', 400, 500);

    expect(next).toEqual(state);
  });
});
