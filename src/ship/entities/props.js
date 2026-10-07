import { ease } from '../../engine/tween.js';
import { CHAIR_H, CHAIR_W, PLANT_STAGES } from '../art/props.js';
import { CHAIR, DOOR, PLANET_SPOT, PORTHOLE, POSTER, SCREEN, SNACK_LOCKER } from '../layout.js';
import { Carryable } from './carryable.js';
import { SNACKS } from './items.js';

const HEADROOM = 16;

const inRect = (px, py, x, y, w, h, pad = 3) => px >= x - pad && px <= x + w + pad && py >= y - pad && py <= y + h + pad;

// Shared "you touched me" feedback: a quick squash so every tap feels answered
// even while the girl is still walking over.
class Prop {
  constructor() {
    this.squash = 0;
  }

  onTap() {
    this.scene.engine.audio.play('tap');
    this.squash = 1;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.35, ease.outElastic);
    this.scene.interact(this);
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }
}

// ------------------------------------------------------------- pilot chair
export class Chair extends Prop {
  constructor(assets) {
    super();
    this.img = assets.chair;
    this.x = CHAIR.x;
    this.y = CHAIR.y;
    this.spot = CHAIR.spot;
    this.angle = 0;
    this.spinning = false;
    this.occupied = false;
    // Offscreen canvas where chair + girl are composed, so they spin as one.
    // Headroom above the chair lets her bounce in the seat.
    this.comp = document.createElement('canvas');
    this.comp.width = CHAIR_W;
    this.comp.height = CHAIR_H + HEADROOM;
    this.compCtx = this.comp.getContext('2d');
  }

  hitTest(px, py) {
    return inRect(px, py, this.x - 13, this.y - 36, 26, 36);
  }

  accepts(x, y) {
    return Math.abs(x - this.x) < 14 && y > this.y - 34 && y < this.y + 6;
  }

  async use() {
    if (!this.occupied) {
      await this.seat();
    }
    await this.spin();
  }

  async seat() {
    const girl = this.scene.girl;
    girl.cancelWalk();
    girl.pose = null;
    girl.x = this.x;
    girl.y = this.y + 1;
    girl.mode = 'seated';
    girl.lift = 0;
    this.occupied = true;
  }

  release() {
    if (!this.occupied) {
      return;
    }
    const girl = this.scene.girl;
    this.occupied = false;
    this.angle = 0;
    girl.mode = 'idle';
    girl.x = this.x + 16;
    girl.y = this.y;
  }

  async spin() {
    if (this.spinning) {
      return;
    }
    this.spinning = true;
    const girl = this.scene.girl;
    this.scene.engine.audio.play('wheee');
    if (this.occupied) {
      girl.act('sitCheer', 1.6);
    }
    this.angle = 0;
    await this.scene.engine.tweens.to(this, { angle: Math.PI * 6 }, 1.8, ease.outCubic);
    this.angle = 0;
    this.spinning = false;
    if (this.occupied) {
      girl.dizzy = 1.8;
    }
  }

  draw(r) {
    const c = this.compCtx;
    c.clearRect(0, 0, this.comp.width, this.comp.height);
    const facingAway = Math.cos(this.angle) < 0;
    if (facingAway) {
      c.drawImage(this.img.rear, 0, HEADROOM);
    } else {
      c.drawImage(this.img.back, 0, HEADROOM);
      if (this.occupied) {
        c.drawImage(this.scene.girl.currentFrame(), 3, HEADROOM - 3 - Math.round(this.scene.girl.lift));
      }
      c.drawImage(this.img.front, 0, HEADROOM);
    }
    r.rect(this.x - 12, this.y - 1, 24, 2, '#000000', 0.25);
    // Fake 3D spin: squash horizontally by |cos|, swap to the rear view halfway.
    const sx = Math.max(0.08, Math.abs(Math.cos(this.angle))) * this.bounce;
    r.image(this.comp, this.x, this.y + 1, { scaleX: sx, scaleY: 2 - this.bounce });
  }
}

// ------------------------------------------------------------- porthole alien
export class Porthole extends Prop {
  constructor(assets) {
    super();
    this.aliens = assets.aliens;
    this.spot = PORTHOLE.spot;
    this.depth = -10;
    this.peek = 0; // 0 = hidden below the rim, 1 = fully up
    this.frame = 'idle';
    this.colorIndex = 0;
    this.busy = false;
  }

