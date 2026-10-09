# 15 — Stripey planet scene and Zig the stripey alien

**What to build:** Make Stripey landable with its own scene, as deep as Frosty: a stripy look, the parked ship to re-board, a stripey alien friend, carryable things native to Stripey, drop-on reactions (including one rewarding carrying something from another planet), a secret, and Stripey's star stickers.

**Blocked by:** 13 — Candy planet scene

**Relevant files:** new `src/ship/stripeyScene.js`, new `src/ship/art/stripey.js`, new `src/ship/entities/stripey.js`; `src/ship/art/props.js` (`PLANETS` — mark Stripey landable), `src/ship/assets.js`, `src/ship/kinds.js`, `src/ship/world.js`, `src/ship/layout.js`, `src/ship/stickers.js`, `src/ship/sfx.js`, `src/ship/planetScenes.js`, `VISION.md`

**Decisions:**
- Zig's stripes come in five colourways (its own plus one per other planet), remembered as its `stage`, so they stick across reloads and wherever it's carried.
- The stripe cactus's flower (from a juice) is also a `stage`, so it stays in flower.

**Status:** done

- [x] Stripey is landable from the star map; landing cutscene and door work as on the other planets
- [x] Striped canyon: sunset-striped sky, banded mesas, wavy striped sand, long striped clouds
- [x] Zig the stripey alien is a friend: carryable, bag-able, chair-sittable, greets her, plays, eats snacks; tap → waves with a "zig-zig!"
- [x] Carryables: stripe stones (each plinks its own note), stripe cacti; secret: a sand mound with a stripy worm; stripy butterflies
- [x] Drop-ons: stripe stone on Zig → plays a tune on its stripes; bluebell / fire flower / frost flower / snowball / lollipop / gumdrop on Zig → new stripes in that planet's colours; juice on a stripe cactus → it flowers
- [x] Five Stripey stickers on the board
- [x] Existing saves pick up Stripey's default things without losing progress
- [x] VISION.md updated
- [x] `npm test` passes
