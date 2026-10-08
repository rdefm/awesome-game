import { Cherry, Straw, WaferBoat } from './entities/milkshakeLake.js';
import { Butterfly } from './entities/outdoors.js';
import { CHERRIES } from './layout.js';
import { OutdoorScene } from './outdoorScene.js';

// The milkshake lake on Candy, a ride from the ship on the hoverbike: a
// great pink lake of strawberry milkshake ringed with whipped cream, with a
// giant straw to slurp from, cherries bobbing about to dunk, and a wafer boat
// sailing up and down. The ship isn't here, so the hoverbike (parked on the
// left) is how she gets anywhere else.
export class MilkshakeLakeScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'milkshake', { ...opts, ship: false });
    this.roam = { minX: 60, maxX: 244 };
    this.addBike();
    this.add(new Straw(assets));
    CHERRIES.forEach((_, i) => this.add(new Cherry(assets, i)));
    this.add(new WaferBoat(assets));
    this.addPlaced();
    for (let i = 0; i < 2; i++) {
      this.add(new Butterfly(assets.candyButterflies, i, 'candy.butterfly'));
    }
    this.addGirl();
  }
}