  hitTest(px, py) {
    return Math.hypot(px - PORTHOLE.x, py - PORTHOLE.y) <= PORTHOLE.r + 6;
  }

  async use() {
    if (this.busy) {
      return;
    }
    this.busy = true;
    const { engine, girl } = this.scene;
    const tw = engine.tweens;
    this.colorIndex = (this.colorIndex + 1) % this.aliens.length;
    this.frame = 'idle';
    engine.audio.play('peek');
    girl.faceToward(PORTHOLE.x);
    await tw.to(this, { peek: 1 }, 0.6, ease.outBack);
    girl.say('bang', 0.8);
    await engine.wait(0.3);
    engine.audio.play('boop');
    girl.act('wave', 1.8);
    for (let i = 0; i < 8; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      await engine.wait(0.2);
    }
    this.frame = 'blink';
    await engine.wait(0.15);
    this.frame = 'idle';
    await engine.wait(0.4);
    engine.audio.play('hide');
    await tw.to(this, { peek: 0 }, 0.4, ease.inQuad);
    girl.say('heart');
    this.busy = false;
  }

  // Called from the scene's "behind the room" layer so the wall masks him.
  drawBehind(r) {
    if (this.peek <= 0) {
      return;
    }
    const img = this.aliens[this.colorIndex][this.frame];
    const bob = this.frame === 'idle' ? Math.sin(this.scene.engine.time * 6) * 0.6 : 0;
    r.image(img, PORTHOLE.x, PORTHOLE.y + 26 - this.peek * 18 + bob, { ay: 1 });
  }

  draw(r) {
    // A small glint sweeping across the glass hints that it's tappable.
    const t = (this.scene.engine.time * 0.4) % 3;
    if (t < 1) {
      const gx = PORTHOLE.x - 8 + t * 16;
      for (let i = 0; i < 4; i++) {
        r.pixel(gx + i, PORTHOLE.y - 6 + i, '#ffffff', 0.35);
      }
    }
  }
}

// -------------------------------------------------------------- rocket poster
export class Poster extends Prop {
  constructor(assets) {
    super();
    this.imgs = assets.poster;
    this.spot = POSTER.spot;
    this.depth = -10;
    this.flicker = false;
  }

  hitTest(px, py) {
    return inRect(px, py, POSTER.x, POSTER.y, POSTER.w, POSTER.h);
  }

  use() {
    this.scene.girl.act('reach', 0.4);
    this.scene.blastOff();
  }

  draw(r) {
    const flame = this.flicker ? Math.floor(this.scene.engine.time * 20) % 2 : Math.floor(this.scene.engine.time * 3) % 2;
    const s = this.bounce;
    r.image(this.imgs[flame], POSTER.x + POSTER.w / 2, POSTER.y + POSTER.h / 2, { ay: 0.5, scaleX: s, scaleY: s });
  }
}

// ------------------------------------------------------------- snack locker
// The right-hand locker. Tap it and she walks over and swings the door open
// on a shelf of snacks: drag one out, or tap one to pop it onto the floor.
// Shut the door and open it again and the shelves are full again.
const SWING = Math.PI * 0.75; // how far the door swings round when wide open

export class SnackLocker extends Prop {
  constructor(assets) {
    super();
    this.assets = assets;
    this.spot = SNACK_LOCKER.spot;
    this.depth = -10;
    this.open = 0; // 0 = shut, 1 = swung wide
    this.isOpen = false;
    this.swinging = false;
    this.shelves = [...SNACKS]; // the snack on each shelf (null once taken)
    this.pulling = null; // a snack being dragged off a shelf
  }

  // Only the snacks inside can be dragged out.
  get draggable() {
    return this.isOpen;
  }

  hitTest(px, py) {
    const { x, y, w, h } = SNACK_LOCKER;
    return inRect(px, py, x, y, w + (this.isOpen ? 12 : 0), h);
  }

  // Which shelf's snack is under the point (-1 if none, or the door's in the way).
  shelfAt(px, py) {
    if (!this.isOpen || this.open < 0.6) {
      return -1;
    }
    return SNACK_LOCKER.shelves.findIndex((s, i) => this.shelves[i] && Math.abs(px - s.x) <= 7 && py >= s.y - 13 && py <= s.y + 2);
  }

