import { HAIR_COLORS } from './art/palette.js';

// How she looks (just her hair colour, for now), as kept in the save.
export const HAIRS = Object.keys(HAIR_COLORS);

// Old saves (and anything odd) get her starting look: red hair.
export function normalizeLook(raw) {
  return { hair: HAIRS.includes(raw?.hair) ? raw.hair : HAIRS[0] };
}

// One trip to the wardrobe: the next hair colour along.
export function nextLook(look) {
  const i = HAIRS.indexOf(normalizeLook(look).hair);
  return { ...look, hair: HAIRS[(i + 1) % HAIRS.length] };
}
