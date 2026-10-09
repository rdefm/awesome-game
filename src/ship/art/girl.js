import { Pixmap } from '../../engine/pixmap.js';
import { TEDDY_PALETTE } from './items.js';
import { C, HAIR_COLORS, SUIT_COLORS } from './palette.js';

// Our hero: a small girl with pigtails in a flight suit (red and blue to
// start with; her wardrobe changes hair, suit and hat).
// Built like a paper doll (head grid + procedural body/arms/legs) so each pose
// is just a different combination of parts, then auto-outlined.

export const GIRL_W = 22;
// Clear space above her head for the tallest hat.
export const HAT_ROOM = 6;
export const GIRL_H = 28 + HAT_ROOM;
const CX = 10.5; // horizontal centre of the body within the sprite

const HEAD = [
  '.....RRRRRR.....',
  '...RRRRRRRRRR...',
  '..RRhhRRRRRRRR..',
  '..RhhRRRRRRRRR..',
  '..RRRRRRRRRRRR..',
  '.YRRRRSRRRRSRRY.',
  'RR.RSSSSSSSSR.RR',
  'RR.SSeSSSSeSS.RR',
  'RR.SSeSSSSeSS.RR',
  'Rr.ScSSSSSScS.rR',
  'rr.SSSSmmSSSS.rr',
  '.r..SSSSSSSS..r.',
  '......SSSS......',
];

// The head's colours for a given hair colour (a key of HAIR_COLORS).
function headPalette(hair) {
  const { hair: R, dark: r, light: h } = HAIR_COLORS[hair] ?? HAIR_COLORS.red;
  return { R, r, h, Y: C.belt, S: C.skin, e: C.outline, c: C.cheek, m: C.redDark };
}

// Her hats, each a grid laid over the head grid: `x`/`y` place its top-left
// corner relative to the head's (negative `y` pokes up above her hair).
// Listed in the order the wardrobe shows them; "none" is how she starts out.
export const HATS = {
  none: null,
  helmet: {
    x: 0,
    y: -3,
    rows: [
      '.....wWWWWW.....',
      '...wWWWRRWWWW...',
      '..wWWWWRRWWWWs..',
      '.wWWWWWRRWWWWWs.',
      '.WWWWWWRRWWWWWs.',
      '.TTTTTTTTTTTTTT.',
    ],
    palette: { W: C.metalHi, w: C.white, s: C.metalLight, R: C.red, T: C.teal },
  },
  bow: {
    x: 9,
    y: -2,
    rows: [
      'PP...PP',
      'PPPkPPP',
      'pPPkPPp',
      'pp...pp',
    ],
    palette: { P: C.pink, p: '#d65a9c', k: C.redDark },
  },
  crown: {
    x: 4,
    y: -4,
    rows: [
      'Y..YY..Y',
      'YY.YY.YY',
      'YYYYYYYY',
      'YRYYYYTY',
      'yyyyyyyy',
    ],
    palette: { Y: C.yellow, y: C.orange, R: C.red, T: C.teal },
  },
  party: {
    x: 5,
    y: -5,
    rows: [
      '..YY..',
      '..PP..',
      '.TTTT.',
      '.PPPP.',
      'TTTTTT',
      'PPPPPP',
    ],
    palette: { Y: C.yellow, P: C.purple, T: C.teal },
  },
  // The flower crown, woven from Bluebell posies: little bluebells and white
  // flowers among leaves, all round her head. Only in the wardrobe once
  // she's made one (see look.js).
  flowers: {
    x: 2,
    y: -1,
    rows: [
      'B..W.BB.W..B',
      'BgGWgBBgWGgB',
      '.gGgGggGgGg.',
    ],
    palette: { B: '#2f6fd0', W: C.white, g: '#3f9e45', G: '#8ee87a' },
  },
};

// How many px a hat pokes up above the top of her hair.
export const hatHeight = (hat) => Math.max(0, -(HATS[hat]?.y ?? 0));

// Just this hat on its own (outlined), for putting on a friend. Null for
// "none" and anything unknown.
export function drawHatPiece(hat) {
  const spec = HATS[hat];
  if (!spec) {
    return null;
  }
  const pm = new Pixmap(spec.rows[0].length + 2, spec.rows.length + 2);
  pm.grid(spec.rows, spec.palette, 1, 1);
  return pm.outline(C.outline);
}

// How far right of the middle of her head a hat's own middle sits (the bow
// is off to one side), in pixels.
export const hatOffset = (hat) => (HATS[hat] ? HATS[hat].x + HATS[hat].rows[0].length / 2 - 8 : 0);

function drawHat(pm, ox, oy, hat) {
  const spec = HATS[hat];
  if (spec) {
    pm.grid(spec.rows, spec.palette, ox + spec.x, oy + spec.y);
  }
}

