import { BluebellScene } from './bluebellScene.js';
import { CandyScene } from './candyScene.js';
import { EmberScene } from './emberScene.js';
import { FrostyScene } from './frostyScene.js';
import { GingerbreadScene } from './gingerbreadScene.js';

// Each planet she can walk about on (by its id in PLANETS), and the scene for
// it. Adding a planet to explore is one line here (plus `landable` on it in
// PLANETS; a test keeps the two in step). A planet scene's `where` is its id,
// so saves and the world's `placed` lists name it the same way.
const SCENES = {
  bluebell: BluebellScene,
  ember: EmberScene,
  frosty: FrostyScene,
  candy: CandyScene,
};

// Places inside on a planet (not planets themselves), so she can be picked
// up again in there after a reload.
const INDOORS = {
  gingerbread: GingerbreadScene,
};

// The scene for walking out onto planet `id` (or into a place on one, by its
// place name, like the gingerbread house).
export function planetScene(id, assets, opts) {
  return new (SCENES[id] ?? INDOORS[id])(assets, opts);
}

// The planet (or place on one) she was out in when `save` was made, or null
// if she was in the ship.
export function landedOn(save) {
  const out = Object.hasOwn(SCENES, save.where) || Object.hasOwn(INDOORS, save.where);
  return save.landed && out ? save.where : null;
}
