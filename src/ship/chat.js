import { ease } from '../engine/tween.js';
import { hold, letGo } from './entities/friends.js';
import { H, W } from './layout.js';
import { choose, current, next, startTalk, wrap } from './talk.js';

// Chatting with a friend on screen. A friend that can chat has a `headTop`
// (where its lines go) and `chat()`, returning { tree, facts } (see talk.js).
// After its trick it offers a chat with a little speech bubble; tapping the
// bubble opens the chat, which is the scene's modal until "Bye!".

const ME_COLOR = '#8fd3ff'; // her lines
const OUTLINE = '#1b1427';
const WRAP = 30; // characters per row of a line above someone's head
const ROW_H = 16; // a choice row: chunky, for wobbly taps
const CHOICE_SCALE = 2;
const BUBBLE_LIFE = 4; // seconds before an ignored bubble fades away

// Where the choice rows go, top to bottom, stacked up from the bottom edge.
export function choiceRows(n) {
  const top = H - n * ROW_H - 2;
  return Array.from({ length: n }, (_, i) => ({ x: 0, y: top + i * ROW_H, w: W, h: ROW_H }));
}

// True if `id` (a star sticker, or one of the scene's memories) has
// happened: the world facts friends' chats change with.
export function happened(scene, id) {
  return scene.stickers.includes(id) || scene.memories.includes(id);
}

// Offers a chat with `speaker` via a speech bubble over its head, after
// `delay` seconds (to let a trick finish), if it's still free to chat.
export async function offerChat(scene, speaker, delay = 0) {
  if (delay) {
    await scene.engine.wait(delay);
  }
  if (scene.engine.scene !== scene || !scene.entities.includes(speaker) || speaker.busy || speaker.held || speaker.seat) {
    return;
  }
  for (const e of scene.entities) {
    if (e instanceof ChatBubble && e.speaker === speaker) {
      scene.remove(e);
    }
  }
  scene.add(new ChatBubble(speaker));
  scene.engine.audio.play('peek');
}

// The bubble: pops up above the speaker, bobs, and fades if ignored.
export class ChatBubble {
  constructor(speaker) {
    this.speaker = speaker;
    this.color = speaker.chat().tree.color; // of the dots
    this.t = 0;
    this.priority = 20; // wins over the speaker under it
    this.depth = 1e6;
  }

  get x() {
    return this.speaker.x + 8;
  }

  get y() {
    return this.speaker.headTop - 4;
  }

  hitTest(px, py) {
    // Reaches down over the speaker's head: a tap a bit low still opens the chat.
    return Math.abs(px - this.x) < 12 && py > this.y - 16 && py < this.y + 8;
  }

  onTap() {
    const { scene, speaker } = this;
    scene.remove(this);
    const { tree, facts } = speaker.chat();
    new Chat(scene, speaker, tree, facts).open();
  }

  update(dt) {
    this.t += dt;
    const { speaker } = this;
    if (this.t > BUBBLE_LIFE || speaker.held || speaker.busy || !this.scene.entities.includes(speaker)) {
      this.scene.remove(this);
    }
  }

  drawOver(r) {
    const pop = Math.min(1, this.t / 0.15);
    const alpha = Math.min(1, (BUBBLE_LIFE - this.t) / 0.5);
    const x = Math.round(this.x - 7);
    const y = Math.round(this.y - 10 - pop * 2 + Math.sin(this.t * 4) * 0.8);
    // A rounded white bubble with a tail down to the speaker and "..." in it.
    r.rect(x + 1, y, 13, 9, OUTLINE, alpha);
    r.rect(x, y + 1, 15, 7, OUTLINE, alpha);
    r.rect(x + 1, y + 1, 13, 7, '#ffffff', alpha);
    r.rect(x + 2, y + 9, 3, 1, OUTLINE, alpha);
    r.rect(x + 3, y + 8, 1, 1, '#ffffff', alpha);
    r.rect(x + 2, y + 10, 1, 1, OUTLINE, alpha);
    for (let i = 0; i < 3; i++) {
      const hop = Math.floor(this.t * 6) % 3 === i ? 1 : 0;
      r.rect(x + 3 + i * 4, y + 4 - hop, 2, 2, this.color, alpha);
    }
  }
}

