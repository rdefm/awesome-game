import { ease } from '../engine/tween.js';
import { PLANETS } from './art/props.js';
import { BluebellScene } from './bluebellScene.js';
import { Girl, clampToFloor } from './entities/girl.js';
import { Chair, ConsoleScreen, Door, Porthole, Poster, SnackLocker, WindowPlanet } from './entities/props.js';
import { DOOR, PLANET_SPOT, W, H } from './layout.js';
import { LandingCutscene } from './landingCutscene.js';
import { PlanetMap } from './planetMap.js';
import { BLOCK_INPUT, PlayScene } from './playScene.js';
import { loadSave, writeSave } from './save.js';
import { Starfield } from './starfield.js';

// The spaceship interior: one room, one hero, a handful of things to poke.
export class ShipScene extends PlayScene {
  // `fromDoor`: she's just come back in from outside.
  constructor(assets, { fromDoor = false } = {}) {
    super(assets, 'ship');
    this.stars = new Starfield();
    this.shake = 0;
    this.alert = false;
    this.warpTint = 0;
    this.flash = 0; // white-out used to cut to and from the landing cutscene
    this.planetSlide = 0;
    this.planetZoom = 0; // 0..1 while diving down toward the planet
    this.fromDoor = fromDoor;

    const save = loadSave();
    this.planetIndex = Number.isInteger(save.planet) && PLANETS[save.planet] ? save.planet : 0;
    this.landed = Boolean(save.landed && this.planet.landable);
    this.ground = this.landed ? 1 : 0; // how much of the window shows the planet's surface
    const start = fromDoor ? DOOR.spot : clampToFloor(save.x ?? 96, save.y ?? 136);

    this.porthole = this.add(new Porthole(assets));
    this.poster = this.add(new Poster(assets));
    this.add(new SnackLocker(assets));
    this.screen = this.add(new ConsoleScreen(assets));
    this.chair = this.add(new Chair(assets));
    this.door = this.add(new Door());
    this.add(new WindowPlanet());
    this.addPlaced();
    this.girl = this.add(new Girl(assets, start.x, start.y));
    this.map = new PlanetMap(this, assets);
  }

  enter() {
    super.enter();
    if (this.fromDoor) {
      this.walkInFromDoor();
    }
  }

  get planet() {
    return PLANETS[this.planetIndex];
  }

  persist() {
    writeSave({
      ...loadSave(),
      where: 'ship',
      x: Math.round(this.girl.x),
      y: Math.round(this.girl.y),
      planet: this.planetIndex,
      landed: this.landed,
    });
  }

  interact(prop) {
    if (prop === this.chair && this.girl.mode === 'seated') {
      prop.use();
      return;
    }
    super.interact(prop);
  }

  openMap() {
    if (!this.busy && !this.modal) {
      this.map.open();
    }
  }

  async blastOff() {
    if (this.busy) {
      this.girl.say('question', 0.8);
      return;
    }
    this.busy = true;
    const { engine, girl, screen, poster } = this;
    const tw = engine.tweens;
    girl.say('bang', 1);
    for (const n of [3, 2, 1]) {
      screen.countdown = n;
      engine.audio.play('beep');
      await engine.wait(0.65);
    }
    screen.countdown = 'GO';
    engine.audio.play('go');
    engine.audio.play('blast');
    this.alert = true;
    poster.flicker = true;
    girl.act('surprised', 0.7).then(() => girl.act('cheer', 1.8));
    tw.to(this, { shake: 2.5 }, 0.6, ease.inQuad);
    if (this.landed) {
      await this.liftOff();
    }
    await tw.to(this.stars, { warp: 70 }, 1.2, ease.inCubic);
    await engine.wait(1.2);
    screen.countdown = null;
    engine.audio.play('settle');
    tw.to(this, { shake: 0 }, 1.3, ease.outQuad);
    await tw.to(this.stars, { warp: 1 }, 1.5, ease.outCubic);
    this.alert = false;
    poster.flicker = false;
    girl.say('star');
    this.busy = false;
  }

  async travelTo(index) {
    const { engine, girl } = this;
    const tw = engine.tweens;
    if (index === this.planetIndex) {
      girl.say('heart');
      return;
    }
    this.busy = true;
    if (this.landed) {
      engine.audio.play('blast');
      tw.to(this, { shake: 2 }, 0.4);
      await this.liftOff();
    }
    engine.audio.play('warp');
    girl.say('bang', 1);
    girl.act('cheer', 2.4);
    tw.to(this, { warpTint: 1 }, 0.8);
    tw.to(this, { shake: 1 }, 0.6);
    tw.to(this.stars, { warp: 45 }, 1, ease.inCubic);
    await tw.to(this, { planetSlide: -1 }, 1, ease.inCubic);
    this.planetIndex = index;
    this.persist();
    this.planetSlide = 1;
    await engine.wait(0.5);
    engine.audio.play('arrive');
    tw.to(this, { warpTint: 0 }, 1);
    tw.to(this, { shake: 0 }, 0.8);
    tw.to(this.stars, { warp: 1 }, 1.4, ease.outCubic);
    await tw.to(this, { planetSlide: 0 }, 1.4, ease.outCubic);
    girl.say('heart');
    this.busy = false;
  }

  // The ground drops away out of the windows as the ship climbs.
  async liftOff() {
    this.landed = false;
    this.persist();
    await this.engine.tweens.to(this, { ground: 0 }, 1.3, ease.inCubic);
  }

