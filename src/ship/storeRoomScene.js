import { SideRoomScene } from './sideRoomScene.js';

// The store room, through the wall to the left of the cockpit: an empty
// room with painted bays on the floor, for keeping things in. Drop anything
// on the arrow in the cockpit to send it in here.
export class StoreRoomScene extends SideRoomScene {
  constructor(assets, opts) {
    super(assets, 'storeroom', assets.storeRoom, opts);
    this.addGirl();
  }
}
