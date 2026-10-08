import { Easel, GoggleShelf, Hammock, SandTimer } from './entities/zigHut.js';
import { IndoorScene } from './indoorScene.js';
import { StripeyScene } from './stripeyScene.js';

// Inside Zig's hut on Stripey: a stripy dome of a room, with an easel that
// paints the walls in another planet's stripes, a sand timer to turn over, a
// shelf of goggles to try on, and a hammock to swing (or for a friend to nap
// in). Tap the door to go back outside.
export class ZigHutScene extends IndoorScene {
  constructor(assets, { fromDoor = false } = {}) {
    super(assets, 'zighut', {
      room: assets.zigRoom[0],
      door: assets.zigDoor,
      dust: '#d4a46a',
      outside: () => new StripeyScene(assets, { fromHouse: true }),
      fromDoor,
    });
    this.add(new Easel(assets));
    this.add(new SandTimer(assets));
    this.add(new GoggleShelf(assets));
    this.add(new Hammock(assets));
    this.addPlaced();
    this.addGirl();
  }
}
