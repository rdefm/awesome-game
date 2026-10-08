import { BluebellScene } from './bluebellScene.js';
import { EmberScene } from './emberScene.js';
import { FrostyScene } from './frostyScene.js';

// Each planet she can walk about on (by its id in PLANETS), and the scene for
// it. Adding a planet to explore is one line here (plus `landable` on it in
// PLANETS; a test keeps the two in step). A planet scene's `where` is its id,
// so saves and the world's `placed` lists name it the same way.
const SCENES = {
  bluebell: BluebellScene,
  ember: EmberScene,
  frosty: FrostyScene,
};

// The scene for walking out onto planet `id`.
export function planetScene(id, assets, opts) {
  return new SCENES[id](assets, opts);
}

// The planet whose scene she was out in when `save` was made, or null if she
// was in the ship.
export function landedOn(save) {
  return save.landed && Object.hasOwn(SCENES, save.where) ? save.where : null;
}
