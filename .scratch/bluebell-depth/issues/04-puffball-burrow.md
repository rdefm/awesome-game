# 04 — Puffball burrow

**What to build:** A little burrow in a grassy bank. Tap it and a tumble of baby puffballs rolls out, bounces about squeaking and hops back in one by one. Drop the puffball on the burrow and it wriggles in for a nap (snoring Zzz), popping back out when tapped or after a while.

**Blocked by:** 01 — A meadow wider than the screen

**Relevant files:** `src/ship/entities/secret.js`, `src/ship/entities/bluebell.js` (`Critter`, `MoleHole` pattern), `src/ship/art/bluebell.js`, `src/ship/bluebellScene.js`, `src/ship/sfx.js`

**Status:** ready-for-agent

- [ ] Tap: babies roll out, play, and go back in; tapping again gives a variation
- [ ] Drop the puffball on it: naps, then comes back out
- [ ] Doesn't block walking or drops elsewhere
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
