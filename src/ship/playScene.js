import { findReceiver, Scene } from '../engine/scene.js';
import { Bag } from './bag.js';
import { clampToFloor } from './entities/girl.js';
import { makeCarryable } from './kinds.js';
import { FLOOR_TOP, WALK, W, H } from './layout.js';
import { normalizeLook } from './look.js';
import { loadSave, writeSave } from './save.js';
import { add, discard, freshId, normalizeWorld, place, placedIn, setStage, stash } from './world.js';

// Swallows all input (and draws nothing) while a scripted sequence plays.
export const BLOCK_INPUT = { draw() {} };

// What every place the girl can be has in common: tap-to-walk, little
// particle effects, a short message banner, fading in/out between places,
// and the bag plus all the carryable things lying about.
export class PlayScene extends Scene {
  // `where` names this place in the world (e.g. 'ship'), for its carryables.
  constructor(assets, where) {
    super();
    this.assets = assets;
    this.where = where;
    const save = loadSave();
    this.world = normalizeWorld(save.world);
    this.look = normalizeLook(save.look); // how she looks, wherever she goes
    this.bag = new Bag(this);
    this.carried = null; // the carryable being dragged, if any
    this.uiPress = false; // true while the bag owns the current press
    this.particles = [];
    this.busy = false; // true during a scripted event
    this.fade = 1; // black overlay; scenes fade in on enter
    this.toastMsg = null;
  }

  enter() {
    this.engine.tweens.to(this, { fade: 0 }, 0.5);
  }

  // Fades to black, then swaps to the scene `makeScene` builds.
  async leaveTo(makeScene) {
    this.busy = true;
    this.modal = BLOCK_INPUT;
    await this.engine.tweens.to(this, { fade: 1 }, 0.45);
    this.engine.setScene(makeScene());
  }

  // Plays a scripted sequence with all input held off until it's done.
  async scripted(run) {
    this.busy = true;
    this.modal = BLOCK_INPUT;
    try {
      await run();
    } finally {
      if (this.modal === BLOCK_INPUT) {
        this.modal = null;
      }
      this.busy = false;
    }
  }

  // Tap on a prop: walk over to it, then use it (unless interrupted on the
  // way, or put in the bag meanwhile).
  async interact(prop) {
    const girl = this.girl;
    if (girl.mode === 'held') {
      return;
    }
    const arrived = await girl.walkTo(prop.spot.x, prop.spot.y);
    if (arrived && this.entities.includes(prop)) {
      prop.use();
    }
  }

  // ------------------------------------------------------------ carryables
  // Adds every carryable the world has lying about in this place.
  addPlaced() {
    for (const state of placedIn(this.world, this.where)) {
      const item = makeCarryable(this.assets, state);
      if (item) {
        this.add(item);
      }
    }
  }

  saveWorld() {
    writeSave({ ...loadSave(), world: this.world });
  }

  // She's changed how she looks: show it and remember it.
  saveLook(look) {
    this.look = look;
    this.girl.wear(look);
    writeSave({ ...loadSave(), look });
  }

  // Remembers where a carryable now is (after it moved about by itself), or
  // the floor spot (x, y) to put it back on next time.
  settle(item, x = item.x, y = item.y) {
    if (this.entities.includes(item) && !item.held) {
      this.world = place(this.world, item.id, this.where, x, y);
      this.saveWorld();
    }
  }

  // Remembers that a carryable has grown to `stage`.
  saveStage(item, stage) {
    this.world = setStage(this.world, item.id, stage);
    this.saveWorld();
  }

  // A brand-new carryable of `kind` (a snack off the shelf, say) appears at
  // (x, y), with an id nothing else has. Remembered on the floor below.
  spawn(kind, x, y) {
    const id = freshId(this.world, kind, this.entities.map((e) => e.id));
    const item = makeCarryable(this.assets, { id, kind, x, y });
    if (!item) {
      return null;
    }
    this.world = add(this.world, this.where, { id, kind, ...clampToFloor(x, y) });
    this.saveWorld();
    this.add(item);
    return item;
  }

  // Used up for good (eaten): gone from the world straight away. It stays on
  // screen until it's removed.
  useUp(item) {
    this.world = discard(this.world, item.id);
    this.saveWorld();
  }

  // A dragged carryable was let go: into the bag, onto something that wants
  // it, or down onto the floor.
  dropCarryable(item, p) {
    if (this.bag.isDropTarget(p)) {
      this.stashItem(item);
      return;
    }
    const receiver = findReceiver(this.entities, item, p.x, p.y);
    if (receiver) {
      receiver.receive(item);
      return;
    }
    this.putDown(item, item.x, item.y);
  }

  // Drops a carryable onto the floor at (or near) (x, y) and remembers it there.
  // Resolves once it's landed.
  putDown(item, x, y) {
    const floor = clampToFloor(x, y);
    this.world = place(this.world, item.id, this.where, floor.x, floor.y);
    this.saveWorld();
    return item.fall(floor);
  }

  stashItem(item) {
    this.remove(item);
    this.engine.tweens.cancel(item);
    this.world = stash(this.world, item.id);
    this.saveWorld();
    this.engine.audio.play('stash');
    this.bag.swallow();
    this.sparkles(this.bag.center.x, this.bag.center.y, 6);
    if (this.girl.mode === 'idle') {
      this.girl.say('heart', 1);
    }
  }

  // Dragged up out of the bag tray: it appears under her finger, already held.
  takeFromBag(entry, p) {
    const item = makeCarryable(this.assets, { ...entry, x: p.x, y: p.y });
    if (!item) {
      return;
    }
    this.add(item);
    this.engine.audio.play('unpack');
    this.uiPress = false;
    this.press = { start: p, target: item, dragging: true };
    item.onDragStart(p);
    item.grab = { x: 0, y: 8 }; // hang it just below the fingertip
    item.onDrag(p);
  }

