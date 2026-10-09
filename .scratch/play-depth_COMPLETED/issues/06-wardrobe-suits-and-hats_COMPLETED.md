# 06 — Wardrobe: suits and hats

**What to build:** Upgrade the wardrobe locker from "cycle on tap" to a small chunky picker that slides up when she's at the open locker: three rows — hair, suit colour, hat (none, helmet, bow, crown…) — each a row of big tappable swatches. Changes show live on the girl; closing the picker shuts the locker. The look persists and shows on every planet.

**Blocked by:** 05 — Wardrobe: hair colour

**Relevant files:** `src/ship/art/girl.js`, `src/ship/art/palette.js`, `src/ship/assets.js`, `src/ship/entities/girl.js`, `src/ship/planetMap.js` and `src/ship/bag.js` (existing modal/tray UI patterns to match), `src/ship/shipScene.js`, `src/ship/save.js`

**Status:** ready-for-agent

- [ ] Picker opens from the wardrobe, has generous touch targets, closes cleanly
- [ ] Hair, suit colour and hat each change the girl live in all poses (incl. seated/spinning in the chair)
- [ ] Full look persists across reloads and scenes; old saves fall back to defaults
