import { CandyScene } from './candyScene.js';
import { JellyJar, Oven } from './entities/candy.js';
import { IndoorScene } from './indoorScene.js';

// Inside the gingerbread house on Candy: a cosy room with Ginger, who lives
// here, an oven that bakes cupcakes and a jar of jellybeans. Tap the door to
// go back outside.
export class GingerbreadScene extends IndoorScene {
  constructor(assets, { fromDoor = false } = {}) {
    super(assets, 'gingerbread', {
      room: assets.houseRoom,
      door: assets.houseDoor,
      dust: '#ffd0ea',
      outside: () => new CandyScene(assets, { fromHouse: true }),
      fromDoor,
    });
    this.add(new Oven(assets));
    this.add(new JellyJar(assets));
    this.addPlaced();
    this.addGirl();
  }
}
