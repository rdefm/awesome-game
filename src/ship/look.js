import { HATS } from './art/girl.js';
import { HAIR_COLORS, SUIT_COLORS } from './art/palette.js';

// How she looks — hair colour, suit colour and hat — as kept in the save.
// Each part's options, in the order the wardrobe shows them; the first of
// each is how she starts out.
export const LOOK_OPTIONS = {
  hair: Object.keys(HAIR_COLORS),
  suit: Object.keys(SUIT_COLORS),
  hat: Object.keys(HATS),
};

export const DEFAULT_LOOK = Object.fromEntries(
  Object.entries(LOOK_OPTIONS).map(([part, options]) => [part, options[0]]),
);

// Old saves (and anything odd) get her starting look, part by part.
export function normalizeLook(raw) {
  return Object.fromEntries(
    Object.entries(LOOK_OPTIONS).map(([part, options]) => [
      part,
      options.includes(raw?.[part]) ? raw[part] : DEFAULT_LOOK[part],
    ]),
  );
}

// The same look with one part changed (if it's a real option).
export function restyle(look, part, value) {
  if (!LOOK_OPTIONS[part]?.includes(value)) {
    return look;
  }
  return { ...look, [part]: value };
}
