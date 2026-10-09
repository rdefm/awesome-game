import { Bush, MoleHole, Rock } from './entities/bluebell.js';
import { Butterfly } from './entities/outdoors.js';
import { Pod } from './entities/pod.js';
import { OutdoorScene } from './outdoorScene.js';
import { PodScene } from './podScene.js';

// Planet Bluebell: a sunny meadow of giant ringing bluebells, a hopping
// puffball, butterflies and a friendly local, with our ship parked on the left
// (and a few secrets: a rock, a bush and a molehill). Far off in the meadow
// is the pink alien's round pod: tap it and she walks up the path, getting
// smaller, and goes inside.
export class BluebellScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'bluebell', opts);
    this.addHouse(new Pod(assets), (o) => new PodScene(assets, o));
    this.add(new Rock(assets));
    this.add(new Bush(assets));
    this.add(new MoleHole(assets));
    this.addPlaced();
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.butterflies, i, 'bluebell.butterfly'));
    }
    this.addGirl();
  }
}
