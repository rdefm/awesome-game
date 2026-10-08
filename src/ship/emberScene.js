import { Geyser, LavaPool } from './entities/ember.js';
import { Butterfly } from './entities/outdoors.js';
import { OutdoorScene } from './outdoorScene.js';

// Planet Ember: a warm volcanic plain under a smouldering sky, with fire
// flowers, a geode, a scurrying newt and glowing moths, our ship parked on
// the left (and a couple of secrets: a steam vent and a lava pool with a
// fish in it).
export class EmberScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'ember', opts);
    this.add(new Geyser(assets));
    this.add(new LavaPool(assets));
    this.addPlaced();
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.moths, i, 'ember.moth'));
    }
    this.addGirl();
  }
}
