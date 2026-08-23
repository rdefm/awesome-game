# 02 — Drag-and-drop interaction

**What to build:** Dragging a placed entity directly into the inventory tray, and dragging an inventory entity back out into the scene, as an alternative to the tap-to-select/tap-to-place path from ticket 01. Both interaction paths must call the same `gameState` functions — there is exactly one code path for "an entity changed location," regardless of which input triggered it.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Dragging a placed entity into the inventory tray picks it up (same `gameState.pickUp` call as the tap path)
- [ ] Dragging an inventory entity out into the scene places it at the drop position (same `gameState.place` call as the tap path)
- [ ] Tap-to-select/tap-to-place from ticket 01 still works unchanged alongside drag
- [ ] Touch targets are generously sized so drag works reliably on a tablet touchscreen
- [ ] Existing Vitest suite still passes unchanged (this ticket only adds an input path, not new `gameState` behavior)