  // Off the shelf and into the world, as a brand-new snack.
  take(i, x, y) {
    const item = this.scene.spawn(this.shelves[i], x, y);
    if (item) {
      this.shelves[i] = null;
    }
    return item;
  }

  onTap(p) {
    const i = this.shelfAt(p.x, p.y);
    if (i < 0) {
      super.onTap(p);
      return;
    }
    const shelf = SNACK_LOCKER.shelves[i];
    const item = this.take(i, shelf.x, shelf.y);
    if (item) {
      this.scene.engine.audio.play('unpack');
      this.scene.sparkles(shelf.x, shelf.y - 6, 4);
      this.scene.putDown(item, shelf.x, this.spot.y + 6);
    }
  }

  async use() {
    if (this.swinging) {
      return;
    }
    this.swinging = true;
    const { girl } = this.scene;
    girl.faceToward(SNACK_LOCKER.x);
    girl.act('reach', 0.4);
    await this.swing(!this.isOpen);
    if (this.isOpen) {
      girl.say('heart', 1);
    }
    this.swinging = false;
  }

  async swing(open) {
    const { engine } = this.scene;
    if (open) {
      this.shelves = [...SNACKS]; // restocked while nobody was looking
    }
    this.isOpen = open;
    engine.audio.play(open ? 'lockerOpen' : 'lockerShut');
    await engine.tweens.to(this, { open: open ? 1 : 0 }, open ? 0.45 : 0.3, open ? ease.outBack : ease.inQuad);
  }

  onDragStart(p) {
    const i = this.shelfAt(p.x, p.y);
    const item = i < 0 ? null : this.take(i, p.x, p.y);
    if (!item) {
      return;
    }
    this.pulling = item;
    item.onDragStart(p);
    item.grab = { x: 0, y: 8 }; // hang it just below the fingertip
  }

  onDrag(p) {
    this.pulling?.onDrag(p);
  }

  // A wobbly tap on the door (not on a snack) still counts as a tap.
  onDrop(p) {
    const item = this.pulling;
    this.pulling = null;
    if (item) {
      item.onDrop(p);
    } else {
      this.onTap(p);
    }
  }

  draw(r) {
    const { x, y, w, shelves } = SNACK_LOCKER;
    if (this.open > 0) {
      shelves.forEach((s, i) => {
        if (this.shelves[i]) {
          r.image(this.assets.snacks[this.shelves[i]], s.x, s.y);
        }
      });
    }
    // Fake 3D swing about the hinge: the front narrows away, then the inside
    // of the door comes round past the hinge.
    const turn = Math.cos(this.open * SWING) * (2 - this.bounce);
    const door = this.assets.lockerDoor;
    if (turn > 0) {
      r.image(door.front, x + w, y, { ax: 1, ay: 0, scaleX: turn });
    } else {
      r.image(door.back, x + w, y, { ax: 0, ay: 0, scaleX: -turn });
    }
  }
}

// ---------------------------------------------------------------- space plant
// How grown a plant's world entry says it is (0 = just a sprout in a pot).
export function plantStage(state) {
  return Math.max(0, Math.min(PLANT_STAGES - 1, Math.floor(state.stage) || 0));
}

export class Plant extends Carryable {
  constructor(assets, state) {
    super(state);
    this.stages = assets.plant;
    this.stage = plantStage(state);
    this.glow = 0;
    this.busy = false;
  }

  get imgs() {
    return this.stages[this.stage];
  }

  hitTest(px, py) {
    const { width, height } = this.imgs[0];
    return inRect(px, py, this.x - width / 2, this.y - height, width, height);
  }

  async use() {
    const { engine, girl } = this.scene;
    engine.audio.play('boing');
    engine.audio.play('chime');
    this.squash = 1.6;
    engine.tweens.to(this, { squash: 0 }, 0.8, ease.outElastic);
    this.glow = 2.5;
    this.scene.sparkles(this.x, this.y - 18, 8);
    girl.faceToward(this.x);
    girl.say('star');
    await girl.act('cheer', 0.8);
  }

  // A giant bluebell dropped on it makes it grow (until it's in full flower).
  accepts(item) {
    return item.kind === 'bluebell' && this.stage < PLANT_STAGES - 1 && !this.busy && !this.held && !this.falling;
  }

