# 09 — Collectible star stickers + ship shelf

**What to build:** A light "find them all" goal. Hidden star stickers are tucked behind Bluebell's secrets (and other nooks). Finding one plays a sparkle fanfare and it flies off with a "+1" banner. On the ship, a sticker shelf/board shows the found stickers and empty outlines for the rest, with a count (e.g. "2/5"). Found stickers are saved; no penalty, no timer.

**Blocked by:** 03 — Hidden surprises on Bluebell

**Relevant files:** `src/ship/save.js`, new pure collection module + Vitest test (follow `src/ship/world.js` / `world.test.js`), `src/ship/entities/bluebell.js` (secrets), `src/ship/bluebellScene.js`, `src/ship/shipScene.js`, `src/ship/art/room.js`, `src/ship/playScene.js` (banner), `src/ship/sfx.js`

**Status:** ready-for-agent

- [ ] Sticker definitions live in one place, keyed by planet, so new planets can add theirs
- [ ] Finding a sticker records it once (re-tapping doesn't re-award) and persists across reloads
- [ ] Ship shelf shows found vs. not-yet-found stickers and a count
- [ ] Collection logic is pure and tested
- [ ] `npm test` passes
