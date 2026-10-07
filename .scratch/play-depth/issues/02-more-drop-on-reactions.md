# 02 — More drop-on reactions

**What to build:** Use the drop-on mechanism to add three more cause-and-effect pairs so experimenting feels rewarding:

- Ball dropped on the puffball → the puffball chases/bounces the ball around for a moment, then both settle.
- Giant bluebell dropped on the space plant → the plant grows a stage (bigger/flowering) and the bluebell is used up or planted beside it. The growth stage persists across reloads and when the plant travels in the bag.
- Teddy dropped on the girl → she hugs it (a hug pose), then sets it down beside her.

**Blocked by:** 01 — Drop-on reactions

**Relevant files:** `src/ship/entities/bluebell.js` (`Critter`), `src/ship/entities/props.js` (`Plant`), `src/ship/entities/items.js` (`Ball`, `Teddy`), `src/ship/entities/girl.js`, `src/ship/art/girl.js` (new hug pose), `src/ship/art/props.js` (plant stages), `src/ship/world.js` + `src/ship/world.test.js`, `src/ship/kinds.js` (bag icon reflects plant stage)

**Status:** ready-for-agent

- [ ] Each of the three pairs reacts wherever both things are present (ship or Bluebell)
- [ ] Plant growth stage is stored on the plant's world entry and survives reload and bag trips (with a world test)
- [ ] The plant's bag icon reflects its stage
- [ ] Non-matching drops still fall as before
- [ ] `npm test` passes
