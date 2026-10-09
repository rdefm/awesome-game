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
- **Wide places**: most places are one screen wide, but a place can be
  wider (Bluebell's landing site is two screens of meadow). The view eases
  along after her as she walks toward a side, dragging on empty ground pans
  it by hand, and carrying something to a side creeps the view along. The
  bag, music button, banners and chats stay put on screen.
- **Theme/setting**: a cosy spaceship. The hero is a small girl with red
  hair in a blue flight suit. The ship's interior is the hub: porthole alien,
  spinning pilot chair, star map to fly between planets, blast-off poster,
  space plant, and an airlock door. Arrows by the cockpit's side walls lead
  to the ship's other rooms: a store room (left) and a playroom (right).
  A lift in the store room goes up to the ship's other decks (the galley
  and the bunk room); new rooms are added as lift stops, not by squeezing more
  doors into the cockpit.
  Planets are the scenes you visit.
- **Planets**: five on the star map (Bluebell, Ember, Frosty, Candy,
  Stripey). Tap the planet in the windshield to land; once landed, the door
  opens onto that planet's scene. All five are landable. A planet can have
  places to go inside (the pink alien's pod on Bluebell, Candy's
  gingerbread house, the lava family's house on Ember, the yetis' ice cave on Frosty, Zig's hut on Stripey) and other places out of doors (Candy's milkshake lake, Ember's
  lava falls, Stripey's oasis, Frosty's frozen lake, Bluebell's mushroom grove). Where
  a planet has a hoverbike, it's parked by the ship: hop on and a town map
  slides up (an illustrated overview of the planet, Aha World-style, its
  places popping now and then to show they can be tapped); tap a place and
  she zooms there. Every outdoor place has the bike, so she can always ride
  back to the ship.
- **Persistence**: saves locally on the tablet (browser storage) so closing
  the app and coming back picks up where she left off.
- **Audio**: sound effects and gentle background music, all synthesized at
  runtime. A small music note button in the top-right corner of every place
  turns the music on and off (a slash through it when off); the choice is
  saved. Music only starts after the first tap (browser autoplay rules).

## Tech stack
- **Engine**: a small custom engine written from scratch in plain JavaScript
  (`src/engine/`: canvas renderer, game loop, tap/drag input, tweens, synth
  sound effects and music sequencer, pixel font). No game framework.
- **Game code**: `src/ship/` — one scene class per place (`ShipScene`,
  `StoreRoomScene`, `PlayRoomScene`, `BunkRoomScene`, `GalleyScene`, `BluebellScene`, `EmberScene`, `FrostyScene`, `CandyScene`, `StripeyScene`,
  `GingerbreadScene`, `LavaHouseScene`, `IceCaveScene`, `PodScene`, `ZigHutScene`, `MilkshakeLakeScene`, `LavaFallsScene`, `OasisScene`, `FrozenLakeScene`, `MushroomGroveScene`) sharing a `PlayScene` base (tap-to-walk,
  particles, banners, fade transitions, and the view along a place wider
  than the screen: its `width` and `camX`, with the pure panning maths in
  `src/ship/camera.js`); planet scenes share an
  `OutdoorScene` base (backdrop, parked ship, ramp, and the walk up the
  path to a house far off at the back, the hoverbike ride), houses' insides share an
  `IndoorScene` base (room, front door back out), and they're listed in
  `src/ship/planetScenes.js`, every place on each planet with its spot on
  the town map (`src/ship/townMap.js` reads them), so a reload picks her up
  wherever she was; the ship's rooms, left to right, are in `src/ship/shipRooms.js`. Friends who wander about share a `Stroller` base. Scripted moments (landing, door, cutscenes) are
  plain `async` sequences that `await` tweens.
- **Art pipeline**: pixel art only, drawn entirely in code under
  `src/ship/art/` (256x160 internal resolution, scaled up with crisp pixels)
  — sprites as character grids plus procedural painting, baked to canvases
  at startup. No image files.
- **Save system**: browser `localStorage` (`src/ship/save.js`). Stores where
  the girl is (ship or planet), her position, the current planet, whether
  the ship has landed, and the **world** (`src/ship/world.js`): where every
  carryable thing lies in each place, and what's in the bag, plus which star
  stickers she's found (`src/ship/stickers.js`), which galley recipes she's
  found (`src/ship/recipes.js`) and the **memories** friends
  chat about that leave no sticker (a lava cuddle, say). No account, no
  backend, no login.
- **Tests**: Vitest (`npm test`) on the pure, DOM-free parts (pixmap, font,
  tweens, music sequencer, world, stickers, decor, drop receivers, chat trees,
  camera panning).
- **Deployment**: static site built with Vite, deployed to GitHub Pages on
  every push to `master` (`.github/workflows/deploy.yml`). Opened via URL in
  the tablet's browser; "Add to Home Screen" gives it an app-like icon and a
  service worker keeps it playable offline once opened.

## Built so far
- Ship interior with all its props and the girl's idle/walk/act behaviour
- Star map travel between the five planets, blast-off from the poster
- Landing on any of the five planets: chair-bounce, dive toward the planet,
  outside cutscene of the ship touching down; taking off again via map or
  poster
- Airlock door (locked in space, opens when landed)
- Bluebell meadow: parked ship to re-board, giant bluebells that each chime
  a note, a hopping puffball critter, butterflies, a friendly pink alien.
  A fluffy little cloud with a smiley face floats low over the bluebells:
  tap it and it goes grey and rains on the patch under it, the bluebells
  there ringing and ringing, their bells swinging faster, and a puddle forms
  that she splashes in when she walks through it. When the rain stops a
  rainbow arcs over the meadow for a while, and the puddle dries up
  (nothing saved). Far off in the meadow is the pink alien's round pink
  pod, with a glowing
  window and an antenna on top: tap it and she walks up the stepping-stone
  path, getting smaller, and in through the round-topped door. A hoverbike
  parked by the ship rides her anywhere on Bluebell's town map (rolling
  green hills dotted with giant bluebells, the ship, the pod and the grove).
  Out on the far stretch is a picnic: a red-checked blanket (tap it and she
  sits down on it, legs out, till she's off somewhere else; drop a friend on
  it and it sits down too, till it's picked up) and a wicker basket on its corner (tap it and the
  lid flips open and out pops a sandwich, then a berry juice, turn about,
  up to four lying about the picnic at once). Both are new snacks: in the bag, and any
  friend gobbles them up, on the blanket or anywhere else. Nearby is a
  patch of little bluebells: tap it and she picks a posy (up to four lying
  about the patch at once). Drop three posies on her, one at a time, and
  they weave into a flower crown on her head ("A FLOWER CROWN!"); from then
  on it's a hat in the wardrobe like any other (`bluebell.crown` in
  `memories`; the posies woven so far are `posies` in the save). At the
  back, a little burrow in a grassy bank: tap it and a tumble of baby
  puffballs rolls out, bounces about squeaking and hops back in one by one
  (three, then four, then five of them, scattering, playing follow-the-leader
  in a ring, or bouncing together higher and higher). Drop the puffball on
  it and it wriggles in for a nap (snoring, zzzs drifting up), popping back
  out when the burrow's tapped or after a while (nothing saved: napping when
  she leaves, it's just back out next time). Behind the posies, a giant
  dandelion clock taller than she is: tap it and she blows, the seeds
  puffing off across the sky, and one she holds onto lifts her gently off
  the ground, drifts her along and lets her down again. The bald stalk grows
  its fluff back after a little while (tapped before then, it just gives a
  little "nothing left" wiggle; nothing saved). Below the burrow, a kite
  lies in the grass beside its reel: tap it and she picks up the reel and
  runs a few steps, and it swoops up into the sky on its string, loops the
  loop in the wind and floats back down into the grass, and she brings the
  reel back. Drop a friend on it and the wind takes it up with the friend
  riding it, round a loop-the-loop and gently back down, the friend hopping
  for joy (nothing saved). At the far end, a little stream runs down out of
  the hills (she can splash straight through it). Tap one
  of the stepping stones across it and she hops over them all, each ringing
  a note higher than the last, there and back. Drop a thing in the water and
  it bobs off downstream, out of sight, then washes up on the bank a moment
  later; drop a friend in and it paddles across to the far bank and shakes
  itself dry (either way it's saved on the bank straight away, so nothing's
  ever lost)
