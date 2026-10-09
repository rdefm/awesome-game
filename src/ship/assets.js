import { toImage } from '../engine/engine.js';
import { textPixmap } from '../engine/font.js';
import { drawHairSwatch, drawHatPiece, drawHatSwatch, drawSuitSwatch, girlFrames } from './art/girl.js';
import {
  CREW_BODIES, CREW_EARS, CREW_EYES, CREW_FRAMES, drawCrew, drawCrewBodySwatch, drawCrewEarsSwatch, drawCrewEyesSwatch, drawCrewPod,
} from './art/crew.js';
import { drawLockerDoor, drawRoom, drawSpace, drawWardrobeDoor } from './art/room.js';
import {
  drawBeanbag, drawBigCushion, drawFairyLights, drawFishTank, drawLamp, drawLampGlow, drawPlanetMobile,
  drawPrinter, drawRocketLamp, drawRug, drawStarRug, drawWallPoster,
} from './art/decor.js';
import {
  BLANKETS, BLANKET_W, drawBallPitFront, drawBed, drawBlanket, drawBunkDeck, drawBunkFrame, drawBunkRoom, drawLiftButton, drawLiftFrame,
  drawGalley, drawLightSwitch, drawMixingPot, drawNightGlow, drawPlayRoom, drawRoomArrow, drawStoreRoom, drawSwingFrame, drawSwingSeat, drawTrampoline,
} from './art/shipRooms.js';
import {
  BABY_PUFF_COLORS, BIRD_COLORS, BUG_KINDS, BUTTERFLY_COLORS, cropTop, drawBabyPuff, drawBell, drawBird,
  drawBluebellStem, drawStreamStone, drawBug, drawBurrow, drawBush, drawButterfly, drawCloud, drawCritter, drawFlame, drawHole, drawLocal, drawMeadow, drawMole, drawPicnicBasket,
  drawPicnicBlanket, drawPosy, drawPosyPatch, drawRock, drawShipExterior, drawSoilPatch, drawStream,
} from './art/bluebell.js';
import {
  drawBag, drawBall, drawBerryJuice, drawBluebellTea, drawBoxIcon, drawCocoa, drawCookie, drawCrystal, drawHeartIcon,
  drawIceLolly, drawJuice, drawOutlineOf, drawSandwich, drawSmoothie, drawSnowCone, drawSparkleCake, drawStarFruit, drawTeddy,
} from './art/items.js';
import {
  MOTH_COLORS, drawEmberPlain, drawFirebloom, drawGeode, drawLavaFish, drawLavaPool, drawNewt, drawSmoke, drawSteam,
  drawVent,
} from './art/ember.js';
import {
  SNOWBIRD_COLORS, drawDrift, drawFrostFlower, drawHare, drawSnowCloud, drawSnowball, drawSnowfield, drawYeti,
} from './art/frosty.js';
import {
  CANDY_BUTTERFLY_COLORS, GUMDROP_COLORS, LOLLIPOP_COLORS, drawCandyCloud, drawCandyPath, drawCandyland, drawCupcake,
  drawFlossBush, drawGinger, drawGingerbreadHouse, drawGummy, drawGumdrop, drawHouseDoor, drawHouseRoom, drawJar,
  drawLollipop, drawOven, drawSugarMouse,
} from './art/candy.js';
import {
  STONE_COLORS, STRIPE_BUTTERFLY_COLORS, ZIG_STRIPES, drawMound, drawStripeCactus, drawStripeStone,
  drawStripeyCanyon, drawStripeyCloud, drawWorm, drawZig,
} from './art/stripey.js';
import {
  drawCradle, drawEmberPath, drawHearth, drawLavaCake, drawLavaDoor, drawLavaFolk, drawLavaHouse, drawLavaLamp,
  drawLavaRoom,
} from './art/lavaHouse.js';
import {
  GOGGLE_COLORS, HUT_WALLS, drawEasel, drawGoggles, drawSandTimer, drawSling, drawZigDoor, drawZigHut, drawZigPath,
  drawZigRoom,
} from './art/zigHut.js';
import {
  drawCampfire, drawFurNest, drawIceCave, drawIceDoor, drawIceFish, drawIcePath, drawIceRoom, drawIcicle,
} from './art/iceCave.js';
import {
  TRAY, drawBubble, drawBubbleBath, drawNightSky, drawPod, drawPodDoor, drawPodPath, drawPodRoom, drawSeedTray,
  drawTelescope,
} from './art/pod.js';
import { drawHoverbike } from './art/hoverbike.js';
import { drawGonzo, drawMonkey } from './art/shipFriends.js';
import { drawCherry, drawMilkshakeLake, drawStraw, drawWaferBoat } from './art/milkshakeLake.js';
import { drawLavaBubble, drawLavaFalls, drawPumice, drawSteppingStone } from './art/lavaFalls.js';
import {
  MAP_STYLE, drawBluebellMap, drawCandyMap, drawEmberMap, drawFrostyMap, drawMapBike, drawMapFalls, drawMapFrozenLake, drawMapGingerbread,
  drawMapIceCave, drawMapLake, drawMapLavaHouse, drawMapMushroomGrove, drawMapOasis, drawMapPod, drawMapShip, drawMapZigHut,
  drawStripeyMap,
} from './art/townMap.js';
import { SNOW_CRITTER_COLORS, drawFrozenLake, drawLakeFish, drawSnowCritter } from './art/frozenLake.js';
import { drawBounceShroom, drawMushroomCreature, drawMushroomGrove } from './art/mushroomGrove.js';
import { drawCoconut, drawFrog, drawOasis, drawPalm } from './art/oasis.js';
import { FRIEND_BUNKS, GINGERBREAD_HOUSE, HER_BUNK, HORIZON, ICE_CAVE, ICICLES, LAVA_HOUSE, MEADOW_W, PICNIC, POD, ZIG_HUT, distanceScale } from './layout.js';
import { LOOK_OPTIONS } from './look.js';
import {
  ALIEN_COLORS, PLANETS, PLANT_STAGES, chairBackLayer, chairFrontLayer, chairRearView, drawAlien, drawEmote,
  drawPlanet, drawPlant, drawPoster, drawShipIcon, drawSparkle, drawStarSticker,
} from './art/props.js';
import { allStickers } from './stickers.js';

