import { FlossBush, GingerbreadHouse } from './entities/candy.js';
import { Butterfly } from './entities/outdoors.js';
import { GingerbreadScene } from './gingerbreadScene.js';
import { OutdoorScene } from './outdoorScene.js';

// Planet Candy: pink icing underfoot, frosting hills and lollipop trees, a
// wobbly gummy bear, lollipops and gumdrops, candy butterflies, our ship
// parked on the left (and a secret: a candy-floss bush with a sugar mouse in
// it). Far off at the back is the gingerbread house: tap it and she walks
// up the winding path, getting smaller and smaller, and goes inside.
export class CandyScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'candy', opts);
    this.addHouse(new GingerbreadHouse(assets), (o) => new GingerbreadScene(assets, o));
    this.add(new FlossBush(assets));
    this.addPlaced();
    for (let i = 0; i < 3; i++) {
      this.add(new Butterfly(assets.candyButterflies, i, 'candy.butterfly'));
    }
    this.addGirl();
  }
}
