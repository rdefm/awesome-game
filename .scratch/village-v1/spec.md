# Spec: Cozy Village Sandbox — v1

Status: ready-for-agent

## Problem Statement

There's no tablet game right now for this player (a kid, age 7-12) that matches
what they enjoy about apps like Avatar World and Aha World: wandering through
a scene, poking at characters and animals, picking things up, and carrying
them somewhere else. Nothing needs to be bought or built from scratch by hand
— the player just wants something to explore and fiddle with on a tablet, and
the builder (the user) wants that to exist without having to become a game
developer, install engines, or manage app-store builds.

## Solution

A small browser-based game, built with Phaser, depicting one cozy village
scene populated with a few characters/animals and a few items. The player
can tap or drag characters and items to pick them up into an inventory, and
place them back down. Some characters optionally want a specific item; giving
it to them is a small rewarded moment, not a requirement. Progress (what's in
the inventory, where things have been placed, which optional goals are met)
is saved automatically on the tablet itself. The game is opened as a URL in
the tablet's browser and can be pinned to the home screen like an installed
app, on either iPad or Android, with no app-store submission and no build
tooling for the user to operate.

This spec covers v1 only: one scene, 2-3 characters/animals, 3-5 items —
enough to prove the core pick-up/carry/place/optional-goal loop feels good
before expanding to multiple connected scenes.

## User Stories