  // Tapped in the bag tray: it pops out onto the floor beside her.
  placeFromBag(entry) {
    const girl = this.girl;
    const maxY = this.bag.isOpen ? 130 : WALK.maxY; // keep it clear of the open tray
    const spot = clampToFloor(girl.x + girl.facing * 20, Math.min(girl.y + 2, maxY));
    const item = makeCarryable(this.assets, { ...entry, x: spot.x, y: spot.y - 16 });
    if (!item) {
      return;
    }
    this.world = place(this.world, item.id, this.where, spot.x, spot.y);
    this.saveWorld();
    this.add(item);
    this.engine.audio.play('unpack');
    this.sparkles(spot.x, spot.y - 10, 6);
    item.fall(spot);
  }

  // The bag gets first look at every press; the rest goes to the scene.
  pointerDown(p) {
    if (!this.modal && this.bag.hitTest(p)) {
      this.uiPress = true;
      this.bag.pointerDown(p);
      return;
    }
    super.pointerDown(p);
  }

  pointerMove(p) {
    if (this.uiPress) {
      this.bag.pointerMove(p);
      return;
    }
    super.pointerMove(p);
  }

  pointerUp(p) {
    if (this.uiPress) {
      this.uiPress = false;
      this.bag.pointerUp(p);
      return;
    }
    super.pointerUp(p);
  }

  onTapEmpty(p) {
    const target = clampToFloor(p.x, Math.max(p.y, FLOOR_TOP + 10));
    this.ripple(target.x, target.y);
    this.girl.walkTo(target.x, target.y);
  }

  toast(text, seconds = 2) {
    this.toastMsg = { text, t: 0, life: seconds };
  }

  // ------------------------------------------------------------ particles
  dust(x, y) {
    for (let i = 0; i < 6; i++) {
      const dir = i < 3 ? -1 : 1;
      this.particles.push({
        x: x + dir * 4, y: y - 1, vx: dir * (10 + Math.random() * 20), vy: -6 - Math.random() * 8,
        life: 0.4 + Math.random() * 0.2, age: 0, color: this.dustColor ?? '#8b93b8', size: 2, gravity: 0,
      });
    }
  }

  // A little burst of flying bits (leaves, dirt) that fall back down.
  bits(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10, y, vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 25,
        life: 0.6 + Math.random() * 0.3, age: 0, color, size: 1 + Math.round(Math.random()), gravity: 90,
      });
    }
  }

  sparkles(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.particles.push({
        x, y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30 - 10, life: 0.7, age: 0, img: this.assets.sparkle, gravity: 30,
      });
    }
  }

  hearts(x, y, n) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: x + (i - (n - 1) / 2) * 6, y, vx: (Math.random() - 0.5) * 14, vy: -24 - Math.random() * 12,
        life: 1, age: 0, img: this.assets.emotes.heart, gravity: 0,
      });
    }
  }

  ripple(x, y) {
    this.particles.push({ x, y, ring: true, life: 0.35, age: 0 });
  }

  musicNote(x, y) {
    const colors = ['#6fb2ff', '#ff8fc8', '#ffe066', '#ffffff'];
    this.particles.push({
      x, y, vx: (Math.random() - 0.5) * 16, vy: -22 - Math.random() * 10, gravity: 0, life: 1.1, age: 0,
      note: true, color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  update(dt) {
    super.update(dt);
    this.bag.update(dt);
    for (const p of this.particles) {
      p.age += dt;
      if (!p.ring) {
        p.vy += (p.gravity ?? 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
    if (this.toastMsg) {
      this.toastMsg.t += dt;
      if (this.toastMsg.t > this.toastMsg.life) {
        this.toastMsg = null;
      }
    }
  }

  drawParticles(r) {
    for (const p of this.particles) {
      const k = 1 - p.age / p.life;
      if (p.ring) {
        const rad = 2 + (p.age / p.life) * 6;
        r.rect(p.x - rad, p.y, rad * 2, 1, '#e1e6f2', k);
        r.rect(p.x - rad / 2, p.y - 2, rad, 1, '#e1e6f2', k * 0.5);
      } else if (p.note) {
        // A little quaver: head, stem and flag.
        r.rect(p.x, p.y, 2, 2, p.color, k);
        r.rect(p.x + 1, p.y - 4, 1, 4, p.color, k);
        r.rect(p.x + 2, p.y - 4, 1, 1, p.color, k);
      } else if (p.img) {
        r.image(p.img, p.x, p.y, { ay: 0.5, alpha: k });
      } else {
        r.rect(p.x, p.y, p.size, p.size, p.color, k);
      }
    }
  }

  // Whatever's being carried is drawn later, above the bag tray.
  drawEntities(r) {
    for (const e of this.sorted()) {
      if (!e.held) {
        e.draw?.(r);
      }
    }
  }

  // The bag, banner text, the fade, and anything else that sits above the
  // whole scene.
  drawOverlay(r) {
    this.bag.draw(r);
    if (this.carried && !this.modal) {
      this.carried.draw(r);
    }
    const m = this.toastMsg;
    if (m) {
      const alpha = Math.min(1, m.t / 0.15, (m.life - m.t) / 0.3);
      const img = this.assets.text(m.text, '#ffe066', { outline: '#1b1427' });
      r.image(img, W / 2, 8 - (1 - Math.min(1, m.t / 0.15)) * 4, { ay: 0, alpha });
    }
    if (this.fade > 0) {
      r.rect(0, 0, W, H, '#000000', this.fade);
    }
  }
}
