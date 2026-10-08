import { ease } from '../../engine/tween.js';
import { WALK } from '../layout.js';

// Friends are the carryables that can sit in the pilot chair (they have a
// `seatFrame()`), and that greet her and play with each other. Each one keeps
// a `busy` flag (it's in the middle of something) and may have a `pose(frame)`
// to show a named picture of itself for a moment.
export const isFriendItem = (item) => Boolean(item.seatFrame);

// Holds a friend still (and out of reach of fingers) for a reaction.
export function hold(friend) {
  friend.stayPut?.();
  friend.busy = true;
  friend.draggable = false;
}

export function letGo(friend) {
  friend.pose?.('idle');
  friend.busy = false;
  friend.draggable = true;
}

// A happy hop straight up and back down.
async function jump(friend, height) {
  const { tweens } = friend.scene.engine;
  friend.pose?.('hop');
  await tweens.to(friend, { lift: height }, 0.16, ease.outQuad);
  await tweens.to(friend, { lift: 0 }, 0.2, ease.inQuad);
}

// A twirl right round on the spot.
async function twirl(friend) {
  friend.turn = 0;
  await friend.scene.engine.tweens.to(friend, { turn: 1 }, 0.5, ease.inOutSine);
  friend.turn = 0;
}

// A friend dropped on the girl: it lands beside her and they say hello —
// she waves, it waves back and hops for joy, hearts all round.
export async function greet(girl, friend) {
  const { scene } = girl;
  const { engine } = scene;
  girl.greeting = true;
  hold(friend);
  girl.cancelWalk();
  const side = friend.x < girl.x ? -1 : 1;
  await scene.putDown(friend, girl.x + side * 14, girl.y);
  girl.faceToward(friend.x);
  friend.facing = -side;
  engine.audio.play('boop');
  if (girl.onFeet) {
    girl.act('wave', 1.2); // (unless she's been picked up meanwhile)
  }
  for (let i = 0; i < 4; i++) {
    friend.pose?.(i % 2 ? 'wave2' : 'wave1');
    await engine.wait(0.25);
  }
  engine.audio.play('giggle');
  scene.hearts(girl.x, girl.y - 32, 2);
  await jump(friend, 10);
  scene.hearts(friend.x, friend.y - 24, 3);
  scene.sparkles(friend.x, friend.y - 16, 6);
  girl.say('heart', 1.4);
  girl.greeting = false;
  letGo(friend);
}

// One friend dropped on another: it lands beside them and they play — taking
// turns to bounce, then a twirl together and a giggle — before settling down
// side by side.
export async function play(friend, other) {
  const { scene } = other;
  const { engine } = scene;
  hold(friend);
  hold(other);
  let side = friend.x < other.x ? -1 : 1;
  const x = other.x + side * 16;
  if (x < WALK.minX || x > WALK.maxX) {
    side = -side; // no room against the wall: the other side, then
  }
  await scene.putDown(friend, other.x + side * 16, other.y);
  friend.facing = -side;
  other.facing = side;
  engine.audio.play('giggle');
  for (let i = 0; i < 4; i++) {
    const who = i % 2 ? friend : other;
    await jump(who, 8 + i * 2);
    who.pose?.('idle');
    scene.sparkles(who.x, who.y - 18, 4);
  }
  engine.audio.play('giggle');
  await Promise.all([twirl(friend), twirl(other)]);
  scene.hearts((friend.x + other.x) / 2, Math.min(friend.y, other.y) - 24, 3);
  scene.girl.faceToward(other.x);
  scene.girl.say('heart', 1.2);
  letGo(friend);
  letGo(other);
  if (engine.scene !== scene) {
    return; // she left mid-game; they're remembered where they landed
  }
  scene.settle(friend);
  scene.settle(other);
}

// A baby back with its mum (or dad): scooped up into a big cuddle and rocked,
// then set down beside them. `sound` is the grown-up's happy noise; a
// `sticker`, if given, is found as a thank-you, and a `memory`, if given, is
// remembered (see PlayScene.remember).
export async function cuddle(mum, baby, { sound = 'hoo', sticker = null, memory = null } = {}) {
  const { scene } = mum;
  const { engine, girl } = scene;
  hold(mum);
  hold(baby);
  const side = baby.x < mum.x ? -1 : 1;
  await scene.putDown(baby, mum.x + side * 10, mum.y + 1);
  mum.facing = side;
  baby.facing = -side;
  girl.faceToward(mum.x);
  engine.audio.play(sound);
  // Up into mum's arms...
  mum.frame = 'wave1';
  baby.frame = 'hop';
  await engine.tweens.to(baby, { lift: 10, x: mum.x + side * 5 }, 0.3, ease.outQuad);
  // ...and a gentle rock side to side.
  engine.audio.play('giggle');
  for (let i = 0; i < 4; i++) {
    mum.boing(0.5);
    baby.facing = i % 2 ? side : -side;
    await engine.wait(0.3);
    scene.hearts((mum.x + baby.x) / 2, mum.y - 32, 1);
  }
  mum.frame = 'blink';
  baby.frame = 'blink';
  await engine.wait(0.5);
  if (sticker) {
    scene.findSticker(sticker, mum.x, mum.y - 36);
  }
  if (memory) {
    scene.remember(memory);
  }
  // Back down beside her.
  baby.frame = 'hop';
  await engine.tweens.to(baby, { lift: 0, x: mum.x + side * 14 }, 0.3, ease.inQuad);
  girl.say('heart', 1.4);
  letGo(mum);
  letGo(baby);
  if (engine.scene !== scene) {
    return; // she left mid-cuddle; they're remembered where they landed
  }
  scene.settle(baby);
}
