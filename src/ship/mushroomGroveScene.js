import {
  BounceShroom, FairyRing, GlowPond, HollowLog, SnailRace, SporeJar, Spores,
} from './entities/mushroomGrove.js';
import { Butterfly } from './entities/outdoors.js';
import { OutdoorScene } from './outdoorScene.js';
import { loadSave, writeSave } from './save.js';

// The mushroom grove on Bluebell, a ride from the ship on the hoverbike: a
// shady corner of the meadow under giant mushrooms, two to bounce on,
// glowing spores drifting up to pop, a dark little pond of glowing fish
// (pop a spore over it and a lily blooms on the water), a jar to pop spores
// into till it's a glowing lantern to keep, a fairy ring that shrinks
// whoever stands in it down tiny, two snails to cheer on in a race, a hollow
// log to crawl through (sometimes something else comes scuttling out
// first), and a shy mushroom creature that hides under its cap when she
// comes near (it lives in the world, see world.js, so that once it's her
// friend she can take it anywhere). The ship isn't here, so the hoverbike
// (parked on the left) is how she gets anywhere else. When it's night on
// Bluebell (see night.js) it's night here too, the mushrooms and spores
// glowing brighter in the dark.
export class MushroomGroveScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'mushroomgrove', { ...opts, ship: false });
    this.roam = { minX: 60, maxX: 244 };
    this.addBike();
    const pond = this.add(new GlowPond(assets));
    this.add(new FairyRing(assets));
    this.add(new SnailRace(assets));
    this.add(new HollowLog(assets));
    this.add(new BounceShroom(assets, 0));
    this.add(new BounceShroom(assets, 1));
    const jar = this.add(new SporeJar(assets, loadSave().sporeJar));
    this.add(new Spores(pond, jar));
    this.addPlaced();
    for (let i = 0; i < 2; i++) {
      this.add(new Butterfly(assets.butterflies, i, 'bluebell.butterfly'));
    }
    this.addGirl();
  }

  // Remembers how many spores are in the jar.
  saveJar(n) {
    writeSave({ ...loadSave(), sporeJar: n });
  }
}
