import { BluebellScene } from './bluebellScene.js';
import { CandyScene } from './candyScene.js';
import { EmberScene } from './emberScene.js';
import { FrostyScene } from './frostyScene.js';
import { GingerbreadScene } from './gingerbreadScene.js';
import { LavaHouseScene } from './lavaHouseScene.js';
import { MilkshakeLakeScene } from './milkshakeLakeScene.js';
import { StripeyScene } from './stripeyScene.js';

// Every place she can be on each planet (by its id in PLANETS), for the
// hoverbike's town map to read. A place's `where` is its id, so saves and the
// world's `placed` lists name it the same way. `spot` is where it sits on the
// planet's town map (screen pixels). `kind` says how she gets there:
//   'landing' — the ship parks here; its `where` is the planet's id. One each.
//   'house'   — inside; she walks in through the door from outside.
//   'site'    — outdoors with no ship; she arrives by hoverbike.
// Adding a planet to explore is an entry here (plus `landable` on it in
// PLANETS; a test keeps the two in step).
const PLACES = {
  bluebell: [
    { where: 'bluebell', name: 'Landing site', kind: 'landing', spot: { x: 128, y: 96 }, scene: BluebellScene },
  ],
  ember: [
    { where: 'ember', name: 'Landing site', kind: 'landing', spot: { x: 80, y: 104 }, scene: EmberScene },
    { where: 'lavahouse', name: 'Lava house', kind: 'house', spot: { x: 176, y: 72 }, scene: LavaHouseScene },
  ],
  frosty: [
    { where: 'frosty', name: 'Landing site', kind: 'landing', spot: { x: 128, y: 96 }, scene: FrostyScene },
  ],
  candy: [
    { where: 'candy', name: 'Landing site', kind: 'landing', spot: { x: 80, y: 104 }, scene: CandyScene },
    { where: 'gingerbread', name: 'Gingerbread house', kind: 'house', spot: { x: 176, y: 72 }, scene: GingerbreadScene },
    { where: 'milkshake', name: 'Milkshake lake', kind: 'site', spot: { x: 200, y: 128 }, scene: MilkshakeLakeScene },
  ],
  stripey: [
    { where: 'stripey', name: 'Landing site', kind: 'landing', spot: { x: 128, y: 96 }, scene: StripeyScene },
  ],
};

const BY_WHERE = new Map(Object.values(PLACES).flat().map((place) => [place.where, place]));
const PLANET_OF = new Map(Object.entries(PLACES).flatMap(([id, places]) => places.map((place) => [place.where, id])));

// The places on planet `id`, landing site first; none if she can't land there.
export function placesOn(id) {
  return PLACES[id] ?? [];
}

// The planet (by its id) that place `where` is on, or null (e.g. the ship).
export function planetOf(where) {
  return PLANET_OF.get(where) ?? null;
}

// How she turns up at place `where` off the hoverbike: in through the front
// door of a house, or riding in and parking the bike anywhere out of doors.
export function arrivingBy(where) {
  return BY_WHERE.get(where).kind === 'house' ? { fromDoor: true } : { fromShip: false, byBike: true };
}

// The scene for being at place `where`: out on a planet (by its id) or at
// another place on one, like inside the gingerbread house.
export function planetScene(where, assets, opts) {
  return new (BY_WHERE.get(where).scene)(assets, opts);
}

// The place she was at when `save` was made, or null if she was in the ship.
export function landedOn(save) {
  return save.landed && BY_WHERE.has(save.where) ? save.where : null;
}
