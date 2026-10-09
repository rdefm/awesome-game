import { Falls, FallsGeyser, LavaBubbles, SteppingStone } from './entities/lavaFalls.js';
import { Butterfly } from './entities/outdoors.js';
import { FALLS_STONES } from './layout.js';
import { OutdoorScene } from './outdoorScene.js';

// The lava falls on Ember, a ride from the ship on the hoverbike: a glowing
// cascade of lava pouring down a dark cliff into a bubbling pool, with lava
// bubbles to pop, stepping stones along the shore to hop across, and a geyser
// that blasts a pumice rock up into the air. The ship isn't here, so the
// hoverbike (parked on the left) is how she gets anywhere else.
export class LavaFallsScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'lavafalls', { ...opts, ship: false });
    this.roam = { minX: 60, maxX: 244 };
    this.addBike();
    this.add(new Falls());
    this.bubbles = this.add(new LavaBubbles(assets));
    this.stones = FALLS_STONES.map((at) => this.add(new SteppingStone(assets.steppingStone, at)));
    this.add(new FallsGeyser(assets));
    this.addPlaced();
    for (let i = 0; i < 2; i++) {
      this.add(new Butterfly(assets.moths, i, 'ember.moth'));
    }
    this.addGirl();
  }
}
