import { PlayRoomScene } from './playRoomScene.js';
import { ShipScene } from './shipScene.js';
import { StoreRoomScene } from './storeRoomScene.js';

// The rooms of the ship, left to right, by their place in the world: the
// store room, the cockpit (with the airlock out, where she starts) and the
// playroom. An arrow by each side wall goes through to the room beside.
const ROOMS = ['storeroom', 'ship', 'playroom'];

// What the arrow going to each room says.
export const ROOM_NAMES = { storeroom: 'STORE ROOM', ship: 'COCKPIT', playroom: 'PLAYROOM' };

export const isShipRoom = (where) => ROOMS.includes(where);

// The room through the wall on `side` (-1 left, 1 right) of room `where`,
// or null if that's the outside of the ship.
export function roomBeside(where, side) {
  const i = ROOMS.indexOf(where);
  return i < 0 ? null : ROOMS[i + side] ?? null;
}

// The scene for room `where` (the cockpit, unless it's one of the others).
export function shipRoomScene(where, assets, opts) {
  if (where === 'storeroom') {
    return new StoreRoomScene(assets, opts);
  }
  if (where === 'playroom') {
    return new PlayRoomScene(assets, opts);
  }
  return new ShipScene(assets, opts);
}
