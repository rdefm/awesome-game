import { FishingHole, Ice, SnowCritter } from './entities/frozenLake.js';
import { Butterfly } from './entities/outdoors.js';
import { OutdoorScene } from './outdoorScene.js';

// The frozen lake on Frosty, a ride from the ship on the hoverbike: a great
// sheet of ice to slide across (her friends sliding along behind her), a
// fishing hole with a curious fish under it, and little snow critters
// waddling about, under softly falling snow. The ship isn't here, so the
// hoverbike (parked on the left) is how she gets anywhere else.
export class FrozenLakeScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'frozenlake', { ...opts, ship: false });
    this.roam = { minX: 60, maxX: 244 };
    this.addBike();
    this.add(new Ice());
    this.add(new FishingHole(assets));
    for (let i = 0; i < 3; i++) {
      this.add(new SnowCritter(assets, i));
    }
    this.addPlaced();
    for (let i = 0; i < 2; i++) {
      this.add(new Butterfly(assets.snowbirds, i, 'frosty.bird'));
    }
    this.addGirl();
  }
}
