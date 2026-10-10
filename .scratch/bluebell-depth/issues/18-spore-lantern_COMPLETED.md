# 18 — Spore jar lantern

**What to build:** An empty jar sitting in the grove. Pop spores near it and they float into the jar; when it holds five it glows and becomes a lantern (a new carryable). The lantern glows softly wherever it's put, in any place, and tapping it makes it pulse and chime. A new empty jar turns up after a while.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/entities/mushroomGrove.js` (`Spores`), `src/ship/art/mushroomGrove.js`, `src/ship/mushroomGroveScene.js`, `src/ship/entities/carryable.js`, `src/ship/kinds.js`, `src/ship/world.js`, `src/ship/sfx.js`

**Status:** ready-for-agent

- [ ] Popped spores fill the jar; at five it turns into a glowing lantern
- [ ] Lantern carryable, baggable, glows and chimes anywhere
- [ ] Jar's fill level survives a reload
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