// The chat itself: whoever's speaking has their line over their head, and
// her choices sit in a band along the bottom. Every tap moves it on.
export class Chat {
  constructor(scene, speaker, tree, facts) {
    this.scene = scene;
    this.speaker = speaker;
    this.tree = tree;
    this.talk = startTalk(tree, facts);
    this.t = 0; // since the current line or choices showed
    this.press = null; // index of the choice row pressed (-1 for none) while held
  }

  get assets() {
    return this.scene.assets;
  }

  // Opens it; resolves once it's been said goodbye to.
  open() {
    const { scene, speaker } = this;
    this.prevModal = scene.modal;
    scene.modal = this;
    scene.girl.cancelWalk();
    scene.girl.faceToward(speaker.x);
    hold(speaker); // it stays to chat
    speaker.facing = scene.girl.x < speaker.x ? -1 : 1;
    scene.engine.audio.play('select');
    this.shown();
    return new Promise((resolve) => {
      this.done = resolve;
    });
  }

  // Something new is showing: give it a voice, or close if it's all said.
  shown() {
    const step = current(this.talk);
    this.t = 0;
    if (!step) {
      this.scene.modal = this.prevModal;
      letGo(this.speaker);
      this.done?.();
      return;
    }
    if (step.line) {
      const them = step.line.who === 'them';
      this.scene.engine.audio.play(them ? this.tree.voice : 'chatGirl');
      if (them) {
        this.speaker.boing?.(0.4);
      } else {
        this.scene.girl.hop(3);
      }
    }
  }

  // The choice row under a point, or -1.
  rowAt(p, n) {
    return choiceRows(n).findIndex((row) => p.y >= row.y && p.y < row.y + row.h);
  }

  pointerDown(p) {
    const step = current(this.talk);
    this.press = step?.choices ? this.rowAt(p, step.choices.length) : -1;
  }

  pointerUp(p) {
    const press = this.press;
    this.press = null;
    const step = current(this.talk);
    if (!step || this.t < 0.2) {
      return; // a beat before it'll move on, so a double tap doesn't skip a line
    }
    if (step.line) {
      this.talk = next(this.talk);
      this.shown();
      return;
    }
    const i = this.rowAt(p, step.choices.length);
    if (i >= 0 && i === press) {
      this.talk = choose(this.talk, i);
      this.shown();
    }
  }

  update(dt) {
    this.t += dt;
  }

  draw(r) {
    const step = current(this.talk);
    if (step?.line) {
      this.drawLine(r, step.line);
    } else if (step?.choices) {
      this.drawChoices(r, step.choices);
    }
  }

  // A line in the speaker's colour, centred over their head, popping in.
  drawLine(r, { who, text }) {
    const them = who === 'them';
    const by = them ? this.speaker : this.scene.girl;
    const color = them ? this.tree.color : ME_COLOR;
    const rows = wrap(text, WRAP).map((row) => this.assets.text(row, color, { outline: OUTLINE }));
    const widest = Math.max(...rows.map((img) => img.width));
    const x = Math.max(2 + widest / 2, Math.min(W - 2 - widest / 2, by.x));
    const pop = ease.outBack(Math.min(1, this.t / 0.18));
    let y = Math.max(rows.length * 7 + 2, by.headTop - 3);
    for (let i = rows.length - 1; i >= 0; i--) {
      r.image(rows[i], Math.round(x), Math.round(y + (1 - pop) * 3), { alpha: Math.min(1, pop) });
      y -= 7;
    }
  }

  // Her choices, one chunky row each along the bottom.
  drawChoices(r, choices) {
    const rows = choiceRows(choices.length);
    const top = rows[0].y;
    const slide = (1 - ease.outQuad(Math.min(1, this.t / 0.2))) * (H - top);
    r.rect(0, top - 2 + slide, W, H - top + 2, OUTLINE, 0.9);
    r.rect(0, top - 2 + slide, W, 1, '#64729f');
    choices.forEach((c, i) => {
      const row = rows[i];
      const pressed = this.press === i;
      if (pressed) {
        r.rect(row.x, row.y + slide, row.w, row.h, '#4b5784');
      }
      const img = this.assets.text(c.text, pressed ? '#ffe066' : '#ffffff', { scale: CHOICE_SCALE, outline: OUTLINE });
      r.image(img, 6, row.y + slide + (row.h - img.height) / 2, { ax: 0, ay: 0 });
    });
  }
}
