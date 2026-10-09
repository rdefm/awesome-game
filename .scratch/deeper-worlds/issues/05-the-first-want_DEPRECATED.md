# 05 — The first Want

**What to build:** A **Want**: a friend would love a specific thing, as an optional little goal. A friend with a Want now and then shows a small thought bubble with the item drawn in it. Asking about it in a chat explains why ("My house is so dark… if only I had a glowing crystal"). Drop the wanted thing on them: a big happy reaction, they keep it, and she earns a reward — a new decor piece unlocked in the printer, announced with a fanfare and a banner. Ignoring a Want costs nothing. Start with one Want on one friend.

**Blocked by:** 01 — Talking to the pink alien; 04 — More decor pieces to unlock

**Relevant files:** `src/ship/world.js` (Wants kept with the world), `src/ship/save.js`, `src/ship/talk.js` / `src/ship/talks/`, `src/ship/entities/friends.js`, `src/ship/playScene.js` (`findSticker` / banner pattern), new `src/ship/wants.js` (pure + tested), `src/ship/decor.js`, `VISION.md`

**Decisions:**
- A Want never blocks anything; no timers, no failing.
- Wants sit alongside the existing drop-on reactions; those stay as they are.
- Reward = a decor unlock.

**Status:** deprecated — playtesting showed this isn't wanted (2026-10-09)

- [ ] One friend has a Want, shown as an occasional thought bubble with the item in it
- [ ] Their chat has a branch explaining the Want
- [ ] Dropping the wanted thing on them: reaction, they keep it, a decor piece unlocks with fanfare + banner
- [ ] The Want and its being met survive a reload; old saves load fine
- [ ] Want logic is pure and covered by tests
- [ ] VISION.md updated (Wants move out of "Planned later")
- [ ] `npm test` passes
