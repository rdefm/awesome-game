import { BunkRoomScene } from './bunkRoomScene.js';
import { PlayRoomScene } from './playRoomScene.js';
import { ShipScene } from './shipScene.js';
import { StoreRoomScene } from './storeRoomScene.js';

// The rooms of the ship, left to right, by their place in the world: the
// store room, the cockpit (with the airlock out, where she starts) and the
// playroom. An arrow by each side wall goes through to the room beside.
const ROOMS = ['storeroom', 'ship', 'playroom'];

// The ship's other decks, reached by the lift (a door in the store room):
// every stop it makes, as listed on its panel, top to bottom. A new deck is a
// stop here, its name and scene below, and a lift in that scene.
export const LIFT_STOPS = ['bunkroom', 'storeroom'];

// What the arrow (or lift button) going to each room says.
export const ROOM_NAMES = { storeroom: 'STORE ROOM', ship: 'COCKPIT', playroom: 'PLAYROOM', bunkroom: 'BUNK ROOM' };

// Each room's scene (the cockpit's is the one for anywhere else).
const SCENES = { storeroom: StoreRoomScene, playroom: PlayRoomScene, bunkroom: BunkRoomScene };

export const isShipRoom = (where) => ROOMS.includes(where) || LIFT_STOPS.includes(where);

// The room through the wall on `side` (-1 left, 1 right) of room `where`,
// or null if that's the outside of the ship.
export function roomBeside(where, side) {
  const i = ROOMS.indexOf(where);
  return i < 0 ? null : ROOMS[i + side] ?? null;
}

// The scene for room `where` (the cockpit, unless it's one of the others).
export function shipRoomScene(where, assets, opts) {
  const Room = Object.hasOwn(SCENES, where) ? SCENES[where] : ShipScene;
  return new Room(assets, opts);
}
