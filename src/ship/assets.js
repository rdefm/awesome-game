import { toImage } from '../engine/engine.js';
import { textPixmap } from '../engine/font.js';
import { girlFrames } from './art/girl.js';
import { drawRoom, drawSpace } from './art/room.js';
import {
  ALIEN_COLORS, PLANETS, chairBackLayer, chairFrontLayer, chairRearView, drawAlien, drawEmote,
  drawPlanet, drawPlant, drawPoster, drawShipIcon, drawSparkle,
} from './art/props.js';

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

// Paints every sprite once at startup. There are no image files: all art is
// generated from code in ./art.
export function loadAssets() {
  const textCache = new Map();
  return {
    girl: bake(girlFrames()),
    room: bake(drawRoom()),
    space: bake(drawSpace()),
    poster: bake([drawPoster(0), drawPoster(1)]),
    plant: bake([drawPlant(0), drawPlant(1)]),
    chair: bake({ back: chairBackLayer(), front: chairFrontLayer(), rear: chairRearView() }),
    aliens: ALIEN_COLORS.map((c) => bake({
      idle: drawAlien(c, 'idle'), blink: drawAlien(c, 'blink'), wave1: drawAlien(c, 'wave1'), wave2: drawAlien(c, 'wave2'),
    })),
    planetsBig: PLANETS.map((p) => bake(drawPlanet(p, 18))),
    planetsSmall: PLANETS.map((p) => bake(drawPlanet(p, 9))),
    emotes: bake({
      heart: drawEmote('heart'), bang: drawEmote('bang'), note: drawEmote('note'),
      question: drawEmote('question'), star: drawEmote('star'),
    }),
    shipIcon: bake(drawShipIcon()),
    sparkle: bake(drawSparkle()),
    text(str, color, opts = {}) {
      const key = `${str}|${color}|${opts.scale ?? 1}|${opts.outline ?? ''}`;
      if (!textCache.has(key)) {
        textCache.set(key, toImage(textPixmap(str, color, opts)));
      }
      return textCache.get(key);
    },
  };
}
