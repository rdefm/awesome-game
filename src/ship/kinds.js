import { Bluebell, Critter, Local } from './entities/bluebell.js';
import { Ball, Crystal, Teddy } from './entities/items.js';
import { Plant, plantStage } from './entities/props.js';

// Every kind of carryable thing: how to build it from its world entry, the
// picture shown for it in the bag, and whether it's a friend (friends live
// in their own pocket of the bag).
export const KINDS = {
  plant: { make: (a, s) => new Plant(a, s), icon: (a, s) => a.plant[plantStage(s)][0] },
  ball: { make: (a, s) => new Ball(a, s), icon: (a) => a.ball },
  teddy: { make: (a, s) => new Teddy(a, s), icon: (a) => a.teddy },
  crystal: { make: (a, s) => new Crystal(a, s), icon: (a) => a.crystal[0] },
  bluebell: { make: (a, s) => new Bluebell(a, s), icon: (a, s) => a.bluebellIcons[s.v ?? 0] },
  critter: { friend: true, make: (a, s) => new Critter(a, s), icon: (a) => a.critter.idle },
  local: { friend: true, make: (a, s) => new Local(a, s), icon: (a) => a.local.idle },
};

export const isFriend = (kind) => Boolean(KINDS[kind]?.friend);

// Null for kinds this version of the game doesn't know (e.g. an old save).
export function makeCarryable(assets, state) {
  return KINDS[state.kind]?.make(assets, state) ?? null;
}

export function iconFor(assets, entry) {
  return KINDS[entry.kind]?.icon(assets, entry) ?? assets.sparkle;
}
