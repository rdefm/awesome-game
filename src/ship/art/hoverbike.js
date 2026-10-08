import { Pixmap } from '../../engine/pixmap.js';
import { C } from './palette.js';

// The hoverbike, side on and facing right: a rounded teal body with a lemon
// stripe, a padded seat, handlebars at the front and a glowing hover pad
// underneath (`frame` 0/1 flickers the glow). Bottom-centre on the ground.
export const BIKE_SIZE = { w: 34, h: 18, seat: 9 }; // `seat`: how far above the ground she sits

export function drawHoverbike(frame = 0) {
  const pm = new Pixmap(BIKE_SIZE.w, BIKE_SIZE.h);
  // The glowing hover pad underneath.
  const glow = frame ? '#bff8ff' : '#7fe8f0';
  pm.ellipse(17, 16, 11, 1.5, glow);
  pm.rect(10, 15, 14, 1, '#ffffff');
  // The body: a long rounded pod, nose to the right.
  pm.ellipse(17, 11, 15, 4, C.teal);
  pm.ellipse(17, 13, 13, 2, C.tealDark);
  pm.rect(4, 10, 26, 1, C.yellow); // go-faster stripe
  pm.set(30, 10, '#ffffff'); // headlight
  pm.set(31, 11, '#ffffff');
  // The tail fin.
  pm.rect(2, 5, 3, 5, C.teal);
  pm.rect(2, 5, 1, 4, C.tealDark);
  // The seat.
  pm.rect(9, 6, 12, 2, C.purple);
  pm.rect(10, 5, 10, 1, '#c8a8ff');
  // Handlebars at the front.
  pm.line(25, 7, 27, 1, C.metal, 1);
  pm.rect(25, 0, 4, 2, C.outline);
  pm.rect(26, 0, 2, 1, C.pink);
  return pm.outline(C.outline);
}
