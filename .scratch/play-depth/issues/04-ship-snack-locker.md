# 04 — Snack locker on the ship

**What to build:** The ship already has a pair of lockers painted into the room background (two doors; the left one has the "ME" name tag and becomes the wardrobe in 05). Make the **right** locker door a snack cupboard: tapping it swings the door open to show snacks (e.g. space cookie, star fruit, juice pouch). Snacks are new carryable kinds — drag them out, carry them in the bag, take them anywhere. Drop a snack on a friend (puffball, pink alien) and the friend eats it with a munch animation; the snack is used up. The locker restocks when closed and reopened so snacks never run out.

**Blocked by:** 01 — Drop-on reactions, 03 — Hidden surprises (reuse the open/reveal entity pattern)

**Relevant files:** `src/ship/art/room.js` (`drawLockers` — doors are currently baked into the background), `src/ship/layout.js` (`LOCKERS`), `src/ship/shipScene.js`, `src/ship/entities/props.js`, `src/ship/art/items.js`, `src/ship/kinds.js`, `src/ship/world.js` (removing a used-up thing; unique ids for restocked snacks) + `src/ship/world.test.js`, `src/ship/entities/bluebell.js` (friends' eat reaction)

**Status:** ready-for-agent

- [ ] Right locker door is a tappable prop that opens/closes with animation and sound
- [ ] At least 3 snack kinds, each draggable, bag-able, with bag icons
- [ ] Dropping a snack on a friend plays an eat reaction and removes the snack from the world
- [ ] Restocking never duplicates ids; world tests cover remove + unique-id creation
- [ ] `npm test` passes
