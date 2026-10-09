# 11 — Dresser drawers in the pod

**What to build:** A chest of drawers in the pod. Tap a drawer and it slides open and something small pops out: a stripy sock, a seed packet, or a little pink-alien plushie (new carryables). Each drawer has its own thing; once it's been taken out the drawer comes up empty with a puff of dust and a sneeze.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/podScene.js`, `src/ship/entities/pod.js`, `src/ship/art/pod.js`, `src/ship/entities/carryable.js`, `src/ship/entities/items.js`, `src/ship/kinds.js`, `src/ship/world.js`, `src/ship/sfx.js`

**Status:** ready-for-agent

- [ ] Drawers open and give a small new thing; things are carryable and baggable
- [ ] A drawer that's been emptied gives a funny empty reaction instead
- [ ] What's been taken out is remembered across reloads (no endless duplicates)
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