// The frames every strolling friend has (see entities/stroller.js).
const STROLLER_FRAMES = ['idle', 'blink', 'wave1', 'wave2', 'hop', 'walk'];

// Turns a (possibly nested) structure of Pixmaps into canvas images.
function bake(value) {
  if (Array.isArray(value)) {
    return value.map(bake);
  }
  if (value && value.data && value.width) {
    return toImage(value);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, bake(v)]));
  }
  return value;
}

// A whole giant bluebell (stem plus hanging bells) as one picture, for the bag.
function bluebellIcon(stem, bell) {
  const canvas = document.createElement('canvas');
  canvas.width = stem.img.width;
  canvas.height = stem.img.height + 4;
  const ctx = canvas.getContext('2d');
  const baseY = stem.img.height - 1;
  ctx.drawImage(stem.img, 0, 0);
  for (const h of stem.hang) {
    ctx.drawImage(bell, 8 + h.x - Math.round(bell.width / 2), baseY + h.y);
  }
  return canvas;
}

// A sprite cut down to each number of its top rows (0 is never drawn): how
// much of something shows above a hole, or above the milkshake.
const croppedRows = (pm) => bake(Array.from({ length: pm.height + 1 }, (_, k) => cropTop(pm, k)));

const strollerFrames = (draw) => bake(Object.fromEntries(STROLLER_FRAMES.map((f) => [f, draw(f)])));

