import { W } from './layout.js';

// The view onto a place wider than the screen (Bluebell's meadow, say):
// `camX` is how far along the place the screen's left edge is. All pure, so
// the scene just keeps a number and asks these where it should be.

export const EDGE = 80; // she's kept at least this far in from either side of the view
const FOLLOW_RATE = 6; // how quickly the view catches up (per second; higher = snappier)
const NUDGE_ZONE = 24; // a finger carrying something this close to a side...
const NUDGE_SPEED = 140; // ...creeps the view that way, up to this fast (px per second)

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Never shows past either end of the place.
export function clampCam(camX, width, view = W) {
  return clamp(camX, 0, Math.max(0, width - view));
}

// The view with x in the middle (as near as the ends allow).
export function centreOn(x, width, view = W) {
  return clampCam(x - view / 2, width, view);
}

// Where the view wants to be so that x (her) stays EDGE in from either side.
export function followCam(camX, x, width, view = W, edge = EDGE) {
  if (x < camX + edge) {
    return clampCam(x - edge, width, view);
  }
  if (x > camX + view - edge) {
    return clampCam(x - view + edge, width, view);
  }
  return clampCam(camX, width, view);
}

// One frame's step of the view easing toward `target`, landing on it
// exactly once it's close.
export function easeCam(camX, target, dt, rate = FOLLOW_RATE) {
  const next = camX + (target - camX) * (1 - Math.exp(-rate * dt));
  return Math.abs(target - next) < 0.5 ? target : next;
}

// One frame's creep of the view toward whichever side a finger carrying
// something is near (`screenX` is the finger, on screen), faster the nearer.
export function nudgeCam(camX, screenX, dt, width, view = W) {
  const left = 1 - screenX / NUDGE_ZONE;
  const right = 1 - (view - screenX) / NUDGE_ZONE;
  const push = left > 0 ? -left : right > 0 ? right : 0;
  return clampCam(camX + push * NUDGE_SPEED * dt, width, view);
}
