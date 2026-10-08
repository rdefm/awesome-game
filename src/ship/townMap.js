import { ease } from '../engine/tween.js';
import { MAP, MAP_STYLE } from './art/townMap.js';
import { PLANETS } from './art/props.js';
import { Picker } from './picker.js';
import { placesOn, planetOf } from './planetScenes.js';

const PANEL = { x: 4, y: 4, w: 248, h: 152 };
const REACH = 24; // how near a tap has to be to a place's spot to pick it: big targets for small fingers
const POP_EVERY = 2.4; // seconds (or a bit more) between one place bouncing and the next

// The hoverbike's town map: a picture of the planet she's on, with every
// place on it (from the place registry) joined up by paths. She's shown on
// the bike beside the place she's at. Now and then one of the places she can
// go bounces with a sparkle, to show it can be tapped. Tap one and the bike
// flies across the map to it; `open()` resolves with that place, or null if
// the map was closed instead. Once a place is picked it stays up (so the
// scene can fade out over it) and ignores taps.
export class TownMap extends Picker {
  // `here`: the place she's at now (by its `where`).
  constructor(scene, here) {
    super(scene, PANEL);
    this.here = here;
    this.planet = planetOf(here);
    this.places = placesOn(this.planet);
    this.style = MAP_STYLE[this.planet];
    this.title = `${PLANETS.find((p) => p.id === this.planet).name} TOWN`;
    this.popIn = 0.6;
    this.popTurn = 0;
    this.bounces = {}; // where -> 0..1, how far through its bounce it is
    this.flight = null; // { from, to, t } while the bike flies to a place
  }

  // Where she is on the map.
  get spot() {
    return this.places.find((place) => place.where === this.here).spot;
  }

  // The places she could go: everywhere but where she is.
  get elsewhere() {
    return this.places.filter((place) => place.where !== this.here);
  }

  // The place she could go nearest a tap (if it's near enough), as a button.
  cellAt(p) {
    const near = this.elsewhere
      .map((place) => ({ place, d: Math.hypot(p.x - place.spot.x, p.y - place.spot.y) }))
      .filter(({ d }) => d <= REACH)
      .sort((a, b) => a.d - b.d)[0];
    return near ? { key: near.place.where, place: near.place } : null;
  }

  // Off she flies to the place tapped: it bounces as she sets off and again
  // as she lands, then the map says where she's going.
  async pick({ place }) {
    const { engine } = this.scene;
    this.closing = true;
    this.result = place;
    engine.audio.play('select');
    this.bounces[place.where] = 0;
    this.flight = { from: this.spot, to: place.spot, t: 0 };
    engine.audio.play('whoosh');
    await engine.tweens.to(this.flight, { t: 1 }, 1, ease.inOutQuad);
    this.bounces[place.where] = 0;
    await engine.wait(0.2);
    this.done(place);
  }

  // Bounces play out, and every so often the next place takes its turn.
  update(dt) {
    super.update(dt);
    for (const where of Object.keys(this.bounces)) {
      this.bounces[where] += dt / 0.7;
      if (this.bounces[where] >= 1) {
        delete this.bounces[where];
      }
    }
    // One place at a time, taking turns, has a little bounce.
    if (this.show < 0.9 || this.closing) {
      return;
    }
    this.popIn -= dt;
    const places = this.elsewhere;
    if (this.popIn <= 0 && places.length) {
      const place = places[this.popTurn % places.length];
      this.popTurn += 1;
      this.bounces[place.where] = 0;
      this.popIn = POP_EVERY + Math.random() * 0.8;
      this.scene.engine.audio.play('mapPop');
    }
  }

  // A dotted path from `a` to `b`, sagging into a gentle curve, in the
  // planet's map colours.
  drawPath(r, a, b, dy) {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + len * 0.15 };
    const n = Math.floor(len / 6);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * mid.x + t ** 2 * b.x;
      const y = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * mid.y + t ** 2 * b.y + dy;
      r.rect(Math.round(x) - 1, Math.round(y), 3, 2, this.style.shade, 0.5);
      r.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 2, this.style.dot);
    }
  }

  // A place's picture, squashing and stretching through its bounce, with a
  // ring of sparkles bursting out.
  drawPlace(r, place, dy) {
    const { assets } = this;
    const img = assets.townMap.places[place.where];
    const k = this.bounces[place.where];
    const { x } = place.spot;
    const y = place.spot.y + dy;
    const base = y + img.height / 2;
    if (k === undefined) {
      r.image(img, x, base);
      return;
    }
    const wobble = Math.sin(k * Math.PI * 3) * (1 - k);
    const hop = Math.sin(k * Math.PI) * 6 * (1 - k * 0.5);
    r.image(img, x, base - hop, { scaleX: 1 - wobble * 0.25, scaleY: 1 + wobble * 0.3 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const d = 8 + k * 18;
      r.image(assets.sparkle, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, { ay: 0.5, alpha: 1 - k });
    }
  }

  draw(r) {
    const { assets, dy } = this;
    this.drawFrame(r, this.title, '#ffe066');
    r.image(assets.townMap.ground[this.planet], MAP.x, MAP.y + dy, { ax: 0, ay: 0 });
    const [home, ...rest] = this.places;
    for (const place of rest) {
      this.drawPath(r, home.spot, place.spot, dy);
    }
    for (const place of this.places) {
      this.drawPlace(r, place, dy);
    }
    // Her on the bike: beside where she is, or flying across to somewhere new.
    const { from, to, t } = this.flight ?? { from: this.spot, to: this.spot, t: 0 };
    const x = from.x + (to.x - from.x) * t + 20;
    const y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 24 + 12 + dy;
    const bob = this.flight ? 0 : Math.round(Math.sin(this.scene.engine.time * 4));
    r.image(assets.townMap.bike, x, y + bob, { flipX: to.x < from.x });
  }
}
