import { ease } from '../engine/tween.js';
import { centreOn, easeCam } from './camera.js';
import { ClimbTree, SwingRope, TreeHouse, deckAngle } from './entities/mrMonkey.js';
import { Butterfly } from './entities/outdoors.js';
import { CANOPY, W, climbSpot, deckSpot, floorMaxX } from './layout.js';
import { OutdoorScene } from './outdoorScene.js';
import { TreeHouseScene } from './treeHouseScene.js';

const RUNGS = 6; // steps up (or down) the ladder or the vine

// Planet Mr Monkey: a deep forest of tall, tall trees, with our ship parked
// on the left. Far off at the back is the tree family's house, a great big
// tree with a door in it: tap it and she walks up the path, getting
// smaller, and goes inside. The forest is two screens wide (see FOREST_W),
// and on the far stretch stand two climbing trees, with platforms up high
// and a rope hanging between them: tap the first tree and she climbs its
// ladder (the second has a vine), and tap the rope and she swings across
// from one platform to the other. Up a tree, tap anywhere else and she
// climbs back down first. Friends dropped on the rope swing across too...
// though Monkey and Gonzo go much too fast (see SwingRope).
export class MrMonkeyScene extends OutdoorScene {
  constructor(assets, opts) {
    super(assets, 'mrmonkey', opts);
    this.roam.maxX = floorMaxX(this.width);
    this.addHouse(new TreeHouse(assets), (o) => new TreeHouseScene(assets, o));
    this.trees = CANOPY.trees.map((_, i) => this.add(new ClimbTree(assets, i)));
    this.rope = this.add(new SwingRope(assets));
    this.up = null; // which tree she's up (its index), while she's up one
    this.addPlaced();
    for (let i = 0; i < 2; i++) {
      this.add(new Butterfly(assets.forestButterflies, i, 'mrmonkey.butterfly'));
    }
    this.add(new Butterfly(assets.forestButterflies, 2, 'mrmonkey.butterfly', W));
    this.addGirl();
  }

  // Which tree she's standing up (its index), or null if she's on the floor
  // (she may have been picked up and carried off it).
  get upTree() {
    return this.girl.perch > 0 ? this.up : null;
  }

  // Tapped tree `i`: up it she climbs, or back down if she's up it already.
  async useTree(i) {
    const up = this.upTree;
    if (up === i) {
      await this.climbDown();
      return;
    }
    if (up !== null) {
      await this.climbDown();
    }
    await this.climbUp(i);
  }

  // Over to the foot of tree `i` and up its ladder (or vine), then out onto
  // its platform. Resolves true once she's up, false if the walk there was
  // cut short.
  async climbUp(i) {
    const { engine, girl } = this;
    const tree = CANOPY.trees[i];
    const foot = climbSpot(i);
    if (!(await girl.walkTo(foot.x, foot.y))) {
      return false;
    }
    await this.scripted(async () => {
      girl.facing = tree.side;
      girl.mode = 'act';
      girl.pose = { frame: 'held', token: {} }; // reaching up, hand over hand
      for (let step = 1; step <= RUNGS; step++) {
        engine.audio.play(tree.climb === 'ladder' ? 'tap' : 'rustle');
        await engine.tweens.to(girl, { perch: (CANOPY.deck * step) / RUNGS }, tree.climb === 'ladder' ? 0.2 : 0.26, ease.outQuad);
      }
      girl.pose = null;
      girl.mode = 'walk';
      await engine.tweens.to(girl, { x: deckSpot(i).x }, 0.35, ease.linear);
      girl.mode = 'idle';
    });
    this.up = i;
    girl.say('heart', 1.2);
    return true;
  }

  // Back along the platform and down: step by step down the ladder, or
  // sliding all the way down the vine.
  async climbDown() {
    const { engine, girl } = this;
    const i = this.upTree;
    if (i === null) {
      return;
    }
    const tree = CANOPY.trees[i];
    await this.scripted(async () => {
      const foot = climbSpot(i);
      girl.faceToward(foot.x);
      girl.mode = 'walk';
      await engine.tweens.to(girl, { x: foot.x }, 0.35, ease.linear);
      girl.mode = 'act';
      girl.pose = { frame: 'held', token: {} };
      if (tree.climb === 'vine') {
        engine.audio.play('wheee');
        await engine.tweens.to(girl, { perch: 0 }, 0.6, ease.inQuad);
        this.dust(girl.x, girl.y);
      } else {
        for (let step = RUNGS - 1; step >= 0; step--) {
          engine.audio.play('tap');
          await engine.tweens.to(girl, { perch: (CANOPY.deck * step) / RUNGS }, 0.16, ease.inQuad);
        }
      }
      girl.pose = null;
      girl.mode = 'idle';
    });
    this.up = null;
    this.persist();
  }

  // Tapped the rope: up to it if she's down on the floor, and if it's hooked
  // up over at the other tree, it swings across to her. Then she grabs it
  // and swings off the platform, right across to the other tree's platform.
  async swing() {
    const { engine, girl, rope } = this;
    let from = this.upTree;
    if (from === null) {
      if (!(await this.climbUp(rope.side))) {
        return;
      }
      from = rope.side;
    }
    const to = 1 - from;
    rope.busy = true;
    await this.scripted(async () => {
      if (rope.side !== from) {
        girl.act('reach', 0.9);
        engine.audio.play('swoop');
        await rope.swingTo(deckAngle(from), 0.9);
        rope.side = from;
      }
      girl.facing = CANOPY.trees[to].x > girl.x ? 1 : -1;
      girl.mode = 'act';
      girl.pose = { frame: 'held', token: {} };
      rope.rider = { place: (end) => Object.assign(girl, { x: end.x, perch: CANOPY.ground - (end.y + CANOPY.grip) }) };
      engine.audio.play('wheee');
      await rope.swingTo(deckAngle(to), 1.1);
      rope.rider = null;
      rope.side = to;
      girl.pose = null;
      girl.mode = 'idle';
    });
    rope.busy = false;
    this.up = to;
    girl.say('star', 1.4);
    girl.act('cheer', 0.8);
    this.hearts(girl.x, girl.headTop - 2, 3);
    this.findSticker('mrmonkey.swing', girl.x, girl.headTop - 8);
  }

  // While someone's on the rope, the view swings over to show both trees,
  // so a swing across (or a smack into the far tree) is never off screen.
  moveView(dt) {
    if (this.rope.busy && !this.panning && !this.press?.dragging) {
      this.camX = easeCam(this.camX, centreOn(CANOPY.rope.x, this.width), dt);
      this.lastGirlX = this.girl.x;
      return;
    }
    super.moveView(dt);
  }

  // Up a tree, she climbs down before going off to anything else...
  async interact(prop) {
    if (this.upTree !== null) {
      await this.climbDown();
    }
    return super.interact(prop);
  }

  // ...or walking off anywhere.
  onTapEmpty(p) {
    if (this.upTree === null) {
      super.onTapEmpty(p);
      return;
    }
    if (!this.busy) {
      this.climbDown().then(() => super.onTapEmpty(p));
    }
  }
}
