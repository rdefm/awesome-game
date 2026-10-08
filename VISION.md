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
  space plant, and an airlock door. Arrows by the cockpit's side walls lead
  to the ship's other rooms: a store room (left) and a playroom (right).
  Planets are the scenes you visit.
- **Planets**: five on the star map (Bluebell, Ember, Frosty, Candy,
  Stripey). Tap the planet in the windshield to land; once landed, the door
  opens onto that planet's scene. Bluebell, Ember, Frosty and Candy are
  landable so far — Stripey says "too wild to land here yet" until it gets a
  scene. A planet can have places to go inside (Candy's gingerbread house).
- **Persistence**: saves locally on the tablet (browser storage) so closing
  the app and coming back picks up where she left off.
- **Audio**: sound effects only (synthesized at runtime). No music yet.

## Tech stack
- **Engine**: a small custom engine written from scratch in plain JavaScript
  (`src/engine/`: canvas renderer, game loop, tap/drag input, tweens, synth
  sound effects, pixel font). No game framework.
- **Game code**: `src/ship/` — one scene class per place (`ShipScene`,
  `StoreRoomScene`, `PlayRoomScene`, `BluebellScene`, `EmberScene`, `FrostyScene`, `CandyScene`,
  `GingerbreadScene`) sharing a `PlayScene` base (tap-to-walk,
  particles, banners, fade transitions); planet scenes share an
  `OutdoorScene` base (backdrop, parked ship, ramp) and are listed in
  `src/ship/planetScenes.js` (with places inside, so a reload picks her up
  in there); the ship's rooms, left to right, are in `src/ship/shipRooms.js`. Friends who wander about share a `Stroller` base. Scripted moments (landing, door, cutscenes) are
  plain `async` sequences that `await` tweens.
- **Art pipeline**: pixel art only, drawn entirely in code under
  `src/ship/art/` (256x160 internal resolution, scaled up with crisp pixels)
  — sprites as character grids plus procedural painting, baked to canvases
  at startup. No image files.
- **Save system**: browser `localStorage` (`src/ship/save.js`). Stores where
  the girl is (ship or planet), her position, the current planet, whether
  the ship has landed, and the **world** (`src/ship/world.js`): where every
  carryable thing lies in each place, and what's in the bag, plus which star
  stickers she's found (`src/ship/stickers.js`). No account, no
  backend, no login.
- **Tests**: Vitest (`npm test`) on the pure, DOM-free parts (pixmap, font,
  tweens, world, stickers, drop receivers).
- **Deployment**: static site built with Vite, deployed to GitHub Pages on
  every push to `master` (`.github/workflows/deploy.yml`). Opened via URL in
  the tablet's browser; "Add to Home Screen" gives it an app-like icon and a
  service worker keeps it playable offline once opened.

## Built so far
- Ship interior with all its props and the girl's idle/walk/act behaviour
- Star map travel between the five planets, blast-off from the poster
- Landing on Bluebell, Ember, Frosty or Candy: chair-bounce, dive toward the planet,
  outside cutscene of the ship touching down; taking off again via map or
  poster
- Airlock door (locked in space, opens when landed)
- Bluebell meadow: parked ship to re-board, giant bluebells that each chime
  a note, a hopping puffball critter, butterflies, a friendly pink alien
- Ember volcanic plain: smouldering sky and a glowing volcano, parked ship,
  fire flowers that flare when tapped, a geode, a scurrying fire newt,
  glowing moths, a steam vent that erupts and a lava pool with a leaping fish
- Frosty snowy valley: snow falling the whole time (and during the landing),
  snowy peaks and pines, parked ship, a friendly mum yeti who waves hello
  and her baby who toddles after her, snowballs, twinkling frost flowers,
  snowbirds, and a snow drift with a shy snow hare behind it
- Candy sugar land: pink icing sprinkled with sprinkles, frosting hills and
  lollipop trees, parked ship, a wobbly gummy bear, lollipops that spin,
  bouncy gumdrops, candy butterflies, and a candy-floss bush with a sugar
  mouse in it. Far off at the back is a gingerbread house: tap it and she
  walks up the winding path, getting smaller as she goes, and in through
  the door (and back down it, growing, when she comes out)
- Inside the gingerbread house: Ginger the gingerbread girl, who lives there
  and dances when tapped, an oven that bakes cupcakes (a new snack), a jar
  of jellybeans that pop out, and the door to go back outside
- **Inventory (the bag)**, Toca/Avatar-World style: carryable things (plant,
  teddy, ball, crystal, giant bluebells, fire flowers, geode, snowballs,
  frost flowers, lollipops, gumdrops, cupcakes) and friends (puffball, pink
  alien, newt, mum and baby yeti, gummy bear, Ginger)
  can be dragged anywhere and dropped onto the bag button (bottom-left).
  Tapping it slides up a tray with two pockets — things and friends — that
  scrolls sideways, no size limit. Drag a slot upward to pull it out under
  your finger, or tap it to pop it out beside the girl, in any place. Kinds
  are registered in `src/ship/kinds.js`.
- **Drop-on reactions**: anything can opt in to having a dragged thing
  dropped on it (`accepts(item)` / `receive(item)`; the bag still wins).
  Drop the crystal on the pink alien and it cheers, hearts pop, and it keeps
  the crystal beside it. Drop the geode on the newt and its tail cracks it
  open; bring the always-too-hot newt a giant bluebell from Bluebell and it
  cools off in the shade. Bring baby yeti back to mum for a cuddle; give
  baby a snowball and it plays catch (until it lands on its head); bring
  mum a fire flower from Ember to warm her paws. Give the gummy bear a
  lollipop for a big lick; bring Ginger a snowball from Frosty — she's
  never seen snow.
- **Star stickers**: a gentle "find them all". Stickers hide behind
  Bluebell's secrets (rock, bush, mole, a butterfly, the alien's thank-you)
  and Ember's (the vent's first big plume, the lava fish's big leap, a moth,
  inside the geode, the newt's thank-you for a bluebell) and Frosty's (the
  hare's big bound, a snowbird, baby's snowball, mum's cuddle, mum's
  thank-you for a fire flower) and Candy's (the sugar mouse's dash, a candy
  butterfly, the gummy bear's lick, the first cupcake from the oven,
  Ginger's first snow);
  each one found plays a fanfare and flies off with a "+1" banner. A board
  under the poster shows found stickers and outlines for the rest, with a
  count. Each planet lists its own in `src/ship/stickers.js`.

- **The ship's other rooms**: an arrow by each side wall of the cockpit
  (labelled with where it goes) — tap it and she walks off through the
  wall into the next room; tap the arrow there to come back. Drop anything
  on an arrow and it's sent through on its own. The **store room** (left)
  starts empty: painted bays on the floor for keeping things in. The
  **playroom** (right) has a ball pit (she hops in, dives right under and
  pops up in a splash of balls), a swing (higher and higher) and a
  trampoline (each bounce higher than the last). Drop a friend on any of
  them and they have a go. A reload puts her back in whichever room she
  was in.

## Planned later
- A scene for Stripey
- **Wants**: characters can want a specific item as optional objectives that
  reward you without punishing you for ignoring them

## Explicitly deferred
- Background music
- Packaging as an installable native app (via Capacitor or similar)
- Cloud save / accounts
- Any real quest/progression system beyond light optional goals