  async receive(item) {
    this.busy = true;
    this.draggable = false; // stay put until it's done growing
    const { scene } = this;
    const { engine, girl } = scene;
    // The bluebell gets planted beside it.
    const side = item.x < this.x ? -1 : 1;
    scene.putDown(item, this.x + side * 18, this.y + 1);
    girl.faceToward(this.x);
    engine.audio.play('grow');
    // Remembered straight away, in case she leaves before it's done.
    const stage = this.stage + 1;
    scene.saveStage(this, stage);
    // Stretch up tall, pop out a size bigger, and wobble.
    await engine.tweens.to(this, { squash: -2 }, 0.3, ease.inQuad);
    this.stage = stage;
    this.glow = 2.5;
    scene.sparkles(this.x, this.y - this.imgs[0].height + 4, 10);
    this.squash = 1.6;
    await engine.tweens.to(this, { squash: 0 }, 0.8, ease.outElastic);
    girl.say('star');
    this.busy = false;
    this.draggable = true;
  }

  update(dt) {
    this.glow = Math.max(0, this.glow - dt);
  }

  draw(r) {
    // Squash wide-and-short on the way down, like a boing.
    const sway = Math.sin(this.scene.engine.time * 1.3) * 0.03;
    if (this.held || this.falling) {
      this.shadow(r, 12);
    }
    r.image(this.imgs[this.glow > 0 && Math.floor(this.glow * 8) % 3 ? 1 : 0], this.x, this.y + 1, {
      scaleX: this.bounce + sway, scaleY: 2 - this.bounce,
    });
  }
}

// ------------------------------------------------------------ console screen
export class ConsoleScreen extends Prop {
  constructor(assets) {
    super();
    this.assets = assets;
    this.spot = SCREEN.spot;
    this.depth = -10;
    this.countdown = null;
    this.lights = Array.from({ length: 8 }, (_, i) => ({ phase: i * 1.7, rate: 1 + (i % 3) * 0.7 }));
  }

  hitTest(px, py) {
    return inRect(px, py, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 5);
  }

  async use() {
    this.scene.girl.act('reach', 0.5);
    await this.scene.engine.wait(0.25);
    this.scene.openMap();
  }

  draw(r) {
    const { x, y, w, h } = SCREEN;
    const t = this.scene.engine.time;
    const alert = this.scene.alert;
    if (this.countdown != null) {
      const img = this.assets.text(String(this.countdown), alert ? '#ff5a5a' : '#7cf28a', { scale: 2 });
      r.image(img, x + w / 2, y + h / 2, { ay: 0.5 });
    } else {
      // Idle: a gently scrolling signal trace and the planet we're orbiting.
      for (let i = 0; i < w; i++) {
        const v = Math.sin(i * 0.35 + t * 4) * 2.5 + Math.sin(i * 0.9 - t * 2) * 1;
        r.pixel(x + i, y + 5 + Math.round(v), '#3fd0c9', 0.9);
      }
      const name = this.scene.planet.name;
      r.image(this.assets.text(name, '#7cf28a'), x + w / 2, y + h - 2, { ay: 1 });
      if (Math.floor(t * 2) % 2) {
        r.pixel(x + w - 3, y + 2, '#7cf28a');
      }
    }
    // Scanlines.
    for (let yy = y; yy < y + h; yy += 2) {
      r.rect(x, yy, w, 1, '#000000', 0.18);
    }
    // Blinking control lights either side of the screen.
    const colors = alert ? ['#ff5a5a', '#ff9d3c'] : ['#7cf28a', '#ffe066', '#3fd0c9', '#ff8fc8'];
    this.lights.forEach((l, i) => {
      const on = Math.sin(t * l.rate * (alert ? 4 : 1) + l.phase) > 0;
      const lx = i < 4 ? 183 + (i % 2) * 5 : 239 + (i % 2) * 5;
      const ly = i < 4 ? 96 + Math.floor(i / 2) * 5 : 100 + Math.floor((i - 4) / 2) * 5;
      r.rect(lx, ly, 3, 2, on ? colors[i % colors.length] : '#2a3150');
    });
  }
}

// ------------------------------------------------------------- airlock door
export class Door extends Prop {
  constructor() {
    super();
    this.spot = DOOR.spot;
    this.depth = -10;
    this.open = 0; // 0 = shut, 1 = panels fully slid apart
    this.denied = 0;
  }

