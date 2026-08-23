# 01 — Scaffold + core pick-up/place loop (tap only)

**What to build:** A running Phaser+Vite project showing one village scene with a few placeholder entities (plain colored shapes standing in for characters/items — no real art yet). Tapping an entity picks it up into a visible inventory tray; tapping again places it back into the scene. All of this state lives in a `gameState` module with zero Phaser dependency, which Phaser scene code calls into and renders from. This ticket also establishes the project's dev tooling (Vite) and test tooling (Vitest).

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Vite project scaffolded, `npm run dev` serves the game locally
- [ ] `gameState` module exists with zero Phaser/DOM dependency, exposing functions to pick up an entity (scene → inventory) and place an entity (inventory → scene position)
- [ ] A content manifest defines a small placeholder cast (at least 2 entities) rendered as simple colored shapes in one Phaser scene
- [ ] Tapping a placed entity moves it into a visible on-screen inventory tray
- [ ] Tapping an inventory entity, then tapping an empty spot in the scene, places it back at that position
- [ ] Vitest unit tests cover `gameState`'s pick-up and place functions directly (no browser/canvas required to run them)
- [ ] `npm test` runs the Vitest suite and passes
