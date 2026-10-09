import { ease } from '../../engine/tween.js';
import { clampToFloor } from './girl.js';

// Something that looks like plain scenery until tapped: it squashes at once,
// she walks over, then it reveals a little surprise. Tap it again for another
// go (subclasses can vary it each time). Secrets stay put: they can't be
// carried and never take things dropped on them, and only their own small
// patch answers taps, so she can walk right past them.
// Subclasses implement `reveal(n)` (n = how many times it's been revealed
// before), resolving once the surprise has played out.
export class Secret {
  // (x, y) is the bottom-centre; `w` x `h` the tappable patch above it.
  constructor(x, y, { w, h, reach = 16 }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.reach = reach;
    this.squash = 0;
    this.times = 0;
    this.revealing = false;
    this.priority = -1; // anything else under the finger (a dropped ball, say) wins
  }

  get bounce() {
    return 1 + this.squash * 0.12;
  }

  boing(amount = 1) {
    this.squash = amount;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.5, ease.outElastic);
  }

  // Where the girl stands to look: beside it, on whichever side she's on.
  get spot() {
    const side = this.scene.girl.x < this.x ? -1 : 1;
    return clampToFloor(this.x + side * this.reach, this.y + 2, this.scene.width);
  }

  hitTest(px, py) {
    return Math.abs(px - this.x) <= this.w / 2 && py >= this.y - this.h && py <= this.y + 2;
  }

  onTap() {
    this.scene.engine.audio.play('tap');
    this.boing(0.7);
    if (!this.revealing) {
      this.scene.interact(this);
    }
  }

  // She reacts to the surprise (a pose and a bubble), unless she's since gone
  // off somewhere else or been picked up.
  react(pose, emote) {
    const { girl } = this.scene;
    if (girl.mode !== 'idle' && girl.mode !== 'act') {
      return;
    }
    girl.faceToward(this.x);
    girl.say(emote, 1.2);
    girl.act(pose, 0.8);
  }

  async use() {
    if (this.revealing) {
      return;
    }
    this.revealing = true;
    this.scene.girl.faceToward(this.x);
    try {
      await this.reveal(this.times);
    } finally {
      this.times += 1;
      this.revealing = false;
    }
  }
}