  hitTest(px, py) {
    return inRect(px, py, DOOR.x, DOOR.y - 4, DOOR.w, DOOR.h + 4);
  }

  onTap(p) {
    const { scene } = this;
    if (scene.busy) {
      return;
    }
    if (!scene.landed) {
      // Locked in space: buzz, flash the light and wobble the panels.
      scene.engine.audio.play('denied');
      this.denied = 0.8;
      this.squash = 1;
      scene.engine.tweens.to(this, { squash: 0 }, 0.35, ease.outElastic);
      scene.girl.say('question', 1);
      scene.toast('LAND ON A PLANET FIRST!');
      return;
    }
    super.onTap(p);
  }

  use() {
    this.scene.exitShip();
  }

  async slide(to) {
    this.scene.engine.audio.play('door');
    await this.scene.engine.tweens.to(this, { open: to }, 0.45, to ? ease.outCubic : ease.inQuad);
  }

  update(dt) {
    this.denied = Math.max(0, this.denied - dt);
  }

  // Panels go behind the room layer so the door frame hides their edges.
  drawBehind(r) {
    const { x, y, w, h } = DOOR;
    const half = w / 2;
    const shown = half * (1 - this.open);
    const wobble = this.squash ? Math.round(Math.sin(this.scene.engine.time * 60) * this.squash) : 0;
    if (shown < 0.5) {
      return;
    }
    for (const side of [0, 1]) {
      const px = side ? x + w - shown : x;
      r.rect(px + wobble, y, shown, h, '#7d88ab');
      r.rect(px + wobble + (side ? 0 : shown - 1), y, 1, h, '#4d5677');
      r.rect(px + wobble + (side ? 1 : 0), y, 1, h, '#b4bdd6');
      // A little window slit in each panel.
      if (shown > 4) {
        r.rect(px + wobble + (side ? 2 : shown - 6), y + 10, 4, 10, '#114a55');
      }
    }
  }

  draw(r) {
    // Status light above the door: red = locked (in space), green = open sesame.
    const t = this.scene.engine.time;
    const landed = this.scene.landed;
    let color = '#b8323f';
    if (this.denied > 0) {
      color = Math.floor(this.denied * 10) % 2 ? '#ff5a5a' : '#4d1520';
    } else if (landed) {
      color = Math.sin(t * 4) > -0.3 ? '#7cf28a' : '#2f9e57';
    }
    r.rect(DOOR.x + DOOR.w / 2 - 3, DOOR.y - 9, 6, 3, '#1b1427');
    r.rect(DOOR.x + DOOR.w / 2 - 2, DOOR.y - 8, 4, 1, color);
    if (landed && this.open === 0 && !this.scene.busy && Math.floor(t * 1.5) % 2) {
      // A bouncing arrow inviting a tap.
      const bob = Math.round(Math.sin(t * 5) * 1.5);
      r.image(this.scene.assets.text('V', '#7cf28a', { outline: '#1b1427' }), DOOR.x + DOOR.w / 2, DOOR.y + 14 + bob, { ay: 1 });
    }
  }
}

// ------------------------------------------------------ planet in windshield
// The planet outside isn't drawn here (the scene draws it in the space layer);
// this just makes it tappable so the girl can fly down and land on it.
export class WindowPlanet {
  constructor() {
    this.depth = -20;
  }

  get available() {
    const scene = this.scene;
    return !scene.landed && !scene.busy && scene.planetZoom === 0 && Math.abs(scene.planetSlide) < 0.05;
  }

  // Stays tappable while busy so an excited double-tap doesn't fall through
  // to "walk here" and cancel the landing.
  hitTest(px, py) {
    return !this.scene.landed && Math.hypot(px - PLANET_SPOT.x, py - PLANET_SPOT.y) < 22;
  }

  onTap() {
    if (!this.available) {
      return;
    }
    this.scene.engine.audio.play('tap');
    this.scene.land();
  }

  draw(r) {
    const scene = this.scene;
    const t = scene.engine.time;
    if (this.available && scene.planet.landable && Math.floor(t * 1.2) % 3 !== 0) {
      r.image(scene.assets.text('LAND', '#7cf28a', { outline: '#1b1427' }), PLANET_SPOT.x, 70, { ay: 1 });
    }
  }
}
