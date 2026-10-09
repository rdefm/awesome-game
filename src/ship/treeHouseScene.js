import { FireflyJar } from './entities/treeHouse.js';
import { IndoorScene } from './indoorScene.js';
import { MrMonkeyScene } from './mrMonkeyScene.js';

// Inside the tree family's house on Mr Monkey: the hollow of a great big
// tree, where dad, mum and their little sapling Twiggy live with Sprout,
// their pet leaf dragon. A round window onto the forest, and a jar of
// fireflies to let out. Tap the door to go back outside.
export class TreeHouseScene extends IndoorScene {
  constructor(assets, { fromDoor = false } = {}) {
    super(assets, 'treehouse', {
      room: assets.treeRoom,
      door: assets.treeDoor,
      dust: '#c08850',
      outside: () => new MrMonkeyScene(assets, { fromHouse: true }),
      fromDoor,
    });
    this.add(new FireflyJar(assets));
    this.addPlaced();
    this.addGirl();
  }
}
