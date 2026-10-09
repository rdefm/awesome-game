import { Pixmap } from '../../engine/pixmap.js';
import { C } from './palette.js';

// The two friends who've been on the ship from the very start: Monkey, a
// cheeky little monkey with a great big round face, a spiky red tuft and an
// enormous laughing mouth, and Gonzo, a fuzzy blue baby with a long
// nose, sleepy eyelids and a red jumper with a yellow chick on it.

// ------------------------------------------------------------------ Monkey
// Facing right. frame: 'idle' | 'blink' | 'wave1' | 'wave2' | 'hop' | 'walk'
export const MONKEY = {
  fur: '#8e2a1e', furDark: '#5e1712', face: '#f6d4b8', faceShade: '#e2aa8a', mouth: '#3a1418', tongue: '#f08aa0',
};

export function drawMonkey(frame = 'idle') {
  const k = MONKEY;
  const pm = new Pixmap(22, 26);
  const hop = frame === 'hop';
  const cx = 10;
  const by = hop ? 20 : 21; // tummy centre
  const step = frame === 'walk' ? 1 : 0;
  // A thin tail curling up behind.
  pm.line(cx - 3, by + 1, cx - 7, by, k.fur);
  pm.line(cx - 7, by, cx - 8, by - 3, k.fur);
  pm.line(cx - 8, by - 3, cx - 6, by - 4, k.fur);
  // Legs: short, with pale feet.
  const legY = by + 2;
  for (const [x, dir] of [[cx - 2, -1], [cx + 2, 1]]) {
    pm.rect(x + dir * step - 1, hop ? legY - 1 : legY, 2, 2, k.fur);
    pm.hline(x + dir * step - 1, x + dir * step + 1, hop ? legY + 1 : legY + 2, k.face);
  }
  // A little body, with a pale tummy.
  pm.ellipse(cx, by, 3.5, 3, k.fur);
  pm.ellipse(cx + 1, by, 2, 2, k.face);
  // Back arm.
  pm.line(cx - 2, by - 2, cx - 5, by + 1, k.fur, 2);
  pm.set(cx - 5, by + 2, k.face);
  // A great big round head: red fur round the back, a spiky tuft on top...
  const hy = by - 10;
  pm.circle(cx - 6, hy + 1, 1.5, k.face); // far ear
  pm.ellipse(cx, hy, 6.5, 6, k.fur);
  pm.line(cx - 1, hy - 5, cx - 2, hy - 9, k.fur, 2);
  pm.line(cx + 1, hy - 5, cx + 2, hy - 10, k.fur, 2);
  pm.line(cx + 3, hy - 5, cx + 5, hy - 8, k.fur, 2);
  pm.set(cx, hy - 7, k.furDark);
  pm.set(cx + 3, hy - 7, k.furDark);
  // ...and nearly all the front of it a pale face, with a round ear.
  pm.ellipse(cx + 1, hy + 1, 5.5, 5, k.face);
  pm.circle(cx + 7, hy + 1, 1.5, k.face);
  pm.set(cx + 7, hy + 1, k.faceShade);
  // Eyes (with cheeky eyebrows), or screwed shut laughing.
  if (frame === 'blink') {
    pm.hline(cx - 1, cx, hy - 1, C.outline);
    pm.hline(cx + 3, cx + 4, hy - 1, C.outline);
  } else {
    pm.vline(cx, hy - 2, hy - 1, C.outline);
    pm.vline(cx + 4, hy - 2, hy - 1, C.outline);
  }
  pm.hline(cx - 1, cx, hy - 4, k.fur);
  pm.hline(cx + 4, cx + 5, hy - 4, k.fur);
  // That enormous open mouth: teeth on top, a pink tongue at the bottom.
  pm.ellipse(cx + 2, hy + 3, 3.5, 2.5, k.mouth);
  pm.hline(cx, cx + 4, hy + 1, C.white);
  pm.hline(cx + 1, cx + 3, hy + 5, k.tongue);
  pm.set(cx + 2, hy + 4, k.tongue);
  // Front arm: down, or up to wave.
  if (frame === 'wave1' || frame === 'wave2') {
    const up = frame === 'wave1' ? 0 : 1;
    pm.line(cx + 2, by - 1, cx + 8, by - 3 - up * 2, k.fur, 2);
    pm.circle(cx + 9, by - 4 - up * 2, 1.2, k.face);
  } else {
    pm.line(cx + 2, by - 1, cx + 5, by + 1, k.fur, 2);
    pm.set(cx + 6, by + 2, k.face);
  }
  return pm.outline(C.outline);
}

