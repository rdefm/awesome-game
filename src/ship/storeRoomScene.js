import { CrewPod } from './entities/crew.js';
import { Lift } from './entities/lift.js';
import { DecorPrinter } from './entities/printer.js';
import { SideRoomScene } from './sideRoomScene.js';

// The store room, through the wall to the left of the cockpit: painted bays
// on the floor for keeping things in, the lift up to the galley and the bunk
// room (and any other decks), the decor printer against the back wall and
// the crew pod in front of the cargo net. Drop anything on the arrow in the
// cockpit to send it in here.
export class StoreRoomScene extends SideRoomScene {
  constructor(assets, opts) {
    super(assets, 'storeroom', assets.storeRoom, opts);
    this.add(new DecorPrinter(assets));
    this.add(new CrewPod(assets));
    this.lift = this.add(new Lift(assets));
    this.addGirl();
  }
}
