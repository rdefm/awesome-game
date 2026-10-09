import { ease } from '../../engine/tween.js';
import { CREW_POD } from '../layout.js';
import { offerChat } from '../chat.js';
import { CrewPicker } from '../crewPicker.js';
import { canMakeCrew, normalizeCrew } from '../crew.js';
import { CREW } from '../talks/crew.js';
import { hold, isFriendItem, letGo, play } from './friends.js';
import { inRect } from './house.js';
import { isSnack } from './items.js';
import { Prop } from './props.js';
import { Stroller } from './stroller.js';

// ---------------------------------------------------------------- crewmate
// A crewmate she made in the crew pod: an ordinary friend (it strolls, greets
// her, plays, sits in chairs, rides in the bag, eats snacks and chats). Its
// body, eyes and ears are on its world entry as `crew` (its hat as `hat`).
export class Crew extends Stroller {
  constructor(assets, state) {
    const look = normalizeCrew(state.crew);
    super(state, assets.crewFrames(look), { speed: 16, wander: 70, width: 16, height: 24 });
    this.look = look;
  }

  onTap() {
    if (this.seat) {
      this.seat.spin();
      return;
    }
    if (this.free) {
      this.wave();
    }
  }

  // A happy wave and a hop, then a chat if she wants one.
  async wave() {
    hold(this);
    const { scene } = this;
    const { engine, girl } = scene;
    this.boing(0.7);
    this.facing = girl.x < this.x ? -1 : 1;
    girl.faceToward(this.x);
    engine.audio.play('giggle');
    for (let i = 0; i < 4; i++) {
      this.frame = i % 2 ? 'wave2' : 'wave1';
      await engine.wait(0.2);
    }
    await this.hopUp(8);
    scene.hearts(this.x, this.y - 30, 2);
    girl.say('heart', 1.2);
    letGo(this);
    offerChat(scene, this);
  }

  chat() {
    return { tree: CREW, facts: {} };
  }

  accepts(item) {
    return this.free && (isSnack(item) || isFriendItem(item));
  }

  receive(item) {
    return isFriendItem(item) ? play(item, this) : this.eat(item);
  }
}

// ----------------------------------------------------------------- crew pod
// The crew pod in the store room. Tap it and she walks over; the creator
// slides up and she builds a crewmate, watching it change as she taps. Tap
// "Done" and the pod hisses open and the new crewmate hops out. There's only
// room for MAX_CREW crewmates in all.
export class CrewPod extends Prop {
  constructor(assets) {
    super();
    this.imgs = assets.crewPod;
    this.x = CREW_POD.x;
    this.y = CREW_POD.y;
    this.spot = CREW_POD.spot;
    this.open = false;
    this.glow = 0;
  }

  hitTest(px, py) {
    return inRect(px, py, this.x - CREW_POD.w / 2, this.y - CREW_POD.h, CREW_POD.w, CREW_POD.h);
  }

  wobble(amount) {
    this.squash = amount;
    this.scene.engine.tweens.to(this, { squash: 0 }, 0.35, ease.outElastic);
  }

  use() {
    const { scene } = this;
    if (scene.busy) {
      return;
    }
    scene.scripted(() => this.make());
  }

  async make() {
    const { scene } = this;
    const { engine, girl } = scene;
    girl.faceToward(this.x);
    girl.act('reach', 0.4);
    if (!canMakeCrew(scene.world)) {
      // A full crew: the pod just hums.
      engine.audio.play('denied');
      this.wobble(0.5);
      scene.toast('THE CREW IS FULL!', 2);
      girl.say('question', 1);
      return;
    }
    this.picker ??= new CrewPicker(scene);
    const crew = await this.picker.open();
    if (crew) {
      await this.hatch(crew);
    }
  }

  // The pod whirrs and glows, hisses open and the new crewmate hops out.
  async hatch({ hat, ...crew }) {
    const { scene } = this;
    const { engine, girl } = scene;
    engine.audio.play('whirr');
    for (let i = 0; i < 4; i++) {
      this.wobble(0.5);
      this.glow = 1;
      await engine.wait(0.22);
    }
    this.glow = 0;
    engine.audio.play('poof');
    this.open = true;
    for (let i = 0; i < 3; i++) {
      scene.bits(this.x + (i - 1) * 6, this.y - CREW_POD.h + 6, 6, '#e8fbff'); // steam
    }
    const item = scene.spawn('crew', this.x, this.y - 12, { crew, hat: hat === 'none' ? undefined : hat });
    if (!item) {
      this.open = false;
      return;
    }
    hold(item);
    scene.sparkles(this.x, this.y - 24, 8);
    await engine.wait(0.3);
    engine.audio.play('giggle');
    await scene.putDown(item, CREW_POD.out.x, CREW_POD.out.y);
    item.facing = girl.x < item.x ? -1 : 1;
    scene.hearts(item.x, item.y - 30, 3);
    girl.faceToward(item.x);
    girl.say('heart', 1.4);
    letGo(item);
    await girl.act('cheer', 0.6);
    this.open = false;
  }

  draw(r) {
    r.image(this.imgs[this.open ? 'open' : 'shut'], this.x, this.y, { scaleX: 2 - this.bounce, scaleY: this.bounce });
  }
}
