# 14 — The ship's other rooms: store room and playroom

**What to build:** Arrows by the cockpit's side walls to walk through to new rooms, and arrows back. To the left, a store room for putting things in, which starts empty. To the right, a playroom with things for characters to play on (a ball pit, a swing, a trampoline).

**Relevant files:** new `src/ship/shipRooms.js`, `src/ship/sideRoomScene.js`, `src/ship/storeRoomScene.js`, `src/ship/playRoomScene.js`, `src/ship/entities/roomArrow.js`, `src/ship/entities/playroom.js`, `src/ship/art/shipRooms.js`; `src/ship/shipScene.js`, `src/ship/main.js`, `src/ship/assets.js`, `src/ship/layout.js`, `src/ship/art/room.js`, `src/ship/entities/girl.js`, `VISION.md`

**Decisions:**
- Each room is its own place in the world (`storeroom`, `playroom`), like the gingerbread house: things stay where they're left, and a reload puts her back in that room.
- Going through is a walk off the side of the screen and a fade, with her walking in from the other side.
- Dropping a thing on an arrow sends it through to the next room (handy for filling the store room).
- Playground kit is one at a time: her (tap it) or a friend (drop them on it).

**Status:** done

- [x] Arrows (labelled with where they go) by the cockpit's side walls, and back
- [x] Store room starts empty; things left there stay
- [x] Playroom: ball pit, swing, trampoline — for her and for friends
- [x] Reloading in a side room puts her back there
- [x] VISION.md updated
- [x] `npm test` passes