1. As the player, I want to see a village scene when I open the game, so that I have somewhere to start exploring.
2. As the player, I want to tap a character or animal, so that I can see it react or pick it up.
3. As the player, I want to drag a character or animal with my finger, so that picking things up feels tactile and game-like.
4. As the player, I want to tap an item to pick it up, so that I have a simple, reliable alternative to dragging.
5. As the player, I want to drag an item into my inventory, so that I can carry it with me.
6. As the player, I want to see my inventory on screen at all times, so that I know what I'm currently holding.
7. As the player, I want to drag an item out of my inventory back into the scene, so that I can place it wherever I want.
8. As the player, I want to tap an inventory item and then tap a spot in the scene, so that I can place it without needing to drag precisely.
9. As the player, I want to pick up a character/animal the same way I pick up an item, so that the game treats them consistently.
10. As the player, I want some characters to visibly want a specific item (e.g. a hungry animal), so that I have something to figure out and do.
11. As the player, I want something fun to happen when I give a character the item it wants (a reaction, a sound, a visual change), so that I feel rewarded for figuring it out.
12. As the player, I want giving a character the "wrong" item to just... not do anything bad, so that I'm never punished or blocked for experimenting.
13. As the player, I want to be able to ignore every optional goal entirely and just explore freely, so that the game stays a sandbox, not a checklist.
14. As the player, I want a satisfying little sound when I pick something up, drop it, or tap it, so that interacting with the world feels responsive.
15. As the player, I want to close the game and come back later with everything exactly as I left it (inventory contents, where I placed things, which characters I've already satisfied), so that my progress isn't lost.
16. As the player, I want to add the game to my tablet's home screen, so that it feels like a real installed app rather than a browser tab.
17. As the player, I want the game to work the same way whether I'm on an iPad or an Android tablet, so that the device I'm handed doesn't matter.
18. As the builder (user), I want the game hosted somewhere free and simple, so that I don't have to run or maintain a server myself.
19. As the builder (user), I want to supply AI-generated art files and have them wired into the game, so that I don't have to draw anything myself or learn an art tool.
20. As the builder (user), I want the actual game logic (Claude) written entirely for me, so that I don't need to learn Phaser, JavaScript, or any build tooling to get a playable game.
21. As the builder (user), I want the core state of the game (inventory, placements, goals) separated from the rendering code, so that the important logic can be tested without needing a browser or a tablet on hand.
22. As the builder (user), I want a v1 that's small enough to actually finish and play quickly, so that we can validate the core loop before investing in more scenes, art, and content.
23. As the builder (user), I want the save data to survive a page reload, so that testing changes doesn't wipe out play progress every time.
24. As the player, I want the touch targets on characters and items to be generously sized, so that tapping/dragging works reliably on a tablet screen with a kid's fingers.
25. As the builder (user), I want a straightforward path to add a second and third scene later, so that the "carry things between locations" hook (deferred out of v1) isn't blocked by how v1 is built.

## Implementation Decisions

- **Engine**: Phaser 3, plain JavaScript. No TypeScript, no framework beyond Phaser itself, to keep the codebase simple to extend later even by a non-expert.
- **Build tooling**: Vite as the dev server and build tool. It gives fast local iteration, a trivial static-site build for hosting, and pairs cleanly with Vitest for the unit-testing seam below. This is tooling only Claude operates — the user never runs build commands themselves; the shipped artifact is a static site.
- **Scene scope**: exactly one Phaser scene for v1 (the village). Multi-scene/cross-scene carrying is explicitly deferred (see Out of Scope) but the state-module separation below is chosen partly so that adding scenes later doesn't require restructuring game logic.
- **Core seam — `gameState` module**: all game state (inventory contents, per-entity placement/position, which optional goals are satisfied) lives in one plain JS module with zero Phaser dependency. It exposes plain functions such as: pick up an entity (moves it from "placed in scene" to "in inventory"), place an entity (moves it from inventory to a scene position), and check/satisfy a goal (given an item id and a character id, determine whether the character's want is met and mark it satisfied). Phaser scene code calls these functions and re-renders sprites based on the returned/updated state; it does not itself own or mutate game state directly. This is the one seam this spec tests against.
- **Entities as data**: characters/animals and items are defined as plain data objects (id, display name, sprite/image key, type) in a small content manifest, not hardcoded scattered through scene code — makes it straightforward to add/adjust the cast without touching interaction logic.
- **Interaction handling**: Phaser's built-in drag input (`setInteractive` + drag events) is the primary interaction; a tap handler provides the select-then-place fallback described in the user stories. Both paths call the same `gameState` functions, so there's exactly one code path for "an item changed location," regardless of which input triggered it.
- **Optional goals**: a character entity may declare a `wants: <itemId>` field. When the player places/gives that item to that character, `gameState` marks the goal satisfied and returns enough information for the scene to trigger a reaction (animation/visual change) and a sound cue. No fail state, no time limit, no penalty for a mismatch — a mismatched item simply does nothing.
- **Persistence**: `gameState` is serialized to `localStorage` on every mutation (pick up, place, goal satisfied) and rehydrated on load. No account, no backend, no sync across devices.
- **Art integration**: character/item/background art is supplied as image files generated externally by the user (AI image tool) and dropped into an assets directory; Phaser's preload step loads them by key, referenced from the entity content manifest above. No in-repo art generation.
- **Audio**: short sound-effect files (pick up, drop/place, tap, goal-satisfied) played via Phaser's sound manager. No background music in v1. Source of the actual SFX files (free pack vs. generated) is not yet decided — flagged as an open question for whoever picks up this ticket.
- **Home-screen installability**: a minimal web app manifest (name, icon, display: standalone) is added so "Add to Home Screen" produces an app-like icon on both iOS and Android, without introducing a full offline-first service worker (not needed given this is always played online/on the same device).
- **Hosting**: static build output deployed to a free static host (e.g. GitHub Pages). Deployment mechanics (repo setup, CI/manual push) are an implementation detail for whoever builds this, not fixed by this spec.

## Testing Decisions

- Good tests here assert on `gameState`'s public behavior (inputs in, resulting state out) — not on Phaser internals, DOM structure, or rendering. This keeps tests fast, running in plain Node with no browser/canvas needed, and immune to churn in sprite/animation code.
- **Modules tested**: the `gameState` module only, for v1. Cases to cover: picking up an item/character removes it from "placed" and adds it to inventory; placing an inventory entity sets its scene position and removes it from inventory; giving a character its wanted item marks that goal satisfied exactly once (repeat gives don't re-trigger or error); giving a character an item it doesn't want changes nothing and doesn't error; serializing then deserializing state round-trips to an equivalent state (covers the persistence contract without needing real `localStorage` in the test — a plain object can stand in for the storage backend).
- **Test runner**: Vitest, run against the `gameState` module directly (no Phaser, no jsdom needed since the module has no DOM/canvas dependency).
- **Prior art**: none — this is a greenfield repo, no existing test conventions to match.
- Rendering, drag-gesture handling, sprite placement, and audio playback are not covered by automated tests in v1; verified manually by playing the build on an actual tablet.

## Out of Scope

- Multiple connected scenes and carrying entities *between* them (the single biggest deferred piece — v1 proves the mechanic within one scene only).
- Background music.
- Packaging as an installable native app (Capacitor or similar) — v1 is browser/home-screen-icon only.
- Free/purchased art asset packs as an art source — v1 art is AI-generated and user-supplied.
- Cloud save, accounts, or cross-device sync.
- Any required quest/progression system, fail states, scoring, or time pressure.
- Inventory capacity limits — not specified; v1 assumes unlimited inventory unless whoever implements this decides a cap is needed for UI reasons.
- Automated rendering/interaction/e2e tests — deferred until there's a reason (recurring visual bugs, more contributors) to justify the heavier harness.

## Further Notes

- Theme is deliberately generic ("cozy village," no fixed IP or story) so it can be reskinned or expanded in any direction later without fighting established lore.
- This is a personal, unpublished project for one specific player — there's no app-store compliance, privacy policy, or monetization concern to design around.
- A concrete cast/item list (which 2-3 characters, which 3-5 items, what each "wants") and the corresponding art-generation prompts are expected to be produced at implementation time, not fixed by this spec.
- Full context and prior discussion live in `VISION.md` at the repo root.
