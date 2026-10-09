import { describe, expect, it } from 'vitest';
import {
  GALLEY_FOODS, RECIPES, learn, mixOf, normalizeRecipes, recipeCard,
} from './recipes.js';

const [cocoa, lolly] = RECIPES;

describe('recipes', () => {
  it('has at least six, each a different new food from two different things', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(6);
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
    expect(GALLEY_FOODS).toEqual(RECIPES.map((r) => r.makes));
    expect(RECIPES.every((r) => r.from.length === 2 && r.from[0] !== r.from[1])).toBe(true);
  });

  it('mixes two things into the new food, whichever goes in first', () => {
    expect(mixOf('snowball', 'firebloom')).toBe(cocoa);
    expect(mixOf('firebloom', 'snowball')).toBe(cocoa);
    expect(mixOf('frostflower', 'lollipop')).toBe(lolly);
  });

  it('makes nothing from a mix that isn\'t a recipe', () => {
    expect(mixOf('snowball', 'teddy')).toBe(null);
    expect(mixOf('snowball', 'snowball')).toBe(null);
  });

  it('never has two recipes from the same pair of things', () => {
    const pairs = RECIPES.map((r) => [...r.from].sort().join('+'));
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('remembers each recipe once, and only real ones', () => {
    const found = learn([], cocoa.id);
    expect(found).toEqual([cocoa.id]);
    expect(learn(found, cocoa.id)).toBe(found);
    expect(learn(found, 'nope')).toBe(found);
  });

  it('lays out the card with every recipe in a fixed order, found or not', () => {
    const card = recipeCard([lolly.id]);
    expect(card.map((r) => r.id)).toEqual(RECIPES.map((r) => r.id));
    expect(card.filter((r) => r.found).map((r) => r.id)).toEqual([lolly.id]);
  });

  it('survives a save round-trip, and cleans up junk saves', () => {
    const found = learn(learn([], lolly.id), cocoa.id);
    expect(normalizeRecipes(JSON.parse(JSON.stringify(found)))).toEqual(found);
    expect(normalizeRecipes(undefined)).toEqual([]);
    expect(normalizeRecipes([cocoa.id, 'nope', 3, cocoa.id])).toEqual([cocoa.id]);
  });
});
