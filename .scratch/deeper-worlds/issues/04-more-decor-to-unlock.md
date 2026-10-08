# 04 — More decor pieces to unlock

**What to build:** The printer's picker shows more pieces than she has: locked ones appear as outlines (like stickers on the board), with a count. Unlocking is a single call that other features use (Wants, tickets 05–06): it saves, plays a fanfare, and the new piece wiggles in the picker next time it opens. Add a good handful of new pieces (e.g. fairy lights, a fish tank, a star rug, a rocket lamp, a planet mobile, a big cushion).

**Blocked by:** 03 — Decor printer in the store room

**Relevant files:** new `src/ship/decor.js` (catalogue + unlocked list, pure + tested; pattern from `src/ship/stickers.js`), `src/ship/save.js`, `src/ship/entities/decor.js`, `src/ship/art/decor.js`, the printer picker from 03, `VISION.md`

**Status:** ready-for-agent

- [ ] Catalogue of all decor pieces; starters unlocked, the rest locked
- [ ] Picker shows locked pieces as outlines, with a found/total count
- [ ] An unlock call that saves, plays a fanfare, and highlights the new piece
- [ ] Unlocked list survives a reload; old saves load with the starters
- [ ] VISION.md updated
- [ ] `npm test` passes
