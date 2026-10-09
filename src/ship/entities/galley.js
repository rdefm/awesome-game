import { ease } from '../../engine/tween.js';
import { iconFor } from '../kinds.js';
import { MIXING_POT, RECIPE_CARD } from '../layout.js';
import { RECIPES, mixOf, recipeCard } from '../recipes.js';
import { find } from '../world.js';
import { isFriendItem } from './friends.js';
import { inRect } from './house.js';
import { Prop } from './props.js';

const BROTH = '#c4f2a0';

// ---------------------------------------------------------------- mixing pot
// The galley's big pot. Drop a thing in and it bobs about in the broth; drop
// in a second and the pot bubbles and burps, and out pops something new to
// eat (see recipes.js). Two things that aren't a recipe just fizzle, and
// both pop back out. Friends don't go in the pot! Tap it for a stir.
export class MixingPot extends Prop {
  constructor(assets) {
    super();
    this.assets = assets;
    this.imgs = assets.mixingPot;
    this.x = MIXING_POT.x;
    this.y = MIXING_POT.y;
    this.spot = MIXING_POT.spot;
    this.inside = []; // what's been dropped in: [{ item, icon }]
    this.bubbling = false;
  }

  hitTest(px, py) {
    const { x, y, w, h } = MIXING_POT;
    return inRect(px, py, x - w / 2 - 4, y - h - 12, w + 8, h + 13);
  }

  accepts(item) {
    return !this.bubbling && this.inside.length < 2 && !isFriendItem(item);
  }

  // In it goes with a plop. It stays remembered on the floor in front of the
  // pot (so it's not lost if she leaves now), but it's in the pot till mixed.
  receive(item) {
    const { scene } = this;
    const { mouth, out } = MIXING_POT;
    scene.settle(item, out.x, out.y);
    const icon = iconFor(this.assets, find(scene.world, item.id) ?? item);
    scene.remove(item);
    scene.engine.tweens.cancel(item);
    this.inside.push({ item, icon });
    scene.engine.audio.play('plop');
    scene.bits(mouth.x, mouth.y, 4, BROTH);
    this.boing(0.8);
    if (this.inside.length === 2) {
      return scene.scripted(() => this.mix());
    }
    scene.girl.faceToward(this.x);
    scene.toast('ONE MORE THING!');
  }

  boing(amount) {
    this.squash = amount;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.5, ease.outElastic);
  }

  async mix() {
    const { scene } = this;
    const { engine, girl } = scene;
    const { mouth } = MIXING_POT;
    girl.faceToward(this.x);
    this.bubbling = true;
    for (let i = 0; i < 4; i++) {
      engine.audio.play('blorp');
      scene.bits(mouth.x + (Math.random() - 0.5) * 20, mouth.y, 3, BROTH);
      this.boing(0.5);
      await engine.wait(0.35);
    }
    const [a, b] = this.inside.map((m) => m.item);
    this.inside = [];
    const recipe = mixOf(a.kind, b.kind);
    await (recipe ? this.cook(recipe, a, b) : this.fizzle(a, b));
    this.bubbling = false;
  }

  // A big burp, and out pops the new food.
  async cook(recipe, a, b) {
    const { scene } = this;
    const { engine, girl } = scene;
    const { mouth, out } = MIXING_POT;
    scene.useUp(a);
    scene.useUp(b);
    engine.audio.play('burp');
    this.boing(1.6);
    await engine.wait(0.4);
    const food = scene.spawn(recipe.makes, mouth.x, mouth.y - 6);
    if (food) {
      engine.audio.play('ding');
      scene.sparkles(mouth.x, mouth.y - 6, 7);
      await scene.putDown(food, out.x, out.y);
    }
    scene.learnRecipe(recipe, mouth.x, mouth.y - 10);
    await girl.act('cheer', 0.8);
  }

  // Not a recipe: a sad fizzle and a puff of smoke, and both things pop back out.
  async fizzle(a, b) {
    const { scene } = this;
    const { engine, girl } = scene;
    const { mouth, out } = MIXING_POT;
    engine.audio.play('fizzle');
    scene.bits(mouth.x, mouth.y - 4, 8, '#8b93b8');
    this.boing(1);
    scene.toast('FIZZLE! NOT A RECIPE');
    await engine.wait(0.5);
    await Promise.all([a, b].map((item, i) => {
      item.x = mouth.x;
      item.y = mouth.y;
      scene.add(item);
      return scene.putDown(item, out.x + (i ? 18 : -18), out.y);
    }));
    girl.say('question', 1.2);
  }

  // A stir: the broth blorps.
  use() {
    const { scene } = this;
    const { mouth } = MIXING_POT;
    scene.girl.faceToward(this.x);
    scene.girl.act('reach', 0.4);
    scene.engine.audio.play('blorp');
    scene.bits(mouth.x, mouth.y, 3, BROTH);
    scene.toast(this.inside.length ? 'ONE MORE THING!' : 'DROP IN TWO THINGS!');
  }

  draw(r) {
    const t = this.scene.engine.time;
    const { mouth } = MIXING_POT;
    const s = this.bounce;
    r.image(this.imgs[this.bubbling ? 1 : 0], this.x, this.y + 1, { scaleX: s, scaleY: 2 - s });
    // Whatever's in it bobs about in the broth.
    this.inside.forEach(({ icon }, i) => {
      const bob = Math.sin(t * 3 + i * 2) * 1.5;
      r.image(icon, mouth.x + (i ? 8 : -8), mouth.y + 2 + bob, { ay: 1 });
    });
    // Bubbles rise off the broth now and then (lots, while it's mixing).
    const n = this.bubbling ? 5 : 2;
    for (let i = 0; i < n; i++) {
      const k = (t * (this.bubbling ? 1.6 : 0.6) + i / n) % 1;
      if (k < 0.4) {
        r.pixel(mouth.x - 12 + ((i * 7) % 24), mouth.y - 2 - Math.round(k * 14), '#e8ffd8', 1 - k * 2.5);
      }
    }
  }
}

