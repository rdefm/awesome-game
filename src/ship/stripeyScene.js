import { SandMound } from './entities/stripey.js';
import { Butterfly } from './entities/outdoors.js';
import { ZigHut } from './entities/zigHut.js';
import { OutdoorScene } from './outdoorScene.js';
import { ZigHutScene } from './zigHutScene.js';

// Planet Stripey: a striped canyon under a sunset-striped sky, home to Zig
// the stripey alien, with stripe stones, stripe cacti and stripy
// butterflies, our ship parked on the left (and a secret: a sand mound with
// a stripy worm living in it). Out among the mesas is Zig's hut: tap it and
// she walks up the sandy path, getting smaller, and goes inside. Beside the
// ship is the hoverbike, to ride off anywhere else on Stripey.
export class StripeyScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'stripey', opts);
    this.addHouse(new ZigHut(assets), (o) => new ZigHutScene(assets, o));
    this.addBike();
    this.add(new SandMound(assets));
    this.addPlaced();
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.stripeButterflies, i, 'stripey.butterfly'));
    }
    this.addGirl();
  }
}
