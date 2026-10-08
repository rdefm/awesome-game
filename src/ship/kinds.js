import { Bluebell, Critter, Local } from './entities/bluebell.js';
import {
  Beanbag, BigCushion, FairyLights, FishTank, Lamp, PlanetMobile, RocketLamp, Rug, StarRug, WallPoster,
} from './entities/decor.js';
import { Ginger, Gumdrop, GummyBear, Lollipop } from './entities/candy.js';
import { Firebloom, Geode, Newt } from './entities/ember.js';
import { LavaBaby, LavaDad, LavaMum } from './entities/lavaHouse.js';
import { BabyYeti, FrostFlower, MumYeti, Snowball } from './entities/frosty.js';
import { StripeCactus, StripeStone, Zig } from './entities/stripey.js';
import { Ball, Crystal, SNACKS, Snack, Teddy } from './entities/items.js';
import { Plant, plantStage } from './entities/props.js';

// Every kind of carryable thing: how to build it from its world entry, the
// picture shown for it in the bag, and whether it's a friend (friends live
// in their own pocket of the bag).
export const KINDS = {
  plant: { make: (a, s) => new Plant(a, s), icon: (a, s) => a.plant[plantStage(s)][0] },
  ball: { make: (a, s) => new Ball(a, s), icon: (a) => a.ball },
  teddy: { make: (a, s) => new Teddy(a, s), icon: (a) => a.teddy },
  crystal: { make: (a, s) => new Crystal(a, s), icon: (a) => a.crystal[0] },
  ...Object.fromEntries(SNACKS.map((kind) => [kind, { make: (a, s) => new Snack(a, s), icon: (a) => a.snacks[kind] }])),
  bluebell: { make: (a, s) => new Bluebell(a, s), icon: (a, s) => a.bluebellIcons[s.v ?? 0] },
  critter: { friend: true, make: (a, s) => new Critter(a, s), icon: (a) => a.critter.idle },
  local: { friend: true, make: (a, s) => new Local(a, s), icon: (a) => a.local.idle },
  firebloom: { make: (a, s) => new Firebloom(a, s), icon: (a, s) => a.firebloom[(s.v ?? 0) % a.firebloom.length][0] },
  geode: { make: (a, s) => new Geode(a, s), icon: (a, s) => a.geode[s.stage ? 1 : 0] },
  newt: { friend: true, make: (a, s) => new Newt(a, s), icon: (a) => a.newt.idle },
  snowball: { make: (a, s) => new Snowball(a, s), icon: (a) => a.snowball },
  frostflower: { make: (a, s) => new FrostFlower(a, s), icon: (a) => a.frostFlower[0] },
  mumYeti: { friend: true, make: (a, s) => new MumYeti(a, s), icon: (a) => a.mumYeti.idle },
  babyYeti: { friend: true, make: (a, s) => new BabyYeti(a, s), icon: (a) => a.babyYeti.idle },
  lollipop: { make: (a, s) => new Lollipop(a, s), icon: (a, s) => a.lollipop[(s.v ?? 0) % a.lollipop.length][0] },
  gumdrop: { make: (a, s) => new Gumdrop(a, s), icon: (a, s) => a.gumdrop[(s.v ?? 0) % a.gumdrop.length] },
  gummy: { friend: true, make: (a, s) => new GummyBear(a, s), icon: (a) => a.gummy.idle },
  ginger: { friend: true, make: (a, s) => new Ginger(a, s), icon: (a) => a.ginger.idle },
  lavaDad: { friend: true, make: (a, s) => new LavaDad(a, s), icon: (a) => a.lavaDad.idle },
  lavaMum: { friend: true, make: (a, s) => new LavaMum(a, s), icon: (a) => a.lavaMum.idle },
  lavaBaby: { friend: true, make: (a, s) => new LavaBaby(a, s), icon: (a) => a.lavaBaby.idle },
  stripestone: { make: (a, s) => new StripeStone(a, s), icon: (a, s) => a.stripeStone[(s.v ?? 0) % a.stripeStone.length] },
  stripecactus: { make: (a, s) => new StripeCactus(a, s), icon: (a, s) => a.stripeCactus[s.stage ? 1 : 0] },
  rug: { make: (a, s) => new Rug(a, s), icon: (a) => a.decor.rug },
  lamp: { make: (a, s) => new Lamp(a, s), icon: (a, s) => a.decor.lamp[s.stage === 1 ? 1 : 0] },
  beanbag: { make: (a, s) => new Beanbag(a, s), icon: (a) => a.decor.beanbag },
  wallposter: { make: (a, s) => new WallPoster(a, s), icon: (a) => a.decor.wallposter },
  starrug: { make: (a, s) => new StarRug(a, s), icon: (a) => a.decor.starrug },
  rocketlamp: { make: (a, s) => new RocketLamp(a, s), icon: (a, s) => a.decor.rocketlamp[s.stage === 1 ? 1 : 0] },
  bigcushion: { make: (a, s) => new BigCushion(a, s), icon: (a) => a.decor.bigcushion },
  fishtank: { make: (a, s) => new FishTank(a, s), icon: (a) => a.decor.fishtank[0] },
  fairylights: { make: (a, s) => new FairyLights(a, s), icon: (a) => a.decor.fairylights[0] },
  planetmobile: { make: (a, s) => new PlanetMobile(a, s), icon: (a) => a.decor.planetmobile },
  zig: { friend: true, make: (a, s) => new Zig(a, s), icon: (a, s) => a.zig[(s.stage ?? 0) % a.zig.length].idle },
};

export const isFriend = (kind) => Boolean(KINDS[kind]?.friend);

// Null for kinds this version of the game doesn't know (e.g. an old save).
export function makeCarryable(assets, state) {
  return KINDS[state.kind]?.make(assets, state) ?? null;
}

export function iconFor(assets, entry) {
  return KINDS[entry.kind]?.icon(assets, entry) ?? assets.sparkle;
}
