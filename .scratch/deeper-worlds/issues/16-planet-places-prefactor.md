# 16 — A planet can have several places to visit (prefactor)

**What to build:** No visible change. Reshape the planet scene registry so each planet lists all its places — the landing site, its house(s), and (later) other outdoor sites — each with a name, a spot on the planet's town map, and whether it's outside or inside. Startup, reload and the ship door keep working exactly as now. This is what the hoverbike's town map reads from.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/planetScenes.js`, `src/ship/planetScenes.test.js`, `src/ship/outdoorScene.js`, `src/ship/indoorScene.js`, `src/ship/main.js`, `src/ship/save.js`, `src/ship/world.js`, `src/ship/planetMap.js` (`PLANETS`)

**Decisions:**
- A place's id is still its `where` (saves and the world's `placed` lists unchanged).
- Outdoor sites other than the landing site have no parked ship; she arrives by hoverbike (ticket 17), so the registry records how each place is arrived at.

**Status:** ready-for-agent

- [ ] Each planet lists its places with name, map spot and kind (landing site / house / site)
- [ ] `planetScene` / `landedOn` work for every listed place; behaviour unchanged
- [ ] Tests cover the registry (every place has a scene; every landable planet has a landing site)
- [ ] `npm test` passes
