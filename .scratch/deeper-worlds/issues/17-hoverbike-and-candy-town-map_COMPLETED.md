# 17 — Hoverbike and town map on Candy, plus the milkshake lake

**What to build:** A hoverbike parked beside the ship on Candy. Tap it and she hops on, and a **town map** slides up: an illustrated, Aha World-style overview of the planet — little pictures of the landed ship, the gingerbread house and a new site, the milkshake lake, on rolling candy hills with paths between them. Every few seconds one of the places you can go "pops" (a squash-and-stretch bounce with a sparkle) to show it can be visited. Tap a place and the bike zooms her there (a quick fly-over transition) and she hops off with the bike parked beside her. Every outdoor site has the bike, so she can always hop on again; the ship's site is always on the map to get home. The milkshake lake is a new outdoor scene with a few things to poke (e.g. a straw to slurp, floating cherries, a wafer boat).

**Blocked by:** 16 — A planet can have several places to visit (prefactor)

**Relevant files:** `src/ship/planetScenes.js`, `src/ship/outdoorScene.js`, `src/ship/candyScene.js`, `src/ship/gingerbreadScene.js`, `src/ship/playScene.js` (modal, `leaveTo`), `src/ship/world.js`, `src/ship/save.js`, `src/ship/assets.js`, `src/ship/layout.js`, new `src/ship/townMap.js`, new `src/ship/art/townMap.js`, new `src/ship/entities/hoverbike.js`, new `src/ship/milkshakeLakeScene.js` (+ art/entities), `src/ship/sfx.js`, `VISION.md`

**Decisions:**
- Map places are big touch targets; the "pop" is occasional and staggered, not all at once.
- Tapping a house on the map takes her straight inside it.
- The walk-up path to the house still works too.
- The town map works off the place registry, so later planets only add art and entries.

**Status:** ready-for-agent

- [ ] Hoverbike by the ship on Candy; tap → she hops on and the town map slides up
- [ ] Map shows the ship, the gingerbread house and the milkshake lake, with occasional staggered "pops"
- [ ] Tap a place → fly-over transition → she arrives (inside, for the house); bike parked at outdoor sites
- [ ] Close button on the map; she hops off
- [ ] Milkshake lake: a new outdoor site with 3+ things to play with
- [ ] A reload at the lake puts her back there; old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
