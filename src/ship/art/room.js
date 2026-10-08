import { Pixmap, fractalNoise, seededRandom, bayer } from '../../engine/pixmap.js';
import { drawText } from '../../engine/font.js';
import { C } from './palette.js';
import { W, H, FLOOR_TOP, PORTHOLE, SNACK_LOCKER, WARDROBE, WINDSHIELD, CONSOLE, SCREEN, DOOR } from '../layout.js';

function rivet(pm, x, y) {
  pm.set(x, y, C.wallHi);
  pm.set(x + 1, y + 1, C.wallDark);
}

function drawCeiling(pm) {
  pm.rect(0, 0, W, 12, C.ceiling);
  // A chunky coolant pipe running the length of the ship.
  pm.rect(0, 3, W, 4, C.metalDark);
  pm.hline(0, W - 1, 3, C.metal);
  pm.hline(0, W - 1, 6, C.wallDark);
  for (let x = 14; x < W; x += 44) {
    pm.rect(x, 2, 3, 6, C.metal);
    pm.vline(x + 2, 2, 7, C.metalDark);
  }
  pm.hline(0, W - 1, 11, C.wallDark);
  // Warm light strips with a soft dithered glow spilling down the wall.
  for (const x of [20, 112, 150]) {
    pm.rect(x, 9, 18, 2, C.yellow);
    pm.hline(x + 1, x + 16, 9, C.white);
    for (let i = 0; i < 10; i++) {
      pm.dither(x - 6 + i, 12 + i, 30 - i * 2, 1, C.wallLight, 0.5 - i * 0.05);
    }
  }
}

// `railTo`: where the chair rail stops (short of the cockpit's windshield).
function drawWall(pm, railTo = 175) {
  pm.rect(0, 12, W, FLOOR_TOP - 12, C.wall);
  // Darker toward the ceiling.
  for (let y = 12; y < 26; y++) {
    pm.dither(0, y, W, 1, C.wallDark, 0.6 - (y - 12) * 0.045);
  }
  for (const x of [52, 96, 160]) {
    pm.vline(x, 12, 93, C.wallDark);
    pm.vline(x + 1, 12, 93, C.wallLight);
  }
  pm.hline(0, railTo, 62, C.wallDark);
  pm.hline(0, railTo, 63, C.wallLight);
  for (const x of [4, 47, 56, 91, 100, 155, 164]) {
    rivet(pm, x, 16);
    rivet(pm, x, 58);
    rivet(pm, x, 67);
    rivet(pm, x, 89);
  }
  // Wainscot band with a teal trim and a hazard stripe at floor level.
  pm.rect(0, 94, W, 18, C.wallDark);
  pm.hline(0, W - 1, 94, C.wallLight);
  pm.hline(0, W - 1, 97, C.tealDark);
  pm.hline(0, W - 1, 98, C.teal);
  for (let x = 0; x < W; x++) {
    for (let y = 106; y < 111; y++) {
      pm.set(x, y, (x + y) % 8 < 4 ? C.yellow : C.outline);
    }
  }
  pm.hline(0, W - 1, 105, C.outline);
  pm.hline(0, W - 1, 111, C.outline);
  // Vents in the wainscot.
  for (const x of [8, 60, 140]) {
    pm.rect(x, 100, 18, 4, C.outline);
    for (let i = 0; i < 18; i += 3) {
      pm.vline(x + i + 1, 100, 103, C.metalDark);
    }
  }
}

function drawFloor(pm) {
  pm.rect(0, FLOOR_TOP, W, H - FLOOR_TOP, C.floor);
  for (let y = FLOOR_TOP; y < FLOOR_TOP + 8; y++) {
    pm.dither(0, y, W, 1, C.floorLight, 0.6 - (y - FLOOR_TOP) * 0.07);
  }
  for (let y = H - 14; y < H; y++) {
    pm.dither(0, y, W, 1, C.floorDark, (y - (H - 14)) * 0.05);
  }
  // Floor plates: horizontal seams bunch up toward the back wall (fake perspective),
  // vertical seams fan out from a vanishing point.
  for (const y of [117, 124, 134, 148]) {
    pm.hline(0, W - 1, y, C.floorDark);
    pm.hline(0, W - 1, y + 1, C.floorLight);
  }
  for (let xt = -64; xt <= W + 64; xt += 36) {
    pm.line(xt, FLOOR_TOP, 128 + (xt - 128) * 1.8, H - 1, C.floorDark);
  }
  pm.hline(0, W - 1, FLOOR_TOP, C.metalDark);
}

function drawPorthole(pm) {
  const { x, y, r } = PORTHOLE;
  pm.circle(x + 1, y + 2, r + 5, C.wallDark); // drop shadow
  pm.ring(x, y, r + 5, r, C.metalDark);
  pm.ring(x, y, r + 4, r + 1, C.metal);
  pm.ring(x, y, r + 3, r + 2, C.metalLight);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2 + Math.PI / 8;
    pm.set(Math.round(x + Math.cos(ang) * (r + 3)), Math.round(y + Math.sin(ang) * (r + 3)), C.metalDark);
  }
  // Cut the glass out so the starfield behind shows through.
  for (let yy = y - r; yy <= y + r; yy++) {
    for (let xx = x - r; xx <= x + r; xx++) {
      if (Math.hypot(xx - x, yy - y) <= r + 0.5) {
        pm.clear(xx, yy);
      }
    }
  }
}

