import { SandMound } from './entities/stripey.js';
import { Butterfly } from './entities/outdoors.js';
import { OutdoorScene } from './outdoorScene.js';

// Planet Stripey: a striped canyon under a sunset-striped sky, home to Zig
// the stripey alien, with stripe stones, stripe cacti and stripy
// butterflies, our ship parked on the left (and a secret: a sand mound with
// a stripy worm living in it).
export class StripeyScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'stripey', opts);
    this.add(new SandMound(assets));
    this.addPlaced();
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.stripeButterflies, i, 'stripey.butterfly'));
    }
    this.addGirl();
  }
}
