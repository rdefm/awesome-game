# 13 — Bluebell: the pink alien's pod

**What to build:** A house for Bluebell, like Candy's gingerbread house and Ember's lava house: the pink alien's round pod house far off in the meadow. Tap it and she walks up the path (getting smaller) and in. Inside: a cosy pod with things to play with (e.g. a bubble bath, a telescope that shows twinkling stars, a seed tray that sprouts) and the door back out.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/indoorScene.js`, `src/ship/entities/house.js`, `src/ship/outdoorScene.js`, `src/ship/bluebellScene.js`, `src/ship/planetScenes.js` (`INDOORS`), `src/ship/world.js`, `src/ship/assets.js`, `src/ship/layout.js`, new `src/ship/podScene.js`, new `src/ship/art/pod.js`, new `src/ship/entities/pod.js`; pattern: `src/ship/lavaHouseScene.js` and `.scratch/play-depth/issues/16-ember-lava-house_COMPLETED.md`; `VISION.md`

**Decisions:**
- Its own place, so a reload inside puts her back inside.
- No new stickers (Bluebell's row on the board is full).

**Status:** ready-for-agent

- [ ] Pod far off in the meadow with a path; she walks up shrinking and in through the door; back out growing
- [ ] Inside: 3+ things to play with and the door out
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