// ------------------------------------------------------------------- Gonzo
// Facing right. frame: 'idle' | 'blink' | 'wave1' | 'wave2' | 'hop' | 'walk'
export const GONZO = {
  fur: '#5f86d8', furDark: '#3d5aa8', furLight: '#8fb0f0',
  nose: '#9a72d0', noseDark: '#6f4aa8', lid: '#4a6cc0',
  jumper: '#e0403a', jumperDark: '#a82a2a', chick: '#ffe066',
};

export function drawGonzo(frame = 'idle') {
  const k = GONZO;
  const pm = new Pixmap(21, 25);
  const hop = frame === 'hop';
  const cx = 9;
  const by = hop ? 18 : 19; // tummy centre
  const step = frame === 'walk' ? 1 : 0;
  // Legs, fuzzy, with big floppy feet.
  const legY = by + 3;
  for (const [x, dir] of [[cx - 2, -1], [cx + 2, 1]]) {
    pm.rect(x + dir * step - 1, hop ? legY - 1 : legY, 2, 2, k.fur);
    pm.hline(x + dir * step - 1, x + dir * step + 2, hop ? legY + 1 : legY + 2, k.furDark);
  }
  // The red jumper, with a yellow chick on the front.
  pm.ellipse(cx, by, 4.5, 4, k.jumper);
  pm.dither(cx - 4, by + 1, 9, 3, k.jumperDark, 0.35);
  pm.rect(cx, by - 1, 2, 2, k.chick);
  pm.set(cx + 2, by - 1, C.orange); // its beak
  // Back arm.
  pm.line(cx - 3, by - 2, cx - 5, by + 2, k.jumperDark, 2);
  pm.set(cx - 5, by + 3, k.furDark);
  // Head: a fuzzy round one with a tuft on top.
  const hy = by - 10;
  pm.ellipse(cx, hy, 5, 5, k.fur);
  pm.set(cx - 3, hy + 2, k.furLight);
  pm.vline(cx - 1, hy - 7, hy - 5, k.furDark);
  pm.vline(cx + 1, hy - 8, hy - 5, k.furDark);
  pm.set(cx, hy - 6, k.furDark);
  // Big round eyes with heavy, sleepy lids.
  for (const ex of [cx, cx + 3]) {
    pm.circle(ex, hy - 1, 1.5, C.white);
    if (frame === 'blink') {
      pm.rect(ex - 1, hy - 2, 3, 3, k.lid);
    } else {
      pm.hline(ex - 1, ex + 1, hy - 2, k.lid);
      pm.set(ex + 1, hy, C.outline);
    }
  }
  // That long nose, sticking right out.
  pm.ellipse(cx + 6, hy + 1, 3, 1.5, k.nose);
  pm.hline(cx + 5, cx + 7, hy + 2, k.noseDark);
  // A big happy smile under it.
  pm.set(cx - 1, hy + 2, C.outline);
  pm.hline(cx, cx + 4, hy + 3, C.outline);
  pm.hline(cx + 1, cx + 3, hy + 4, '#f08aa0');
  // Front arm: down, or up to wave.
  if (frame === 'wave1' || frame === 'wave2') {
    const up = frame === 'wave1' ? 0 : 1;
    pm.line(cx + 3, by - 2, cx + 6, by - 6 - up, k.jumper, 2);
    pm.circle(cx + 6, by - 7 - up, 1, k.fur);
  } else {
    pm.line(cx + 3, by - 2, cx + 4, by + 2, k.jumper, 2);
    pm.set(cx + 4, by + 3, k.fur);
  }
  return pm.outline(C.outline);
}
