// Movement (in game pixels) before a press becomes a drag. Generous, because
// kids' taps wobble.
const DRAG_THRESHOLD = 4;

// Base scene: a list of entities with depth-sorted drawing and a unified
// tap / drag gesture model. Entities opt in by implementing any of:
//   hitTest(x, y) -> bool, onTap(p), draggable, onDragStart(p), onDrag(p), onDrop(p)
// and optionally `depth` (draw order; defaults to y, so lower = in front).
export class Scene {
  constructor() {
    this.entities = [];
    this.press = null;
    this.modal = null; // an overlay that swallows all input while open
  }

  add(entity) {
    this.entities.push(entity);
    entity.scene = this;
    return entity;
  }

  remove(entity) {
    this.entities = this.entities.filter((e) => e !== entity);
  }

  sorted() {
    return [...this.entities].sort((a, b) => (a.depth ?? a.y) - (b.depth ?? b.y));
  }

  // Topmost entity under the point. `priority` lets important things (the
  // player character) win over big background props they overlap.
  pick(x, y) {
    const hits = this.sorted()
      .reverse()
      .filter((e) => e.hitTest?.(x, y));
    hits.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return hits[0] ?? null;
  }

  pointerDown(p) {
    if (this.modal) {
      this.modal.pointerDown?.(p);
      return;
    }
    this.press = { start: p, target: this.pick(p.x, p.y), dragging: false };
  }

  pointerMove(p) {
    if (this.modal) {
      return;
    }
    const press = this.press;
    if (!press) {
      return;
    }
    if (!press.dragging && press.target?.draggable) {
      if (Math.hypot(p.x - press.start.x, p.y - press.start.y) > DRAG_THRESHOLD) {
        press.dragging = true;
        press.target.onDragStart?.(press.start);
      }
    }
    if (press.dragging) {
      press.target.onDrag?.(p);
    }
  }

  pointerUp(p) {
    if (this.modal) {
      this.modal.pointerUp?.(p);
      return;
    }
    const press = this.press;
    this.press = null;
    if (!press) {
      return;
    }
    if (press.dragging) {
      press.target.onDrop?.(p);
    } else if (press.target?.onTap) {
      press.target.onTap(p);
    } else {
      this.onTapEmpty?.(p);
    }
  }

  update(dt) {
    for (const e of [...this.entities]) {
      e.update?.(dt);
    }
    this.modal?.update?.(dt);
  }

  drawEntities(r) {
    for (const e of this.sorted()) {
      e.draw?.(r);
    }
  }

  draw(r) {
    this.drawEntities(r);
    this.modal?.draw?.(r);
  }
}
