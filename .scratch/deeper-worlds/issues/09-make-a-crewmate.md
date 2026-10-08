# 09 — Make a crewmate

**What to build:** A crew pod on the ship where she builds a brand-new friend, Avatar World character-creator style: pick body colour, eyes, antennae/ears and a hat, watching them change as she taps. Tap "Done" and the pod opens with a hiss and the new crewmate hops out. Crewmates are ordinary friends: they stroll, greet her, play with others, sit in chairs, go in the bag, eat snacks and can be talked to (a simple friendly chat, once talking exists). She can make several.

**Blocked by:** 08 — Hats for friends

**Relevant files:** `src/ship/wardrobePicker.js` (picker pattern), `src/ship/look.js`, `src/ship/kinds.js`, `src/ship/world.js` (crewmate's look on its entry), `src/ship/entities/stroller.js`, `src/ship/entities/friends.js`, new `src/ship/entities/crew.js`, new `src/ship/art/crew.js`, new crew pod prop (cockpit or a side room), `VISION.md`

**Decisions:**
- Crewmates are built from parts drawn in code like everything else (no image files).
- A sensible cap on how many exist (implementer's call).

**Status:** ready-for-agent

- [ ] Crew pod; tap → creator panel with body colour, eyes, antennae/ears, hat
- [ ] Live preview; "Done" → pod opens and the crewmate hops out
- [ ] Crewmate does everything friends do (stroll, greet, play, chair, bag, snacks)
- [ ] Crewmates and their looks survive a reload
- [ ] VISION.md updated
- [ ] `npm test` passes
