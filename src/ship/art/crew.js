import { Pixmap } from '../../engine/pixmap.js';
import { CREW_POD } from '../layout.js';
import { C } from './palette.js';

// A crewmate: a bean-shaped little spaceship friend built from parts she picks
// in the crew pod. Colour, eyes and ears (or antennae) are drawn here; the hat
// is one of her own hats, added on top like for any friend (see friendHats.js).
// Facing right, like the other friends. frame: 'idle' | 'blink' | 'wave1' |
// 'wave2' | 'hop' | 'walk'

export const CREW_W = 22;
export const CREW_H = 28;

// Body colours, in the order the pod shows them (the first is how a crew
// starts out in the pod).
export const CREW_BODIES = {
  mint: { body: '#5fd9a8', shade: '#2f9e7e', light: '#a6f0d0' },
  sky: { body: '#5aaef2', shade: '#3571c0', light: '#a0d4ff' },
  sunny: { body: '#ffd24a', shade: '#d89a22', light: '#fff0a0' },
  coral: { body: '#ff7f6e', shade: '#c9473f', light: '#ffb8a8' },
  lilac: { body: '#b48cf2', shade: '#7a55c0', light: '#d8c0ff' },
  lime: { body: '#a6e04a', shade: '#6aa22a', light: '#d6f58a' },
};
export const CREW_EYES = ['round', 'big', 'sleepy', 'star'];
export const CREW_EARS = ['antennae', 'bunny', 'cat', 'round'];

const FACE = '#f4f1ea';
const BOBBLE = '#ffe066';

// Ears sit behind the head, out to the sides so a hat doesn't hide them.
function drawEars(pm, ears, c, top, cx = CREW_W / 2) {
  for (const side of [-1, 1]) {
    const x = (dx) => cx + side * dx;
    if (ears === 'antennae') {
      pm.line(x(4), top + 1, x(7), top - 5, c.shade, 1);
      pm.circle(x(8), top - 6, 1.7, BOBBLE);
    } else if (ears === 'bunny') {
      pm.line(x(4), top + 2, x(7), top - 7, c.body, 3);
      pm.line(x(5), top - 1, x(7), top - 6, c.light, 1);
    } else if (ears === 'cat') {
      for (let i = 0; i < 5; i++) {
        const inner = Math.max(3, 6 - i);
        pm.hline(Math.min(x(inner), x(7)), Math.max(x(inner), x(7)), top - 4 + i, c.body);
      }
      pm.rect(x(6), top - 1, 1, 2, c.light);
    } else {
      pm.circle(x(7), top - 1, 2.6, c.body);
      pm.circle(x(7), top - 1, 1.2, c.light);
    }
  }
}

function drawEyes(pm, eyes, frame, y, cx = CREW_W / 2) {
  const xs = [cx - 3, cx + 3];
  if (frame === 'blink' || eyes === 'sleepy') {
    for (const x of xs) {
      pm.hline(x - 1, x + 1, y + 1, C.outline);
      if (eyes === 'sleepy' && frame !== 'blink') {
        pm.set(x - 1, y, C.outline);
        pm.set(x + 1, y, C.outline);
      }
    }
    return;
  }
  for (const x of xs) {
    if (eyes === 'round') {
      pm.rect(x, y - 1, 1, 3, C.outline);
    } else if (eyes === 'big') {
      pm.rect(x - 1, y - 2, 3, 4, C.outline);
      pm.set(x - 1, y - 2, C.white);
    } else {
      // star
      pm.set(x, y - 2, BOBBLE);
      pm.hline(x - 1, x + 1, y - 1, BOBBLE);
      pm.set(x, y, BOBBLE);
      pm.set(x, y - 1, C.white);
    }
  }
}

// `crew`: { body, eyes, ears } (see ../crew.js).
export function drawCrew(frame = 'idle', crew = {}) {
  const c = CREW_BODIES[crew.body] ?? CREW_BODIES.mint;
  const eyes = CREW_EYES.includes(crew.eyes) ? crew.eyes : CREW_EYES[0];
  const ears = CREW_EARS.includes(crew.ears) ? crew.ears : CREW_EARS[0];
  const pm = new Pixmap(CREW_W, CREW_H);
  const cx = CREW_W / 2;
  const hop = frame === 'hop';
  const cy = hop ? 14 : 15; // middle of the body
  const top = cy - 8; // the top of its head
  const step = frame === 'walk' ? 1 : 0;
  drawEars(pm, ears, c, top + 1);
  // Legs: little stubs.
  for (const [x, dir] of [[cx - 3, -1], [cx + 3, 1]]) {
    pm.rect(Math.round(x + dir * step) - 1, cy + 7, 3, hop ? 3 : 4, c.shade);
  }
  // Back arm.
  pm.ellipse(cx - 7, cy + 2, 1.5, 3, c.shade);
  // The bean of a body, shaded underneath.
  pm.ellipse(cx, cy, 7, 8, c.body);
  pm.dither(cx - 6, cy + 3, 13, 5, c.shade, 0.5);
  pm.ellipse(cx - 2, cy - 4, 2, 1.5, c.light);
  // Face panel, eyes and a little smile.
  pm.ellipse(cx, cy - 2, 6, 3.5, FACE);
  drawEyes(pm, eyes, frame, cy - 3);
  pm.hline(cx - 1, cx, cy, C.redDark);
  // Front arm: down, or up to wave.
  if (frame === 'wave1' || frame === 'wave2') {
    const up = frame === 'wave1' ? 0 : 1;
    pm.line(cx + 6, cy, cx + 9, cy - 6 - up, c.body, 2);
  } else {
    pm.ellipse(cx + 7, cy + 2, 1.5, 3, c.body);
  }
  return pm.outline(C.outline);
}

