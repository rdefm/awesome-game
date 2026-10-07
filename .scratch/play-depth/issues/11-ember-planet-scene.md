# 11 — Ember planet scene

**What to build:** Make Ember landable with its own scene, built with everything from the earlier tickets so it feels as deep as Bluebell from day one: a warm volcanic look, the parked ship to re-board, a new friend, a couple of carryable things native to Ember, at least one drop-on reaction (ideally one involving a Bluebell item, rewarding carrying things between planets), a secret or two, and Ember's star stickers.

**Blocked by:** 02 — More drop-on reactions, 03 — Hidden surprises, 09 — Star stickers, 10 — Planet → scene lookup

**Relevant files:** new `src/ship/emberScene.js`, new `src/ship/art/ember.js`, new `src/ship/entities/ember.js`; patterns in `src/ship/bluebellScene.js`, `src/ship/entities/bluebell.js`, `src/ship/art/bluebell.js`; `src/ship/art/props.js` (`PLANETS` — mark Ember landable), `src/ship/assets.js`, `src/ship/kinds.js`, `src/ship/world.js` (default Ember placements), `src/ship/layout.js`, `src/ship/landingCutscene.js`, `VISION.md` ("Built so far")

**Status:** ready-for-agent

- [ ] Ember is landable from the star map; landing cutscene and door work as on Bluebell
- [ ] Scene has a friend, ≥2 carryables, ≥1 drop-on reaction, ≥1 secret, and Ember stickers on the shelf
- [ ] Ember things travel in the bag to the ship and Bluebell and back
- [ ] Existing saves pick up Ember's default things without losing progress
- [ ] VISION.md updated
- [ ] `npm test` passes
