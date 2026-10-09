// Where everything sits in the 256x160 ship interior. Art and gameplay both
// read from here so the painted room and the hitboxes can't drift apart.
export const W = 256;
export const H = 160;
export const FLOOR_TOP = 112;

// The band of floor her feet can stand on (gives a little depth), in a
// one-screen place; a wider place's floor reaches on further right (see
// clampToFloor).
export const WALK = { minX: 12, maxX: 244, minY: 122, maxY: 154 };

// The far right of the floor in a place `width` wide.
export function floorMaxX(width = W) {
  return WALK.maxX + width - W;
}

export const PORTHOLE = { x: 34, y: 50, r: 13, spot: { x: 46, y: 126 } };
export const POSTER = { x: 64, y: 26, w: 24, h: 32, spot: { x: 76, y: 124 } };
// The star-sticker board, on the wall under the poster.
// No fixed height: it grows a row at a time as planets add stickers.
export const STICKER_BOARD = { x: 54, y: 66, w: 40, spot: { x: 74, y: 124 } };
export const LOCKERS = { x: 100, y: 26, w: 38, h: 68 };
// The left-hand locker (with her name tag) is her wardrobe; its door is
// hinged on its left edge.
export const WARDROBE = {
  x: LOCKERS.x,
  y: LOCKERS.y,
  w: LOCKERS.w / 2 - 1,
  h: LOCKERS.h,
  spot: { x: 109, y: 124 },
};
// The right-hand locker is the snack cupboard: its door (hinged on its right
// edge) and the bottom-centre of each of its three shelves.
export const SNACK_LOCKER = {
  x: LOCKERS.x + LOCKERS.w / 2,
  y: LOCKERS.y,
  w: LOCKERS.w / 2 - 1,
  h: LOCKERS.h,
  spot: { x: 128, y: 124 },
  shelves: [21, 43, 65].map((dy) => ({ x: LOCKERS.x + LOCKERS.w * 0.75 - 0.5, y: LOCKERS.y + dy })),
};
export const WINDSHIELD = { top: 16, bottom: 70, leftTop: 176, leftBottom: 166, right: 250, strut: 213 };
export const CONSOLE = { x: 180, y: 74, w: 74, h: 38 };
export const SCREEN = { x: 199, y: 82, w: 36, h: 17, spot: { x: 226, y: 124 } };
// `cushion`: how far above the floor a friend sitting in it is.
// `hopOut`: the floor beside it, where whoever leaves the seat ends up.
export const CHAIR = { x: 186, y: 140, spot: { x: 186, y: 141 }, cushion: 13, hopOut: { x: 202, y: 140 } };
export const PLANET_SPOT = { x: 226, y: 44 };
// The airlock door on the left wall. It only opens once the ship has landed.
export const DOOR = { x: 3, y: 66, w: 20, h: 46, spot: { x: 14, y: 124 } };

// Out on a planet (same 256x160 screen and walkable band as the ship): where
// the land meets the sky, and where our ship parks, on every planet.
export const HORIZON = 100;
export const PARKED_SHIP = { x: 58, y: 120, spot: { x: 57, y: 123 } };
// Bluebell's landing site is two screens wide: the view pans to follow her
// (see camera.js), with more meadow off to the right of the usual screen.
export const MEADOW_W = W * 2;
// Bluebell's secrets (bottom-centres), placed in the gaps between the giant bluebells.
export const MEADOW_SECRETS = { rock: { x: 112, y: 152 }, bush: { x: 150, y: 119 }, hole: { x: 192, y: 151 } };
// Ember's secrets: a steam vent at the back and a lava pool at the front.
export const EMBER_SECRETS = { vent: { x: 124, y: 124 }, pool: { x: 182, y: 151 } };
// Frosty's secret: a snow drift at the back, a snow hare hiding behind it.
export const FROSTY_SECRETS = { drift: { x: 150, y: 121 } };

// A house far off at the back of a planet, and the winding path up to its
// door. The path runs from the near end (on the walkable band) to the
// doorstep; she shrinks as she walks it, to `far` scale at the doorstep.
// Candy's gingerbread house:
export const GINGERBREAD_HOUSE = {
  x: 196,
  y: 99,
  path: [{ x: 154, y: 128 }, { x: 176, y: 119 }, { x: 162, y: 111 }, { x: 182, y: 104 }, { x: 196, y: 99 }],
  far: 0.34,
};
// ...and the lava family's house, dug into the foot of Ember's volcano.
export const LAVA_HOUSE = {
  x: 168,
  y: 99,
  path: [{ x: 150, y: 129 }, { x: 170, y: 120 }, { x: 156, y: 112 }, { x: 170, y: 105 }, { x: 168, y: 99 }],
  far: 0.34,
};