  // Tap the planet outside: hop in the pilot seat, bounce with excitement,
  // dive down toward the planet, then watch the landing from outside.
  async land() {
    const { engine, girl, chair, screen } = this;
    const tw = engine.tweens;
    if (this.busy || this.landed || this.modal) {
      return;
    }
    if (!this.planet.landable) {
      engine.audio.play('denied');
      girl.say('question', 1.2);
      this.toast('TOO WILD TO LAND HERE YET!');
      return;
    }
    this.busy = true;
    if (girl.mode !== 'seated') {
      const arrived = await girl.walkTo(chair.spot.x, chair.spot.y);
      if (!arrived) {
        this.busy = false;
        return;
      }
      chair.seat();
    }
    this.modal = BLOCK_INPUT;
    girl.say('bang', 1);
    girl.act('sitCheer', 2.2);
    for (let i = 0; i < 3; i++) {
      engine.audio.play('boing');
      await girl.hop(6);
    }
    screen.countdown = 'LAND';
    engine.audio.play('beep');
    tw.to(this, { shake: 1 }, 0.8);
    engine.audio.play('dive');
    await tw.to(this, { planetZoom: 1 }, 2.2, ease.inCubic);
    await tw.to(this, { flash: 1 }, 0.25);

    // Cut outside.
    const cutscene = new LandingCutscene(this, this.assets);
    this.modal = cutscene;
    this.shake = 0;
    this.planetZoom = 0;
    screen.countdown = null;
    await tw.to(this, { flash: 0 }, 0.3);
    await cutscene.play();
    await tw.to(this, { flash: 1 }, 0.3);

    // Back inside, on the ground.
    this.modal = BLOCK_INPUT;
    this.landed = true;
    this.ground = 1;
    this.persist();
    await tw.to(this, { flash: 0 }, 0.4);
    this.shake = 1.5;
    tw.to(this, { shake: 0 }, 0.5);
    engine.audio.play('arrive');
    girl.act('sitCheer', 1.2);
    girl.say('heart');
    this.modal = null;
    this.busy = false;
    this.toast('WE LANDED! TAP THE DOOR!', 2.5);
  }

  async exitShip() {
    const { engine, girl, door } = this;
    if (this.busy || !this.landed) {
      return;
    }
    this.busy = true;
    this.modal = BLOCK_INPUT;
    girl.faceToward(DOOR.x);
    await door.slide(1);
    girl.say('heart', 1);
    engine.tweens.to(girl, { y: DOOR.spot.y - 6 }, 0.5);
    await engine.tweens.to(girl, { alpha: 0 }, 0.5);
    await this.leaveTo(() => new BluebellScene(this.assets));
  }

  async walkInFromDoor() {
    const { engine, girl, door } = this;
    this.busy = true;
    door.open = 1;
    girl.alpha = 0;
    girl.facing = 1;
    await engine.tweens.to(girl, { alpha: 1 }, 0.4);
    this.busy = false;
    girl.walkTo(DOOR.spot.x + 26, DOOR.spot.y + 4);
    await door.slide(0);
  }

  update(dt) {
    super.update(dt);
    this.stars.update(dt);
  }

  draw(r) {
    const t = this.engine.time;
    r.offsetX = this.shake ? Math.round((Math.random() - 0.5) * 2 * this.shake) : 0;
    r.offsetY = this.shake ? Math.round((Math.random() - 0.5) * 2 * this.shake) : 0;

    // Layer 1: outer space (or the planet's surface), seen through the
    // window holes in the room.
    r.image(this.assets.space, 0, 0, { ax: 0, ay: 0 });
    this.stars.draw(r);
    const px = PLANET_SPOT.x + this.planetSlide * 130;
    const py = PLANET_SPOT.y + Math.sin(t * 0.5) * 1.5;
    const huge = this.assets.planetsHuge[this.planetIndex];
    if (this.planetZoom > 0 && huge) {
      // Diving in: the planet swells and sinks until its surface fills the view.
      const z = this.planetZoom;
      const scale = 0.3 + z * z * 4;
      r.image(huge, px - z * 40, py + z * z * 150, { ay: 0.5, scaleX: scale, scaleY: scale });
    } else {
      r.image(this.assets.planetsBig[this.planetIndex], px, py, { ay: 0.5 });
    }
    if (this.ground > 0) {
      r.image(this.assets.meadowWindow, 0, (1 - this.ground) * H, { ax: 0, ay: 0 });
    }
    this.door.drawBehind(r);
    this.porthole.drawBehind(r);

    // Layer 2: the room itself, then props and the girl, depth-sorted.
    r.image(this.assets.room, 0, 0, { ax: 0, ay: 0 });
    this.drawEntities(r);
    for (const e of this.entities) {
      e.drawOver?.(r);
    }
    this.drawParticles(r);

    // Ship-wide lighting moods.
    if (this.alert) {
      r.rect(-4, -4, W + 8, H + 8, '#ff2040', 0.12 + 0.1 * Math.sin(t * 10));
    }
    if (this.warpTint > 0) {
      r.rect(-4, -4, W + 8, H + 8, '#4060ff', 0.18 * this.warpTint);
    }

    r.offsetX = 0;
    r.offsetY = 0;
    this.modal?.draw(r);
    if (this.flash > 0) {
      r.rect(0, 0, W, H, '#ffffff', this.flash);
    }
    this.drawOverlay(r);
  }
}
