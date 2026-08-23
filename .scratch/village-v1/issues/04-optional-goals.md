# 04 — Optional goals ("wants") + reaction feedback

**What to build:** Some characters optionally declare a `wants: <itemId>`. When the player gives that character its wanted item (via place/drag onto the character), `gameState` marks that goal satisfied and the scene plays a visible reaction (animation/visual change). Giving a character an item it doesn't want is a harmless no-op — no error, no penalty, no fail state. Giving the correct item twice doesn't re-trigger the reaction or error.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] At least one character in the real cast has a `wants` field referencing a real item
- [ ] `gameState` exposes a function to check/satisfy a goal given an item id and a character id
- [ ] Giving the wanted item to the character marks the goal satisfied and triggers a visible on-screen reaction
- [ ] Giving a non-wanted item to a character changes nothing and does not error
- [ ] Re-giving an already-satisfied item does not re-trigger the reaction or error
- [ ] Vitest unit tests cover: goal satisfied on correct item, no-op on incorrect item, no double-trigger on repeat correct item
