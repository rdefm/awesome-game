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

// Candy: the gingerbread house far off at the back, and the winding path up
// to its door. The path runs from the near end (on the walkable band) to the
// doorstep; she shrinks as she walks it, to `far` scale at the doorstep.
export const GINGERBREAD_HOUSE = {
  x: 196,
  y: 99,
  path: [{ x: 154, y: 128 }, { x: 176, y: 119 }, { x: 162, y: 111 }, { x: 182, y: 104 }, { x: 196, y: 99 }],
  far: 0.34,
};

// How big things look at height y on Candy's path: full size at its near end,
// shrinking steadily to `far` at the house's doorstep.
export function distanceScale(y) {
  const { path, far } = GINGERBREAD_HOUSE;
  const near = path[0].y;
  const door = path[path.length - 1].y;
  const k = (y - door) / (near - door);
  return Math.max(far, Math.min(1, far + (1 - far) * k));
}
// Candy's secret: a candy-floss bush at the back, a sugar mouse living in it.
export const CANDY_SECRETS = { bush: { x: 112, y: 121 } };

// Inside the gingerbread house (same screen and walkable band as the ship):
// the front door on the left wall, the oven on the right, a jar of jellybeans
// on the shelf and a window at the back.
export const HOUSE_DOOR = { x: 6, y: 64, w: 22, h: 48, spot: { x: 18, y: 124 } };
export const OVEN = { x: 192, y: 56, w: 50, h: 56, spot: { x: 204, y: 124 } };
export const JAR = { x: 70, y: 56, spot: { x: 70, y: 124 } };
export const HOUSE_WINDOW = { x: 106, y: 24, w: 48, h: 40 };
