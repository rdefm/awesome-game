import { MixingPot, RecipeCard } from './entities/galley.js';
import { Lift } from './entities/lift.js';
import { learn, normalizeRecipes } from './recipes.js';
import { loadSave, writeSave } from './save.js';
import { SideRoomScene } from './sideRoomScene.js';

// The galley, down the lift from the bunk room (and up from the store room):
// a big bubbling mixing pot, and a recipe card on the wall. Drop two things
// in the pot and, if they're a recipe, out pops something new for friends
// to eat (see recipes.js).
export class GalleyScene extends SideRoomScene {
  constructor(assets, opts) {
    super(assets, 'galley', assets.galley, opts);
    this.recipes = normalizeRecipes(loadSave().recipes); // ids of the recipes she's found
    this.lift = this.add(new Lift(assets));
    this.add(new RecipeCard(assets));
    this.pot = this.add(new MixingPot(assets));
    this.addGirl();
  }

  // The pot's just made `recipe`: if it's a new one, a fanfare, and it goes
  // on the card (and is remembered).
  learnRecipe(recipe, x, y) {
    const found = learn(this.recipes, recipe.id);
    if (found === this.recipes) {
      this.toast(recipe.name);
      return;
    }
    this.recipes = found;
    writeSave({ ...loadSave(), recipes: found });
    this.engine.audio.play('fanfare');
    this.sparkles(x, y, 10);
    this.toast(`NEW RECIPE! ${recipe.name}`, 2.5);
  }
}
