# 07 — The bunk room

**What to build:** A new ship room to the right of the playroom: the bunk room. Bunks for her and for friends: tap her bunk and she climbs in and snoozes (zzz) until tapped; drop a friend on a bunk and they're tucked in and fall asleep. A light switch dims the room to night — stars come out in the porthole, a night light glows, sleepers snore softly — and flicking it back gives a morning wake-up (stretches and yawns).

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/shipRooms.js` (room order and names), `src/ship/sideRoomScene.js`, `src/ship/playRoomScene.js` and `src/ship/entities/playroom.js` (pattern: friends having a go), new `src/ship/bunkRoomScene.js`, new `src/ship/entities/bunkroom.js`, `src/ship/art/shipRooms.js`, `src/ship/entities/friends.js`, `src/ship/entities/stroller.js`, `src/ship/sfx.js`, `src/ship/shipRooms.test.js`, `VISION.md`

**Status:** ready-for-agent

- [ ] Arrow from the playroom leads to the bunk room (and back)
- [ ] She climbs into her bunk and naps; tap to wake
- [ ] Drop a friend on a bunk: tucked in, sleeps; picking them up wakes them
- [ ] Light switch: night (dim, stars, night light, snores) ↔ morning (wake-up stretches)
- [ ] A reload puts her back in the bunk room; old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