// ...and Zig's stripy dome hut, out among the mesas on Stripey.
export const ZIG_HUT = {
  x: 202,
  y: 99,
  path: [{ x: 178, y: 129 }, { x: 198, y: 120 }, { x: 186, y: 112 }, { x: 200, y: 105 }, { x: 202, y: 99 }],
  far: 0.34,
};

// ...and the yetis' ice cave, in the mountainside at the back of Frosty.
export const ICE_CAVE = {
  x: 190,
  y: 99,
  path: [{ x: 200, y: 129 }, { x: 182, y: 120 }, { x: 198, y: 112 }, { x: 184, y: 105 }, { x: 190, y: 99 }],
  far: 0.34,
};

// ...and the pink alien's round pod, far off in Bluebell's meadow.
export const POD = {
  x: 214,
  y: 99,
  path: [{ x: 210, y: 129 }, { x: 226, y: 120 }, { x: 206, y: 112 }, { x: 220, y: 105 }, { x: 214, y: 99 }],
  far: 0.34,
};

// How big things look at height y on a house's path: full size at its near
// end, shrinking steadily to `far` at the house's doorstep.
export function distanceScale(y, house = GINGERBREAD_HOUSE) {
  const { path, far } = house;
  const near = path[0].y;
  const door = path[path.length - 1].y;
  const k = (y - door) / (near - door);
  return Math.max(far, Math.min(1, far + (1 - far) * k));
}
// Candy's secret: a candy-floss bush at the back, a sugar mouse living in it.
export const CANDY_SECRETS = { bush: { x: 112, y: 121 } };

// Where the hoverbike parks (bottom-centre) at each place out of doors that
// has one: beside the ship at a landing site, and on the left at a site.
export const HOVERBIKE = {
  candy: { x: 106, y: 142 },
  milkshake: { x: 40, y: 140 },
  ember: { x: 98, y: 146 }, // clear of the steam vent
  lavafalls: { x: 40, y: 140 },
  stripey: { x: 100, y: 148 }, // below the sand mound
  oasis: { x: 34, y: 142 },
  frosty: { x: 96, y: 152 }, // below the frost flower, clear of the snowball
  frozenlake: { x: 34, y: 142 },
  bluebell: { x: 92, y: 150 }, // between the ship and the rock
  mushroomgrove: { x: 34, y: 142 },
};

// The mushroom grove on Bluebell: two giant mushrooms to bounce on (bottom-
// centre x, y; `top` how high above its foot the middle of its cap is, `rx`
// how wide the cap is), and the shy mushroom creature standing among them,
// which hides under its cap when she's within `shy` pixels.
export const MUSHROOM_GROVE = {
  shrooms: [
    { x: 118, y: 138, top: 27, rx: 17 },
    { x: 196, y: 146, top: 31, rx: 19 },
  ],
  creature: { x: 156, y: 128 },
  shy: 40,
};

// Whether she's close enough to (x, y) that the shy creature there hides.
export function spooks(girl, { x, y }, shy = MUSHROOM_GROVE.shy) {
  return Math.hypot(girl.x - x, (girl.y - y) * 1.6) < shy;
}

// The frozen lake on Frosty: a sheet of ice (an ellipse round x, y) from the
// back right up to the floor she walks on, to slide across from one of its
// `ends` to the other (tap the far part of it, off the floor); a fishing
// hole cut in it at the back, with a curious fish living under it.
export const FROZEN_LAKE = {
  x: 158, y: 120, rx: 86, ry: 16,
  ends: [{ x: 100, y: 128 }, { x: 216, y: 128 }],
};
export const FISHING_HOLE = { x: 124, y: 112, rx: 9, ry: 3, spot: { x: 124, y: 124 } };

// Whether (x, y) is out on the frozen lake's ice.
export function onIce(x, y) {
  const { x: cx, y: cy, rx, ry } = FROZEN_LAKE;
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
}

// The oasis on Stripey: a stripy pool (an ellipse round x, y) with lily pads
// for the frog to sit on, a palm on the left whose crown hangs coconuts out
// over the shore, and a big sand dune at the back on the right, its top
// edge running down from `peak` to its `foot` (see duneTop), to climb (up
// its front from `spot`, by way of `climb`) and slide down.
export const OASIS_POOL = { x: 128, y: 112, rx: 62, ry: 9 };
export const LILY_PADS = [{ x: 96, y: 110 }, { x: 132, y: 116 }, { x: 166, y: 108 }];
export const PALM = { x: 58, y: 124 };
export const DUNE = {
  peak: { x: 232, y: 78 },
  foot: { x: 194, y: 124 },
  spot: { x: 236, y: 130 },
  climb: [{ x: 240, y: 106 }, { x: 236, y: 90 }, { x: 232, y: 79 }],
};

