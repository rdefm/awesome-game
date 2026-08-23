# 03 — Real cast, items, and art integration

**What to build:** Replace the placeholder shapes from ticket 01 with the actual v1 cast: 2-3 characters/animals and 3-5 items, each backed by an AI-generated image asset supplied by the user, plus a real village background image. Define the concrete content manifest (names, sprite keys, types) that later tickets (goals, persistence) will reference.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] A concrete list of 2-3 characters/animals and 3-5 items is proposed and confirmed with the user, along with the art-generation prompts for each
- [ ] User-supplied image assets are integrated into the project and loaded via Phaser's preload step
- [ ] The village scene renders the real background and real sprites in place of the ticket 01 placeholders
- [x] Pick-up/place (tap and drag, from tickets 01-02) continue to work unchanged against the real entities
- [x] Content manifest structure (id, display name, sprite key, type) is stable enough for ticket 04 to add a `wants` field to character entries

## Comments

Cast confirmed with user: characters Cat, Dog, Rabbit; items Ball, Bone,
Flower, Basket (7 entities, within the 2-3/3-5 range). Art-generation prompts,
file-naming convention, and image specs are written up in
`public/assets/README.md`.

Code is fully wired for real art: `content.js` manifest now carries
`id/name/type/spriteKey` (dropped the old `shape/color/radius/size`
placeholder fields), and `VillageScene` preloads `assets/<spriteKey>.png` +
`assets/background.png` and renders sprites/background via Phaser images
instead of primitive shapes. Tap and drag pick-up/place work unchanged
against the new sprite-based entities.

Blocked on the actual PNG files: I have no image-generation tool in this
environment, so the 8 files listed in `public/assets/README.md`'s checklist
still need to be generated (e.g. via ChatGPT image gen) and dropped into
`public/assets/` by the user. Until then the scene will show Phaser's
missing-texture placeholder instead of real art. Leaving this ticket open
(not renaming to `_COMPLETED`) until those files land and rendering is
verified — the remaining two checkboxes above are the only gate.
