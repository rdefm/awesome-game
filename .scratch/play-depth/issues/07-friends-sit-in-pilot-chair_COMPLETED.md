# 07 — Friends sit in the pilot chair

**What to build:** Drag a friend (puffball, pink alien) onto the pilot chair and they sit in it, just like the girl can. Tapping the chair spins it with the friend aboard. Dragging the friend out frees the chair. If the girl is already seated, a friend can't take the seat (falls beside it as normal), and vice versa.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/entities/props.js` (`Chair` — `accepts`, `seat`, `release`, composed spin canvas), `src/ship/entities/girl.js` (current seating flow in `onDrop`), `src/ship/entities/carryable.js`, `src/ship/entities/bluebell.js` (`Critter`, `Local`), `src/ship/shipScene.js`

**Status:** ready-for-agent

- [ ] Friends dropped on the chair sit in it and spin with it
- [ ] Only one occupant at a time; the girl and friends both respect that
- [ ] Dragging a seated friend out works; reload puts the friend on the floor near the chair (the seat itself isn't persisted)
