# 06 — Wants for every friend, and new ones over time

**What to build:** Every friend has a small pool of Wants. A friend has at most one Want at a time; when it's met, a new one turns up later (e.g. after she's been away and come back). Wants lean on travel between planets (a yeti wanting something warm from Ember, Ginger wanting a crystal for her windowsill), and each met Want unlocks a decor piece until all are unlocked.

**Blocked by:** 02 — Talking to every friend; 05 — The first Want

**Relevant files:** `src/ship/wants.js`, `src/ship/talks/`, `src/ship/entities/*.js` (friends), `src/ship/world.js`, `src/ship/decor.js`, `VISION.md`

**Status:** ready-for-agent

- [ ] Every friend has 2+ Wants, explained in their chat
- [ ] At most one Want per friend at a time; a new one appears after the last is met
- [ ] Most Wants need a trip to another planet
- [ ] Each met Want unlocks a decor piece (once all are unlocked, just the happy reaction)
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
