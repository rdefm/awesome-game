# 03 — Hidden surprises on Bluebell

**What to build:** A reusable "secret" kind of scene thing: something that looks like scenery but does something unexpected when tapped (flip, rustle, pop open), revealing a small surprise. Add 2–3 to the Bluebell meadow, e.g. a rock that flips over to show a wriggly bug, a bush that rustles and a bird flutters out, a hole a little mole peeks out of. Secrets can be tapped again for a repeat/variation; they're not carryable.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/bluebellScene.js`, `src/ship/entities/bluebell.js`, `src/ship/art/bluebell.js`, `src/ship/assets.js`, `src/ship/sfx.js`, `src/ship/layout.js`

**Status:** ready-for-agent

- [ ] A shared secret entity/base exists that later scenes (ship, Ember) can reuse
- [ ] Bluebell has 2–3 secrets, each with its own reveal animation and sound
- [ ] Tapping a secret gives immediate feedback (squash) even while the girl walks over
- [ ] Secrets don't block walking or carryable drops
