import { ease } from '../../engine/tween.js';
import { FO } from '../art/mrMonkey.js';
import { CANOPY, TREE_HOUSE, deckSpot, ropeAngle, ropeEnd } from '../layout.js';
import { hold, isFriendItem, letGo } from './friends.js';
import { FarHouse } from './house.js';

// The things on planet Mr Monkey: the tree family's house far off at the
// back, and on the far stretch, the two tall climbing trees and the rope
// that swings between them. Climbing up and down, and swinging across, are
// the scene's (see MrMonkeyScene): these say when she's tapped them.

// ---------------------------------------------------------------- the house
// The tree family's house: a great big tree far off at the back of the
// forest, with its path of log slices up to the door. Tap it and she walks
// up the path and goes inside (see MrMonkeyScene).
export class TreeHouse extends FarHouse {
  constructor(assets) {
    super(assets.treeHouse, TREE_HOUSE);
  }
}

// ------------------------------------------------------- the climbing trees
// One of the two tall trees on the far stretch (`i`: 0 has the ladder, 1 the
// vine; see CANOPY.trees). Tap it and she climbs up to its platform, or back
// down if she's up there already. Its leaves rustle when tapped.
export class ClimbTree {
  constructor(assets, i) {
    this.i = i;
    this.img = assets.climbTrees[i];
    this.x = CANOPY.trees[i].x;
    this.y = CANOPY.foot;
  }

  // The trunk all the way up, or the platform reaching out from it.
  hitTest(px, py) {
    const { side } = CANOPY.trees[this.i];
    const deck = CANOPY.ground - CANOPY.deck;
    const onTrunk = Math.abs(px - this.x) <= CANOPY.trunk + 5 && py <= CANOPY.foot + 2;
    const onDeck = (px - this.x) * side >= 0 && (px - this.x) * side <= 36 && Math.abs(py - deck) <= 6;
    return onTrunk || onDeck;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('rustle');
    scene.bits(this.x, 14, 4, FO.leafLight);
    if (!scene.busy) {
      scene.useTree(this.i);
    }
  }

  draw(r) {
    r.image(this.img, this.x, CANOPY.foot + 1);
  }
}

// --------------------------------------------------------------- the rope
// Monkey and Gonzo always go far too fast on the rope, and smack into the
// tree on the other side.
export const SMACKERS = ['monkey', 'gonzo'];
export const smacksIntoTree = (kind) => SMACKERS.includes(kind);

// The angle the rope hangs at to reach someone up on tree i's platform...
export const deckAngle = (i) => ropeAngle(deckSpot(i).x);

// ...and the angle where someone swinging toward tree i hits its trunk.
export function smackAngle(i) {
  const tree = CANOPY.trees[i];
  return ropeAngle(tree.x + tree.side * (CANOPY.trunk + 6));
}

// The rope hanging from the big branch between the trees, hooked up beside
// one tree's platform (`side`). Tap it and she climbs up there and swings
// across to the other tree (see MrMonkeyScene.swing). Drop a friend on it and
// it scrambles up and swings across, landing on the far platform and
// hopping down; except Monkey and Gonzo, who go far too fast and SMACK into
// the far tree's trunk, and slide down it, seeing stars.
export class SwingRope {
  constructor(assets) {
    this.branch = assets.ropeBranch;
    this.x = CANOPY.rope.x;
    this.y = CANOPY.foot + 1; // in front of the trees, behind whoever's on the floor
    this.side = 0;
    this.angle = deckAngle(0);
    this.rider = null; // whoever's swinging on it: { place(end) } moves them along with it
    this.busy = false;
    this.dizzy = null; // a friend seeing stars after smacking into a tree
  }

  get end() {
    return ropeEnd(this.angle);
  }