function windshieldLeft(y) {
  const { top, bottom, leftTop, leftBottom } = WINDSHIELD;
  return Math.round(leftTop + ((leftBottom - leftTop) * (y - top)) / (bottom - top));
}

function drawWindshield(pm) {
  const { top, bottom, right, strut } = WINDSHIELD;
  // Thick frame.
  for (let y = top - 4; y <= bottom + 4; y++) {
    const l = windshieldLeft(Math.max(top, Math.min(bottom, y))) - 4;
    pm.hline(l, Math.min(W - 1, right + 4), y, C.metalDark);
  }
  for (let y = top - 3; y <= bottom + 3; y++) {
    const l = windshieldLeft(Math.max(top, Math.min(bottom, y))) - 3;
    pm.hline(l, Math.min(W - 1, right + 3), y, C.metal);
  }
  pm.hline(windshieldLeft(top) - 3, W - 1, top - 3, C.metalLight);
  for (let y = top; y <= bottom; y++) {
    for (let x = windshieldLeft(y); x <= right; x++) {
      pm.clear(x, y);
    }
  }
  // Centre strut.
  pm.rect(strut - 1, top, 3, bottom - top + 1, C.metal);
  pm.vline(strut - 1, top, bottom, C.metalLight);
  pm.vline(strut + 1, top, bottom, C.metalDark);
  for (const yy of [top + 4, bottom - 4]) {
    pm.set(strut, yy, C.metalDark);
  }
}

// A locker door at (lx, y), its handle `handleX` in from its left edge.
function lockerDoor(pm, lx, y, w, h, handleX) {
  pm.rect(lx, y, w, h, C.metalDark);
  pm.rect(lx + 1, y + 1, w - 2, h - 2, C.metal);
  pm.vline(lx + 1, y + 1, y + h - 2, C.metalLight);
  for (let v = 0; v < 4; v++) {
    pm.hline(lx + 5, lx + w - 6, y + 6 + v * 2, C.metalDark);
  }
  pm.rect(lx + handleX, y + 30, 2, 8, C.outline);
  pm.set(lx + handleX, y + 30, C.metalHi);
}

// A locker's dark inside, ready for its door to swing open over it.
function lockerInside(pm, { x, y, w, h }) {
  pm.rect(x, y, w, h, C.metalDark);
  pm.rect(x + 1, y + 1, w - 2, h - 2, C.ceiling);
  pm.dither(x + 1, y + 1, w - 2, 4, C.outline, 0.5);
}

// A little flight suit on a hanger, hanging from the rail at (cx, y).
function hangingSuit(pm, cx, y, color, dark) {
  pm.set(cx, y + 1, C.metalLight);
  pm.hline(cx - 3, cx + 3, y + 2, C.metalLight);
  pm.rect(cx - 3, y + 3, 7, 9, color);
  pm.vline(cx + 3, y + 3, y + 11, dark);
  pm.rect(cx - 2, y + 12, 2, 6, dark);
  pm.rect(cx + 1, y + 12, 2, 6, dark);
  pm.hline(cx - 3, cx + 3, y + 7, C.belt);
}

// Both lockers' insides: the left one is her wardrobe (a rail of spare
// suits and some boots), the right one the snack cupboard (three shelves).
// Their doors swing open live (see drawWardrobeDoor and drawLockerDoor).
function drawLockers(pm) {
  const wardrobe = WARDROBE;
  lockerInside(pm, wardrobe);
  pm.hline(wardrobe.x + 1, wardrobe.x + wardrobe.w - 2, wardrobe.y + 7, C.metalLight);
  hangingSuit(pm, wardrobe.x + 6, wardrobe.y + 6, C.pink, C.redDark);
  hangingSuit(pm, wardrobe.x + 12, wardrobe.y + 6, C.suit, C.suitDark);
  for (const bx of [wardrobe.x + 3, wardrobe.x + 10]) {
    pm.rect(bx, wardrobe.y + wardrobe.h - 5, 5, 3, C.boot);
    pm.hline(bx, bx + 4, wardrobe.y + wardrobe.h - 3, C.bootDark);
  }

  const snack = SNACK_LOCKER;
  lockerInside(pm, snack);
  for (const shelf of snack.shelves) {
    pm.hline(snack.x + 1, snack.x + snack.w - 2, shelf.y, C.metalLight);
    pm.hline(snack.x + 1, snack.x + snack.w - 2, shelf.y + 1, C.metalDark);
  }
}

