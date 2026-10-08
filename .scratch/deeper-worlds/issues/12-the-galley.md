# 12 — The galley

**What to build:** A new ship room to the left of the store room: the galley, with a big bubbling mixing pot. Drop two things into the pot, it bubbles and burps, and out pops something new (e.g. snowball + fire flower = hot cocoa; lollipop + frost flower = ice lolly; cupcake + crystal = sparkle cake). Mixes that don't match make a funny fizzle and give both things back. A recipe card on the wall shows found recipes and outlines for the rest. New foods can be fed to friends.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/shipRooms.js`, `src/ship/sideRoomScene.js`, new `src/ship/galleyScene.js`, new `src/ship/recipes.js` (recipe table + found list, pure + tested), `src/ship/entities/items.js` (`Snack`), `src/ship/kinds.js`, `src/ship/world.js`, `src/ship/stickers.js` and `StickerBoard` in `src/ship/entities/props.js` (pattern for the recipe card), `src/ship/art/shipRooms.js`, `src/ship/sfx.js`, `src/ship/shipRooms.test.js`, `VISION.md`

**Status:** ready-for-agent

- [ ] Arrow from the store room leads to the galley (and back)
- [ ] Pot takes two things; matching recipe → new thing; no match → fizzle and both come back
- [ ] At least 6 recipes using things from across the planets
- [ ] Recipe card shows found/outlined recipes; the found list survives a reload
- [ ] Friends can eat the new foods
- [ ] VISION.md updated
- [ ] `npm test` passes
