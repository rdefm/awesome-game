import { BallPit, Swing, Trampoline } from './entities/playroom.js';
import { SideRoomScene } from './sideRoomScene.js';

// The playroom, through the wall to the right of the cockpit: a ball pit,
// a swing and a trampoline. Tap one and she has a go; drop a friend on one
// and they do.
export class PlayRoomScene extends SideRoomScene {
  constructor(assets, opts) {
    super(assets, 'playroom', assets.playRoom, opts);
    this.add(new BallPit(assets));
    this.add(new Swing(assets));
    this.add(new Trampoline(assets));
    this.addGirl();
  }
}
