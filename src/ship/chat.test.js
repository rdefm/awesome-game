import { describe, expect, it, vi } from 'vitest';
import { Chat, choiceRows } from './chat.js';

const TREE = {
  color: '#ff8fc8',
  voice: 'chatAlien',
  bye: 'SEE YOU!',
  nodes: { start: { lines: [['them', 'HI!']], choices: [{ text: 'HOW ARE YOU?', go: 'fine' }] }, fine: { lines: [['them', 'GREAT!']] } },
};

// Just enough of a scene for a chat to run in.
function fakeScene() {
  return {
    modal: null,
    girl: { x: 100, headTop: 100, cancelWalk: vi.fn(), faceToward: vi.fn(), hop: vi.fn() },
    engine: { audio: { play: vi.fn() } },
  };
}

// A tap at (x, y), after long enough for the chat to take it.
function tap(chat, x = 128, y = 40) {
  chat.update(1);
  chat.pointerDown({ x, y });
  chat.pointerUp({ x, y });
}

const middleOf = (row) => ({ x: row.x + row.w / 2, y: row.y + row.h / 2 });

describe('chat', () => {
  it('stacks chunky choice rows on screen along the bottom', () => {
    const rows = choiceRows(4);
    expect(rows.at(-1).y + rows.at(-1).h).toBeLessThanOrEqual(160);
    for (const row of rows) {
      expect(row.h).toBeGreaterThanOrEqual(14);
      expect(row.w).toBe(256);
    }
  });

  it('is the modal while open, and hands back once bye is said', async () => {
    const scene = fakeScene();
    const chat = new Chat(scene, { x: 140, headTop: 110 }, TREE, {});
    const closed = chat.open();
    expect(scene.modal).toBe(chat);
    tap(chat); // past "HI!"
    const bye = middleOf(choiceRows(2)[1]);
    tap(chat, bye.x, bye.y); // "BYE!"
    tap(chat); // past her "BYE!"
    expect(scene.modal).toBe(chat);
    tap(chat); // past "SEE YOU!"
    expect(scene.modal).toBeNull();
    await closed;
  });

  it('follows a picked choice', () => {
    const chat = new Chat(fakeScene(), { x: 140, headTop: 110 }, TREE, {});
    chat.open();
    tap(chat);
    const pick = middleOf(choiceRows(2)[0]);
    tap(chat, pick.x, pick.y);
    tap(chat);
    expect(chat.talk.lines.map((l) => l.text)).toEqual(['HOW ARE YOU?', 'GREAT!']);
  });

  it('ignores taps that miss the choices', () => {
    const chat = new Chat(fakeScene(), { x: 140, headTop: 110 }, TREE, {});
    chat.open();
    tap(chat);
    tap(chat, 128, 10);
    expect(chat.talk.choices).not.toBeNull();
    expect(chat.talk.at).toBe(1);
  });
});
