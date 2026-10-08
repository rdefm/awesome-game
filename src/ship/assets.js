import { toImage } from '../engine/engine.js';
import { textPixmap } from '../engine/font.js';
import { drawHairSwatch, drawHatSwatch, drawSuitSwatch, girlFrames } from './art/girl.js';
import { drawLockerDoor, drawRoom, drawSpace, drawWardrobeDoor } from './art/room.js';
import {
  BIRD_COLORS, BUG_KINDS, BUTTERFLY_COLORS, cropTop, drawBell, drawBird, drawBluebellStem, drawBug, drawBush,
  drawButterfly, drawCloud, drawCritter, drawFlame, drawHole, drawLocal, drawMeadow, drawMole, drawRock,
  drawShipExterior, drawSoilPatch,
} from './art/bluebell.js';
import {
  drawBag, drawBall, drawBoxIcon, drawCookie, drawCrystal, drawHeartIcon, drawJuice, drawStarFruit, drawTeddy,
} from './art/items.js';
import {
  MOTH_COLORS, drawEmberPlain, drawFirebloom, drawGeode, drawLavaFish, drawLavaPool, drawNewt, drawSmoke, drawSteam,
  drawVent,
} from './art/ember.js';
import { HORIZON } from './layout.js';
import { LOOK_OPTIONS } from './look.js';
import {
  ALIEN_COLORS, PLANETS, PLANT_STAGES, chairBackLayer, chairFrontLayer, chairRearView, drawAlien, drawEmote,
  drawPlanet, drawPlant, drawPoster, drawShipIcon, drawSparkle, drawStarSticker,
} from './art/props.js';
import { allStickers } from './stickers.js';

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

// Paints every sprite once at startup. There are no image files: all art is
// generated from code in ./art.
export function loadAssets() {
  const textCache = new Map();
  const girlCache = new Map();
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
    room: bake(drawRoom()),
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
        ground: drawMeadow({ horizon: HORIZON }),
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
    },
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
    mole: [drawMole(), drawMole(true)].map((m) => bake(Array.from({ length: m.height + 1 }, (_, k) => cropTop(m, k)))),
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
    emotes: bake({
      heart: drawEmote('heart'), bang: drawEmote('bang'), note: drawEmote('note'),
      question: drawEmote('question'), star: drawEmote('star'),
    }),
    shipIcon: bake(drawShipIcon()),
    // Carryable things and the bag.
    ball: bake(drawBall()),
    teddy: bake(drawTeddy()),
    crystal: bake([drawCrystal(), drawCrystal(true)]),
    snacks: bake({ cookie: drawCookie(), starfruit: drawStarFruit(), juice: drawJuice() }),
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
