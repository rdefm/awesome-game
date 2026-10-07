# Awesome Game — Vision Doc

## What this is
A personal tablet game for a specific kid (age 7-12), inspired by Avatar World /
Aha World: explorable scenes with characters and animals to poke at, and
places to travel between. Not published — built for one player, not the app
store.

## Audience
- Single player, age 7-12 (can read, can handle light goals/challenge —
  unlike the toddler-focused reference apps)
- Played on a tablet — either iPad or Android, undecided/flexible

## Core design
- **Sandbox + light goals**: free exploration is the default mode. No fail
  states, no required quests.
- **Interaction**: tap is the main interaction — tap a thing and the girl
  walks over and uses it; tap empty floor to walk there. She can also be
  dragged and dropped (e.g. straight into the pilot chair). Touch targets are
  generous because kids' taps wobble.
- **Theme/setting**: a cosy spaceship. The hero is a small girl with red
  hair in a blue flight suit. The ship's interior is the hub: porthole alien,
  spinning pilot chair, star map to fly between planets, blast-off poster,
  space plant, and an airlock door. Planets are the scenes you visit.
- **Planets**: five on the star map (Bluebell, Ember, Frosty, Candy,
  Stripey). Tap the planet in the windshield to land; once landed, the door
  opens onto that planet's scene. Only Bluebell is landable so far — the
  others say "too wild to land here yet" until they get a scene.
- **Persistence**: saves locally on the tablet (browser storage) so closing
  the app and coming back picks up where she left off.
- **Audio**: sound effects only (synthesized at runtime). No music yet.

## Tech stack
- **Engine**: a small custom engine written from scratch in plain JavaScript
  (`src/engine/`: canvas renderer, game loop, tap/drag input, tweens, synth
  sound effects, pixel font). No game framework.
- **Game code**: `src/ship/` — one scene class per place (`ShipScene`,
  `BluebellScene`) sharing a `PlayScene` base (tap-to-walk, particles,
  banners, fade transitions). Scripted moments (landing, door, cutscenes) are
  plain `async` sequences that `await` tweens.
- **Art pipeline**: pixel art only, drawn entirely in code under
  `src/ship/art/` (256x160 internal resolution, scaled up with crisp pixels)
  — sprites as character grids plus procedural painting, baked to canvases
  at startup. No image files.
- **Save system**: browser `localStorage` (`src/ship/save.js`). Stores where
  the girl is (ship or planet), her position, the current planet, whether
  the ship has landed, and the **world** (`src/ship/world.js`): where every
  carryable thing lies in each place, and what's in the bag. No account, no
  backend, no login.
- **Tests**: Vitest (`npm test`) on the pure, DOM-free parts (pixmap, font,
  tweens, world, drop receivers).
- **Deployment**: static site built with Vite, deployed to GitHub Pages on
  every push to `master` (`.github/workflows/deploy.yml`). Opened via URL in
  the tablet's browser; "Add to Home Screen" gives it an app-like icon and a
  service worker keeps it playable offline once opened.

## Built so far
- Ship interior with all its props and the girl's idle/walk/act behaviour
- Star map travel between the five planets, blast-off from the poster
- Landing on Bluebell: chair-bounce, dive toward the planet, outside
  cutscene of the ship touching down; taking off again via map or poster
- Airlock door (locked in space, opens when landed)
- Bluebell meadow: parked ship to re-board, giant bluebells that each chime
  a note, a hopping puffball critter, butterflies, a friendly pink alien
- **Inventory (the bag)**, Toca/Avatar-World style: carryable things (plant,
  teddy, ball, crystal, giant bluebells) and friends (puffball, pink alien)
  can be dragged anywhere and dropped onto the bag button (bottom-left).
  Tapping it slides up a tray with two pockets — things and friends — that
  scrolls sideways, no size limit. Drag a slot upward to pull it out under
  your finger, or tap it to pop it out beside the girl, in any place. Kinds
  are registered in `src/ship/kinds.js`.
- **Drop-on reactions**: anything can opt in to having a dragged thing
  dropped on it (`accepts(item)` / `receive(item)`; the bag still wins).
  Drop the crystal on the pink alien and it cheers, hearts pop, and it keeps
  the crystal beside it.

## Planned later
- Scenes for the other four planets
- **Wants**: characters can want a specific item as optional objectives that
  reward you without punishing you for ignoring them

## Explicitly deferred
- Background music
- Packaging as an installable native app (via Capacitor or similar)
- Cloud save / accounts
- Any real quest/progression system beyond light optional goals
