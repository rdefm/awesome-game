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
- **Theme/setting**: generic cozy sandbox village for now — houses, a park,
  some animals/people to interact with. No strong IP or story. Can sharpen
  or change later.
- **Persistence**: progress (inventory contents, where things were placed)
  saves locally on the tablet (browser storage) so it survives closing the
  app and coming back later.
- **Audio**: sound effects only for v1 (pop/tap/drop-style feedback). No
  music yet.

## Tech stack
- **Engine**: [Phaser](https://phaser.io/) (JavaScript 2D game framework).
  Chosen because it has built-in support for sprites, touch/drag input, and
  scene management — a strong fit for this genre — and because the
  developer (me, Claude) writes the code directly with no visual editor or
  engine installation required from the user.
- **Deployment**: hosted as a static web app (e.g. GitHub Pages), opened via
  URL in the tablet's browser. "Add to Home Screen" gives it an app-like
  icon. Works identically on iPad and Android — no app store submission, no
  native build tooling (Xcode/Android Studio) required.
- **Art pipeline**: AI-generated images. The user generates character/item/
  scene art in a separate tool (e.g. ChatGPT image generation), then hands
  the files over to be wired into the game as code. Claude does not have a
  built-in image generation tool in this environment.
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
