import { CREW_BODIES, CREW_EARS, CREW_EYES } from './art/crew.js';
import { LOOK_OPTIONS } from './look.js';
import { countKind } from './world.js';

// A crewmate she makes in the crew pod: body colour, eyes and ears (or
// antennae) as kept on its world entry, plus a hat (the same hats as hers).
// Each part's options, in the order the pod shows them; the first of each is
// how the pod starts out.
export const CREW_OPTIONS = {
  body: Object.keys(CREW_BODIES),
  eyes: CREW_EYES,
  ears: CREW_EARS,
  hat: LOOK_OPTIONS.hat,
};

export const DEFAULT_CREW = Object.fromEntries(Object.entries(CREW_OPTIONS).map(([part, options]) => [part, options[0]]));

// How many crewmates there can be in all (in the bag or about), so the ship
// never gets too crowded to find anyone.
export const MAX_CREW = 6;

// A crewmate's body, eyes and ears, part by part (anything odd gets the first
// option). The hat isn't part of this: it's on the world entry, like any friend's.
export function normalizeCrew(raw) {
  return Object.fromEntries(['body', 'eyes', 'ears'].map((part) => [
    part, CREW_OPTIONS[part].includes(raw?.[part]) ? raw[part] : DEFAULT_CREW[part],
  ]));
}

// The same crew choices with one part changed (if it's a real option).
export function reshape(crew, part, value) {
  return CREW_OPTIONS[part]?.includes(value) ? { ...crew, [part]: value } : crew;
}

// Is there room in the crew for another?
export const canMakeCrew = (world) => countKind(world, 'crew') < MAX_CREW;