// Paints every sprite once at startup. There are no image files: all art is
// generated from code in ./art.
export function loadAssets() {
  const textCache = new Map();
  const girlCache = new Map();
  // What the galley's mixing pot makes (see recipes.js).
  const galleyFoods = {
    cocoa: drawCocoa(), icelolly: drawIceLolly(), sparklecake: drawSparkleCake(),
    bluebelltea: drawBluebellTea(), snowcone: drawSnowCone(), smoothie: drawSmoothie(),
  };
  const crewCache = new Map();
  const bell = bake(drawBell());
  const stems = [[40, 3], [52, 3], [34, 2], [44, 3]].map(([h, n]) => bake(drawBluebellStem(h, n)));
  return {
    // Her frames for a look (see look.js), baked the first time she wears it.
    girl(look) {
      const key = JSON.stringify(look);
      if (!girlCache.has(key)) {
        girlCache.set(key, bake(girlFrames(look)));
      }
      return girlCache.get(key);
    },
    // A crewmate's frames for its body, eyes and ears (see crew.js), baked the first time one's seen.
    crewFrames(crew) {
      const key = `${crew.body}|${crew.eyes}|${crew.ears}`;
      if (!crewCache.has(key)) {
        crewCache.set(key, bake(Object.fromEntries(CREW_FRAMES.map((f) => [f, drawCrew(f, crew)]))));
      }
      return crewCache.get(key);
    },
    crewPod: bake({ shut: drawCrewPod(), open: drawCrewPod(true) }),
    // The crew pod's picker buttons (ears are shown in each body colour).
    crewSwatches: bake({
      body: Object.fromEntries(Object.keys(CREW_BODIES).map((b) => [b, drawCrewBodySwatch(b)])),
      eyes: Object.fromEntries(CREW_EYES.map((e) => [e, drawCrewEyesSwatch(e)])),
      ears: Object.fromEntries(Object.keys(CREW_BODIES).map((b) => [
        b, Object.fromEntries(CREW_EARS.map((e) => [e, drawCrewEarsSwatch(e, b)])),
      ])),
    }),
    room: bake(drawRoom()),
    // The ship's other rooms, either side of the cockpit, and the arrows through.
    storeRoom: bake(drawStoreRoom()),
    playRoom: bake(drawPlayRoom()),
    roomArrow: bake(drawRoomArrow()),
    // The store room's decor printer [idle, printing], and the decor it prints.
    printer: bake([drawPrinter(), drawPrinter(true)]),
    decor: bake({
      rug: drawRug(), lamp: [drawLamp(), drawLamp(true)], lampGlow: drawLampGlow(), beanbag: drawBeanbag(),
      wallposter: drawWallPoster(), starrug: drawStarRug(), rocketlamp: [drawRocketLamp(), drawRocketLamp(true)],
      bigcushion: drawBigCushion(), fishtank: [drawFishTank(0), drawFishTank(1)],
      fairylights: [drawFairyLights(0), drawFairyLights(1)], planetmobile: drawPlanetMobile(),
    }),
    ballPit: bake(drawBallPitFront()),
    swing: bake({ frame: drawSwingFrame(), seat: drawSwingSeat() }),
    trampoline: bake([drawTrampoline(), drawTrampoline(true)]),
    // The lift (in the store room, the galley and the bunk room): its frame, and its call button [unlit, lit].
    lift: bake({ frame: drawLiftFrame(), button: [drawLiftButton(), drawLiftButton(true)] }),
    // The bunk room, its beds and blankets [flat, tucked in], and the light switch [night, on].
    bunkRoom: bake(drawBunkRoom()),
    bed: bake({ her: drawBed(HER_BUNK.w, HER_BUNK.deck), deck: drawBunkDeck(FRIEND_BUNKS[0].w), frame: drawBunkFrame() }),
    blankets: bake(Object.fromEntries(Object.entries(BLANKETS).map(([k, color]) => [
      k, [drawBlanket(BLANKET_W, color), drawBlanket(BLANKET_W, color, true)],
    ]))),
    lightSwitch: bake([drawLightSwitch(false), drawLightSwitch(true)]),
    nightGlow: bake(drawNightGlow()),
    // The galley, and its mixing pot [still, bubbling].
    galley: bake(drawGalley()),
    mixingPot: bake([drawMixingPot(), drawMixingPot(true)]),
    space: bake(drawSpace()),
    poster: bake([drawPoster(0), drawPoster(1)]),
    // [stage][glow]
    plant: bake(Array.from({ length: PLANT_STAGES }, (_, stage) => [drawPlant(0, stage), drawPlant(1, stage)])),
    chair: bake({ back: chairBackLayer(), front: chairFrontLayer(), rear: chairRearView() }),
    aliens: ALIEN_COLORS.map((c) => bake({
      idle: drawAlien(c, 'idle'), blink: drawAlien(c, 'blink'), wave1: drawAlien(c, 'wave1'), wave2: drawAlien(c, 'wave2'),
    })),
    planetsBig: PLANETS.map((p) => bake(drawPlanet(p, 18))),
    planetsSmall: PLANETS.map((p) => bake(drawPlanet(p, 9))),
    // Only landable planets get the big close-up used while descending.
    planetsHuge: PLANETS.map((p) => (p.landable ? bake(drawPlanet(p, 60)) : null)),
    // Each landable planet's backdrop (see backdrop.js): its ground filling
    // the screen out there, the same seen out of the ship's windows once
    // landed, what drifts across its sky, and the colour of its dust.
    backdrops: {
      bluebell: bake({
        ground: drawMeadow({ horizon: HORIZON, width: MEADOW_W }),
        window: drawMeadow({ horizon: 52 }),
        clouds: [drawCloud(0), drawCloud(1)],
        dust: '#c9f0b0',
        puff: '#e8f7ff',
      }),
      ember: bake({
        ground: drawEmberPlain({ horizon: HORIZON }),
        window: drawEmberPlain({ horizon: 52 }),
        clouds: [drawSmoke(0), drawSmoke(1)],
        dust: '#7a4a52',
        puff: '#8a6a74',
      }),
      frosty: bake({
        ground: drawSnowfield({ horizon: HORIZON }),
        window: drawSnowfield({ horizon: 52 }),
        clouds: [drawSnowCloud(0), drawSnowCloud(1)],
        dust: '#ffffff',
        puff: '#ffffff',
        snow: true,
      }),
      candy: bake({
        ground: drawCandyland({ horizon: HORIZON }),
        window: drawCandyland({ horizon: 52 }),
        clouds: [drawCandyCloud(0), drawCandyCloud(1)],
        dust: '#ffffff',
        puff: '#fff0f8',
      }),
      // Not a planet: the milkshake lake on Candy (there are no windows onto it).
      milkshake: bake({
        ground: drawMilkshakeLake({ horizon: HORIZON }),
        clouds: [drawCandyCloud(1), drawCandyCloud(0)],
        dust: '#ffffff',
        puff: '#fff0f8',
      }),
      // Not a planet: the lava falls on Ember.
      lavafalls: bake({
        ground: drawLavaFalls({ horizon: HORIZON }),
        clouds: [drawSmoke(1), drawSmoke(0)],
        dust: '#7a4a52',
        puff: '#8a6a74',
      }),
      stripey: bake({
        ground: drawStripeyCanyon({ horizon: HORIZON }),
        window: drawStripeyCanyon({ horizon: 52 }),
        clouds: [drawStripeyCloud(0), drawStripeyCloud(1)],
        dust: '#f8e2b4',
        puff: '#ffe8d0',
      }),
      // Not a planet: the frozen lake on Frosty (snowing there too).
      frozenlake: bake({
        ground: drawFrozenLake({ horizon: HORIZON }),
        clouds: [drawSnowCloud(1), drawSnowCloud(0)],
        dust: '#ffffff',
        puff: '#ffffff',
        snow: true,
      }),
      // Not a planet: the mushroom grove on Bluebell.
      mushroomgrove: bake({
        ground: drawMushroomGrove({ horizon: HORIZON }),
        clouds: [drawCloud(1), drawCloud(0)],
        dust: '#c9f0b0',
        puff: '#e8f7ff',
      }),
      // Not a planet: the oasis on Stripey.
      oasis: bake({
        ground: drawOasis({ horizon: HORIZON }),
        clouds: [drawStripeyCloud(1), drawStripeyCloud(0)],
        dust: '#f8e2b4',
        puff: '#ffe8d0',
      }),
    },
    // The hoverbike [glow flicker 0, 1], and its town maps: each planet's
    // picture, each place's picture on it (by its `where`), and her on the bike.
    hoverbike: bake([drawHoverbike(0), drawHoverbike(1)]),
    townMap: bake({
      ground: {
        candy: drawCandyMap(), ember: drawEmberMap(), stripey: drawStripeyMap(), frosty: drawFrostyMap(), bluebell: drawBluebellMap(),
      },
      places: {
        candy: drawMapShip(MAP_STYLE.candy.shadow),
        gingerbread: drawMapGingerbread(),
        milkshake: drawMapLake(),
        ember: drawMapShip(MAP_STYLE.ember.shadow),
        lavahouse: drawMapLavaHouse(),
        lavafalls: drawMapFalls(),
        stripey: drawMapShip(MAP_STYLE.stripey.shadow),
        zighut: drawMapZigHut(),
        oasis: drawMapOasis(),
        frosty: drawMapShip(MAP_STYLE.frosty.shadow),
        icecave: drawMapIceCave(),
        frozenlake: drawMapFrozenLake(),
        bluebell: drawMapShip(MAP_STYLE.bluebell.shadow),
        pod: drawMapPod(),
        mushroomgrove: drawMapMushroomGrove(),
      },
      bike: drawMapBike(),
    }),
    shipOutside: bake({ closed: drawShipExterior(), open: drawShipExterior({ open: true }) }),
    flame: bake([drawFlame(0), drawFlame(1)]),
    bell,
    stems,
    bluebellIcons: stems.map((stem) => bluebellIcon(stem, bell)),
    critter: bake({ idle: drawCritter('idle'), squish: drawCritter('squish'), jump: drawCritter('jump') }),
    butterflies: BUTTERFLY_COLORS.map((c) => bake([drawButterfly(c, 0), drawButterfly(c, 1)])),
    // The meadow's secrets.
    rock: bake({ top: drawRock(), under: drawRock(true), soil: drawSoilPatch() }),
    bugs: BUG_KINDS.map((kind) => bake([drawBug(kind, 0), drawBug(kind, 1)])),
    bush: bake([drawBush(), drawBush(true)]),
    birds: BIRD_COLORS.map((c) => bake([drawBird(c, 0), drawBird(c, 1)])),
    hole: bake(drawHole()),
    // [eyes open / shut][rows showing above the hole] (0 is never drawn)
    mole: [drawMole(), drawMole(true)].map(croppedRows),
    // The picnic on the far stretch.
    picnicBlanket: bake(drawPicnicBlanket(PICNIC.blanket.half, PICNIC.blanket.h)),
    picnicBasket: bake([drawPicnicBasket(), drawPicnicBasket(true)]),
    // The little bluebells she picks posies from, and a posy.
    posyPatch: bake(drawPosyPatch()),
    posy: bake(drawPosy()),
    // The puffball burrow (empty / puffball asleep in it), and the babies living in it.
    burrow: bake({ empty: drawBurrow(), asleep: drawBurrow(true) }),
    babyPuff: BABY_PUFF_COLORS.map((c) => bake(drawBabyPuff(c))),
    // The stream across the far end of the meadow, and its stepping stones (dry / just hopped on).
    stream: bake(drawStream()),
    streamStone: bake([drawStreamStone(), drawStreamStone(true)]),
    local: bake({
      idle: drawLocal('idle'), blink: drawLocal('blink'), wave1: drawLocal('wave1'), wave2: drawLocal('wave2'),
      hop: drawLocal('idle', true),
    }),
    // Planet Ember.
    newt: bake(Object.fromEntries(['idle', 'blink', 'wave1', 'wave2', 'hop', 'walk'].map((f) => [f, drawNewt(f)]))),
    // [colour][flicker 0, flicker 1, flared]
    firebloom: bake([0, 1].map((v) => [drawFirebloom(v, 0), drawFirebloom(v, 1), drawFirebloom(v, 0, true)])),
    geode: bake([drawGeode(), drawGeode(true)]),
    vent: bake(drawVent()),
    steam: bake(drawSteam()),
    lavaPool: bake([drawLavaPool(0), drawLavaPool(1)]),
    lavaFish: bake([drawLavaFish(0), drawLavaFish(1)]),
    moths: MOTH_COLORS.map((c) => bake([drawButterfly(c, 0), drawButterfly(c, 1)])),
    // The lava family's house on Ember, the family, and inside the house.
    lavaHouse: bake({
      shut: drawLavaHouse(),
      open: drawLavaHouse({ open: true }),
      path: drawEmberPath(LAVA_HOUSE.path, (y) => distanceScale(y, LAVA_HOUSE)),
    }),
    lavaDad: strollerFrames((f) => drawLavaFolk(f, 'dad')),
    lavaMum: strollerFrames((f) => drawLavaFolk(f, 'mum')),
    lavaBaby: strollerFrames((f) => drawLavaFolk(f, 'baby')),
    lavaRoom: bake(drawLavaRoom()),
    lavaDoor: bake({ shut: drawLavaDoor(), open: drawLavaDoor(true) }),
    hearth: bake([drawHearth(), drawHearth(true)]),
    lavaLamp: bake(drawLavaLamp()),
    cradle: bake({ back: drawCradle(), front: drawCradle(true) }),
    // The pink alien's pod on Bluebell, and inside it.
    pod: bake({
      shut: drawPod(),
      open: drawPod({ open: true }),
      path: drawPodPath(POD.path, (y) => distanceScale(y, POD)),
    }),
    podRoom: bake(drawPodRoom()),
    podDoor: bake({ shut: drawPodDoor(), open: drawPodDoor(true) }),
    telescope: bake(drawTelescope()),
    nightSky: bake(drawNightSky()),
    seedTray: bake([...Array(TRAY.stages).keys()].map((stage) => drawSeedTray(stage))),
    bubbleBath: bake({ back: drawBubbleBath(true), front: drawBubbleBath() }),
    bubble: bake(drawBubble()),
    // Planet Frosty.
    mumYeti: strollerFrames((f) => drawYeti(f, 'mum')),
    babyYeti: strollerFrames((f) => drawYeti(f, 'baby')),
    snowball: bake(drawSnowball()),
    // [twinkle 0, twinkle 1, lit up]
    frostFlower: bake([drawFrostFlower(0), drawFrostFlower(1), drawFrostFlower(0, true)]),
    drift: bake(drawDrift()),
    hare: bake([drawHare(), drawHare(true)]),
    snowbirds: SNOWBIRD_COLORS.map((c) => bake([drawBird(c, 0), drawBird(c, 1)])),
    // The yetis' ice cave on Frosty, and inside it.
    iceCave: bake({
      shut: drawIceCave(),
      open: drawIceCave({ open: true }),
      path: drawIcePath(ICE_CAVE.path, (y) => distanceScale(y, ICE_CAVE)),
    }),
    iceRoom: bake(drawIceRoom()),
    iceDoor: bake({ shut: drawIceDoor(), open: drawIceDoor(true) }),
    icicles: bake(ICICLES.lengths.map((len) => drawIcicle(len))),
    iceFish: bake([drawIceFish(0), drawIceFish(1)]),
    // The frozen lake on Frosty: the curious fish [look, blink, oh][rows
    // showing above the water], and the snow critters [colour][frame].
    lakeFish: Object.fromEntries(['look', 'blink', 'oh'].map((f) => [f, croppedRows(drawLakeFish(f))])),
    snowCritters: SNOW_CRITTER_COLORS.map((_, v) => bake(Object.fromEntries(
      ['stand', 'step', 'blink', 'belly'].map((f) => [f, drawSnowCritter(f, v)]),
    ))),
    // The mushroom grove on Bluebell: the bouncy mushrooms, and the shy creature.
    bounceShrooms: bake([drawBounceShroom(0), drawBounceShroom(1)]),
    shroomCreature: bake(Object.fromEntries(
      ['out', 'blink', 'peek', 'hide', 'dance1', 'dance2'].map((f) => [f, drawMushroomCreature(f)]),
    )),
    furNest: bake({ back: drawFurNest(true), front: drawFurNest() }),
    // [flicker 0, flicker 1, flared 0, flared 1]
    campfire: bake([drawCampfire(0), drawCampfire(1), drawCampfire(0, true), drawCampfire(1, true)]),
    // Planet Candy, and inside the gingerbread house.
    house: bake({
      shut: drawGingerbreadHouse(),
      open: drawGingerbreadHouse({ open: true }),
      path: drawCandyPath(GINGERBREAD_HOUSE.path, distanceScale),
    }),
    // The friends who live on the ship from the start.
    monkey: strollerFrames(drawMonkey),
    gonzo: strollerFrames(drawGonzo),
    gummy: strollerFrames(drawGummy),
    ginger: strollerFrames(drawGinger),
    // [colour][swirl turned 0..3]
    lollipop: bake(LOLLIPOP_COLORS.map((_, v) => [0, 1, 2, 3].map((f) => drawLollipop(v, f)))),
    gumdrop: bake(GUMDROP_COLORS.map((_, v) => drawGumdrop(v))),
    flossBush: bake([drawFlossBush(), drawFlossBush(true)]),
    sugarMouse: bake([drawSugarMouse(), drawSugarMouse(true)]),
    candyButterflies: CANDY_BUTTERFLY_COLORS.map((c) => bake([drawButterfly(c, 0), drawButterfly(c, 1)])),
    // The milkshake lake on Candy.
    straw: bake(drawStraw()),
    // The cherry: [rows showing above the milkshake] (0 is never drawn).
    cherry: croppedRows(drawCherry()),
    waferBoat: bake(drawWaferBoat()),
    // The lava falls on Ember (its geyser's vent and steam are Ember's own).
    steppingStone: bake([drawSteppingStone(), drawSteppingStone(true)]),
    pumice: bake(drawPumice()),
    lavaBubble: bake(drawLavaBubble()),
    houseRoom: bake(drawHouseRoom()),
    houseDoor: bake({ shut: drawHouseDoor(), open: drawHouseDoor(true) }),
    oven: bake([drawOven(), drawOven(true)]),
    jar: bake([drawJar(), drawJar(true)]),
    // Planet Stripey. Zig comes in every planet's stripes: [stripes][frame].
    zig: ZIG_STRIPES.map((_, way) => strollerFrames((f) => drawZig(f, way))),
    stripeStone: bake(STONE_COLORS.map((_, v) => drawStripeStone(v))),
    stripeCactus: bake([drawStripeCactus(), drawStripeCactus(true)]),
    mound: bake(drawMound()),
    // The worm: [eyes open / shut][rows showing above the hole], and whole.
    worm: {
      up: [drawWorm(), drawWorm(true)].map(croppedRows),
      whole: bake(drawWorm()),
    },
    stripeButterflies: STRIPE_BUTTERFLY_COLORS.map((c) => bake([drawButterfly(c, 0), drawButterfly(c, 1)])),
    // Zig's hut on Stripey, and inside it (its walls in every planet's stripes).
    zigHut: bake({
      shut: drawZigHut(),
      open: drawZigHut({ open: true }),
      path: drawZigPath(ZIG_HUT.path, (y) => distanceScale(y, ZIG_HUT)),
    }),
    zigRoom: bake(HUT_WALLS.map((_, v) => drawZigRoom(v))),
    zigDoor: bake({ shut: drawZigDoor(), open: drawZigDoor(true) }),
    easel: bake(HUT_WALLS.map((_, v) => drawEasel(v))),
    sandTimer: bake(drawSandTimer()),
    goggles: bake(GOGGLE_COLORS.map((_, v) => drawGoggles(v))),
    sling: bake(drawSling()),
    // The oasis on Stripey: the palm [swayed left, still, swayed right], a
    // coconut [turned 0..3], and the frog (and [rows showing above the water]
    // as it pops up).
    palm: bake([drawPalm(-2), drawPalm(0), drawPalm(2)]),
    coconut: bake([0, 1, 2, 3].map(drawCoconut)),
    frog: {
      ...bake({ sit: drawFrog('sit'), blink: drawFrog('blink'), puff: drawFrog('puff'), leap: drawFrog('leap') }),
      up: croppedRows(drawFrog('sit')),
    },
    emotes: bake({
      heart: drawEmote('heart'), bang: drawEmote('bang'), note: drawEmote('note'),
      question: drawEmote('question'), star: drawEmote('star'),
    }),
    shipIcon: bake(drawShipIcon()),
    // Carryable things and the bag.
    ball: bake(drawBall()),
    teddy: bake(drawTeddy()),
    crystal: bake([drawCrystal(), drawCrystal(true)]),
    snacks: bake({
      cookie: drawCookie(), starfruit: drawStarFruit(), juice: drawJuice(), cupcake: drawCupcake(), lavacake: drawLavaCake(), ...galleyFoods,
      sandwich: drawSandwich(), berryjuice: drawBerryJuice(),
    }),
    // The galley's foods as faint outlines, for recipes not found yet.
    foodOutlines: bake(Object.fromEntries(Object.entries(galleyFoods).map(([k, pm]) => [k, drawOutlineOf(pm)]))),
    lockerDoor: bake({ front: drawLockerDoor(), back: drawLockerDoor(true) }),
    wardrobeDoor: bake({ front: drawWardrobeDoor(), back: drawWardrobeDoor(true) }),
    // The wardrobe picker's buttons. Hats are shown on top of each hair colour,
    // so the hat row always matches her hair.
    swatches: bake({
      hair: Object.fromEntries(LOOK_OPTIONS.hair.map((h) => [h, drawHairSwatch(h)])),
      suit: Object.fromEntries(LOOK_OPTIONS.suit.map((s) => [s, drawSuitSwatch(s)])),
      hat: Object.fromEntries(LOOK_OPTIONS.hair.map((h) => [
        h, Object.fromEntries(LOOK_OPTIONS.hat.map((hat) => [hat, drawHatSwatch(hat, h)])),
      ])),
    }),
    // Each hat on its own, for friends to wear.
    hats: bake(Object.fromEntries(LOOK_OPTIONS.hat.filter((hat) => hat !== 'none').map((hat) => [hat, drawHatPiece(hat)]))),
    bag: bake({ shut: drawBag(), open: drawBag(true) }),
    boxIcon: bake(drawBoxIcon()),
    heartIcon: bake(drawHeartIcon()),
    sparkle: bake(drawSparkle()),
    // Star stickers by id, plus the empty outline of one not found yet.
    stickers: bake(Object.fromEntries(allStickers().map((s) => [s.id, drawStarSticker(s.color)]))),
    stickerSlot: bake(drawStarSticker()),
    text(str, color, opts = {}) {
      const key = `${str}|${color}|${opts.scale ?? 1}|${opts.outline ?? ''}`;
      if (!textCache.has(key)) {
        textCache.set(key, toImage(textPixmap(str, color, opts)));
      }
      return textCache.get(key);
    },
  };
}