// The height of the dune's top edge at column x (past the peak it falls
// away more gently, off the side of the screen).
export function duneTop(x) {
  const { peak, foot } = DUNE;
  const k = (x - peak.x) / (x < peak.x ? peak.x - foot.x : 48);
  return peak.y + (foot.y - peak.y) * k * k;
}

// The lava falls on Ember: a cliff across the back with a glowing cascade
// pouring down it into a lava pool (an ellipse round x, y), and the floor
// she walks on in front. Stepping stones along the near shore to hop across,
// lava bubbles rising out of the pool to pop, and a geyser on the right with
// a pumice rock sat on it for the plume to lift.
export const LAVA_FALLS = { x: 170, top: 30, w: 26 };
export const FALLS_POOL = { x: 156, y: 113, rx: 98, ry: 9 };
export const FALLS_STONES = [{ x: 92, y: 132 }, { x: 116, y: 137 }, { x: 140, y: 132 }, { x: 164, y: 137 }, { x: 188, y: 132 }];
export const FALLS_GEYSER = { x: 222, y: 146 };

// The milkshake lake on Candy fills the back of the scene (an ellipse round
// x, y), with the shore she walks along in front. In it: a giant straw to
// slurp from, cherries bobbing about, and a wafer boat sailing up and down.
export const MILKSHAKE_LAKE = { x: 150, y: 111, rx: 100, ry: 11 };
export const STRAW = { x: 92, y: 116, spot: { x: 98, y: 126 } };
export const CHERRIES = [{ x: 140, y: 106 }, { x: 178, y: 113 }, { x: 214, y: 105 }];
export const WAFER_BOAT = { y: 119, minX: 116, maxX: 232 };

// Stripey's secret: a sand mound in the middle, a stripy worm living in it.
export const STRIPEY_SECRETS = { mound: { x: 132, y: 124 } };

// Inside the gingerbread house (same screen and walkable band as the ship):
// the front door on the left wall, the oven on the right, a jar of jellybeans
// on the shelf and a window at the back.
export const HOUSE_DOOR = { x: 6, y: 64, w: 22, h: 48, spot: { x: 18, y: 124 } };
export const OVEN = { x: 192, y: 56, w: 50, h: 56, spot: { x: 204, y: 124 } };
export const JAR = { x: 70, y: 56, spot: { x: 70, y: 124 } };
export const HOUSE_WINDOW = { x: 106, y: 24, w: 48, h: 40 };

// Inside the lava family's house: the same front door, a lava lamp on a
// little table, an arched window onto the volcano, the baby's cradle under
// the family picture, and the hearth with its bubbling pot on the right.
export const LAVA_LAMP = { x: 56, y: 94, spot: { x: 56, y: 124 } };
export const LAVA_WINDOW = { x: 80, y: 20, w: 40, h: 40 };
export const CRADLE = { x: 150, y: 117, w: 32, spot: { x: 150, y: 128 } };
export const HEARTH = { x: 186, y: 40, w: 58, h: 72, spot: { x: 204, y: 124 } };

// Inside Zig's hut: the same front door, a stripe-painting easel on the
// floor, a round window onto the canyon, a sand timer on a little table, a
// shelf of goggles to try on, and a hammock slung between two hooks on the
// right (its ends at x1 and x2 on `top`, sagging down to `sag`).
export const EASEL = { x: 58, y: 118, spot: { x: 74, y: 126 } };
export const HUT_WINDOW = { x: 102, y: 42, r: 15 };
export const SAND_TIMER = { x: 138, y: 92, spot: { x: 138, y: 124 } };
export const GOGGLE_SHELF = { x: 152, y: 52, w: 42, spot: { x: 172, y: 124 } };
export const HAMMOCK = { x1: 202, x2: 246, top: 66, sag: 98, spot: { x: 222, y: 126 } };

// Inside the yetis' ice cave: the same front door, a row of icicles hanging
// from a ledge of rock (each `gap` apart from x, from y down `lengths`), a
// round window of clear ice onto the frozen pond (a fish under the ice), a
// fur-rug nest on the floor, and a campfire on the right with spots round
// it for friends to huddle at (`seats`).
export const ICICLES = { x: 46, y: 26, gap: 8, lengths: [12, 19, 25, 16, 22, 14, 10], spot: { x: 70, y: 124 } };
export const POND_WINDOW = { x: 134, y: 54, r: 20, spot: { x: 134, y: 124 } };
export const FUR_NEST = { x: 82, y: 136, spot: { x: 108, y: 138 } };
export const CAMPFIRE = {
  x: 208,
  y: 134,
  spot: { x: 182, y: 134 },
  seats: [{ x: 234, y: 134 }, { x: 222, y: 150 }, { x: 196, y: 150 }],
};

