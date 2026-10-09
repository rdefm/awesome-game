# 01 — A meadow wider than the screen

**What to build:** Bluebell's landing site becomes about twice as wide as the screen, with a new stretch of meadow off to the right to hold the new things. When she walks toward an edge, the view pans smoothly to follow her; dragging on empty ground pans the view by hand. The bag, the music button, banners and chats stay put on screen while the meadow moves. Every other place stays one screen wide and behaves exactly as before. Nothing new to play with yet beyond the extra room — a few bluebells and a butterfly or two over there so it isn't bare.

**Blocked by:** None — can start immediately

**Relevant files:** `src/engine/scene.js`, `src/engine/engine.js` (input coords), `src/ship/playScene.js` (tap-to-walk, drag, banners, HUD), `src/ship/outdoorScene.js`, `src/ship/backdrop.js`, `src/ship/art/bluebell.js`, `src/ship/bluebellScene.js`, `src/ship/layout.js` (`W`, walkable band), `src/ship/bag.js`, `src/ship/musicButton.js`, `src/ship/chat.js`, `src/ship/save.js` (her x can now be past 256), `src/ship/world.js` (positions of things in the wide meadow)

**Status:** ready-for-agent

- [ ] A scene can declare a width wider than the screen; default stays one screen, so other places are unchanged
- [ ] View follows her as she walks toward an edge, easing rather than snapping, and never shows past the meadow's ends
- [ ] Dragging on empty ground pans; dragging a thing or friend still carries it (and the view nudges along when it's carried near an edge)
- [ ] Taps, drops and drop-on reactions land on the right thing wherever the view is
- [ ] Bag, music button, banners and chat bubbles stay fixed on screen
- [ ] A reload on the far side of the meadow puts her (and the view) back there; the hoverbike, ship and pod still work
- [ ] Panning maths is pure and covered by tests
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
