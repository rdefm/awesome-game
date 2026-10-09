import { Bush, MoleHole, Rock } from './entities/bluebell.js';
import { Butterfly } from './entities/outdoors.js';
import { W, floorMaxX } from './layout.js';
import { Basket, Blanket } from './entities/picnic.js';
import { Pod } from './entities/pod.js';
import { PosyPatch } from './entities/posies.js';
import { OutdoorScene } from './outdoorScene.js';
import { PodScene } from './podScene.js';

// Planet Bluebell: a sunny meadow of giant ringing bluebells, a hopping
// puffball, butterflies and a friendly local, with our ship parked on the left
// (and a few secrets: a rock, a bush and a molehill). Far off in the meadow
// is the pink alien's round pod: tap it and she walks up the path, getting
// smaller, and goes inside. Beside the ship is the hoverbike, to ride off
// anywhere else on Bluebell. The meadow is two screens wide (see MEADOW_W):
// the view follows her along it, and the far stretch has more bluebells and
// butterflies of its own, a picnic (a checked blanket to sit on and a
// basket of sandwiches and berry juice) and a patch of little bluebells to
// pick posies from.
export class BluebellScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'bluebell', opts);
    this.roam.maxX = floorMaxX(this.width); // critters wander the whole meadow
    this.addHouse(new Pod(assets), (o) => new PodScene(assets, o));
    this.addBike();
    this.add(new Rock(assets));
    this.add(new Bush(assets));
    this.add(new MoleHole(assets));
    this.add(new Blanket(assets));
    this.add(new Basket(assets));
    this.add(new PosyPatch(assets));
    this.addPlaced();
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.butterflies, i, 'bluebell.butterfly'));
    }
    // Two more over the far stretch, a screen along.
    for (let i = 0; i < 2; i++) {
      this.add(new Butterfly(assets.butterflies, i + 1, 'bluebell.butterfly', W));
    }
    this.addGirl();
  }
}