// Inside the pink alien's pod: the same front door, a telescope on the
// floor pointing up at a round window onto the sky (stars come out in it),
// a seed tray on a little table, and a bubble bath on the right.
export const STAR_WINDOW = { x: 112, y: 44, r: 20 };
export const TELESCOPE = { x: 76, y: 120, spot: { x: 58, y: 126 } };
export const SEED_TRAY = { x: 168, y: 98, spot: { x: 168, y: 124 } };
export const BUBBLE_BATH = { x: 216, y: 144, spot: { x: 184, y: 140 } };

// The ship's other rooms sit either side of the cockpit (same screen and
// walkable band): an arrow by each side wall goes through to the next room.
export const ROOM_ARROW = { y: 124, left: 8, right: 248 };

// The playroom. The ball pit is a padded box on the floor: its back wall
// from `back` down to `rim`, balls from there to `top`, where the front wall
// starts, down to `bottom` on the floor. Whoever's in it stands at `inY`.
export const BALL_PIT = { x: 26, w: 76, back: 112, rim: 121, top: 133, bottom: 144, inY: 139, spot: { x: 64, y: 150 } };
// A swing hanging from a frame at the back: its rope hangs from (x, top),
// `rope` long; whoever's on it is `y` deep.
export const SWING = { x: 142, top: 30, rope: 86, y: 127, spot: { x: 142, y: 136 } };
// A round trampoline; its mat is `mat` above the floor at y.
export const TRAMPOLINE = { x: 206, y: 134, rx: 22, mat: 8, spot: { x: 206, y: 147 } };

// Where wall decor (a poster, say) can hang in the ship's rooms: the band its
// bottom-centre stays inside. Dropped lower, it snaps up to the bottom of it.
export const WALL_HANG = { minX: 14, maxX: 242, minY: 40, maxY: 96 };

// The store room's decor printer, standing against the back wall
// (bottom-centre), and the floor in front where what it prints lands.
// The crew pod beside it, in front of the cargo net: where it stands
// (bottom-centre), where she stands to use it and where a new crewmate hops out to.
export const CREW_POD = { x: 214, y: 118, w: 30, h: 46, spot: { x: 190, y: 126 }, out: { x: 206, y: 138 } };
export const PRINTER = { x: 128, y: 118, w: 36, h: 42, spot: { x: 102, y: 124 }, out: { x: 132, y: 134 } };

// The lift, a door in the back wall of the store room, the galley and the
// bunk room (the same spot in each): its doorway's bottom-centre on the
// floor line, `w` wide and `h` high; the call button beside it; where she
// stands to use it.
export const LIFT = { x: 40, y: FLOOR_TOP, w: 26, h: 44, button: { x: 62, y: 84 }, spot: { x: 42, y: 124 } };

// The bunk room, up the lift. Her bed by the back wall, and a bunk bed for
// friends (a lower and an upper bunk). Each bunk: bottom-centre on the floor
// at (x, y), `w` wide, its mattress `deck` above the floor; `spot`, where she
// stands by it (and where a friend in it is remembered as being).
export const HER_BUNK = { x: 118, y: 128, w: 54, deck: 12, spot: { x: 118, y: 138 } };
export const FRIEND_BUNKS = [
  { x: 202, y: 128, w: 52, deck: 10, spot: { x: 194, y: 140 } },
  { x: 202, y: 128, w: 52, deck: 42, spot: { x: 210, y: 140 } },
];
// The bunk bed's ladder, up its right-hand end.
export const BUNK_LADDER = { x: 233, top: 70 };
// The light switch on the wall, the night light plugged in low down, and the
// porthole the stars come out in.
export const LIGHT_SWITCH = { x: 78, y: 78, spot: { x: 78, y: 124 } };
export const NIGHT_LIGHT = { x: 160, y: 101 };
export const BUNK_PORTHOLE = { x: 118, y: 46, r: 12 };

// The galley, down the lift. The big mixing pot on the floor, bottom-centre
// at (x, y), `w` wide and `h` high: things dropped in land at `mouth`, and
// what comes out is put down at `out`; `spot`, where she stands to stir it.
// The recipe card on the wall: its top-left, how wide it is, and where she
// stands to look at it.
export const MIXING_POT = { x: 170, y: 132, w: 44, h: 32, mouth: { x: 170, y: 106 }, spot: { x: 136, y: 140 }, out: { x: 170, y: 148 } };
export const RECIPE_CARD = { x: 82, y: 24, w: 128, spot: { x: 146, y: 124 } };
