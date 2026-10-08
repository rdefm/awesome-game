// Where everything sits in the 256x160 ship interior. Art and gameplay both
// read from here so the painted room and the hitboxes can't drift apart.
export const W = 256;
export const H = 160;
export const FLOOR_TOP = 112;

// The band of floor her feet can stand on (gives a little depth).
export const WALK = { minX: 12, maxX: 244, minY: 122, maxY: 154 };

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
};

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
export const PRINTER = { x: 128, y: 118, w: 36, h: 42, spot: { x: 102, y: 124 }, out: { x: 132, y: 134 } };
