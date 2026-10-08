import { Dune, Frog, Palm } from './entities/oasis.js';
import { Butterfly } from './entities/outdoors.js';
import { OutdoorScene } from './outdoorScene.js';

// The oasis on Stripey, a ride from the ship on the hoverbike: a stripy pool
// among palms, with a stripy frog on the lily pads that dives in with a
// splash, a palm to shake coconuts down from (and kick them rolling about),
// and a big sand dune to climb and slide down. The ship isn't here, so the
// hoverbike (parked on the left) is how she gets anywhere else.
export class OasisScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'oasis', { ...opts, ship: false });
    this.roam = { minX: 60, maxX: 244 };
    this.addBike();
    this.add(new Dune());
    this.add(new Frog(assets));
    this.add(new Palm(assets));
    this.addPlaced();
    for (let i = 0; i < 2; i++) {
      this.add(new Butterfly(assets.stripeButterflies, i, 'stripey.butterfly'));
    }
    this.addGirl();
  }
}
