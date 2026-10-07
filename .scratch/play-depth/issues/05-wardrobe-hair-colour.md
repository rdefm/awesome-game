# 05 — Wardrobe: hair colour

**What to build:** Turn the **left** ship locker (the one with the "ME" name tag, already painted into the room background) into her wardrobe. Tap it: the girl walks over, the door opens, she pops behind it, and comes out with a new hair colour (cycling through ~5 options, starting with her current red). Her look is saved and shows everywhere she goes.

Prefactor first: the girl's sprite frames are baked once with a fixed palette — make them bakeable for a given "look" so changing it is just re-baking.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/art/room.js` (`drawLockers`), `src/ship/layout.js` (`LOCKERS`), `src/ship/art/girl.js` (`HEAD_PALETTE`, `girlFrames`), `src/ship/art/palette.js`, `src/ship/assets.js`, `src/ship/entities/girl.js`, `src/ship/shipScene.js`, `src/ship/entities/props.js`, `src/ship/save.js`

**Status:** ready-for-agent

- [ ] Girl frames can be generated for a look (at least hair colour) without duplicating the pose code
- [ ] Left locker is a tappable prop with an open → change → close sequence
- [ ] Each use cycles to the next hair colour; the look saves and persists across reloads and scenes
- [ ] Old saves without a look default to red hair
