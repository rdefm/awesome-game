// Where every carryable thing is: lying somewhere in one of the places she can
// visit, or tucked away in her bag. Plain JSON-able data; every operation
// returns a new world so callers can save it straight away.
//
//   { placed: { ship: [{ id, kind, x, y, v?, stage? }], bluebell: [...] }, bag: [{ id, kind, v?, stage? }] }
//
// `id` is unique across the whole world, `kind` picks the art and behaviour,
// `v` is an optional variant (e.g. which of the giant bluebells it is), and
// `stage` is how far it has grown (the space plant).

export function defaultWorld() {
  return {
    placed: {
      ship: [
        { id: 'plant', kind: 'plant', x: 152, y: 120 },
        { id: 'teddy', kind: 'teddy', x: 62, y: 134 },
        { id: 'ball', kind: 'ball', x: 118, y: 146 },
      ],
      bluebell: [
        ...[[104, 121], [140, 148], [176, 119], [244, 127]].map(([x, y], v) => ({ id: `bluebell${v}`, kind: 'bluebell', x, y, v })),
        { id: 'local', kind: 'local', x: 214, y: 138 },
        { id: 'critter', kind: 'critter', x: 160, y: 132 },
        { id: 'crystal', kind: 'crystal', x: 190, y: 150 },
      ],
    },
    bag: [],
  };
}

const validEntry = (e) => e && typeof e.id === 'string' && typeof e.kind === 'string';
const validPlaced = (e) => validEntry(e) && Number.isFinite(e.x) && Number.isFinite(e.y);

// Turns whatever came out of storage into a usable world. Anything new in the
// default world that an older save has never heard of gets added in its
// default spot, so new things show up without wiping her progress.
export function normalizeWorld(raw) {
  if (!raw || typeof raw !== 'object') {
    return defaultWorld();
  }
  const placed = {};
  for (const [where, list] of Object.entries(raw.placed ?? {})) {
    if (Array.isArray(list)) {
      placed[where] = list.filter(validPlaced);
    }
  }
  const world = { placed, bag: Array.isArray(raw.bag) ? raw.bag.filter(validEntry) : [] };
  const known = new Set(allIds(world));
  for (const [where, list] of Object.entries(defaultWorld().placed)) {
    for (const entry of list) {
      if (!known.has(entry.id)) {
        world.placed[where] = [...(world.placed[where] ?? []), entry];
      }
    }
  }
  return world;
}

function allIds(world) {
  return [...Object.values(world.placed).flat(), ...world.bag].map((e) => e.id);
}

export function find(world, id) {
  return [...Object.values(world.placed).flat(), ...world.bag].find((e) => e.id === id) ?? null;
}

export function placedIn(world, where) {
  return world.placed[where] ?? [];
}

// The bag's contents, newest first. `friends` picks the friends pocket.
export function bagContents(world, isFriend, friends) {
  return world.bag.filter((e) => Boolean(isFriend(e.kind)) === friends);
}

function without(world, id) {
  return {
    placed: Object.fromEntries(Object.entries(world.placed).map(([where, list]) => [where, list.filter((e) => e.id !== id)])),
    bag: world.bag.filter((e) => e.id !== id),
  };
}

// Just the identity of a thing (and how grown it is), not where it is.
function identity({ id, kind, v, stage }) {
  return {
    id, kind, ...(v === undefined ? {} : { v }), ...(stage === undefined ? {} : { stage }),
  };
}

// The same thing, now grown to `stage`, wherever it is.
export function setStage(world, id, stage) {
  if (!find(world, id)) {
    return world;
  }
  const regrow = (e) => (e.id === id ? { ...e, stage } : e);
  return {
    placed: Object.fromEntries(Object.entries(world.placed).map(([where, list]) => [where, list.map(regrow)])),
    bag: world.bag.map(regrow),
  };
}

// Into the bag (from wherever it was), at the front.
export function stash(world, id) {
  const entry = find(world, id);
  if (!entry) {
    return world;
  }
  const next = without(world, id);
  next.bag = [identity(entry), ...next.bag];
  return next;
}

// Out onto the floor of `where` at (x, y), from the bag or from anywhere else.
export function place(world, id, where, x, y) {
  const entry = find(world, id);
  if (!entry) {
    return world;
  }
  const next = without(world, id);
  next.placed[where] = [...(next.placed[where] ?? []), { ...identity(entry), x: Math.round(x), y: Math.round(y) }];
  return next;
}
