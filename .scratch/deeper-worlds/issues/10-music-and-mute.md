# 10 — Music, plus a mute button

**What to build:** Gentle background music. A small sequencer on top of the existing synth plays a cosy looping tune on the ship. A music on/off button (small and out of the way, so a parent can find it) turns it off and remembers that.

**Blocked by:** None — can start immediately

**Relevant files:** `src/engine/audio.js`, `src/ship/sfx.js`, `src/ship/playScene.js` (button in the overlay), `src/ship/save.js`, `src/ship/shipScene.js`, `src/ship/sideRoomScene.js`, `VISION.md` (music moves out of "Explicitly deferred")

**Status:** ready-for-agent

- [ ] Sequencer: tunes as data (notes, tempo, instrument) on the existing synth; tested where pure
- [ ] A cosy loop plays in all ship rooms, quieter than sound effects
- [ ] Music on/off button; the choice survives a reload
- [ ] Music starts only after the first tap (browser autoplay rules)
- [ ] VISION.md updated
- [ ] `npm test` passes
