import { Bush, MoleHole, Rock } from './entities/bluebell.js';
import { PuffBurrow } from './entities/burrow.js';
import { Carryable } from './entities/carryable.js';
import { Dandelion } from './entities/dandelion.js';
import { Kite } from './entities/kite.js';
import { Butterfly } from './entities/outdoors.js';
import { W, floorMaxX } from './layout.js';
import { Basket, Blanket } from './entities/picnic.js';
import { Pod } from './entities/pod.js';
import { PosyPatch } from './entities/posies.js';
import { RainCloud } from './entities/rainCloud.js';
import { Stream, besideStream, streamStones } from './entities/stream.js';
import { OutdoorScene } from './outdoorScene.js';
import { PodScene } from './podScene.js';

// Planet Bluebell: a sunny meadow of giant ringing bluebells, a hopping
// puffball, butterflies and a friendly local, with our ship parked on the left
// (and a few secrets: a rock, a bush and a molehill), and a little rain
// cloud floating low over them to make it rain. Far off in the meadow
// is the pink alien's round pod: tap it and she walks up the path, getting
// smaller, and goes inside. Beside the ship is the hoverbike, to ride off
// anywhere else on Bluebell. The meadow is two screens wide (see MEADOW_W):
// the view follows her along it, and the far stretch has more bluebells and
// butterflies of its own, a picnic (a checked blanket to sit on and a
// basket of sandwiches and berry juice), a patch of little bluebells to
// pick posies from, a burrow of baby puffballs in a grassy bank, a giant
// dandelion clock to blow, a kite to fly, and a little stream at the far
// end with stepping stones across it.
export class BluebellScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'bluebell', opts);
    this.roam.maxX = floorMaxX(this.width); // critters wander the whole meadow
    this.addHouse(new Pod(assets), (o) => new PodScene(assets, o));
    this.addBike();
    this.add(new Rock(assets));
    this.add(new Bush(assets));
    this.add(new MoleHole(assets));
    this.add(new RainCloud(assets));
    this.add(new Blanket(assets));
    this.add(new Basket(assets));
    this.add(new PosyPatch(assets));
    this.add(new PuffBurrow(assets));
    this.add(new Dandelion(assets));
    this.add(new Kite(assets));
    this.add(new Stream(assets));
    this.stones = streamStones(assets).map((stone) => this.add(stone));
    this.addPlaced();
    // (Anything an older save left where the stream now runs sits on its bank.)
    for (const e of this.entities.filter((e) => e instanceof Carryable)) {
      Object.assign(e, besideStream(e, this.width));
    }
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.butterflies, i, 'bluebell.butterfly'));
    }
    // Two more over the far stretch, a screen along.
    for (let i = 0; i < 2; i++) {
      this.add(new Butterfly(assets.butterflies, i + 1, 'bluebell.butterfly', W));
    }
    this.addGirl();
  }

  // Nothing put down comes to rest in the stream (only things dropped right
  // in, which float off).
  restingSpot(item, x, y) {
    return besideStream(super.restingSpot(item, x, y), this.width);
  }
}