// Eyes live at rows 7-8, columns 5 and 10 of the head grid.
function drawHead(pm, ox, oy, { eyes = 'open', look = 0, mouth = 'smile' }, palette) {
  const rows = HEAD.map((row) => row.replace(/e/g, 'S').replace(/m/g, 'S'));
  pm.grid(rows, palette, ox, oy);
  const ex = [5 + look, 10 + look];
  for (const x of ex) {
    if (eyes === 'open') {
      pm.set(ox + x, oy + 7, C.outline);
      pm.set(ox + x, oy + 8, C.outline);
    } else if (eyes === 'closed') {
      pm.set(ox + x, oy + 8, C.outline);
      pm.set(ox + x - 1, oy + 8, C.outline);
    } else if (eyes === 'happy') {
      pm.set(ox + x, oy + 7, C.outline);
      pm.set(ox + x - 1, oy + 8, C.outline);
      pm.set(ox + x + 1, oy + 8, C.outline);
    } else if (eyes === 'dizzy') {
      pm.set(ox + x - 1, oy + 7, C.outline);
      pm.set(ox + x + 1, oy + 7, C.outline);
      pm.set(ox + x, oy + 8, C.outline);
    } else if (eyes === 'wide') {
      pm.rect(ox + x, oy + 7, 1, 2, C.outline);
      pm.set(ox + x, oy + 6, C.outline);
    }
  }
  if (mouth === 'smile') {
    pm.hline(ox + 7, ox + 8, oy + 10, C.redDark);
  } else if (mouth === 'open') {
    pm.rect(ox + 7, oy + 10, 2, 2, C.redDark);
  } else if (mouth === 'o') {
    pm.set(ox + 7, oy + 10, C.redDark);
    pm.set(ox + 8, oy + 10, C.redDark);
    pm.set(ox + 7, oy + 11, C.redDark);
    pm.set(ox + 8, oy + 11, C.redDark);
  }
}

// The suit's colours for a suit colour (a key of SUIT_COLORS).
const suitColors = (suit) => SUIT_COLORS[suit] ?? SUIT_COLORS.blue;

function drawTorso(pm, top, suit, x0 = Math.round(CX - 4)) {
  pm.rect(x0, top, 8, 6, suit.suit);
  pm.vline(x0 + 7, top, top + 5, suit.dark);
  pm.vline(x0, top + 1, top + 5, suit.light);
  pm.hline(x0 + 3, x0 + 4, top, C.white); // collar
  pm.set(x0 + 2, top + 2, C.belt); // star badge
  pm.hline(x0, x0 + 7, top + 3, C.belt);
  pm.set(x0 + 4, top + 3, C.orange); // buckle
}

// Legs: each entry is the lift (in px) of the left and right foot.
// Feet stay planted at FOOT_Y while the body bobs above them.
const FOOT_Y = 24 + HAT_ROOM;

function drawLegs(pm, hip, { left = 0, right = 0 }, suit) {
  for (const [x, lift] of [[Math.round(CX - 3), left], [Math.round(CX + 1), right]]) {
    const bottom = FOOT_Y - lift;
    pm.rect(x, hip, 2, bottom - hip, suit.dark);
    const outward = x < CX ? -1 : 0;
    pm.rect(x + outward, bottom, 3, 2, C.boot);
    pm.hline(x + outward, x + outward + 2, bottom + 1, C.bootDark);
  }
}

// Sat right down on the ground: legs straight out in front along the floor
// (she faces right), boots toes-up at the end.
function drawLegsOut(pm, hip, suit) {
  const x0 = Math.round(CX - 3);
  pm.rect(x0, hip, 8, 2, suit.dark);
  pm.rect(x0 + 8, hip - 2, 2, 4, C.boot);
  pm.vline(x0 + 9, hip - 2, hip + 1, C.bootDark);
}

function drawArm(pm, sx, sy, hx, hy, suit) {
  pm.line(sx, sy, hx, hy, suit.dark, 2);
  pm.rect(hx, hy, 2, 2, C.skin);
}

// Arm presets: [leftHand, rightHand] positions relative to the torso top.
const ARMS = {
  down: [[-6, 4], [5, 4]],
  swingA: [[-6, 3], [5, 5]],
  swingB: [[-6, 5], [5, 3]],
  wave1: [[-6, 4], [8, -6]],
  wave2: [[-6, 4], [6, -7]],
  cheer: [[-9, -6], [8, -6]],
  reach: [[-6, 4], [8, -3]],
  held: [[-8, -5], [7, -5]],
  lap: [[-4, 5], [3, 5]],
  hug: [[-4, 4], [3, 4]],
};

// A small teddy squeezed to her chest, for the hug pose.
const HUG_TEDDY = [
  'bB...Bb',
  'BBBBBBB',
  'BkBBBkB',
  'BBmkmBB',
  '.BBBBB.',
  'BBBBBBB',
  'BBBBBBB',
  '.BB.BB.',
];

