import { EmberScene } from './emberScene.js';
import { Cradle, Hearth, LavaLamp } from './entities/lavaHouse.js';
import { IndoorScene } from './indoorScene.js';

// Inside the lava family's house on Ember: a cosy stone room where dad, mum
// and the baby live, with a hearth whose pot cooks lava cakes, a lava lamp,
// and the baby's cradle. Tap the door to go back outside.
export class LavaHouseScene extends IndoorScene {
  constructor(assets, { fromDoor = false } = {}) {
    super(assets, 'lavahouse', {
      room: assets.lavaRoom,
      door: assets.lavaDoor,
      dust: '#a8604a',
      outside: () => new EmberScene(assets, { fromHouse: true }),
      fromDoor,
    });
    this.add(new Hearth(assets));
    this.add(new LavaLamp(assets));
    this.add(new Cradle(assets));
    this.addPlaced();
    this.addGirl();
  }
}
