import { ease } from '../../engine/tween.js';
import { CHAIR_H, CHAIR_W } from '../art/props.js';
import { CHAIR, PLANT, PORTHOLE, POSTER, SCREEN } from '../layout.js';

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
    this.comp = document.createElement('canvas');
    this.comp.width = CHAIR_W;
    this.comp.height = CHAIR_H + 8;
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
      c.drawImage(this.img.rear, 0, 8);
    } else {
      c.drawImage(this.img.back, 0, 8);
      if (this.occupied) {
        c.drawImage(this.scene.girl.currentFrame(), 3, 5);
      }
      c.drawImage(this.img.front, 0, 8);
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

// ---------------------------------------------------------------- space plant
export class Plant extends Prop {
  constructor(assets) {
    super();
    this.imgs = assets.plant;
    this.x = PLANT.x;
    this.y = PLANT.y;
    this.spot = PLANT.spot;
    this.glow = 0;
  }

  hitTest(px, py) {
    return inRect(px, py, this.x - 9, this.y - 28, 18, 28);
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

  update(dt) {
    this.glow = Math.max(0, this.glow - dt);
  }

  draw(r) {
    // Squash wide-and-short on the way down, like a boing.
    const sway = Math.sin(this.scene.engine.time * 1.3) * 0.03;
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
