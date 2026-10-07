import { ease } from '../engine/tween.js';
import { iconFor, isFriend } from './kinds.js';
import { W, H } from './layout.js';
import { bagContents } from './world.js';

// The bag button sits in the bottom-left corner; tapping it slides a tray up
// from the bottom showing what's inside, in two pockets: things and friends.
const BTN = { x: 2, y: H - 21, w: 20, h: 20 };
const TRAY_H = 28;
const TAB_X = 25;
const TAB_W = 16;
const SLOTS_X = 44;
const SLOT_W = 24;
const SLOTS_W = W - SLOTS_X - 2;
const PULL_DISTANCE = 6; // drag a slot upward this far to pull the thing out

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const inBox = (p, x, y, w, h, pad = 0) => p.x >= x - pad && p.x <= x + w + pad && p.y >= y - pad && p.y <= y + h + pad;

// UI overlay owned by a PlayScene. It gets first look at every press (see
// PlayScene.pointerDown) and hands drags of bag contents over to the scene.
export class Bag {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.open = 0; // tray slide, 0..1
    this.friends = false; // which pocket is showing
    this.scroll = 0;
    this.gulp = 0; // swallow wobble after something goes in
    this.press = null;
  }

  get assets() {
    return this.scene.assets;
  }

  // Hidden while anything else (the map, a cutscene) has the screen.
  get visible() {
    return !this.scene.modal;
  }

  get trayTop() {
    return H - TRAY_H * this.open;
  }

  get center() {
    return { x: BTN.x + BTN.w / 2, y: BTN.y + BTN.h / 2 };
  }

  // The pocket's contents, minus whatever's currently being dragged out.
  contents() {
    const carried = this.scene.carried?.id;
    return bagContents(this.scene.world, isFriend, this.friends).filter((e) => e.id !== carried);
  }

  get maxScroll() {
    return Math.max(0, this.contents().length * SLOT_W - SLOTS_W);
  }

  onButton(p, pad = 2) {
    return inBox(p, BTN.x, BTN.y, BTN.w, BTN.h, pad);
  }

  inTray(p) {
    return this.isOpen && p.y >= this.trayTop;
  }

  hitTest(p) {
    return this.visible && (this.onButton(p) || this.inTray(p));
  }

  // Dropping a dragged thing here puts it in the bag. Generous, for wobbly fingers.
  isDropTarget(p) {
    return this.visible && (this.onButton(p, 8) || this.inTray(p));
  }

  setOpen(open) {
    if (open === this.isOpen) {
      return;
    }
    this.isOpen = open;
    this.scene.engine.audio.play(open ? 'open' : 'close');
    this.scene.engine.tweens.cancel(this);
    this.scene.engine.tweens.to(this, { open: open ? 1 : 0 }, 0.2, open ? ease.outCubic : ease.inQuad);
  }

  swallow() {
    this.gulp = 1;
  }

  slotAt(p) {
    return this.contents()[Math.floor((p.x - SLOTS_X + this.scroll) / SLOT_W)] ?? null;
  }

  pointerDown(p) {
    if (this.onButton(p)) {
      this.press = { on: 'button' };
    } else if (p.x >= TAB_X && p.x < SLOTS_X) {
      this.press = { on: 'tab', friends: p.y >= this.trayTop + TRAY_H / 2 };
    } else if (p.x >= SLOTS_X) {
      this.press = { on: 'slot', start: p, scroll: this.scroll, entry: this.slotAt(p), mode: null };
    } else {
      this.press = { on: 'tray' };
    }
  }

  pointerMove(p) {
    const press = this.press;
    if (press?.on !== 'slot') {
      return;
    }
    const dx = p.x - press.start.x;
    const dy = p.y - press.start.y;
    // Upward pulls a thing out into the scene (even diagonally, and even
    // after scrolling a bit, once the finger leaves the tray); sideways scrolls.
    const upward = Math.hypot(dx, dy) > PULL_DISTANCE && -dy > Math.abs(dx) * 0.6;
    const pull = press.mode ? this.slotAt(p) : press.entry;
    if (pull && ((!press.mode && upward) || p.y < this.trayTop - 4)) {
      this.press = null;
      this.setOpen(false);
      this.scene.takeFromBag(pull, p);
      return;
    }
    if (!press.mode && Math.hypot(dx, dy) > PULL_DISTANCE) {
      press.mode = 'scroll';
    }
    if (press.mode === 'scroll') {
      this.scroll = clamp(press.scroll - dx, 0, this.maxScroll);
    }
  }

  pointerUp(p) {
    const press = this.press;
    this.press = null;
    if (press?.on === 'button' && this.onButton(p, 6)) {
      this.setOpen(!this.isOpen);
    } else if (press?.on === 'tab' && press.friends !== this.friends) {
      this.friends = press.friends;
      this.scroll = 0;
      this.scene.engine.audio.play('select');
    } else if (press?.on === 'slot' && !press.mode && press.entry) {
      // A plain tap pops it out right next to her.
      this.scene.placeFromBag(press.entry);
    }
  }

  update(dt) {
    this.gulp = Math.max(0, this.gulp - dt * 3);
    this.scroll = clamp(this.scroll, 0, this.maxScroll);
  }

  draw(r) {
    if (!this.visible) {
      return;
    }
    if (this.open > 0.01) {
      this.drawTray(r);
    }
    // The button: bobs with its mouth open while something's being dragged,
    // inviting her to drop it in.
    const t = this.scene.engine.time;
    const carrying = Boolean(this.scene.carried);
    const s = (carrying ? 1.1 + Math.sin(t * 8) * 0.08 : 1) + this.gulp * 0.25;
    const img = carrying || this.gulp > 0 ? this.assets.bag.open : this.assets.bag.shut;
    if (!this.isOpen) {
      r.rect(BTN.x, BTN.y, BTN.w, BTN.h, '#1b1427', 0.3);
    }
    r.image(img, BTN.x + BTN.w / 2, BTN.y + BTN.h / 2 + 1, { ay: 0.5, scaleX: s, scaleY: s });
  }

  drawTray(r) {
    const top = this.trayTop;
    r.rect(0, top, W, TRAY_H, '#1b1427', 0.92);
    r.rect(0, top, W, 1, '#64729f');

    // Pocket tabs: things on top, friends below.
    for (const friends of [false, true]) {
      const ty = top + 2 + (friends ? 12 : 0);
      r.rect(TAB_X, ty, TAB_W, 11, friends === this.friends ? '#4b5784' : '#2a3150');
      r.image(friends ? this.assets.heartIcon : this.assets.boxIcon, TAB_X + TAB_W / 2, ty + 6, { ay: 0.5 });
    }

    const items = this.contents();
    const ctx = r.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(SLOTS_X, top, SLOTS_W, TRAY_H);
    ctx.clip();
    if (!items.length) {
      const hint = this.friends ? 'DRAG FRIENDS ONTO THE BAG' : 'DRAG THINGS ONTO THE BAG';
      r.image(this.assets.text(hint, '#8b93b8'), SLOTS_X + SLOTS_W / 2, top + TRAY_H / 2, { ay: 0.5 });
    }
    items.forEach((entry, i) => {
      const sx = SLOTS_X + i * SLOT_W - this.scroll;
      if (sx < SLOTS_X - SLOT_W || sx > W) {
        return;
      }
      const pressed = this.press?.entry === entry && !this.press.mode;
      r.rect(sx + 1, top + 2, SLOT_W - 2, TRAY_H - 4, pressed ? '#4b5784' : '#2a3150');
      // Shrink big things (like a giant bluebell) to fit the slot.
      const icon = iconFor(this.assets, entry);
      const k = Math.min(1, (SLOT_W - 4) / icon.width, (TRAY_H - 6) / icon.height);
      r.image(icon, sx + SLOT_W / 2, top + TRAY_H / 2 - (pressed ? 1 : 0), { ay: 0.5, scaleX: k, scaleY: k });
    });
    ctx.restore();

    // Little arrows when there's more to scroll to.
    const arrow = (x, dir) => {
      for (let i = 0; i < 3; i++) {
        r.rect(x + dir * i, top + TRAY_H / 2 - (2 - i), 1, (2 - i) * 2 + 1, '#e1e6f2', 0.8);
      }
    };
    if (this.scroll > 0) {
      arrow(SLOTS_X + 1, 1);
    }
    if (this.scroll < this.maxScroll) {
      arrow(W - 2, -1);
    }
  }
}
