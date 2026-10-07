# 01 — Drop-on reactions: crystal gift to the pink alien

**What to build:** Today a dragged carryable dropped anywhere just falls to the floor (or goes in the bag). Add a general "dropped onto something" path: when a carryable is let go over another entity that knows how to receive it, that entity reacts instead of the item simply falling. First pairing: drop the crystal on the pink alien (the Bluebell local) — the alien cheers, hearts/sparkles pop, a happy sound plays, and the alien keeps the crystal (shown held/beside them; the world still knows where the crystal is so nothing is lost on reload). Anything dropped on something that doesn't accept it behaves exactly as before.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/playScene.js` (`dropCarryable`), `src/ship/entities/carryable.js` (`onDrop`), `src/engine/scene.js` (`pick`), `src/ship/entities/bluebell.js` (`Local`), `src/ship/sfx.js`, `src/ship/world.js`

**Status:** ready-for-agent

- [ ] Any entity can opt in to receiving drops (e.g. an `accepts(item)` / `receive(item)` pair); the bag still takes priority as a drop target
- [ ] Dropping the crystal on the pink alien triggers a visible + audible reaction
- [ ] Dropping anything else on the alien, or the crystal on anything else, falls to the floor as before
- [ ] After the reaction the world/save is consistent: reload shows the crystal where the reaction left it
- [ ] Pure "which receiver is under this drop point" logic has a Vitest test
- [ ] `npm test` passes