// The snack locker's door, hinged on its right edge. `back` is its inside
// face, seen once it has swung past wide open.
export function drawLockerDoor(back = false) {
  const { w, h } = SNACK_LOCKER;
  const pm = new Pixmap(w, h);
  if (back) {
    pm.rect(0, 0, w, h, C.metalDark);
    pm.rect(1, 1, w - 2, h - 2, C.wallLight);
    pm.vline(w - 2, 1, h - 2, C.metal);
    return pm;
  }
  lockerDoor(pm, 0, 0, w, h, 3);
  // A kid's star sticker.
  pm.set(8, 48, C.yellow);
  pm.hline(7, 9, 49, C.yellow);
  pm.set(8, 50, C.yellow);
  pm.set(7, 51, C.yellow);
  pm.set(9, 51, C.yellow);
  return pm;
}

// Her wardrobe's door, with her name tag, hinged on its left edge. `back` is
// its inside face (with a little mirror), seen once it has swung past wide
// open; its hinge side is on the right.
export function drawWardrobeDoor(back = false) {
  const { w, h } = WARDROBE;
  const pm = new Pixmap(w, h);
  if (back) {
    pm.rect(0, 0, w, h, C.metalDark);
    pm.rect(1, 1, w - 2, h - 2, C.wallLight);
    pm.vline(1, 1, h - 2, C.metal);
    pm.rect(4, 14, w - 8, 18, C.metalDark);
    pm.rect(5, 15, w - 10, 16, C.tealDeep);
    pm.line(6, 22, 10, 18, C.teal);
    pm.line(7, 27, 12, 22, C.teal);
    return pm;
  }
  lockerDoor(pm, 0, 0, w, h, w - 4);
  pm.rect(4, 50, 12, 7, C.white);
  drawText(pm, 'ME', 6, 51, C.redDark);
  return pm;
}

function drawConsole(pm) {
  const { x, y, w, h } = CONSOLE;
  // Sloped top surface.
  for (let i = 0; i < 6; i++) {
    pm.hline(x + 6 - i, x + w - 1, y + i, i < 2 ? C.metalLight : C.metal);
  }
  pm.rect(x, y + 6, w, h - 6, C.metalDark);
  pm.hline(x, x + w - 1, y + 6, C.metal);
  pm.rect(x, y + h - 3, w, 3, C.wallDark);
  // Screen bezel; the screen itself is drawn live.
  pm.rect(SCREEN.x - 2, SCREEN.y - 2, SCREEN.w + 4, SCREEN.h + 4, C.outline);
  pm.rect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, C.screen);
  // Knobs and a throttle lever.
  for (const kx of [186, 191]) {
    pm.circle(kx, 88, 2, C.outline);
    pm.circle(kx, 88, 1, C.metalLight);
  }
  pm.rect(243, 84, 4, 12, C.outline);
  pm.rect(244, 80, 2, 10, C.metalLight);
  pm.rect(243, 78, 4, 3, C.red);
}

// The airlock frame. The doorway itself is cut out: the sliding panels (and
// whatever is outside) are drawn live behind the room.
function drawDoor(pm) {
  const { x, y, w, h } = DOOR;
  pm.rect(x - 3, y - 4, w + 6, h + 4, C.metalDark);
  pm.rect(x - 2, y - 3, w + 4, h + 3, C.metal);
  pm.hline(x - 2, x + w + 1, y - 3, C.metalLight);
  pm.vline(x - 2, y - 3, y + h - 1, C.metalLight);
  // Hazard stripes on the lintel.
  for (let xx = x; xx < x + w; xx++) {
    for (let yy = y - 2; yy < y; yy++) {
      pm.set(xx, yy, (xx + yy) % 6 < 3 ? C.yellow : C.outline);
    }
  }
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      pm.clear(xx, yy);
    }
  }
}

function drawShadows(pm) {
  // Contact shadow under the console so it sits on the floor.
  pm.dither(CONSOLE.x - 2, FLOOR_TOP, CONSOLE.w + 2, 3, C.floorDark, 0.7);
}

// Bare walls, ceiling and floor, for the ship's other rooms to fit out.
export function drawShell() {
  const pm = new Pixmap(W, H);
  drawWall(pm, W - 1);
  drawCeiling(pm);
  drawFloor(pm);
  return pm;
}

export function drawRoom() {
  const pm = new Pixmap(W, H);
  drawWall(pm);
  drawCeiling(pm);
  drawFloor(pm);
  drawPorthole(pm);
  drawDoor(pm);
  drawLockers(pm);
  drawWindshield(pm);
  drawConsole(pm);
  drawShadows(pm);
  return pm;
}

// Deep space behind the windows: base colour, a dithered nebula and faint fixed
// stars. Moving stars are drawn live on top of this.
export function drawSpace() {
  const pm = new Pixmap(W, H);
  const rand = seededRandom(7);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = fractalNoise(x / 40, y / 30, 3, 4);
      let color = C.space;
      if (n > 0.62 - bayer(x, y) * 0.08) {
        color = C.nebula2;
      } else if (n > 0.52 - bayer(x, y) * 0.1) {
        color = C.nebula;
      } else if (n > 0.45 - bayer(x, y) * 0.1) {
        color = C.spaceMid;
      }
      pm.set(x, y, color);
    }
  }
  for (let i = 0; i < 90; i++) {
    pm.set(Math.floor(rand() * W), Math.floor(rand() * H), rand() < 0.5 ? '#4a4f80' : '#6e6fa6');
  }
  return pm;
}
