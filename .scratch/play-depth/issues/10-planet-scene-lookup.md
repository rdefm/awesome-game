# 10 — Planet → scene lookup (prefactor)

**What to build:** Make adding a planet a one-line change. Today Bluebell is hard-wired in several places (startup reload, the ship door, leaving the planet). Introduce a single lookup from planet → scene so the door, startup and saves all go through it, and saves record which planet's scene she's in generically. No visible change: Bluebell works exactly as before.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/main.js` (startup scene choice), `src/ship/shipScene.js` (door → planet scene), `src/ship/bluebellScene.js`, `src/ship/art/props.js` (`PLANETS`, `landable`), `src/ship/save.js`, `src/ship/world.js` (`placed` keyed by place name)

**Status:** ready-for-agent

- [ ] One registry maps planet → scene; nothing else names `BluebellScene` for routing
- [ ] Existing saves (`where: 'bluebell'`) still load into Bluebell
- [ ] Landing, door, re-boarding and reload all behave as before
- [ ] `npm test` passes
