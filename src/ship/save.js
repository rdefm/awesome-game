const KEY = 'awesome-game.ship.v1';

// Browser storage can be missing or blocked (private mode), so saving is best-effort.
export function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore: the game still works, it just won't remember
  }
}

// Is the music on? It is unless she (or a parent) switched it off; saves
// from before the button have no setting, so they get music.
export function musicOn(save) {
  return save.music !== false;
}
