import { SnowDrift } from './entities/frosty.js';
import { Butterfly } from './entities/outdoors.js';
import { OutdoorScene } from './outdoorScene.js';

// Planet Frosty: a snowy valley under softly falling snow, home to a mum and
// baby yeti, with snowballs, frost flowers and little snowbirds, our ship
// parked on the left (and a secret: a snow drift with a hare behind it).
export class FrostyScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'frosty', opts);
    this.add(new SnowDrift(assets));
    this.addPlaced();
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.snowbirds, i, 'frosty.bird'));
    }
    this.addGirl();
  }
}