  // Anywhere along it (it's thin, so generously).
  hitTest(px, py) {
    const { x: ax, y: ay } = CANOPY.rope;
    const { x: bx, y: by } = this.end;
    const len2 = (bx - ax) ** 2 + (by - ay) ** 2;
    const k = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / len2));
    return Math.hypot(px - (ax + (bx - ax) * k), py - (ay + (by - ay) * k)) <= 7;
  }

  onTap() {
    const { scene } = this;
    scene.engine.audio.play('tap');
    if (!scene.busy && !this.busy) {
      scene.swing();
    }
  }

  // Swings over to `angle` (and whoever's on it with it).
  swingTo(angle, seconds, easing = ease.inOutSine) {
    return this.scene.engine.tweens.to(this, { angle }, seconds, easing);
  }

  accepts(item) {
    return isFriendItem(item) && !this.busy && !this.scene.busy;
  }

  // A friend's dropped on it: up it scrambles and off it swings.
  async receive(friend) {
    const { scene } = this;
    const { engine, girl } = scene;
    const { tweens } = engine;
    hold(friend);
    this.busy = true;
    const from = this.side;
    const to = 1 - from;
    const grip = Math.max(8, (friend.height ?? 18) - 6);
    const ground = CANOPY.ground;
    // Up to the end of the rope.
    friend.lift = Math.max(0, ground - friend.y);
    friend.y = ground;
    friend.facing = CANOPY.trees[from].side;
    friend.pose?.('hop');
    const hands = this.end;
    await tweens.to(friend, { x: hands.x, lift: ground - (hands.y + grip) }, 0.35, ease.outQuad);
    this.rider = { place: (end) => Object.assign(friend, { x: end.x, lift: ground - (end.y + grip) }) };
    friend.pose?.('wave1');
    girl.faceToward(friend.x);
    if (smacksIntoTree(friend.kind)) {
      await this.smack(friend, from, to);
    } else {
      await this.swingAcross(friend, to);
    }
    letGo(friend);
    this.busy = false;
    if (engine.scene === scene) {
      scene.settle(friend);
    }
  }

  // Wheee, across to the far platform; a hop for joy, then down it jumps.
  async swingAcross(friend, to) {
    const { scene } = this;
    const { engine, girl } = scene;
    engine.audio.play('wheee');
    await this.swingTo(deckAngle(to), 1, ease.inOutSine);
    this.rider = null;
    this.side = to;
    engine.audio.play('cheer');
    friend.pose?.('hop');
    scene.hearts(friend.x, friend.headTop - 2, 2);
    await engine.wait(0.5);
    const landX = friend.x + CANOPY.trees[to].side * 10;
    await engine.tweens.to(friend, { x: landX, lift: 0 }, 0.45, ease.inQuad);
    engine.audio.play('land');
    scene.dust(friend.x, friend.y);
    friend.boing?.(1);
    girl.say('heart', 1.2);
  }

  // Far too fast... SMACK, flat against the far tree. The rope swings back
  // without them, and they slide all the way down the trunk, seeing stars.
  // Gonzo meant to do that ("TA-DA!"); Monkey just laughs.
  async smack(friend, from, to) {
    const { scene } = this;
    const { engine, girl } = scene;
    engine.audio.play(friend.kind === 'gonzo' ? 'drumroll' : 'oohooh');
    await engine.wait(0.35);
    engine.audio.play('wheee');
    await this.swingTo(smackAngle(to), 0.55, ease.inQuad);
    this.rider = null;
    engine.audio.play('smack');
    friend.pose?.('blink');
    friend.squash = -5; // squashed flat against the trunk
    scene.bits(CANOPY.trees[to].x, 12, 8, FO.leafLight); // leaves shaken down
    scene.bits(friend.x, friend.headTop, 4, '#ffe066');
    girl.say('bang', 1.2);
    if (girl.onFeet && !girl.perch) {
      girl.act('surprised', 0.8);
    }
    scene.findSticker('mrmonkey.smack', friend.x, friend.headTop - 6);
    const back = this.swingTo(deckAngle(from), 1.4, ease.outQuad);
    await engine.wait(0.6);
    engine.audio.play('scrape');
    await engine.tweens.to(friend, { lift: 0 }, 1.2, ease.inQuad);
    engine.audio.play('thud');
    scene.dust(friend.x, friend.y);
    friend.boing(1.5);
    this.dizzy = friend;
    engine.audio.play('wobble');
    await engine.wait(1.6);
    this.dizzy = null;
    friend.facing = girl.x < friend.x ? -1 : 1;
    if (friend.kind === 'gonzo') {
      engine.audio.play('tada');
      for (let i = 0; i < 4; i++) {
        friend.pose?.(i % 2 ? 'wave2' : 'wave1');
        await engine.wait(0.2);
      }
    } else {
      engine.audio.play('oohooh');
      friend.pose?.('hop');
      await engine.tweens.to(friend, { lift: 6 }, 0.15, ease.outQuad);
      await engine.tweens.to(friend, { lift: 0 }, 0.18, ease.inQuad);
    }
    girl.say('heart', 1.2);
    await back;
  }

  update() {
    this.rider?.place(this.end);
  }

  draw(r) {
    const { x: ax, y: ay } = CANOPY.rope;
    r.image(this.branch, ax, ay - 6, { ay: 0 });
    // The rope, twisted (light and dark), with a knot at the end.
    const { x: bx, y: by } = this.end;
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay));
    for (let i = 0; i <= steps; i++) {
      const x = ax + ((bx - ax) * i) / steps;
      const y = ay + ((by - ay) * i) / steps;
      r.rect(x, y, 1, 1, FO.rope);
      r.rect(x + 1, y, 1, 1, i % 3 ? FO.ropeDark : FO.rope);
    }
    r.rect(bx - 1, by, 4, 3, FO.ropeDark);
    r.rect(bx, by, 2, 2, FO.rope);
  }

  // Stars round the head of whoever's just smacked into a tree.
  drawOver(r) {
    const friend = this.dizzy;
    if (!friend) {
      return;
    }
    const t = this.scene.engine.time;
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + (i * Math.PI * 2) / 3;
      r.rect(friend.x + Math.cos(a) * 8, friend.headTop - 2 + Math.sin(a) * 2, 2, 2, i === 1 ? '#ffffff' : '#ffe066');
    }
  }
}
