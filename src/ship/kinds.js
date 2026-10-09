import { Bluebell, Critter, Local, PottedBluebell } from './entities/bluebell.js';
import {
  Beanbag, BigCushion, FairyLights, FishTank, Lamp, PlanetMobile, RocketLamp, Rug, StarRug, WallPoster,
} from './entities/decor.js';
import { Ginger, Gumdrop, GummyBear, Lollipop } from './entities/candy.js';
import { Firebloom, Geode, Newt } from './entities/ember.js';
import { LavaBaby, LavaDad, LavaMum } from './entities/lavaHouse.js';
import { BabyYeti, FrostFlower, MumYeti, Snowball } from './entities/frosty.js';
import { StripeCactus, StripeStone, Zig } from './entities/stripey.js';
import { normalizeCrew } from './crew.js';
import { dress } from './friendHats.js';
import { Crew } from './entities/crew.js';
import { Ball, Crystal, DRAWER_THINGS, SNACKS, Snack, Teddy, Trinket } from './entities/items.js';
import { Posy } from './entities/posies.js';
import { Plant, plantStage } from './entities/props.js';
import { MushroomCreature } from './entities/mushroomGrove.js';
import { Gonzo, Monkey } from './entities/shipFriends.js';
import { Sprout, TreeDad, TreeKid, TreeMum } from './entities/treeHouse.js';

// Every kind of carryable thing: how to build it from its world entry, the
// picture shown for it in the bag, and whether it's a friend (friends live
// in their own pocket of the bag).
export const KINDS = {
  plant: { make: (a, s) => new Plant(a, s), icon: (a, s) => a.plant[plantStage(s)][0] },
  ball: { make: (a, s) => new Ball(a, s), icon: (a) => a.ball },
  teddy: { make: (a, s) => new Teddy(a, s), icon: (a) => a.teddy },
  crystal: { make: (a, s) => new Crystal(a, s), icon: (a) => a.crystal[0] },
  ...Object.fromEntries(SNACKS.map((kind) => [kind, { make: (a, s) => new Snack(a, s), icon: (a) => a.snacks[kind] }])),
  ...Object.fromEntries(DRAWER_THINGS.map((kind) => [kind, { make: (a, s) => new Trinket(a, s), icon: (a) => a.trinkets[kind] }])),
  bluebell: { make: (a, s) => new Bluebell(a, s), icon: (a, s) => a.bluebellIcons[s.v ?? 0] },
  posy: { make: (a, s) => new Posy(a, s), icon: (a) => a.posy },
  pottedbell: { make: (a, s) => new PottedBluebell(a, s), icon: (a) => a.pottedBell.icon },
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
  crew: { friend: true, make: (a, s) => new Crew(a, s), icon: (a, s) => a.crewFrames(normalizeCrew(s.crew)).idle },
  monkey: { friend: true, make: (a, s) => new Monkey(a, s), icon: (a) => a.monkey.idle },
  gonzo: { friend: true, make: (a, s) => new Gonzo(a, s), icon: (a) => a.gonzo.idle },
  treeDad: { friend: true, make: (a, s) => new TreeDad(a, s), icon: (a) => a.treeDad.idle },
  treeMum: { friend: true, make: (a, s) => new TreeMum(a, s), icon: (a) => a.treeMum.idle },
  treeKid: { friend: true, make: (a, s) => new TreeKid(a, s), icon: (a) => a.treeKid.idle },
  sprout: { friend: true, make: (a, s) => new Sprout(a, s), icon: (a) => a.sprout.idle },
  shroom: { friend: true, make: (a, s) => new MushroomCreature(a, s), icon: (a) => a.shroomCreature.idle },
  zig: { friend: true, make: (a, s) => new Zig(a, s), icon: (a, s) => a.zig[(s.stage ?? 0) % a.zig.length].idle },
};

export const isFriend = (kind) => Boolean(KINDS[kind]?.friend);

// Null for kinds this version of the game doesn't know (e.g. an old save).
export function makeCarryable(assets, state) {
  return KINDS[state.kind]?.make(assets, state) ?? null;
}

export function iconFor(assets, entry) {
  const icon = KINDS[entry.kind]?.icon(assets, entry) ?? assets.sparkle;
  // A friend's hat shows in its bag slot too.
  return isFriend(entry.kind) && entry.hat ? dress(icon, entry.kind, entry.hat, assets.hats[entry.hat]) : icon;
}
