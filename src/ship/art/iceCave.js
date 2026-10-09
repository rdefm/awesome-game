import { Pixmap, bayer, fractalNoise, seededRandom } from '../../engine/pixmap.js';
import { C } from './palette.js';
import { FR } from './frosty.js';
import { FLOOR_TOP, HOUSE_DOOR, ICICLES, POND_WINDOW, W, H } from '../layout.js';

// Everything painted for the yetis' ice cave on Frosty: the cave mouth in
// the mountainside and the snowy path up to it; and inside: the glittering
// cave room, its fur-curtain door, the icicles, the fish under the frozen
// pond, the fur-rug nest and the campfire.

// The cave's rock, its ice, and the warm things inside.
export const IC = {
  rock: '#6f8fb0',
  rockDark: '#4a6688',
  rockDeep: '#34496a',
  wall: '#9fd0ee',
  wallLight: '#c8ecfc',
  wallDeep: '#6fa8d8',
  water: '#2f6a9a',
  waterDeep: '#1f4a78',
  fur: '#c89a6a',
  furDark: '#8a6040',
  furLight: '#ecc898',
  glow: '#ffd27a',
  flame: '#ff9d3c',
  flameLight: '#ffe066',
  flameDeep: '#e8502a',
  log: '#7a4a2a',
  stone: '#8a96a8',
  stoneDark: '#5a6478',
};

// ---------------------------------------------------------------- the house
// The cave as seen from far off, bottom-centre on its doorstep: a hump of
// blue rock jutting out of the mountainside under a thick cap of snow, its
// arched mouth fringed with icicles and hung with a fur curtain (or, `open`,
// the curtain drawn aside onto the firelight inside).
export function drawIceCave({ open = false } = {}) {
  const w = 56;
  const h = 42;
  const cx = 28;
  const pm = new Pixmap(w, h);
  // The rock, shaded on its right and round its foot.
  pm.ellipse(cx, h, 27, 34, IC.rock);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pm.isSet(x, y) && bayer(x, y) < (x > cx + 12 ? 0.5 : 0) + (y >= h - 5 ? 0.3 : 0) + (fractalNoise(x / 6, y / 6, 3, 2) > 0.6 ? 0.4 : 0)) {
        pm.set(x, y, IC.rockDark);
      }
    }
  }
  // A thick cap of snow on top, drooping down in lumps.
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (pm.isSet(x, y)) {
        const depth = 8 + Math.round(Math.sin(x * 0.7) * 2 + Math.sin(x * 0.29) * 2);
        for (let d = 0; d < depth && y + d < h; d++) {
          pm.set(x, y + d, d === depth - 1 ? FR.snowShade : FR.snow);
        }
        break;
      }
    }
  }
  // The arched mouth, with its icicle fringe.
  const top = h - 18;
  pm.circle(cx, top, 11, IC.rockDeep);
  pm.rect(cx - 11, top, 23, 18, IC.rockDeep);
  const inside = open ? IC.glow : IC.fur;
  pm.circle(cx, top, 9, inside);
  pm.rect(cx - 9, top, 19, 18, inside);
  if (open) {
    pm.dither(cx - 9, top - 9, 19, 27, IC.flame, 0.35);
    // The curtain, drawn aside to the left.
    pm.rect(cx - 9, top - 4, 4, 22, IC.furDark);
    pm.vline(cx - 7, top - 4, h - 1, IC.fur);
  } else {
    for (let x = cx - 9; x <= cx + 9; x++) {
      if ((x - cx) % 3 === 0) {
        pm.vline(x, top - 6, h - 1, IC.furDark);
      }
    }
    pm.dither(cx - 9, top - 9, 19, 27, IC.furLight, 0.12);
  }
  for (let i = -3; i <= 3; i++) {
    const x = cx + i * 3;
    const len = 2 + ((i + 3) % 3);
    pm.vline(x, top - 10 + Math.abs(i), top - 10 + Math.abs(i) + len, FR.iceLight);
  }
  // The doorstep: trodden snow.
  pm.rect(cx - 10, h - 2, 21, 2, FR.snowShade);
  return pm.outline(C.outline);
}

