import { Pixmap } from '../../engine/pixmap.js';
import { TEDDY_PALETTE } from './items.js';
import { C, HAIR_COLORS } from './palette.js';

// Our hero: a small girl with red pigtails in a blue flight suit.
// Built like a paper doll (head grid + procedural body/arms/legs) so each pose
// is just a different combination of parts, then auto-outlined.

export const GIRL_W = 22;
export const GIRL_H = 28;
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

function drawTorso(pm, top) {
  const x0 = Math.round(CX - 4);
  pm.rect(x0, top, 8, 6, C.suit);
  pm.vline(x0 + 7, top, top + 5, C.suitDark);
  pm.vline(x0, top + 1, top + 5, C.suitLight);
  pm.hline(x0 + 3, x0 + 4, top, C.white); // collar
  pm.set(x0 + 2, top + 2, C.belt); // star badge
  pm.hline(x0, x0 + 7, top + 3, C.belt);
  pm.set(x0 + 4, top + 3, C.orange); // buckle
}

// Legs: each entry is the lift (in px) of the left and right foot.
// Feet stay planted at FOOT_Y while the body bobs above them.
const FOOT_Y = 24;

function drawLegs(pm, hip, { left = 0, right = 0 }) {
  for (const [x, lift] of [[Math.round(CX - 3), left], [Math.round(CX + 1), right]]) {
    const bottom = FOOT_Y - lift;
    pm.rect(x, hip, 2, bottom - hip, C.suitDark);
    const outward = x < CX ? -1 : 0;
    pm.rect(x + outward, bottom, 3, 2, C.boot);
    pm.hline(x + outward, x + outward + 2, bottom + 1, C.bootDark);
  }
}

function drawArm(pm, sx, sy, hx, hy) {
  pm.line(sx, sy, hx, hy, C.suitDark, 2);
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

// `outfit` is her look (see ../look.js): which hair colour to paint.
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
  const sink = seated ? 2 : 0;
  const headTop = 1 + bob + sink;
  const torsoTop = headTop + 13;
  const hip = torsoTop + 6;

  drawLegs(pm, hip, legs);
  drawTorso(pm, torsoTop);
  if (hug) {
    pm.grid(HUG_TEDDY, TEDDY_PALETTE, Math.round(CX - 3.5), torsoTop);
  }
  const [[lx, ly], [rx, ry]] = ARMS[arms];
  const sxL = Math.round(CX - 5);
  const sxR = Math.round(CX + 3);
  drawArm(pm, sxL, torsoTop + 1, Math.round(CX + lx), torsoTop + ly);
  drawArm(pm, sxR, torsoTop + 1, Math.round(CX + rx), torsoTop + ry);
  drawHead(pm, Math.round(CX - 8), headTop, { eyes, look, mouth }, headPalette(outfit.hair));
  // Raised arms go in front of the pigtails.
  if (ly < 0) {
    drawArm(pm, sxL, torsoTop + 1, Math.round(CX + lx), torsoTop + ly);
  }
  if (ry < 0) {
    drawArm(pm, sxR, torsoTop + 1, Math.round(CX + rx), torsoTop + ry);
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
  };
}
