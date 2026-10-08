# 16 — Ember: the lava family's house

**What to build:** A house dug into the foot of Ember's volcano, like Candy's gingerbread house: tap it and she walks up the path into the distance (getting smaller) and goes in through the door. Inside: a family of lava people (a baby, mum, and dad with a moustache) in a cute house with things to play with. Tap the door inside and she walks back out and down the path, growing.

**Blocked by:** 13 — Candy planet scene

**Relevant files:** new `src/ship/lavaHouseScene.js`, new `src/ship/indoorScene.js` (shared with the gingerbread house), new `src/ship/art/lavaHouse.js`, new `src/ship/entities/lavaHouse.js`, new `src/ship/entities/house.js` (far house, door, shared); `src/ship/outdoorScene.js` (the walk up a house's path, moved from CandyScene), `src/ship/emberScene.js`, `src/ship/candyScene.js`, `src/ship/gingerbreadScene.js`, `src/ship/entities/friends.js` (`cuddle`, moved from frosty.js), `src/ship/layout.js`, `src/ship/assets.js`, `src/ship/kinds.js`, `src/ship/world.js`, `src/ship/entities/items.js` (lava cakes), `src/ship/sfx.js`, `src/ship/planetScenes.js`, `VISION.md`

**Decisions:**
- The house is its own place (`lavahouse`), like `gingerbread`: a reload inside puts her back inside.
- The family are friends (carryable, bag-able, chair-sittable); bring the baby to mum or dad for a cuddle.
- No new stickers: Ember's row of five on the board is full.

**Status:** done

- [x] House at the foot of the volcano with a stepping-stone path; tap it: she walks up shrinking, the door opens and she goes in
- [x] Inside: stone room, door back out (she walks down the path, growing)
- [x] Lava dad (moustache; belly laugh), mum (flame hair; hums), baby (giggles; toddles after them); cuddles
- [x] Hearth whose pot cooks lava cakes (a new snack, max 3 about)
- [x] Lava lamp that changes colour; cradle that rocks to a lullaby, and rocks the baby to sleep
- [x] Old saves get the family without losing anything
- [x] VISION.md updated
- [x] `npm test` passes
