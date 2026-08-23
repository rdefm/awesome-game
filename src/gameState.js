export function createGameState(manifest) {
  const entities = {};
  for (const entity of manifest) {
    entities[entity.id] = {
      id: entity.id,
      location: 'scene',
      x: entity.x,
      y: entity.y,
    };
  }
  return { entities, inventory: [] };
}

export function pickUp(state, entityId) {
  const entity = state.entities[entityId];
  if (!entity || entity.location !== 'scene') {
    return state;
  }

  return {
    entities: {
      ...state.entities,
      [entityId]: { id: entityId, location: 'inventory', x: null, y: null },
    },
    inventory: [...state.inventory, entityId],
  };
}

export function place(state, entityId, x, y) {
  const entity = state.entities[entityId];
  if (!entity || entity.location !== 'inventory') {
    return state;
  }

  return {
    entities: {
      ...state.entities,
      [entityId]: { id: entityId, location: 'scene', x, y },
    },
    inventory: state.inventory.filter((id) => id !== entityId),
  };
}

export function moveWithinScene(state, entityId, x, y) {
  const entity = state.entities[entityId];
  if (!entity || entity.location !== 'scene') {
    return state;
  }

  return {
    ...state,
    entities: {
      ...state.entities,
      [entityId]: { id: entityId, location: 'scene', x, y },
    },
  };
}
