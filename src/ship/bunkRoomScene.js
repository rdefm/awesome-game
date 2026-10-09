import { ease } from '../engine/tween.js';
import { FriendBunk, HerBunk, LightSwitch } from './entities/bunkroom.js';
import { Lift } from './entities/lift.js';
import { BUNK_PORTHOLE, FRIEND_BUNKS, H, NIGHT_LIGHT, W } from './layout.js';
import { SideRoomScene } from './sideRoomScene.js';

// Where the stars twinkle in the bunk room's porthole at night (from its
// middle), and how far into their twinkle each starts.
const STARS = [[-6, -5], [3, -7], [7, 1], [-2, 2], [-8, 4], [4, 6], [0, -2], [8, -4]]
  .map(([x, y], i) => ({ x, y, phase: i * 1.7 }));

// The bunk room, up the lift from the store room: her own bed, a bunk bed
// for friends and a light switch. Tap her bed and she snoozes until woken;
// drop a friend on a bunk and they're tucked in. Flick the light switch and
// it's night: the room goes dark, stars come out in the porthole, the night
// light glows and the sleepers snore. Flick it back for morning, and they
// all wake with a stretch and a yawn.
export class BunkRoomScene extends SideRoomScene {
  constructor(assets, opts) {
    super(assets, 'bunkroom', assets.bunkRoom, opts);
    this.lift = this.add(new Lift(assets));
    this.lightSwitch = this.add(new LightSwitch(assets));
    this.herBunk = this.add(new HerBunk(assets));
    this.bunks = [this.herBunk, ...FRIEND_BUNKS.map((at, i) => this.add(new FriendBunk(assets, at, i > 0)))];
    this.night = false;
    this.dark = 0; // how dark it is, 0..1 (eases in and out)
    this.snoreIn = 1.5;
    this.addGirl();
  }

  get herAsleep() {
    return this.herBunk.sleeper === this.girl;
  }

  // Lights out, or morning (when everyone in bed wakes up).
  setNight(on) {
    this.night = on;
    this.engine.tweens.to(this, { dark: on ? 1 : 0 }, on ? 0.8 : 0.5, ease.inOutSine);
    if (!on) {
      this.bunks.forEach((bunk, i) => {
        if (bunk.sleeper) {
          this.engine.wait(0.3 + i * 0.35).then(() => {
            if (!this.night) {
              bunk.wakeUp(); // (unless it's lights out again already)
            }
          });
        }
      });
    }
  }

  // Up she gets first, if she's in bed. (The light switch doesn't come this
  // way while she's in bed: it just flicks.)
  async interact(prop) {
    if (this.herAsleep) {
      await this.herBunk.wakeUp();
    }
    return super.interact(prop);
  }

  onTapEmpty(p) {
    if (this.herAsleep) {
      this.herBunk.wakeUp();
      return;
    }
    super.onTapEmpty(p);
  }

  update(dt) {
    super.update(dt);
    // Soft snores, now and then, from whoever's asleep in the dark.
    if (this.night && this.bunks.some((b) => b.asleep)) {
      this.snoreIn -= dt;
      if (this.snoreIn <= 0) {
        this.snoreIn = 2.4 + Math.random() * 1.6;
        this.engine.audio.play('snore');
      }
    }
  }

  draw(r) {
    r.image(this.room, 0, 0, { ax: 0, ay: 0 });
    this.drawEntities(r);
    this.drawNight(r);
    for (const e of this.entities) {
      e.drawOver?.(r);
    }
    this.drawParticles(r);
    this.modal?.draw(r);
    this.drawOverlay(r);
  }

  // The dark, with the night light glowing through it and stars out in the porthole.
  drawNight(r) {
    const k = this.dark;
    if (k <= 0) {
      return;
    }
    r.rect(0, 0, W, H, '#070a24', 0.6 * k);
    r.image(this.assets.nightGlow, NIGHT_LIGHT.x, NIGHT_LIGHT.y - 3, { ay: 0.5, alpha: 0.3 * k });
    const t = this.engine.time;
    for (const s of STARS) {
      const twinkle = 0.6 + 0.4 * Math.sin(t * 2 + s.phase);
      r.pixel(BUNK_PORTHOLE.x + s.x, BUNK_PORTHOLE.y + s.y, '#ffffff', k * twinkle);
    }
  }
}
