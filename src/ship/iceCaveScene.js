import { Campfire, FurNest, Icicles, PondWindow } from './entities/iceCave.js';
import { FrostyScene } from './frostyScene.js';
import { IndoorScene } from './indoorScene.js';

// Inside the yetis' ice cave on Frosty: a glittering cave home, with icicles
// that chime, a window of clear ice onto the frozen pond (a fish under the
// ice), a fur-rug nest for a friend to nap in, and a campfire to huddle
// round. Tap the fur curtain to go back outside.
export class IceCaveScene extends IndoorScene {
  constructor(assets, { fromDoor = false } = {}) {
    super(assets, 'icecave', {
      room: assets.iceRoom,
      door: assets.iceDoor,
      dust: '#ffffff',
      outside: () => new FrostyScene(assets, { fromHouse: true }),
      fromDoor,
    });
    this.add(new Icicles(assets));
    this.add(new PondWindow(assets));
    this.add(new FurNest(assets));
    this.add(new Campfire(assets));
    this.addPlaced();
    this.addGirl();
  }
}