// The snowy path up to the cave, as a full-screen overlay for the ground: a
// trodden trail narrowing into the distance (`scaleAt(y)` gives how big
// things are at height y), with big yeti footprints up it.
export function drawIcePath(path, scaleAt) {
  const pm = new Pixmap(W, H);
  const prints = [];
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];
    const q = path[i + 1];
    const steps = Math.ceil(Math.hypot(q.x - p.x, q.y - p.y));
    for (let s = 0; s <= steps; s++) {
      const x = p.x + ((q.x - p.x) * s) / steps;
      const y = p.y + ((q.y - p.y) * s) / steps;
      const k = scaleAt(y);
      pm.ellipse(x, y, 9 * k, Math.max(1, 3 * k), FR.snowShade);
      if (s % 6 === 0) {
        prints.push([x, y, k]);
      }
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (pm.isSet(x, y) && bayer(x, y) < 0.25) {
        pm.set(x, y, FR.snow);
      }
    }
  }
  prints.forEach(([x, y, k], i) => {
    if (k > 0.5) {
      const px = Math.round(x + (i % 2 ? 1 : -1) * 3 * k);
      pm.hline(px, px + (k > 0.8 ? 2 : 1), Math.round(y), FR.snowDeep);
    }
  });
  return pm;
}

// ------------------------------------------------------------ inside house
// The room: walls of glittering blue ice in big crystal facets, under a
// rocky roof with a ledge for the icicles to hang from; the doorway in a
// rough rock arch on the left; the round window of clear ice onto the frozen
// pond (just the ice and water: the fish is drawn as it swims); and a floor
// of packed snow, with drifts banked up against the walls.
export function drawIceRoom() {
  const pm = new Pixmap(W, H);
  const rand = seededRandom(41);
  // Walls: icy facets, paler towards the floor.
  for (let y = 0; y < FLOOR_TOP; y++) {
    for (let x = 0; x < W; x++) {
      const n = fractalNoise(x / 22, y / 22, 7, 2);
      const facet = Math.floor(n * 5 + (y / FLOOR_TOP) * 2 + (bayer(x, y) - 0.5) * 0.4);
      pm.set(x, y, [IC.wallDeep, IC.wallDeep, IC.wall, IC.wall, IC.wallLight, IC.wallLight][Math.max(0, Math.min(5, facet))]);
    }
  }
  // ...with glints, and crystal streaks running down them.
  for (let i = 0; i < 18; i++) {
    const x = 34 + Math.floor(rand() * (W - 40));
    const y = 30 + Math.floor(rand() * 60);
    pm.line(x, y, x + 3, y + 8, '#ffffff');
  }
  for (let i = 0; i < 70; i++) {
    pm.set(Math.floor(rand() * W), 14 + Math.floor(rand() * (FLOOR_TOP - 14)), '#ffffff');
  }
  // The rocky roof, lumpy along its bottom edge.
  for (let x = 0; x < W; x++) {
    const bottom = Math.round(10 + fractalNoise(x / 14, 0, 9, 2) * 10);
    pm.vline(x, 0, bottom, IC.rockDark);
    pm.dither(x, 0, 1, bottom, IC.rockDeep, 0.4);
    pm.set(x, bottom, IC.rockDeep);
  }
  // The ledge the icicles hang from.
  const { x: ix, y: iy, gap, lengths } = ICICLES;
  const lw = gap * lengths.length + 8;
  pm.rect(ix - 8, iy - 8, lw, 8, IC.rock);
  pm.dither(ix - 8, iy - 4, lw, 4, IC.rockDark, 0.5);
  pm.hline(ix - 8, ix - 9 + lw, iy - 1, IC.rockDeep);
  pm.hline(ix - 8, ix - 9 + lw, iy - 8, FR.snow);
  // The window onto the frozen pond: thick ice on top (snow on that), dark
  // water underneath with weed and pebbles on the bottom, in a ring of
  // packed snow.
  const { x: wx, y: wy, r } = POND_WINDOW;
  pm.circle(wx, wy, r + 4, FR.snow);
  pm.ring(wx, wy, r + 4, r + 2, FR.snowShade);
  for (let y = wy - r; y <= wy + r; y++) {
    for (let x = wx - r; x <= wx + r; x++) {
      if (Math.hypot(x - wx, y - wy) > r) {
        continue;
      }
      const dy = y - wy;
      let col;
      if (dy < -14) {
        col = FR.snow;
      } else if (dy < -8) {
        col = bayer(x, y) < 0.3 ? '#ffffff' : FR.ice;
      } else {
        col = bayer(x, y) < (dy + 8) / 30 ? IC.waterDeep : IC.water;
      }
      pm.set(x, y, col);
    }
  }
  pm.hline(wx - r, wx + r, wy - 8, FR.iceLight);
  for (const [dx, hgt] of [[-12, 8], [-9, 5], [7, 9], [11, 6]]) {
    pm.line(wx + dx, wy + r - 2, wx + dx + 1, wy + r - 2 - hgt, '#3f8a6a');
  }
  for (const dx of [-4, -1, 3]) {
    pm.circle(wx + dx, wy + r - 2, 1.5, IC.stoneDark);
  }
  pm.ring(wx, wy, r + 1, r, IC.wallLight);
  // The doorway: a rough arch of rock.
  const d = HOUSE_DOOR;
  pm.circle(d.x + d.w / 2, d.y + 6, d.w / 2 + 5, IC.rock);
  pm.rect(d.x - 5, d.y + 6, d.w + 10, d.h - 6, IC.rock);
  pm.dither(d.x - 5, d.y - 10, d.w + 10, d.h + 10, IC.rockDark, 0.3);
  pm.rect(d.x, d.y, d.w, d.h, IC.rockDeep);
  // The floor: packed snow, shaded blue towards the back, banked up against
  // the walls in soft drifts.
  for (let y = FLOOR_TOP; y < H; y++) {
    pm.hline(0, W - 1, y, FR.snow);
    pm.dither(0, y, W, 1, FR.snowShade, 0.6 - (y - FLOOR_TOP) * 0.025);
  }
  for (let x = 0; x < W; x++) {
    const bank = Math.round(4 + Math.sin(x * 0.11) * 3 + Math.sin(x * 0.37));
    pm.vline(x, FLOOR_TOP - bank, FLOOR_TOP, x > d.x - 6 && x < d.x + d.w + 6 ? FR.snowShade : FR.snow);
    pm.set(x, FLOOR_TOP - bank, '#ffffff');
  }
  for (let i = 0; i < 50; i++) {
    pm.set(Math.floor(rand() * W), FLOOR_TOP + 3 + Math.floor(rand() * (H - FLOOR_TOP - 3)), rand() < 0.5 ? '#ffffff' : FR.iceLight);
  }
  return pm;
}

