# 14 — The mushroom creature as a friend

**What to build:** Once the shy mushroom creature has come right out and danced, it stays out and becomes a proper friend: she can carry it, put it in the bag, take it anywhere, sit it in chairs, give it hats and snacks. It has its own chat (shy, whispery, giggly) about being shy and about the grove. Before that first dance it's as shy as now.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/entities/mushroomGrove.js` (`MushroomCreature`), `src/ship/art/mushroomGrove.js`, `src/ship/mushroomGroveScene.js`, `src/ship/entities/carryable.js`, `src/ship/entities/stroller.js`, `src/ship/entities/friends.js`, `src/ship/kinds.js`, `src/ship/friendHats.js` + test, `src/ship/talks/` (new tree + `index.js`), `src/ship/world.js`

**Status:** ready-for-agent

- [ ] Shy behaviour until its first dance; a friend from then on (saved)
- [ ] Carryable, baggable, sits, eats snacks, wears hats
- [ ] Has its own chat tree, covered by the chat tests
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
