# 12 — Frosty planet scene

**What to build:** Make Frosty landable with its own scene, as deep as Bluebell and Ember: a snowy look with snow falling, the parked ship to re-board, a friendly mum and baby yeti, carryable things native to Frosty, drop-on reactions (including one rewarding carrying something from another planet), a secret, and Frosty's star stickers.

**Blocked by:** 11 — Ember planet scene

**Relevant files:** new `src/ship/frostyScene.js`, new `src/ship/art/frosty.js`, new `src/ship/entities/frosty.js`; `src/ship/backdrop.js` (falling snow), `src/ship/art/props.js` (`PLANETS` — mark Frosty landable), `src/ship/assets.js`, `src/ship/kinds.js`, `src/ship/world.js`, `src/ship/layout.js`, `src/ship/stickers.js`, `src/ship/sfx.js`, `src/ship/planetScenes.js`, `VISION.md`

**Status:** done

- [x] Frosty is landable from the star map; landing cutscene and door work as on the other planets
- [x] Snow falls over the scene (and during the landing cutscene)
- [x] Mum yeti (waves hello) and baby yeti (bounces, toddles after mum) are friends: carryable, bag-able, chair-sittable, greet her, play, eat snacks
- [x] Drop-ons: baby on mum (or mum on baby) → cuddle; snowball on baby → catch game; Ember fire flower on mum → warms her paws
- [x] Carryables: snowballs, frost flowers; secret: snow drift with a hare; snowbirds
- [x] Five Frosty stickers on the board
- [x] Existing saves pick up Frosty's default things without losing progress
- [x] VISION.md updated
- [x] `npm test` passes
