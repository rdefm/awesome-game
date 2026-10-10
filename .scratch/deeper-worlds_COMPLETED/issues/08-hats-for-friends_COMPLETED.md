# 08 — Hats for friends

**What to build:** Dress up friends, not just her. Drop a friend on the wardrobe and the picker opens for that friend: a row of hats (the same hats she can wear). Tap one and it pops onto the friend's head, sitting right on each friend's own head shape. The friend keeps the hat wherever they go, in the bag and across reloads.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/wardrobePicker.js`, `src/ship/look.js`, `src/ship/entities/props.js` (`Wardrobe`; add `accepts`/`receive`), `src/ship/art/girl.js` (`HATS`), `src/ship/entities/stroller.js` (draw the hat; per-friend head anchor), `src/ship/entities/friends.js`, `src/ship/world.js` (a friend's look on its entry), `src/ship/bag.js` (hat shows in the bag slot), `VISION.md`

**Status:** ready-for-agent

- [ ] Drop any friend on the wardrobe → picker opens for that friend (hats row only)
- [ ] Each friend wears hats at the right spot for its head
- [ ] Hat stays on through drags, bag, chair and travel, and across reloads
- [ ] Old saves load fine (friends start hatless)
- [ ] VISION.md updated
- [ ] `npm test` passes
