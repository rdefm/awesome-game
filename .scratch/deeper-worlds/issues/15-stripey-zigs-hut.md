# 15 — Stripey: Zig's hut

**What to build:** A house for Stripey: Zig's stripy dome hut out among the mesas. Tap it and she walks up the path (getting smaller) and in. Inside: a stripy home with things to play with (e.g. a stripe-painting easel that recolours a wall, a sand timer, a hammock, a shelf of goggles to try on) and the door back out.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/indoorScene.js`, `src/ship/entities/house.js`, `src/ship/outdoorScene.js`, `src/ship/stripeyScene.js`, `src/ship/planetScenes.js` (`INDOORS`), `src/ship/world.js`, `src/ship/assets.js`, `src/ship/layout.js`, new `src/ship/zigHutScene.js`, new `src/ship/art/zigHut.js`, new `src/ship/entities/zigHut.js`; pattern: `src/ship/lavaHouseScene.js`; `VISION.md`

**Decisions:**
- Its own place, so a reload inside puts her back inside.
- No new stickers (Stripey's row on the board is full).

**Status:** ready-for-agent

- [ ] Hut among the mesas with a path; she walks up shrinking and in; back out growing
- [ ] Inside: 3+ things to play with and the door out
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