// Every picture a crew look needs.
export const CREW_FRAMES = ['idle', 'blink', 'wave1', 'wave2', 'hop', 'walk'];

// ----------------------------------------------------------- pod swatches
// Little pictures for the crew pod's buttons.

// A crew colour: a round little bean with its face panel.
export function drawCrewBodySwatch(body) {
  const c = CREW_BODIES[body] ?? CREW_BODIES.mint;
  const pm = new Pixmap(16, 16);
  pm.ellipse(8, 8, 6.5, 7, c.body);
  pm.dither(2, 10, 12, 5, c.shade, 0.5);
  pm.ellipse(8, 6, 5, 3, FACE);
  pm.rect(5, 5, 1, 3, C.outline);
  pm.rect(10, 5, 1, 3, C.outline);
  return pm.outline(C.outline);
}

// A pair of eyes on a face panel.
export function drawCrewEyesSwatch(eyes) {
  const pm = new Pixmap(18, 11);
  pm.ellipse(9, 5.5, 8, 4.5, FACE);
  drawEyes(pm, eyes, 'idle', 6, 9);
  return pm.outline(C.outline);
}

// The top of a head with these ears or antennae, in this colour.
export function drawCrewEarsSwatch(ears, body) {
  const c = CREW_BODIES[body] ?? CREW_BODIES.mint;
  const pm = new Pixmap(22, 20);
  drawEars(pm, ears, c, 9, 11);
  pm.ellipse(11, 18, 7, 8, c.body);
  pm.ellipse(9, 12, 2, 1.5, c.light);
  return pm.outline(C.outline);
}

// ---------------------------------------------------------------- crew pod
// The crew pod in the store room: a tall glass capsule on a metal base, glowing
// teal inside. Open, its glass lid has swung up and back and the inside is
// empty and dim, ready for the next crewmate.
export function drawCrewPod(open = false) {
  const { w, h } = CREW_POD;
  const pm = new Pixmap(w, h);
  const cx = w / 2;
  const glow = open ? '#1d4a63' : '#2f9db0';
  // The capsule's inside, brighter towards the middle.
  pm.rect(4, 12, w - 8, h - 20, '#143a52');
  pm.rect(7, 12, w - 14, h - 20, glow);
  pm.rect(11, 12, w - 22, h - 20, open ? '#26607c' : '#5fd9d0');
  for (const [x, y] of [[9, 36], [20, 30], [12, 22], [18, 16]]) {
    pm.set(x, y, open ? '#3f86a8' : '#d8fffb'); // bubbles
  }
  // The glass lid: a dome over the top, or swung up and out of the way.
  if (open) {
    pm.rect(3, 11, w - 6, 2, C.metalLight);
    pm.line(w - 4, 10, w - 1, 2, C.metalHi, 2);
    pm.ellipse(w - 3, 4, 3, 5, '#8fd3ff');
  } else {
    pm.ellipse(cx, 12, 12, 9, '#8fd3ff');
    pm.ellipse(cx, 12, 9.5, 7, glow);
    pm.ellipse(cx, 13, 6, 5, '#5fd9d0');
    pm.rect(0, 12, w, 4, C.metalLight);
    pm.rect(4, 12, w - 8, 3, glow);
    pm.vline(7, 8, 12, '#e8fbff'); // glass shine
    pm.hline(8, 9, 6, '#e8fbff');
  }
  // Glass sides with a shine, in a metal frame.
  pm.vline(3, 12, h - 9, C.metalLight);
  pm.vline(w - 4, 12, h - 9, C.metalDark);
  pm.vline(5, 15, h - 12, open ? '#6fa3c0' : '#e8fbff');
  // The base: a chunky plate with hazard stripes and little lights.
  pm.rect(0, h - 9, w, 9, C.metal);
  pm.rect(0, h - 9, w, 2, C.metalLight);
  pm.rect(2, h - 6, w - 4, 3, C.outline);
  for (let x = 3; x < w - 3; x++) {
    pm.set(x, h - 5, (x >> 2) % 2 ? C.yellow : C.outline);
  }
  pm.rect(w - 8, h - 8, 2, 2, open ? C.greenDark : C.green);
  pm.rect(w - 12, h - 8, 2, 2, C.redDark);
  return pm.outline(C.outline);
}
