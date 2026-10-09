import { BounceShroom, MushroomCreature, Spores } from './entities/mushroomGrove.js';
import { Butterfly } from './entities/outdoors.js';
import { OutdoorScene } from './outdoorScene.js';

// The mushroom grove on Bluebell, a ride from the ship on the hoverbike: a
// shady corner of the meadow under giant mushrooms, two to bounce on,
// glowing spores drifting up to pop, and a shy mushroom creature that hides
// under its cap when she comes near. The ship isn't here, so the hoverbike
// (parked on the left) is how she gets anywhere else.
export class MushroomGroveScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'mushroomgrove', { ...opts, ship: false });
    this.roam = { minX: 60, maxX: 244 };
    this.addBike();
    this.add(new BounceShroom(assets, 0));
    this.add(new BounceShroom(assets, 1));
    this.add(new MushroomCreature(assets));
    this.add(new Spores());
    this.addPlaced();
    for (let i = 0; i < 2; i++) {
      this.add(new Butterfly(assets.butterflies, i, 'bluebell.butterfly'));
    }
    this.addGirl();
  }
}
