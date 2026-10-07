# Awesome Game — Vision Doc

## What this is
A personal tablet game for a specific kid (age 7-12), inspired by Avatar World /
Aha World: explorable scenes with characters and animals, tap-or-drag
interaction, and an inventory system for carrying items and characters
between locations. Not published — built for one player, not the app store.

## Audience
- Single player, age 7-12 (can read, can handle light goals/challenge —
  unlike the toddler-focused reference apps)
- Played on a tablet — either iPad or Android, undecided/flexible

## Core design
- **Sandbox + light goals**: free exploration is the default mode. No fail
  states, no required quests. Characters can *want* things (e.g. an animal
  asks for a specific item) as optional objectives that reward you without
  punishing you for ignoring them.
- **Interaction**: both tap-to-select and drag-and-drop are supported for
  picking up and placing items/characters. Drag-and-drop is the primary,
  tactile interaction; tap is the fallback/reliable path.
- **Inventory**: items and characters can be picked up in one scene, carried
  in an inventory, and placed down in a different scene.
- **Theme/setting**: a cosy spaceship. The hero is a small girl with red
  hair; the first area is the ship's interior (porthole alien, spinning pilot
  chair, star map to fly between planets, blast-off poster, space plant).
  Planets are natural future scenes to visit.
- **Persistence**: progress (inventory contents, where things were placed)
  saves locally on the tablet (browser storage) so it survives closing the
  app and coming back later.
- **Audio**: sound effects only for v1 (pop/tap/drop-style feedback). No
  music yet.

## Tech stack
- **Engine**: a small custom engine written from scratch in plain JavaScript
  (`src/engine/`: canvas renderer, game loop, tap/drag input, tweens, synth
  sound effects, pixel font). Replaced the earlier Phaser prototype (still
  reachable at `village.html`) so the game can have a tight, crisp pixel-art
  feel with no framework overhead.
- **Deployment**: hosted as a static web app (e.g. GitHub Pages), opened via
  URL in the tablet's browser. "Add to Home Screen" gives it an app-like
  icon. Works identically on iPad and Android — no app store submission, no
  native build tooling (Xcode/Android Studio) required.
- **Art pipeline**: pixel art (256x160 internal resolution, scaled up with
  crisp pixels), drawn entirely in code under `src/ship/art/` — sprites as
  character grids plus procedural painting. No image files to load.
- **Save system**: browser `localStorage`. No account, no backend, no login.

## v1 scope (deliberately small — prove the core feel first)
- 1 scene (the village)
- 2-3 characters/animals
- 3-5 items
- Inventory works within that single scene (drag/tap items and characters
  around, pick up, carry, place)
- A concrete cast/item list, and what art to generate, will be proposed at
  the start of the build

## Explicitly deferred to later versions
- Multiple connected scenes (the "carry things *between* locations" hook —
  the riskiest/most novel mechanic, deliberately not in v1)
- Background music
- Packaging as an installable native app (via Capacitor or similar)
- Free/purchased asset packs as an alternative art source
- Cloud save / accounts
- Any real quest/progression system beyond light optional goals