- The mushroom grove on Bluebell (by hoverbike): a shady corner of the
  meadow under giant mushrooms. Two giant spotted mushrooms to bounce on
  (she hops up on the cap and bounces higher each time, the cap squashing
  and puffing out glowing spores; every third go is a big one); glowing
  spores drifting up to tap and pop with a chime, lighting up the ones near
  them; and a shy mushroom creature that pulls its cap down and turns into
  just another mushroom when she comes near, pops back out when she steps
  away, and when tapped peeks out and giggles, then looks all round and
  blushes, then at last comes right out for a little dance in a cloud of
  spores
- Inside the pod: a cosy round room, ribbed like a seed pod and strung with
  little lights. A telescope pointing up at a round window: look through it
  and night falls in the window, the stars come out and twinkle, and a
  shooting star streaks across; a seed tray on a little table to water, a
  stage at a time, from seeds to shoots to leaves to tiny bluebells in
  flower (tap it in flower and the bluebells ring, then their seeds blow
  off to start again); and a bubble bath to swish (bubbles float up and
  pop; drop a friend in and it splashes about, then shakes off and hops
  out); a round, cushioned bed nook in the wall under the window, with
  a little curtain (tap it and she climbs in and snoozes, zzz, the pod
  dimming and its string of lights glowing softly, till she's tapped awake;
  drop a friend in and it's tucked in for a nap till it's picked up;
  nothing saved); a mint-green pantry cupboard against the back wall (tap
  it and its doors swing open on shelves of jars, and out pops a pot of
  nectar, then a seed cookie, turn about, up to four lying about the pod at
  once: both new snacks, in the bag and feedable to any friend anywhere);
  and a kettle on a little pot-belly stove beside it (tap it and the stove
  lights, the kettle heats up rattling its lid, then whistles a cheerful
  tune with a puff of steam from its spout). The pink alien lives outside,
  but she can bring it in.
  The door goes back out
