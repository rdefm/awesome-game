# 06 — Local save/load persistence

**What to build:** `gameState` is serialized to `localStorage` on every mutation (pick up, place, goal satisfied) and rehydrated on load, so closing and reopening the game (or reloading the page) restores inventory contents, entity placements, and which goals were already satisfied.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] `gameState` is written to `localStorage` after every state-changing action (pick up, place, goal satisfied)
- [ ] On load, if saved state exists, it is used to rehydrate `gameState` instead of the default starting state
- [ ] Reloading the page after picking up/placing entities and satisfying a goal restores exactly that state
- [ ] Vitest unit tests cover the serialize/deserialize round-trip using a plain-object stand-in for the storage backend (no real `localStorage`/browser needed to run the test)
