import { BluebellScene } from './bluebellScene.js';
import { BedNook, BubbleBath, SeedTray, Telescope } from './entities/pod.js';
import { IndoorScene } from './indoorScene.js';

// Inside the pink alien's pod on Bluebell: a cosy round room, with a
// telescope pointing up at a window where the stars come out, a seed tray
// to water and watch sprout, a bubble bath, and a bed nook to nap in. Tap
// the door to go back out.
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
    this.nook = this.add(new BedNook(assets)); // (after the bath: it dims over its bubbles)
    this.addPlaced();
    this.addGirl();
  }

  // Up she gets first, if she's napping.
  async interact(prop) {
    if (this.nook.herAsleep) {
      await this.nook.wakeUp();
    }
    return super.interact(prop);
  }

  onTapEmpty(p) {
    if (this.nook.herAsleep) {
      this.nook.wakeUp();
      return;
    }
    super.onTapEmpty(p);
  }
}
