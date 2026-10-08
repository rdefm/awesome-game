// Decor the store room's printer can make, in the order its picker shows
// them. She starts with a few; the rest are unlocked as she goes (by
// helping friends, say). What she has is a plain JSON-able
// { unlocked, fresh }: kinds unlocked, in the order she got them (starters
// first), and those she hasn't seen in the picker yet.

export const DECOR = [
  'rug', 'lamp', 'beanbag', 'wallposter',
  'starrug', 'rocketlamp', 'bigcushion', 'fishtank', 'fairylights', 'planetmobile',
];

export const STARTERS = ['rug', 'lamp', 'beanbag', 'wallposter'];

const known = (kind) => DECOR.includes(kind);

// Turns whatever came out of storage into usable decor state. Old saves
// (from before there was any) start with just the starters.
export function normalizeDecor(raw) {
  const list = (v) => (Array.isArray(v) ? v.filter((kind) => typeof kind === 'string' && known(kind)) : []);
  const unlocked = [...new Set([...STARTERS, ...list(raw?.unlocked)])];
  const fresh = [...new Set(list(raw?.fresh))].filter((kind) => unlocked.includes(kind) && !STARTERS.includes(kind));
  return { unlocked, fresh };
}

export function isUnlocked(decor, kind) {
  return decor.unlocked.includes(kind);
}

// She's unlocked `kind`. Already had it (or not a real piece): the very same
// state back, so callers can tell nothing new happened.
export function unlock(decor, kind) {
  if (!known(kind) || isUnlocked(decor, kind)) {
    return decor;
  }
  return { unlocked: [...decor.unlocked, kind], fresh: [...decor.fresh, kind] };
}

// She's seen the new pieces in the picker: they're not new any more.
export function seen(decor) {
  return decor.fresh.length ? { ...decor, fresh: [] } : decor;
}

export function tally(decor) {
  return { found: decor.unlocked.filter(known).length, total: DECOR.length };
}
