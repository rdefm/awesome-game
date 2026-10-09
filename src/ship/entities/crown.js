import { CROWN_MEMORY, restyle } from '../look.js';

// The flower crown she weaves out of Bluebell posies (see posies.js). Kept
// apart from the posies themselves so she (girl.js) can weave without
// pulling in Carryable, which needs her.

// How many posies she weaves into a flower crown.
export const POSIES_FOR_CROWN = 3;

// How many posies she's woven in so far, from the save (0 for old saves).
export function normalizePosies(raw) {
  return Number.isInteger(raw) && raw > 0 && raw < POSIES_FOR_CROWN ? raw : 0;
}

// Is she still making her crown? (Once it's made, posies are just posies.)
export const weavesPosies = (scene) => !scene.memories?.includes(CROWN_MEMORY);

// A posy dropped on her is woven in; the third makes a flower crown, which
// she puts straight on, and which is in the wardrobe from then on.
export async function weave(girl, posy) {
  const { scene } = girl;
  const { engine } = scene;
  girl.weaving = true;
  girl.cancelWalk();
  girl.faceToward(posy.x);
  scene.useUp(posy);
  scene.remove(posy);
  engine.tweens.cancel(posy);
  const woven = scene.posies + 1;
  engine.audio.play('pop');
  scene.sparkles(girl.x, girl.y - 24, 5);
  if (woven < POSIES_FOR_CROWN) {
    scene.savePosies(woven);
    scene.toast(`POSIES ${woven}/${POSIES_FOR_CROWN}`);
    girl.say('heart');
    await girl.act('cheer', 0.6);
  } else {
    scene.savePosies(0);
    scene.remember(CROWN_MEMORY);
    scene.saveLook(restyle(scene.look, 'hat', 'flowers'));
    engine.audio.play('fanfare');
    scene.sparkles(girl.x, girl.y - 30, 10);
    scene.hearts(girl.x, girl.y - 32, 3);
    scene.toast('A FLOWER CROWN!', 2.5);
    await girl.act('cheer', 1.2);
  }
  girl.weaving = false;
}
