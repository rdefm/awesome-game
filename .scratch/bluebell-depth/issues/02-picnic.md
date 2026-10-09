# 02 — Picnic blanket and basket

**What to build:** A checked picnic blanket in the meadow with a wicker basket. Tap the blanket and she sits down on it; tap the basket and the lid flips open and a sandwich or a berry juice pops out (two new snacks, carryable and feedable like the others). Drop a friend on the blanket and it sits down; give it a snack there and it munches.

**Blocked by:** 01 — A meadow wider than the screen

**Relevant files:** `src/ship/bluebellScene.js`, `src/ship/entities/bluebell.js`, `src/ship/art/bluebell.js`, `src/ship/entities/items.js` (`SNACKS`, `Snack`, `feed`), `src/ship/kinds.js`, `src/ship/entities/friends.js`, `src/ship/sfx.js`

**Status:** ready-for-agent

- [ ] She sits on the blanket when it's tapped; a friend dropped on it sits too
- [ ] Basket opens and gives a sandwich or berry juice each tap
- [ ] The new snacks go in the bag and can be fed to friends anywhere
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
