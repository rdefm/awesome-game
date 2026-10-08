# 14 — Frosty: the yetis' ice cave

**What to build:** A house for Frosty: the yeti family's ice cave in the mountainside. Tap it and she walks up the path (getting smaller) and in. Inside: a glittering cave home with things to play with (e.g. icicles that chime, a fur-rug nest, a frozen-pond window with a fish under the ice, a fire to huddle round) and the way back out.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/indoorScene.js`, `src/ship/entities/house.js`, `src/ship/outdoorScene.js`, `src/ship/frostyScene.js`, `src/ship/planetScenes.js` (`INDOORS`), `src/ship/world.js`, `src/ship/assets.js`, `src/ship/layout.js`, `src/ship/entities/frosty.js` (yetis), new `src/ship/iceCaveScene.js`, new `src/ship/art/iceCave.js`, new `src/ship/entities/iceCave.js`; pattern: `src/ship/lavaHouseScene.js`; `VISION.md`

**Decisions:**
- Its own place, so a reload inside puts her back inside.
- The yetis stay outside by default (they're friends; she can bring them in).
- No new stickers (Frosty's row on the board is full).

**Status:** ready-for-agent

- [ ] Cave in the mountainside with a path; she walks up shrinking and in; back out growing
- [ ] Inside: 3+ things to play with and the way out
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