// --------------------------------------------------------------- recipe card
// Every recipe, on a card on the wall: ones she's found show what goes in
// and what comes out; the rest just the outline of what they make. Tap it
// for a count.
const CARD_COLS = 2;
const CARD_ROW = 16;
const CARD_TOP = 12; // the "RECIPES" heading
const ICON = 12; // pictures are shrunk to fit this

export class RecipeCard extends Prop {
  constructor(assets) {
    super();
    this.assets = assets;
    this.spot = RECIPE_CARD.spot;
    this.depth = -10;
  }

  get height() {
    return CARD_TOP + Math.ceil(RECIPES.length / CARD_COLS) * CARD_ROW + 3;
  }

  hitTest(px, py) {
    const { x, y, w } = RECIPE_CARD;
    return inRect(px, py, x, y, w, this.height);
  }

  use() {
    const { scene } = this;
    const { x, y, w } = RECIPE_CARD;
    const found = scene.recipes.length;
    scene.girl.faceToward(x + w / 2);
    scene.girl.act('reach', 0.4);
    scene.engine.audio.play('peek');
    scene.sparkles(x + w / 2, y + this.height / 2, found ? 6 : 3);
    scene.toast(found ? `RECIPES ${found}/${RECIPES.length}` : 'MIX TWO THINGS IN THE POT!');
  }

  // A picture centred at (cx, cy), shrunk to fit if it's big.
  drawFitted(r, img, cx, cy) {
    const k = Math.min(1, ICON / Math.max(img.width, img.height));
    r.image(img, cx, cy, { ay: 0.5, scaleX: k, scaleY: k });
  }

  draw(r) {
    const { assets } = this;
    const { x, y, w } = RECIPE_CARD;
    const h = this.height;
    r.rect(x, y, w, h, '#1b1427');
    r.rect(x + 1, y + 1, w - 2, h - 2, '#f4e2c4');
    r.rect(x + 2, y + 2, w - 4, h - 4, '#fff6e6');
    r.image(assets.text('RECIPES', '#a14a6a'), x + w / 2, y + 9);
    const colW = (w - 8) / CARD_COLS;
    recipeCard(this.scene.recipes).forEach((recipe, i) => {
      const left = x + 4 + (i % CARD_COLS) * colW;
      const cy = y + CARD_TOP + Math.floor(i / CARD_COLS) * CARD_ROW + CARD_ROW / 2;
      const ink = recipe.found ? '#6a4a5a' : '#c8b8a8';
      if (recipe.found) {
        recipe.from.forEach((kind, j) => this.drawFitted(r, iconFor(assets, { kind, v: 0 }), left + 7 + j * 19, cy));
      } else {
        for (let j = 0; j < 2; j++) {
          r.image(assets.text('?', ink), left + 7 + j * 19, cy + 3);
        }
      }
      r.image(assets.text('+', ink), left + 16, cy + 3);
      r.rect(left + 33, cy - 2, 5, 1, ink);
      r.rect(left + 33, cy + 1, 5, 1, ink);
      const food = recipe.found ? assets.snacks[recipe.makes] : assets.foodOutlines[recipe.makes];
      this.drawFitted(r, food, left + 47, cy);
    });
  }
}