// `outfit` is her look (see ../look.js): hair colour, suit colour and hat.
export function drawGirl(pose = {}, outfit = {}) {
  const {
    eyes = 'open',
    look = 0,
    mouth = 'smile',
    arms = 'down',
    legs = {},
    bob = 0,
    seated = false,
    hug = false,
  } = pose;
  const pm = new Pixmap(GIRL_W, GIRL_H);
  // How far down her body sits: a little, in a seat; all the way down to her
  // feet, sat on the ground (`seated: 'ground'`).
  const sink = seated === 'ground' ? FOOT_Y - (1 + HAT_ROOM + bob + 19) : seated ? 2 : 0;
  const suit = suitColors(outfit.suit);
  const headTop = 1 + HAT_ROOM + bob + sink;
  const torsoTop = headTop + 13;
  const hip = torsoTop + 6;

  if (seated === 'ground') {
    drawLegsOut(pm, hip, suit);
  } else {
    drawLegs(pm, hip, legs, suit);
  }
  drawTorso(pm, torsoTop, suit);
  if (hug) {
    pm.grid(HUG_TEDDY, TEDDY_PALETTE, Math.round(CX - 3.5), torsoTop);
  }
  const [[lx, ly], [rx, ry]] = ARMS[arms];
  const sxL = Math.round(CX - 5);
  const sxR = Math.round(CX + 3);
  drawArm(pm, sxL, torsoTop + 1, Math.round(CX + lx), torsoTop + ly, suit);
  drawArm(pm, sxR, torsoTop + 1, Math.round(CX + rx), torsoTop + ry, suit);
  drawHead(pm, Math.round(CX - 8), headTop, { eyes, look, mouth }, headPalette(outfit.hair));
  drawHat(pm, Math.round(CX - 8), headTop, outfit.hat);
  // Raised arms go in front of the pigtails.
  if (ly < 0) {
    drawArm(pm, sxL, torsoTop + 1, Math.round(CX + lx), torsoTop + ly, suit);
  }
  if (ry < 0) {
    drawArm(pm, sxR, torsoTop + 1, Math.round(CX + rx), torsoTop + ry, suit);
  }
  return pm.outline(C.outline);
}

// Every named frame the game uses, for one look. Facing left is done by
// flipping at draw time.
export function girlFrames(outfit = {}) {
  const f = (pose) => drawGirl(pose, outfit);
  return {
    idle: [f({ look: 1 }), f({ look: 1, bob: 1 })],
    blink: f({ eyes: 'closed', look: 1 }),
    walk: [
      f({ look: 1, arms: 'swingA', legs: { left: 1 } }),
      f({ look: 1, arms: 'down', bob: 1 }),
      f({ look: 1, arms: 'swingB', legs: { right: 1 } }),
      f({ look: 1, arms: 'down', bob: 1 }),
    ],
    wave: [f({ eyes: 'happy', arms: 'wave1', mouth: 'open' }), f({ eyes: 'happy', arms: 'wave2', mouth: 'open' })],
    cheer: f({ eyes: 'happy', arms: 'cheer', mouth: 'open' }),
    reach: f({ look: 1, arms: 'reach', mouth: 'o' }),
    surprised: f({ eyes: 'wide', arms: 'cheer', mouth: 'o' }),
    held: [
      f({ eyes: 'happy', arms: 'held', mouth: 'open', legs: { left: 1 } }),
      f({ eyes: 'happy', arms: 'held', mouth: 'open', legs: { right: 1 } }),
    ],
    hug: [
      f({ eyes: 'closed', arms: 'hug', hug: true }),
      f({ eyes: 'closed', arms: 'hug', hug: true, bob: 1 }),
    ],
    sit: f({ seated: true, arms: 'lap' }),
    sitBlink: f({ seated: true, arms: 'lap', eyes: 'closed' }),
    sitCheer: f({ seated: true, arms: 'cheer', eyes: 'happy', mouth: 'open' }),
    dizzy: f({ eyes: 'dizzy', mouth: 'o' }),
    sitDizzy: f({ seated: true, arms: 'lap', eyes: 'dizzy', mouth: 'o' }),
    picnic: f({ seated: 'ground', arms: 'lap', look: 1 }),
    picnicBlink: f({ seated: 'ground', arms: 'lap', eyes: 'closed' }),
  };
}

// ---------------------------------------------------------- wardrobe swatches
// Little pictures for the wardrobe picker's buttons.

// Her head, with this hair colour.
export function drawHairSwatch(hair) {
  const pm = new Pixmap(18, 15);
  drawHead(pm, 1, 1, {}, headPalette(hair));
  return pm.outline(C.outline);
}

// A tiny flight suit in this colour.
export function drawSuitSwatch(suitName) {
  const suit = suitColors(suitName);
  const pm = new Pixmap(16, 15);
  pm.rect(5, 8, 2, 5, suit.dark);
  pm.rect(9, 8, 2, 5, suit.dark);
  drawArm(pm, 4, 3, 2, 7, suit);
  drawArm(pm, 11, 3, 12, 7, suit);
  drawTorso(pm, 2, suit, 4);
  return pm.outline(C.outline);
}

// This hat on the top of her head (just her hair, for "none").
export function drawHatSwatch(hat, hair) {
  const pm = new Pixmap(18, HAT_ROOM + 7);
  const hairTop = HEAD.slice(0, 5);
  pm.grid(hairTop, headPalette(hair), 1, HAT_ROOM);
  drawHat(pm, 1, HAT_ROOM, hat);
  return pm.outline(C.outline);
}
