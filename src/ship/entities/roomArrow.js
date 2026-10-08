import { ease } from '../../engine/tween.js';
import { ROOM_ARROW, W, WALK } from '../layout.js';
import { BLOCK_INPUT } from '../playScene.js';
import { ROOM_NAMES, roomBeside, shipRoomScene } from '../shipRooms.js';
import { place } from '../world.js';
import { clampToFloor } from './girl.js';

// Just inside the side wall on `side` (-1 left, 1 right), where she (or
// anything sent through) comes in from the room next door.
const entryX = (side) => (side < 0 ? 34 : W - 34);

// Where she starts when she's coming in through the wall on `enter.side`,
// at height `enter.y`: just out of sight beyond it.
export function startBeyondWall(enter) {
  return { x: enter.side < 0 ? -10 : W + 10, y: enter.y };
}

// She steps in through the wall from the room next door.
export function walkIn(scene, enter) {
  scene.girl.walkTo(entryX(enter.side), enter.y);
}

// An arrow by each side wall of the ship's rooms that has a room beyond it.
export function addRoomArrows(scene) {
  for (const side of [-1, 1]) {
    const to = roomBeside(scene.where, side);
    if (to) {
      scene.add(new RoomArrow(scene.assets, side, to));
    }
  }
}

// Tap it and she walks off through the wall into room `to`. Drop something
// on it and it's sent through on its own.
export class RoomArrow {
  constructor(assets, side, to) {
    this.img = assets.roomArrow;
    this.label = assets.text(ROOM_NAMES[to], '#e1e6f2', { outline: '#1b1427' });
    this.side = side;
    this.to = to;
    this.x = side < 0 ? ROOM_ARROW.left : ROOM_ARROW.right;
    this.y = ROOM_ARROW.y;
    this.depth = 999; // above everything on the floor (only things being carried go higher)
    this.priority = 20; // wins over her, standing right in front of it
    this.nudge = 0;
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) <= 11 && Math.abs(py - this.y) <= 14;
  }

  poke() {
    this.nudge = 1;
    this.scene.engine.tweens.to(this, { nudge: 0 }, 0.4, ease.outQuad);
  }

  onTap() {
    if (this.scene.busy) {
      return;
    }
    this.scene.engine.audio.play('tap');
    this.poke();
    this.go();
  }

  // Off to the wall, out of sight, and into the room beyond.
  async go() {
    const { scene } = this;
    const { girl, engine } = scene;
    if (girl.mode === 'held') {
      return;
    }
    const arrived = await girl.walkTo(this.side < 0 ? WALK.minX : WALK.maxX, girl.y);
    if (!arrived || scene.busy || engine.scene !== scene) {
      return;
    }
    scene.busy = true;
    scene.modal = BLOCK_INPUT;
    const enter = { side: -this.side, y: Math.round(girl.y) };
    girl.mode = 'walk';
    girl.facing = this.side;
    engine.tweens.to(girl, { x: girl.x + this.side * 24 }, 0.4, ease.linear);
    await scene.leaveTo(() => shipRoomScene(this.to, scene.assets, { enter }));
  }

  accepts() {
    return !this.scene.busy;
  }

  receive(item) {
    const { scene } = this;
    const x = entryX(-this.side) + (Math.random() - 0.5) * 16;
    const y = WALK.minY + 4 + Math.random() * 24;
    // (Every ship room has a wall, so wall decor goes straight up on it.)
    const spot = item.restingSpot?.(x, y) ?? clampToFloor(x, y);
    scene.remove(item);
    scene.engine.tweens.cancel(item);
    scene.world = place(scene.world, item.id, this.to, spot.x, spot.y);
    scene.saveWorld();
    scene.engine.audio.play('stash');
    scene.sparkles(this.x, this.y, 6);
    scene.toast(`OFF TO THE ${ROOM_NAMES[this.to]}!`);
    this.poke();
  }

  draw(r) {
    const t = this.scene.engine.time;
    const alpha = this.scene.busy ? 0.35 : 1;
    const x = this.x + this.side * (Math.round(Math.sin(t * 4) * 1.5) + this.nudge * 3);
    r.image(this.img, x, this.y, { ay: 0.5, flipX: this.side < 0, alpha });
    r.image(this.label, this.side < 0 ? 2 : W - 2, this.y - 10, { ax: this.side < 0 ? 0 : 1, alpha });
  }
}
