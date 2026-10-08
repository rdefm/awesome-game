# 03 — Decor printer in the store room

**What to build:** Decorating the ship, Avatar World style. A decor printer stands in the store room: tap it and a chunky picker slides up showing decor pieces; tap one and the printer whirrs and pops it out. Decor is carryable like everything else — drag it anywhere in any ship room and it stays there across reloads. Start with a rug, a lamp, a beanbag and a wall poster. Rugs lie flat under everything; wall pieces snap up onto the wall.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/storeRoomScene.js`, `src/ship/sideRoomScene.js`, `src/ship/wardrobePicker.js` (picker pattern), `src/ship/kinds.js`, `src/ship/world.js`, `src/ship/playScene.js` (`spawn`, draw order in `drawEntities`), `src/ship/art/shipRooms.js`, `src/ship/entities/carryable.js`, new `src/ship/entities/decor.js`, new `src/ship/art/decor.js`, `src/ship/sfx.js`, `VISION.md`

**Decisions:**
- Decor is ordinary carryable stuff in the world (it can go in the bag, even to planets).
- How many copies of each piece can exist is the implementer's call; keep it sensible.

**Status:** ready-for-agent

- [ ] Printer in the store room; tap → picker of decor pieces; pick → printed out with a whirr
- [ ] Rug, lamp (tap toggles light), beanbag (drop a friend on it to flop), wall poster
- [ ] Rugs draw under everything; wall pieces snap to the wall
- [ ] Decor positions survive a reload; old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
