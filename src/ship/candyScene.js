import { ease } from '../engine/tween.js';
import { FlossBush, GingerbreadHouse } from './entities/candy.js';
import { Butterfly } from './entities/outdoors.js';
import { GingerbreadScene } from './gingerbreadScene.js';
import { GINGERBREAD_HOUSE, distanceScale } from './layout.js';
import { OutdoorScene } from './outdoorScene.js';
import { BLOCK_INPUT } from './playScene.js';

const PATH_SPEED = 44; // game px per second, at full size (slower when far off)

// Planet Candy: pink icing underfoot, frosting hills and lollipop trees, a
// wobbly gummy bear, lollipops and gumdrops, candy butterflies, our ship
// parked on the left (and a secret: a candy-floss bush with a sugar mouse in
// it). Far off at the back is the gingerbread house: tap it and she walks
// up the winding path, getting smaller and smaller, and goes inside.
export class CandyScene extends OutdoorScene {
  // `fromHouse`: she's just come out of the gingerbread house's door.
  constructor(assets, { fromShip = true, fromHouse = false } = {}) {
    super(assets, 'candy', { fromShip: fromShip && !fromHouse });
    this.fromHouse = fromHouse;
    this.house = this.add(new GingerbreadHouse(assets));
    this.add(new FlossBush(assets));
    this.addPlaced();
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.candyButterflies, i, 'candy.butterfly'));
    }
    this.addGirl();
    if (fromHouse) {
      const door = GINGERBREAD_HOUSE.path.at(-1);
      Object.assign(this.girl, { x: door.x, y: door.y, scale: distanceScale(door.y), alpha: 0 });
    }
  }

  enter() {
    super.enter();
    if (this.fromHouse) {
      this.walkOutOfHouse();
    }
  }

  // Walks her along `points` (off the usual floor, so not with walkTo),
  // shrinking or growing with the distance as she goes.
  async walkPath(points) {
    const { engine, girl } = this;
    girl.mode = 'walk';
    girl.pose = null;
    for (const p of points) {
      girl.faceToward(p.x);
      const scale = distanceScale(p.y);
      const dist = Math.hypot(p.x - girl.x, p.y - girl.y);
      const speed = PATH_SPEED * (girl.scale + scale) / 2;
      await engine.tweens.to(girl, { x: p.x, y: p.y, scale }, dist / speed, ease.linear);
    }
    girl.mode = 'idle';
  }

  // She's at the near end of the path (see GingerbreadHouse): up the path to
  // the door, which opens, and in she goes.
  async enterHouse() {
    const { engine, girl, house } = this;
    if (this.busy) {
      return;
    }
    this.busy = true;
    this.modal = BLOCK_INPUT;
    girl.say('heart', 1);
    await this.walkPath(GINGERBREAD_HOUSE.path.slice(1));
    house.open = true;
    engine.audio.play('creak');
    await engine.wait(0.25);
    engine.tweens.to(girl, { y: girl.y - 2 }, 0.4);
    await engine.tweens.to(girl, { alpha: 0 }, 0.4);
    await this.leaveTo(() => new GingerbreadScene(this.assets, { fromDoor: true }));
  }

  // Out of the door and back down the path, growing as she comes nearer.
  async walkOutOfHouse() {
    const { engine, girl, house } = this;
    await this.scripted(async () => {
      house.open = true;
      await engine.tweens.to(girl, { alpha: 1 }, 0.4);
      engine.audio.play('creak');
      house.open = false;
      await this.walkPath([...GINGERBREAD_HOUSE.path].reverse().slice(1));
    });
    girl.scale = 1;
    this.persist();
    girl.say('heart');
  }
}
