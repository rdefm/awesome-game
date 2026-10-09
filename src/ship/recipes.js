// The galley's recipes: drop two things in the mixing pot and, if they're a
// recipe, out pops something new to eat. Each recipe is the new food's kind
// (`makes`, a snack: see items.js), what it's called, and the two things it
// takes (either way round). What she's found is a plain JSON-able list of
// recipe ids, in the order she found them.

export const RECIPES = [
  { id: 'cocoa', makes: 'cocoa', name: 'HOT COCOA', from: ['snowball', 'firebloom'] },
  { id: 'icelolly', makes: 'icelolly', name: 'ICE LOLLY', from: ['lollipop', 'frostflower'] },
  { id: 'sparklecake', makes: 'sparklecake', name: 'SPARKLE CAKE', from: ['cupcake', 'crystal'] },
  { id: 'bluebelltea', makes: 'bluebelltea', name: 'BLUEBELL TEA', from: ['bluebell', 'juice'] },
  { id: 'snowcone', makes: 'snowcone', name: 'SNOW CONE', from: ['snowball', 'gumdrop'] },
  { id: 'smoothie', makes: 'smoothie', name: 'STRIPY SMOOTHIE', from: ['starfruit', 'stripestone'] },
];

// Every new food the pot can make.
export const GALLEY_FOODS = RECIPES.map((r) => r.makes);

// The recipe two things make together (in either order), or null.
export function mixOf(a, b) {
  return RECIPES.find(({ from: [x, y] }) => (a === x && b === y) || (a === y && b === x)) ?? null;
}

const KNOWN = new Set(RECIPES.map((r) => r.id));

// Turns whatever came out of storage into a usable found-list.
export function normalizeRecipes(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return [...new Set(raw.filter((id) => typeof id === 'string' && KNOWN.has(id)))];
}

// She's found recipe `id`. Already found (or not a real recipe): the very
// same list back, so callers can tell nothing new happened.
export function learn(found, id) {
  return found.includes(id) || !KNOWN.has(id) ? found : [...found, id];
}

// Every recipe for the card on the wall, in a fixed order, marked found or not.
export function recipeCard(found) {
  return RECIPES.map((r) => ({ ...r, found: found.includes(r.id) }));
}
