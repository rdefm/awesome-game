// Star stickers: little collectibles tucked away behind each planet's
// secrets. Every planet lists its own here (keyed by the planet's place name,
// as in world.js), so a new planet just adds a row. What she's found is a
// plain JSON-able list of sticker ids, in the order she found them.

export const STICKERS = {
  bluebell: [
    { id: 'bluebell.rock', color: '#ffe066' }, // under the rock
    { id: 'bluebell.bush', color: '#7cf28a' }, // when two birds fly out of the bush
    { id: 'bluebell.mole', color: '#ff9d3c' }, // when the mole pops right out
    { id: 'bluebell.butterfly', color: '#ff8fc8' }, // shaken off a butterfly tapped three times
    { id: 'bluebell.local', color: '#3fd0c9' }, // the local's thank-you for a crystal
  ],
};

// Every sticker on every planet, each with the planet it belongs to.
export function allStickers() {
  return Object.entries(STICKERS).flatMap(([planet, list]) => list.map((s) => ({ ...s, planet })));
}

const KNOWN = new Set(allStickers().map((s) => s.id));
const known = (id) => KNOWN.has(id);

// Turns whatever came out of storage into a usable found-list.
export function normalizeFound(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return [...new Set(raw.filter((id) => typeof id === 'string' && known(id)))];
}

export function hasFound(found, id) {
  return found.includes(id);
}

// She's found sticker `id`. Already found (or not a real sticker): the very
// same list back, so callers can tell nothing new happened.
export function collect(found, id) {
  return hasFound(found, id) || !known(id) ? found : [...found, id];
}

export function tally(found) {
  return { found: found.filter(known).length, total: allStickers().length };
}

// Every sticker for the shelf, in a fixed order, marked found or not.
export function shelf(found) {
  return allStickers().map((s) => ({ ...s, found: hasFound(found, s.id) }));
}
