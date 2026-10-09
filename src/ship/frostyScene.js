import { SnowDrift } from './entities/frosty.js';
import { IceCave } from './entities/iceCave.js';
import { Butterfly } from './entities/outdoors.js';
import { IceCaveScene } from './iceCaveScene.js';
import { OutdoorScene } from './outdoorScene.js';

// Planet Frosty: a snowy valley under softly falling snow, home to a mum and
// baby yeti, with snowballs, frost flowers and little snowbirds, our ship
// parked on the left (and a secret: a snow drift with a hare behind it). Up
// in the mountainside is the yetis' ice cave: tap it and she walks up the
// snowy path, getting smaller, and goes inside.
export class FrostyScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'frosty', opts);
    this.addHouse(new IceCave(assets), (o) => new IceCaveScene(assets, o));
    this.add(new SnowDrift(assets));
    this.addPlaced();
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.snowbirds, i, 'frosty.bird'));
    }
    this.addGirl();
  }
}
