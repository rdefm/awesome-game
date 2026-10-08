import { Geyser, LavaPool } from './entities/ember.js';
import { LavaHouse } from './entities/lavaHouse.js';
import { Butterfly } from './entities/outdoors.js';
import { LavaHouseScene } from './lavaHouseScene.js';
import { OutdoorScene } from './outdoorScene.js';

// Planet Ember: a warm volcanic plain under a smouldering sky, with fire
// flowers, a geode, a scurrying newt and glowing moths, our ship parked on
// the left (and a couple of secrets: a steam vent and a lava pool with a
// fish in it). At the foot of the volcano is the lava family's house: tap it
// and she walks up the stepping-stone path, getting smaller, and goes inside.
// Beside the ship is the hoverbike, to ride off anywhere else on Ember.
export class EmberScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'ember', opts);
    this.addHouse(new LavaHouse(assets), (o) => new LavaHouseScene(assets, o));
    this.addBike();
    this.add(new Geyser(assets));
    this.add(new LavaPool(assets));
    this.addPlaced();
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.moths, i, 'ember.moth'));
    }
    this.addGirl();
  }
}