// The front door from inside: a shaggy fur curtain hung in the mouth, or
// `open` onto the snowy valley outside.
export function drawIceDoor(open = false) {
  const { w, h } = HOUSE_DOOR;
  const pm = new Pixmap(w, h);
  if (open) {
    for (let y = 0; y < h; y++) {
      const k = y / (h - 18) + (bayer(0, y) - 0.5) * 0.1;
      pm.hline(0, w - 1, y, k < 0.4 ? FR.skyTop : k < 0.8 ? FR.sky : FR.skyLow);
    }
    for (let x = 0; x < w; x++) {
      const peak = Math.round(h - 30 + Math.abs(((x * 3) % 22) - 11) * 0.8);
      pm.vline(x, peak, h - 16, FR.peak);
      pm.set(x, peak, FR.peakSnow);
    }
    for (let y = h - 16; y < h; y++) {
      pm.hline(0, w - 1, y, y % 4 ? FR.snow : FR.snowShade);
    }
    return pm;
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const shag = (x + Math.floor(y / 3)) % 4 === 0;
      pm.set(x, y, shag ? IC.furDark : (y + x * 7) % 11 === 0 ? IC.furLight : IC.fur);
    }
    // ...ragged along the bottom.
    pm.vline(x, h - 1 - (x % 3), h - 1, IC.rockDeep);
  }
  // The pole it hangs from.
  pm.rect(0, 0, w, 3, IC.log);
  pm.hline(0, w - 1, 0, '#a8683a');
  return pm;
}

