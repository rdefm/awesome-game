import { Synth } from './audio.js';
import { Tweens } from './tween.js';

// Converts a Pixmap into something the canvas can draw quickly.
export function toImage(pm) {
  const canvas = document.createElement('canvas');
  canvas.width = pm.width;
  canvas.height = pm.height;
  canvas.getContext('2d').putImageData(new ImageData(pm.data, pm.width, pm.height), 0, 0);
  return canvas;
}

// Thin wrapper over the 2D context: integer-snapped, anchor-aware sprite drawing
// plus a global offset used for screen shake.
export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  // (x, y) is the anchor point; ax/ay pick it within the image (0.5, 1 = bottom centre).
  image(img, x, y, { ax = 0.5, ay = 1, flipX = false, scaleX = 1, scaleY = 1, alpha = 1 } = {}) {
    const w = img.width * Math.abs(scaleX);
    const h = img.height * scaleY;
    if (w < 0.5 || h < 0.5 || alpha <= 0) {
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    const left = Math.round(x + this.offsetX - w * ax);
    const top = Math.round(y + this.offsetY - h * ay);
    if (flipX !== scaleX < 0) {
      ctx.translate(left + Math.round(w), top);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, Math.round(w), Math.round(h));
    } else {
      ctx.drawImage(img, left, top, Math.round(w), Math.round(h));
    }
    ctx.restore();
  }

  rect(x, y, w, h, color, alpha = 1) {
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x + this.offsetX), Math.round(y + this.offsetY), Math.round(w), Math.round(h));
    this.ctx.globalAlpha = 1;
  }

  pixel(x, y, color, alpha = 1) {
    this.rect(x, y, 1, 1, color, alpha);
  }
}

// Owns the canvas, the main loop, pointer input and the active scene. The game
// renders at a tiny fixed resolution and the canvas is scaled up with crisp,
// nearest-neighbour pixels to fill the screen.
export class Engine {
  constructor({ parent, width, height }) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.imageRendering = 'pixelated';
    this.canvas.style.touchAction = 'none';
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.renderer = new Renderer(this.ctx);
    this.audio = new Synth();
    this.tweens = new Tweens();
    this.time = 0;
    this.scene = null;

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
    this.bindInput();
  }

  resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fit = Math.min(vw / this.width, vh / this.height);
    // Whole-number scaling keeps every pixel the same size; only fall back to
    // fractional scaling when that would waste too much of the screen.
    const whole = Math.floor(fit);
    const scale = whole >= 1 && whole / fit > 0.85 ? whole : fit;
    this.canvas.style.width = `${Math.floor(this.width * scale)}px`;
    this.canvas.style.height = `${Math.floor(this.height * scale)}px`;
  }

  toGame(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * this.width,
      y: ((e.clientY - r.top) / r.height) * this.height,
    };
  }

  bindInput() {
    let activeId = null;
    this.canvas.addEventListener('pointerdown', (e) => {
      this.audio.unlock();
      if (activeId !== null) {
        return; // one finger at a time keeps things predictable for kids
      }
      activeId = e.pointerId;
      this.canvas.setPointerCapture(e.pointerId);
      this.scene?.pointerDown(this.toGame(e));
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId === activeId) {
        this.scene?.pointerMove(this.toGame(e));
      }
    });
    const end = (e) => {
      if (e.pointerId === activeId) {
        activeId = null;
        this.scene?.pointerUp(this.toGame(e));
      }
    };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
  }

  setScene(scene) {
    this.scene = scene;
    scene.engine = this;
    scene.enter?.();
  }

  wait(seconds) {
    return this.tweens.wait(seconds);
  }

  start() {
    let last = performance.now();
    const frame = (now) => {
      // Clamp so a backgrounded tab doesn't come back with one giant step.
      const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 20));
      last = now;
      this.time += dt;
      this.tweens.update(dt);
      if (this.scene) {
        this.scene.update(dt);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.scene.draw(this.renderer);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
