# 13 — Candy planet scene and the gingerbread house

**What to build:** Make Candy landable with its own scene, as deep as Frosty: a sugary look, the parked ship to re-board, a friend, carryable sweets, drop-on reactions (including one rewarding carrying something from another planet), a secret, and Candy's star stickers. A gingerbread house sits in the background; tap it and she walks up the winding path towards it — getting smaller as she gets further away — and goes in through the door. Inside is a cosy room of its own, with a gingerbread friend who lives there. Tap the door inside and she walks back out and down the path, growing as she gets nearer.

**Blocked by:** 12 — Frosty planet scene

**Relevant files:** new `src/ship/candyScene.js`, new `src/ship/gingerbreadScene.js`, new `src/ship/art/candy.js`, new `src/ship/entities/candy.js`, new `src/ship/entities/stroller.js` (the yetis' wandering, shared); `src/ship/entities/girl.js` (drawn smaller in the distance), `src/ship/art/props.js` (`PLANETS` — mark Candy landable), `src/ship/assets.js`, `src/ship/kinds.js`, `src/ship/world.js`, `src/ship/layout.js`, `src/ship/stickers.js`, `src/ship/sfx.js`, `src/ship/planetScenes.js`, `src/ship/entities/items.js` (cupcakes), `VISION.md`

**Decisions:**
- The walk to the house is scripted (a fixed winding path), not free depth-walking: she only shrinks on the way in and grows on the way out.
- The house is its own place (`gingerbread`) in the world: things can be carried in and out in the bag, and a reload inside the house puts her back inside.
- Leaving is by tapping the door inside.

**Status:** done

- [x] Candy is landable from the star map; landing cutscene and door work as on the other planets
- [x] Gingerbread house in the background with a path; tapping it: she walks to the path, then up it shrinking, the door opens and she goes in
- [x] Inside: a gingerbread room with a door (tap to go back out — she walks down the path, growing), an oven that bakes cupcakes, a jellybean jar
- [x] Ginger (lives in the house) and a gummy bear (outside) are friends: carryable, bag-able, chair-sittable, greet her, play, eat snacks
- [x] Carryables: lollipops, gumdrops, cupcakes (a new snack); secret: a candy-floss bush with a sugar mouse; candy butterflies
- [x] Drop-ons: lollipop on gummy bear → a big lick; Frosty snowball on Ginger → she's never seen snow
- [x] Five Candy stickers on the board
- [x] Reloading inside the house puts her back inside
- [x] Existing saves pick up Candy's default things without losing progress
- [x] VISION.md updated
- [x] `npm test` passes