- Ember volcanic plain: smouldering sky and a glowing volcano, parked ship,
  fire flowers that flare when tapped, a geode, a scurrying fire newt,
  glowing moths, a steam vent that erupts and a lava pool with a leaping fish.
  At the foot of the volcano is the lava family's house, dug into the
  mountain: tap it and she walks up the stepping-stone path, getting
  smaller, and in through the round door. A hoverbike parked by the ship
  rides her anywhere on Ember's town map
- The lava falls on Ember (by hoverbike): a glowing cascade pouring down a
  dark cliff into a bubbling lava pool. The falls surge and hiss when
  tapped; lava bubbles float up out of the pool to pop; stepping stones
  along the shore to hop across, each ringing a higher note; and a geyser
  that blasts a pumice rock high into the air on a fountain of lava
- Inside the lava family's house: a cosy stone room where they live — dad
  (bushy moustache; a big belly laugh when tapped), mum (flame hair in a
  bun; hums a tune) and the baby (giggles and hops; toddles after them).
  A hearth whose pot cooks lava cakes (a new snack), a lava lamp that
  changes colour, the baby's geode cradle that rocks to a lullaby (drop the
  baby in and it's rocked to sleep), and the door to go back outside
- Frosty snowy valley: snow falling the whole time (and during the landing),
  snowy peaks and pines, parked ship, a friendly mum yeti who waves hello
  and her baby who toddles after her, snowballs, twinkling frost flowers,
  snowbirds, and a snow drift with a shy snow hare behind it. Up in the
  mountainside is the yetis' ice cave, its arched mouth fringed with
  icicles and hung with a fur curtain: tap it and she walks up the snowy
  path (big yeti footprints up it), getting smaller, and in through the fur curtain.
  A hoverbike parked by the ship rides her anywhere on Frosty's town map
