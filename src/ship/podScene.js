import { BluebellScene } from './bluebellScene.js';
import {
  BedNook, BubbleBath, Dresser, Kettle, LightCord, Pantry, PhotoFrame, SeedTray, Telescope, normalizePod,
} from './entities/pod.js';
import { IndoorScene } from './indoorScene.js';
import { isFriend } from './kinds.js';
import { loadSave, writeSave } from './save.js';
import { find } from './world.js';

// Inside the pink alien's pod on Bluebell: a cosy round room, with a
// telescope pointing up at a window where the stars come out, a seed tray
// to water and watch sprout, a bubble bath, a bed nook to nap in, a pantry
// cupboard of snacks, a kettle on a stove, a chest of drawers with little
// things tucked away in it, a pull-cord that changes the colour of the
// string of lights, and a photo frame of the last friend she brought in
// (out of her bag). Tap the door to go back out.
export class PodScene extends IndoorScene {
  constructor(assets, { fromDoor = false } = {}) {
    super(assets, 'pod', {
      room: assets.podRoom,
      door: assets.podDoor,
      dust: '#ffc8e6',
      outside: () => new BluebellScene(assets, { fromHouse: true }),
      fromDoor,
    });
    const pod = normalizePod(loadSave().pod);
    this.cord = this.add(new LightCord(assets, pod.lights));
    this.frame = this.add(new PhotoFrame(assets, pod.photo));
    this.add(new Dresser(assets));
    this.add(new Telescope(assets));
    this.add(new SeedTray(assets));
    this.add(new Kettle(assets));
    this.add(new Pantry(assets));
    this.add(new BubbleBath(assets)); // (in front of the kettle and the pantry)
    this.nook = this.add(new BedNook(assets)); // (after the bath: it dims over its bubbles)
    this.addPlaced();
    this.addGirl();
  }

  // Remembers the pod's light colour and photo (`patch`: either or both).
  savePod(patch) {
    const save = loadSave();
    writeSave({ ...save, pod: { ...normalizePod(save.pod), ...patch } });
  }

  // A friend brought in out of the bag (popped out onto the floor, or
  // dragged out and let go anywhere but back in the bag) has its photo taken.
  placeFromBag(entry) {
    super.placeFromBag(entry);
    this.frame.snap(entry);
  }

  dropCarryable(item, p) {
    const fromBag = isFriend(item.kind) && this.world.bag.some((e) => e.id === item.id);
    const backIn = this.bag.isDropTarget(this.toScreen(p));
    super.dropCarryable(item, p);
    if (fromBag && !backIn) {
      this.frame.snap(find(this.world, item.id) ?? item);
    }
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
