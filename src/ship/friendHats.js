import { hatOffset } from './art/girl.js';

// Where each kind of friend wears a hat. Their pictures are all different
// shapes, so each has: `x` (px right of the middle of the picture, as drawn
// facing right, to the middle of its head), `y` (px down from the top of the
// picture to where the hat's bottom edge rests) and `scale` (1 is the size
// she wears them; small friends get smaller hats).
export const HAT_SPOTS = {
  critter: { x: 0, y: 3, scale: 0.5 },
  local: { x: 0, y: 3, scale: 1 },
  newt: { x: 6, y: 3, scale: 0.5 },
  mumYeti: { x: 1, y: 5, scale: 1 },
  babyYeti: { x: 0, y: 3, scale: 0.5 },
  gummy: { x: 0, y: 3, scale: 0.5 },
  ginger: { x: 0, y: 4, scale: 1 },
  lavaDad: { x: 1, y: 5, scale: 1 },
  lavaMum: { x: 0, y: 4, scale: 1 },
  lavaBaby: { x: 1, y: 3, scale: 0.5 },
  zig: { x: 0, y: 4, scale: 0.5 },
  crew: { x: 0, y: 8, scale: 1 },
  monkey: { x: -1, y: 4, scale: 0.75 },
  gonzo: { x: -1, y: 4, scale: 0.75 },
  treeDad: { x: 0, y: 3, scale: 1 },
  treeMum: { x: 0, y: 5, scale: 1 },
  treeKid: { x: 0, y: 4, scale: 0.5 },
  sprout: { x: 5, y: 4, scale: 0.5 },
  shroom: { x: 0, y: 4, scale: 0.5 },
};

export const hatSpot = (kind) => HAT_SPOTS[kind] ?? null;

// Where a hat goes on a picture `w` x `h`, in a picture grown big enough to
// hold both: the hat's top-left (`hatX`, `hatY`), the picture's top-left
// (`imgX`, `imgY`), and the new size. The picture stays bottom-aligned and
// centred, so it can be drawn exactly where the plain one would be.
// `hat`: { w, h, dx } (its size, and its middle's offset from a head's, in
// girl-head pixels).
export function hatPlacement(spot, w, h, hat) {
  const hw = Math.round(hat.w * spot.scale);
  const hh = Math.round(hat.h * spot.scale);
  const centre = w / 2 + spot.x + hat.dx * spot.scale;
  const left = Math.round(centre - hw / 2);
  const top = spot.y - hh;
  const rise = Math.max(0, -top);
  const pad = Math.max(0, -left, left + hw - w);
  return {
    hatX: pad + left, hatY: rise + top, hatW: hw, hatH: hh, imgX: pad, imgY: rise, width: w + pad * 2, height: h + rise,
  };
}

const dressed = new WeakMap(); // picture -> hat piece -> the picture wearing it

// The picture `img` of a `kind` of friend, wearing the hat whose piece is
// `piece` (a hat on its own, see drawHatPiece) named `hat`. The same picture
// back if that kind can't wear one.
export function dress(img, kind, hat, piece) {
  const spot = hatSpot(kind);
  if (!spot || !piece) {
    return img;
  }
  let byHat = dressed.get(img);
  if (!byHat) {
    byHat = new Map();
    dressed.set(img, byHat);
  }
  if (!byHat.has(piece)) {
    const p = hatPlacement(spot, img.width, img.height, { w: piece.width, h: piece.height, dx: hatOffset(hat) });
    const canvas = document.createElement('canvas');
    canvas.width = p.width;
    canvas.height = p.height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, p.imgX, p.imgY);
    ctx.drawImage(piece, p.hatX, p.hatY, p.hatW, p.hatH);
    byHat.set(piece, canvas);
  }
  return byHat.get(piece);
}