- The frozen lake on Frosty (by hoverbike), snow still falling: a great
  sheet of ice to slide across (tap it and she whizzes from one end to the
  other with a twirl in the middle, any friends out there sliding along
  behind her in a line); a fishing hole with a curious fish that pops up to
  see who's there, looks her up and down and blows a bubble (every third
  time it flips right out and back in with a splash); and little snow
  critters that waddle about and, tapped, squeak and hop or flop on their
  tummies and toboggan off
- Inside the ice cave: a glittering cave home of blue ice. A row of
  icicles hanging from a ledge that chime down the row when tapped; a round
  window of clear ice onto the frozen pond, where a fish swims under the
  ice (knock and it comes up to blow bubbles and do a flip); a fur-rug nest
  to fluff up (drop a friend in and it curls up for a nap); and a campfire:
  tap it and it flares up, and the friends in the cave come to huddle
  round it. The yetis live outside, but she can bring them in. The fur
  curtain goes back out
- Candy sugar land: pink icing sprinkled with sprinkles, frosting hills and
  lollipop trees, parked ship, a wobbly gummy bear, lollipops that spin,
  bouncy gumdrops, candy butterflies, and a candy-floss bush with a sugar
  mouse in it. Far off at the back is a gingerbread house: tap it and she
  walks up the winding path, getting smaller as she goes, and in through
  the door (and back down it, growing, when she comes out). A hoverbike
  parked by the ship rides her anywhere on Candy's town map
- The milkshake lake on Candy (by hoverbike): a pink strawberry-milkshake
  lake ringed with whipped cream, a giant stripy straw to slurp from,
  cherries bobbing about that duck under with a plop, and a wafer boat
  with an umbrella sail that toots and speeds up when tapped
- Inside the gingerbread house: Ginger the gingerbread girl, who lives there
  and dances when tapped, an oven that bakes cupcakes (a new snack), a jar
  of jellybeans that pop out, and the door to go back outside
- Stripey canyon: a sunset sky in stripes, banded mesas, sand in wavy
  stripes, parked ship, Zig the stripey alien (goggly eyes on stalks; waves
  both arms with a "zig-zig!"), stripe stones that each plink a note,
  stripe cacti, stripy butterflies, and a sand mound with a stripy worm in
  it. Out among the mesas is Zig's hut, a dome in orange and cream stripes
  with two little eye-stalk aerials on top: tap it and she walks up the
  sandy path, getting smaller, and in through the round door. A hoverbike
  parked by the ship rides her anywhere on Stripey's town map
