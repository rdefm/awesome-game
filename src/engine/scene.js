// Movement (in game pixels) before a press becomes a drag. Generous, because
// kids' taps wobble.
export const DRAG_THRESHOLD = 4;

const byDepth = (a, b) => (a.depth ?? a.y) - (b.depth ?? b.y);

// Everything under the point, frontmost first.
function hitsAt(entities, x, y) {
  return [...entities].sort(byDepth).reverse().filter((e) => e.hitTest?.(x, y));
}

// The frontmost entity under (x, y) willing to take `item` when it's dropped
// there (entities opt in with `accepts(item)` and `receive(item)`), or null.
export function findReceiver(entities, item, x, y) {
  return hitsAt(entities, x, y).find((e) => e !== item && e.accepts?.(item)) ?? null;
}

// Base scene: a list of entities with depth-sorted drawing and a unified
// tap / drag gesture model. Entities opt in by implementing any of:
//   hitTest(x, y) -> bool, onTap(p), draggable, onDragStart(p), onDrag(p), onDrop(p),
//   accepts(item) / receive(item) (to have dragged things dropped onto them)
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
    return [...this.entities].sort(byDepth);
  }

  // Topmost entity under the point. `priority` lets important things (the
  // player character) win over big background props they overlap.
  pick(x, y) {
    const hits = hitsAt(this.entities, x, y);
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
