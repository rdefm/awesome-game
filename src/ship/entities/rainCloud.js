import { RAIN } from '../art/bluebell.js';
import { HORIZON, RAIN_CLOUD } from '../layout.js';
import { Bluebell } from './bluebell.js';

export const RAIN_TIME = 4; // seconds a shower lasts
export const RAINBOW_TIME = 7; // and the rainbow after it
const PATTER_EVERY = 0.3; // seconds between drops plinking a bluebell under it
const SPLASH_EVERY = 0.3; // seconds between splashes as she walks through the puddle
const DRY_RATE = 1.3; // how much quicker the puddle dries than the rainbow fades
const DROPS = 26; // raindrops falling at once
const FALL = 140; // how fast they fall
const DEPTH = -250; // the rainbow and puddle: on the sky and the grass, behind everything

// -------------------------------------------------------------- rain cloud
// A fluffy little cloud floating low over the meadow. Tap it and it goes grey
// and rains on the patch under it: the bluebells there ring and ring, their
// bells swinging faster, and a puddle forms that she splashes in when she
// walks through it. When the rain stops a rainbow arcs over the meadow for a
// while, and the puddle dries up. Nothing about it is saved.
export class RainCloud {
  constructor(assets) {
    this.imgs = assets.rainCloud;
    this.x = RAIN_CLOUD.x;
    this.y = RAIN_CLOUD.y;
    this.depth = DEPTH;
    this.priority = 1; // wins the tap over a butterfly flitting past it
    this.raining = false;
    this.rained = 0; // how long it's been raining
    this.rainbow = 0; // seconds left of the rainbow
    this.puddle = 0; // how big the puddle is, 0..1
    this.patterIn = 0;
    this.splashIn = 0;
    this.nextBell = 0; // which bluebell under it the next drop plinks
  }

  hitTest(px, py) {
    const { tap } = RAIN_CLOUD;
    return Math.abs(px - this.x) <= tap.half && Math.abs(py - this.y) <= tap.h;
  }

  onTap() {
    const { scene } = this;
    scene.girl.faceToward(this.x);
    if (this.raining || this.rainbow > 0) {
      return;
    }
    this.raining = true;
    this.rained = 0;
    this.patterIn = PATTER_EVERY;
    scene.engine.audio.play('rain');
    scene.girl.say('note', 1.2);
  }

  // The giant bluebells under it (not any being carried about).
  bluebellsUnder() {
    return this.scene.entities.filter(
      (e) => e instanceof Bluebell && !e.held && !e.falling && Math.abs(e.bellsX - this.x) <= RAIN_CLOUD.half,
    );
  }

  // Whether (x, y) is in the puddle, as big as it is now.
  inPuddle(x, y) {
    const { puddle: p } = RAIN_CLOUD;
    const rx = p.half * this.puddle;
    const ry = p.h * this.puddle;
    return this.puddle > 0.2 && ((x - p.x) / rx) ** 2 + ((y - p.y) / ry) ** 2 <= 1;
  }

  update(dt) {
    if (this.raining) {
      this.rain(dt);
    } else if (this.rainbow > 0) {
      this.rainbow = Math.max(0, this.rainbow - dt);
      this.puddle = Math.max(0, this.puddle - (dt / RAINBOW_TIME) * DRY_RATE);
    }
    this.splashIn -= dt;
    const { girl } = this.scene;
    if (girl.mode === 'walk' && this.inPuddle(girl.x, girl.y) && this.splashIn <= 0) {
      this.scene.engine.audio.play('splash');
      this.scene.bits(girl.x, girl.y, 3, RAIN.puddleLight);
      this.scene.ripple(girl.x, girl.y);
      this.splashIn = SPLASH_EVERY;
    }
  }

  // Raining: the puddle filling, a drop plinking one of the bluebells under
  // it now and then (each in turn), and when it's done, the rainbow.
  rain(dt) {
    this.rained += dt;
    this.puddle = Math.min(1, this.puddle + dt / RAIN_TIME);
    this.patterIn -= dt;
    if (this.patterIn <= 0) {
      this.patterIn = PATTER_EVERY;
      const bells = this.bluebellsUnder();
      if (bells.length) {
        bells[this.nextBell++ % bells.length].patter();
      }
    }
    if (this.rained >= RAIN_TIME) {
      this.raining = false;
      this.rainbow = RAINBOW_TIME;
      const { scene } = this;
      scene.engine.audio.play('rainbow');
      scene.sparkles(this.x, this.y, 6);
      if (scene.girl.mode === 'idle') {
        scene.girl.faceToward(this.x);
        scene.girl.say('heart', 1.6);
      }
    }
  }

  // The rainbow (fading in and out) and the puddle.
  draw(r) {
    const { rainbow, puddle } = this.imgs;
    if (this.rainbow > 0) {
      const left = this.rainbow / RAINBOW_TIME;
      const alpha = 0.75 * Math.min(1, (1 - left) * 4, left * 3);
      r.image(rainbow, this.x, HORIZON + 8, { ay: 1, alpha });
    }
    if (this.puddle > 0) {
      const { puddle: p } = RAIN_CLOUD;
      r.image(puddle, p.x, p.y, { ay: 0.5, scaleX: this.puddle, scaleY: this.puddle });
    }
  }

  // The cloud itself, and its rain, over everything.
  drawOver(r) {
    const t = this.scene.engine.time;
    const shake = this.raining ? Math.round(Math.sin(t * 20)) * 0.5 : 0;
    const y = this.y + Math.round(Math.sin(t * 1.2) * 1.5);
    if (this.raining) {
      this.drawRain(r, t, y);
    }
    r.image(this.raining ? this.imgs.grey : this.imgs.fluffy, this.x + shake, y, { ay: 0.5 });
  }

  // Streaks of rain falling from it to the grass, each from its own spot
  // under it.
  drawRain(r, t, from) {
    const bottom = RAIN_CLOUD.puddle.y + 8;
    const fall = bottom - from;
    // Fading in as it starts and out as it stops.
    const alpha = Math.min(1, this.rained * 3, (RAIN_TIME - this.rained) * 3);
    for (let i = 0; i < DROPS; i++) {
      const x = this.x - RAIN_CLOUD.half + ((i * 37) % (RAIN_CLOUD.half * 2));
      const y = from + 4 + ((t * FALL + i * 53) % fall);
      if (y < bottom - ((i * 11) % 24)) {
        r.rect(x, y, 1, 3, RAIN.drop, alpha);
      }
    }
  }
}
