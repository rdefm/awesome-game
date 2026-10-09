import { ease } from '../../engine/tween.js';
import { offerChat } from '../chat.js';
import { GONZO } from '../talks/gonzo.js';
import { MONKEY } from '../talks/monkey.js';
import { hold, isFriendItem, letGo, play } from './friends.js';
import { isSnack } from './items.js';
import { Stroller } from './stroller.js';

// ------------------------------------------------------------------ Monkey
// A cheeky monkey who's lived on the ship since the start. Tap him and he
// does a backflip, "OOH OOH!". Drop the ball on him and he boots it away.
export class Monkey extends Stroller {
  constructor(assets, state) {
    super(state, assets.monkey, { speed: 22, wander: 90, width: 14, height: 24 });
  }

  onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (this.free) {
      this.backflip();
    }
  }

  // Up, right round, and down with a grin.
  async backflip() {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(this.x);
    engine.audio.play('oohooh');
    this.frame = 'hop';
    this.turn = 0;
    await Promise.all([
      engine.tweens.to(this, { lift: 14 }, 0.22, ease.outQuad).then(() => engine.tweens.to(this, { lift: 0 }, 0.22, ease.inQuad)),
      engine.tweens.to(this, { turn: 1 }, 0.44, ease.inOutSine),
    ]);
    this.turn = 0;
    this.boing(1.2);
    scene.sparkles(this.x, this.y - 20, 5);
    this.facing = girl.x < this.x ? -1 : 1;
    this.frame = 'wave1';
    await engine.wait(0.3);
    girl.say('star', 1.2);
    letGo(this);
    offerChat(scene, this);
  }

  chat() {
    return { tree: MONKEY, facts: {} };
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item) || item.kind === 'ball');
  }

  receive(item) {
    if (isFriendItem(item)) {
      return play(item, this);
    }
    return isSnack(item) ? this.eat(item) : this.kick(item);
  }

  // The ball lands at his feet and he boots it away across the floor.
  async kick(ball) {
    hold(this);
    const { scene } = this;
    const side = ball.x < this.x ? -1 : 1;
    await scene.putDown(ball, this.x + side * 10, this.y);
    this.facing = side;
    this.frame = 'hop';
    this.boing(1);
    scene.engine.audio.play('oohooh');
    ball.kick(side);
    await scene.engine.wait(0.3);
    scene.girl.faceToward(ball.x);
    scene.girl.say('star', 1);
    letGo(this);
  }
}

// ------------------------------------------------------------------- Gonzo
// A fuzzy blue daredevil with a long nose. Tap him and he does a
// stunt: a mighty leap, a spin, and a splat of a landing. "TA-DA!"
export class Gonzo extends Stroller {
  constructor(assets, state) {
    super(state, assets.gonzo, { speed: 14, wander: 70, width: 14, height: 24 });
  }

  onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (this.free) {
      this.stunt();
    }
  }

  async stunt() {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(this.x);
    engine.audio.play('drumroll');
    this.frame = 'wave1';
    await engine.wait(0.5);
    this.frame = 'hop';
    this.turn = 0;
    await Promise.all([
      engine.tweens.to(this, { lift: 24 }, 0.3, ease.outQuad).then(() => engine.tweens.to(this, { lift: 0 }, 0.25, ease.inQuad)),
      engine.tweens.to(this, { turn: 2 }, 0.55, ease.inOutSine),
    ]);
    this.turn = 0;
    engine.audio.play('boing');
    this.boing(2);
    scene.dust(this.x, this.y);
    await engine.wait(0.3);
    engine.audio.play('tada');
    this.facing = girl.x < this.x ? -1 : 1;
    for (let i = 0; i < 4; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      await engine.wait(0.2);
    }
    scene.hearts(this.x, this.y - 30, 2);
    girl.say('heart', 1.2);
    letGo(this);
    offerChat(scene, this);
  }

  chat() {
    return { tree: GONZO, facts: {} };
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item));
  }

  receive(item) {
    return isFriendItem(item) ? play(item, this) : this.eat(item);
  }
}
