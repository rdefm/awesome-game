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
