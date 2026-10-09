# 03 — Bluebell posies and a flower crown

**What to build:** A patch of little bluebells in the meadow: tap it and she picks a posy (a small carryable). Drop three posies on her, one at a time, and they weave into a flower crown on her head, which is then a hat in the wardrobe like any other (friends can wear it too). Give a posy to the pink alien and it sniffs it, sneezes happily and keeps it beside it; its chat mentions posies before and after.

**Blocked by:** 01 — A meadow wider than the screen

**Relevant files:** `src/ship/bluebellScene.js`, `src/ship/entities/bluebell.js`, `src/ship/art/bluebell.js`, `src/ship/art/girl.js` (`HATS`), `src/ship/friendHats.js` + `friendHats.test.js`, `src/ship/look.js`, `src/ship/wardrobePicker.js`, `src/ship/talks/pinkAlien.js`, `src/ship/kinds.js`, `src/ship/world.js` (memories; crown unlocked)

**Status:** ready-for-agent

- [ ] Patch gives a posy each tap; posies are carryable and baggable
- [ ] Three posies dropped on her make a flower crown; she's wearing it and it's in the wardrobe from then on, saved
- [ ] Friends can wear the crown, sitting right on each friend's head
- [ ] Pink alien reacts to a posy and keeps it; its chat changes once it has one
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