// An icicle `len` long, hanging from its top-centre: clear ice tapering to a
// point, with a bright streak down it and a drip glinting on the tip.
export function drawIcicle(len) {
  const pm = new Pixmap(5, len + 1);
  for (let y = 0; y < len; y++) {
    const half = 2 * (1 - y / len);
    pm.hline(Math.round(2 - half), Math.round(2 + half), y, FR.ice);
  }
  pm.vline(1, 0, Math.floor(len * 0.6), FR.iceLight);
  pm.set(2, len, '#ffffff');
  return pm.outline(C.outline);
}

// The fish that lives under the frozen pond, facing right; `frame` flicks
// its tail.
export function drawIceFish(frame = 0) {
  const pm = new Pixmap(11, 7);
  pm.ellipse(6, 3, 4, 2.5, '#ff9d5c');
  pm.dither(2, 4, 8, 2, '#e8602a', 0.6);
  const tail = frame ? [[0, 1], [0, 5], [1, 2], [1, 4], [2, 3]] : [[0, 2], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3]];
  for (const [x, y] of tail) {
    pm.set(x, y, '#ffd27a');
  }
  pm.set(8, 2, C.outline);
  pm.set(6, 1, '#ffd27a');
  return pm.outline(C.outline);
}

// The fur-rug nest: a big round heap of shaggy rugs with a cosy hollow in
// the middle. Bottom-centre on the floor. `back` is just its far rim and
// hollow (drawn behind whoever's curled up in it); the rest is its near rim.
export const NEST = { w: 44, h: 16 };
export function drawFurNest(back = false) {
  const { w, h } = NEST;
  const cx = w / 2;
  const pm = new Pixmap(w, h);
  const near = (x, y) => y > h - 8 + Math.round(Math.sin((x / w) * Math.PI) * -2);
  pm.ellipse(cx, h - 7, cx - 1, 7, IC.fur);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!pm.isSet(x, y)) {
        continue;
      }
      if (back === near(x, y)) {
        pm.clear(x, y);
      } else if ((x + Math.floor(y / 2) * 3) % 5 === 0) {
        pm.set(x, y, IC.furDark);
      } else if ((x * 3 + y) % 13 === 0) {
        pm.set(x, y, IC.furLight);
      }
    }
  }
  if (back) {
    pm.ellipse(cx, h - 8, cx - 8, 3.5, IC.furDark); // the hollow
  }
  return pm.outline(C.outline);
}

// The campfire: a ring of stones round crossed logs, its flames (two
// `frame`s, so they flicker) leaping up tall when `big`. Bottom-centre.
export function drawCampfire(frame = 0, big = false) {
  const pm = new Pixmap(30, 34);
  const cx = 15;
  const base = 30;
  // Flames: three tongues, the middle one tallest.
  const tall = big ? 1.5 : 1;
  const tongues = [[-5, 9 + frame * 2], [0, 15 - frame * 2], [5, 10 - frame]];
  for (const [dx, hgt] of tongues) {
    const top = base - Math.round(hgt * tall);
    for (let y = top; y < base; y++) {
      const k = (y - top) / (base - top);
      const half = 1 + k * 4;
      const sway = Math.round(Math.sin(y * 0.5 + frame * 2) * (1 - k));
      pm.hline(Math.round(cx + dx + sway - half), Math.round(cx + dx + sway + half), y, k < 0.35 ? IC.flameLight : k < 0.75 ? IC.flame : IC.flameDeep);
    }
  }
  pm.ellipse(cx, base - 3, 4, 3, IC.flameLight);
  // Crossed logs.
  pm.line(cx - 9, base + 1, cx + 7, base - 4, IC.log, 2);
  pm.line(cx + 9, base + 1, cx - 7, base - 4, IC.log, 2);
  // The stones round it.
  for (let i = 0; i < 7; i++) {
    const x = cx - 12 + i * 4;
    pm.ellipse(x, base + 1, 2.5, 2, i % 2 ? IC.stone : IC.stoneDark);
  }
  return pm.outline(C.outline);
}