- The oasis on Stripey (by hoverbike): a pool in turquoise stripes among
  palms. A stripy frog on the lily pads croaks, leaps and dives in with a
  splash (splashing her if she's close), popping up on the next pad; shake
  the palm and a coconut drops and rolls off along the sand (tap one to
  kick it rolling again); and a big sand dune to climb and slide down
- Inside Zig's hut: a stripy dome of a room. An easel: tap it and she
  paints the walls in the next planet's stripes; a sand timer to turn over
  (it dings when the sand's all through); a shelf of goggles to try on, one
  pair after another; and a hammock that swings when tapped (drop a friend
  in and it's swung off to sleep). The door goes back out
- **Music**: tunes are plain data (`src/ship/tunes.js`: tempo, loop length,
  and voices of `[beat, note, length]` with an instrument each) played by a
  sequencer (`src/engine/sequencer.js`, pure; `Music` in
  `src/engine/audio.js` feeds it to the synth through its own quieter volume
  bus). A place picks its tune with `tune` on its scene; the ship and its
  side rooms play a slow, cosy loop; every planet has its own tune (twinkly
  Bluebell, warm rumbly Ember, chimey Frosty, bouncy Candy, twangy Stripey),
  shared by its landing site and outdoor sites (so the hoverbike doesn't restart
  it), and every house plays a softer indoor lullaby. Changing tune fades the old
  one out as the new one fades in. Landing and blast-off each get a short sting
  (`STINGS`, played once by `music.sting`). Muting silences stings too.
  The on/off choice is saved as `music` (old saves get music on).
- **Inventory (the bag)**, Toca/Avatar-World style: carryable things (plant,
  teddy, ball, crystal, giant bluebells, fire flowers, geode, snowballs,
  frost flowers, lollipops, gumdrops, cupcakes, lava cakes, sandwiches,
  berry juices, posies, stripe stones,
  stripe cacti)
  and friends (puffball, pink alien, newt, mum and baby yeti, gummy bear,
  Ginger, Zig, the lava family)
  can be dragged anywhere and dropped onto the bag button (bottom-left).
  Tapping it slides up a tray with two pockets — things and friends — that
  scrolls sideways, no size limit. Drag a slot upward to pull it out under
  your finger, or tap it to pop it out beside the girl, in any place. Kinds
  are registered in `src/ship/kinds.js`.
- **Drop-on reactions**: anything can opt in to having a dragged thing
  dropped on it (`accepts(item)` / `receive(item)`; the bag still wins).
  Drop the crystal on the pink alien and it cheers, hearts pop, and it keeps
  the crystal beside it; drop a posy on it and it has a long sniff, sneezes
  happily and keeps that beside it too (its chat talks of posies before
  and of its own posy after). Drop three posies on her, one at a time, and
  she weaves them into a flower crown. Drop the geode on the newt and its tail cracks it
  open; bring the always-too-hot newt a giant bluebell from Bluebell and it
  cools off in the shade. Bring baby yeti back to mum for a cuddle (and
  the lava baby to its mum or dad); give
  baby a snowball and it plays catch (until it lands on its head); bring
  mum a fire flower from Ember to warm her paws. Give the gummy bear a
  lollipop for a big lick; bring Ginger a snowball from Frosty — she's
  never seen snow. Give Zig a stripe stone and it plays a tune on its own
  stripes; bring it something from another planet (a bluebell, fire flower,
  frost flower, snowball, lollipop or gumdrop) and it twirls round into
  that planet's colours, and stays that way. A stripe cactus drinks a juice
  from the ship's snack locker and bursts into flower for good.
- **Hats for friends**: drop any friend on the ship's wardrobe and the door
  swings open with a hats-only picker (the same hats she can wear, the
  flower crown too once she's woven one). Tap one
  and it pops onto the friend's head, sitting on that friend's own head
  (`src/ship/friendHats.js` says where, and how big, for each kind). The hat
  is kept on the friend's world entry (`hat`), so it stays on through drags,
  the bag, the chair, beds and reloads; old saves have bareheaded friends.
- **Star stickers**: a gentle "find them all". Stickers hide behind
  Bluebell's secrets (rock, bush, mole, a butterfly, the alien's thank-you)
  and Ember's (the vent's first big plume, the lava fish's big leap, a moth,
  inside the geode, the newt's thank-you for a bluebell) and Frosty's (the
  hare's big bound, a snowbird, baby's snowball, mum's cuddle, mum's
  thank-you for a fire flower) and Candy's (the sugar mouse's dash, a candy
  butterfly, the gummy bear's lick, the first cupcake from the oven,
  Ginger's first snow) and Stripey's (the worm's loop-the-loop, a stripy
  butterfly, Zig's tune, Zig's new stripes, the cactus's flower);
  each one found plays a fanfare and flies off with a "+1" banner. A board
  under the poster shows found stickers and outlines for the rest, with a
  count. Each planet lists its own in `src/ship/stickers.js`.

- **Chatting**, Monkey Island style: tap any friend and after its tap
  trick a little speech bubble pops over its head (fading if ignored). Tap
  the bubble and they chat: each line shows over the speaker's head in
  their own colour (tap to move on, with a chatter blip in their own
  voice), and her replies are big tappable lines along the bottom. "Bye!" is
  always one of them. While chatting the scene is modal and the friend
  stays put. Chats are plain data trees (`src/ship/talks/`, one per
  character, the lava family's together; walked by `src/ship/talk.js`)
  that branch on world facts (the stickers she's found and the scene's
  memories). Every friend has its own
  way of talking (the newt drawls, Zig goes "ZIG-ZIG!", the babies babble
  in tiny words), and each chat hints at that friend's drop-on reactions:
  the newt is sooo hot, Ginger wonders what snow is, Zig dreams of other
  planets' colours, the pink alien wants a crystal. Once a reaction has
  happened, the chat changes to talk about it.

- **The ship's other rooms**: an arrow by each side wall of the cockpit
  (labelled with where it goes) — tap it and she walks off through the
  wall into the next room; tap the arrow there to come back. Drop anything
  on an arrow and it's sent through on its own. The **store room** (left)
  has painted bays on the floor for keeping things in, and the **decor
  printer**: tap it and a picker slides up with every decor piece; pick one
  and the printer whirrs and pops it out (up to three of each). Every piece
  is there from the start: a rug, a lamp, a beanbag, a wall poster, a star
  rug, a rocket lamp, a big cushion, a fish tank, fairy lights and a planet
  mobile (`src/ship/decor.js`). Decor is carryable like
  everything else — arrange it anywhere in the ship (or take it to a
  planet in the bag) and it stays put across reloads. Rugs lie flat under
  everything; wall pieces snap up onto the wall. Tap a lamp to switch it
  on; tap the beanbag or the big cushion and she flops right in (or drop a
  friend on it and they do); tap the fish tank and the fish darts about. The
  store room also has the **crew pod**, in front of the cargo net: tap it and
  a creator slides up, Avatar World style, with rows of buttons for body
  colour, eyes, ears or antennae and a hat (the same hats as hers) and the
  crewmate itself beside them, changing as she taps. Tap DONE and the pod
  whirrs, hisses open and the new crewmate hops out (the X backs out).
  Crewmates are ordinary friends (`Crew` in `src/ship/entities/crew.js`, art
  in `src/ship/art/crew.js`, drawn in code from parts): they stroll, greet
  her, play, sit in chairs, ride in the bag, eat snacks, wear hats from the
  wardrobe and have a friendly chat. Their look is on their world entry
  (`crew`), so they survive reloads. There's room for six in all (bag
  included); at six the pod just hums. The
  **playroom** (right) has a ball pit (she hops in, dives right under and
  pops up in a splash of balls), a swing (higher and higher) and a
  trampoline (each bounce higher than the last). Drop a friend on any of
  them and they have a go. The store room's **lift** (a door in its back
  wall) goes up to the ship's other decks: tap it and she presses the call
  button — ding, the doors slide open; tap again and in she steps, the doors
  shut and a panel of floors slides up (every stop it makes, marking where
  she is). Pick one and up (or down) she goes; there's a lift in every room
  it stops at to come back. The stops are a list in `src/ship/shipRooms.js`
  (`LIFT_STOPS`): a new deck is a new stop, its name and scene there, and a
  lift in it. The **bunk room**
  (up the lift) has her own bed and a bunk bed for friends. Tap her bed and
  she climbs in, yawns and snoozes (zzz) until woken by a tap; drop a friend
  on a bunk and they're tucked in and fall asleep (pick them up to wake
  them). The light switch turns the room to night — it goes dark, stars come
  out in the porthole, the night light glows and the sleepers snore softly
  (she can be tucked up in bed first: then the switch just flicks). Flick it
  back for morning, and everyone in bed sits up for a stretch and a yawn and
  hops out. The **galley** (a lift stop between the store room and the bunk
  room) has a big bubbling mixing pot: drop two things in and it bubbles and
  burps, and out pops something new to eat (snowball + fire flower = hot
  cocoa, lollipop + frost flower = ice lolly, cupcake + crystal = sparkle
  cake, bluebell + juice = bluebell tea, snowball + gumdrop = snow cone,
  starfruit + stripe stone = stripy smoothie). A mix that isn't a recipe
  fizzles and both things pop back out; friends can't go in the pot. The new
  foods are snacks, so every friend gobbles them up. A recipe card on the
  wall shows the recipes she's found and outlines for the rest; the recipes
  are a list in `src/ship/recipes.js`. Things from the planets used up in
  the pot turn up again back where they came from (any default-world thing
  missing from a save is put back). A reload puts her back in whichever room she was in.

## Explicitly deferred
- Packaging as an installable native app (via Capacitor or similar)
- Cloud save / accounts
- Any real quest/progression system beyond light optional goals
