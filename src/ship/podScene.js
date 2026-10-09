import { BluebellScene } from './bluebellScene.js';
import { BubbleBath, SeedTray, Telescope } from './entities/pod.js';
import { IndoorScene } from './indoorScene.js';

// Inside the pink alien's pod on Bluebell: a cosy round room, with a
// telescope pointing up at a window where the stars come out, a seed tray
// to water and watch sprout, and a bubble bath. Tap the door to go back out.
export class PodScene extends IndoorScene {
  constructor(assets, { fromDoor = false } = {}) {
    super(assets, 'pod', {
      room: assets.podRoom,
      door: assets.podDoor,
      dust: '#ffc8e6',
      outside: () => new BluebellScene(assets, { fromHouse: true }),
      fromDoor,
    });
    this.add(new Telescope(assets));
    this.add(new SeedTray(assets));
    this.add(new BubbleBath(assets));
    this.addPlaced();
    this.addGirl();
  }
}
