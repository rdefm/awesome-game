import { describe, expect, it } from 'vitest';
import { canDraw } from '../engine/font.js';
import { defineSfx } from './sfx.js';
import { BYE, choose, current, next, startTalk, wrap } from './talk.js';
import { TALKS } from './talks/index.js';

const TREE = {
  bye: 'SEE YOU!',
  nodes: {
    start: { if: 'gotCrystal', then: 'thanks', else: 'hello' },
    hello: {
      lines: [['them', 'HI!'], ['me', 'HELLO!']],
      choices: [
        { text: 'WHAT DO YOU LIKE?', go: 'likes' },
        { text: 'THANKS AGAIN!', if: 'gotCrystal', go: 'thanks' },
      ],
    },
    likes: { lines: [['them', 'SHINY THINGS!']], next: 'hello' },
    thanks: { lines: [['them', 'I LOVE MY CRYSTAL!']], choices: [{ text: 'MORE?', if: '!gotCrystal', go: 'hello' }] },
  },
};

// Plays a chat through, tapping past lines and picking choice texts in turn,
// and returns everything said as "who: text".
function playThrough(tree, facts, picks = []) {
  const said = [];
  let talk = startTalk(tree, facts);
  for (let step = current(talk); step; step = current(talk)) {
    if (step.line) {
      said.push(`${step.line.who}: ${step.line.text}`);
      talk = next(talk);
    } else {
      const pick = picks.shift() ?? BYE.text;
      talk = choose(talk, step.choices.findIndex((c) => c.text === pick));
    }
  }
  return said;
}

describe('talk', () => {
  it('opens with the start node lines, one at a time', () => {
    let talk = startTalk(TREE, {});
    expect(current(talk)).toEqual({ line: { who: 'them', text: 'HI!' } });
    talk = next(talk);
    expect(current(talk)).toEqual({ line: { who: 'me', text: 'HELLO!' } });
  });

  it('offers the choices after the lines, always ending with bye', () => {
    const talk = next(next(startTalk(TREE, {})));
    expect(current(talk).choices.map((c) => c.text)).toEqual(['WHAT DO YOU LIKE?', BYE.text]);
  });

  it('shows a choice only when its world fact holds', () => {
    const talk = next(startTalk({ ...TREE, nodes: { ...TREE.nodes, start: TREE.nodes.hello } }, { gotCrystal: true }));
    expect(current(next(talk)).choices.map((c) => c.text)).toContain('THANKS AGAIN!');
  });

  it('can hide a choice when a world fact holds', () => {
    expect(current(next(startTalk(TREE, { gotCrystal: true }))).choices).toEqual([BYE]);
    const talk = startTalk({ ...TREE, nodes: { ...TREE.nodes, start: TREE.nodes.thanks } }, {});
    expect(current(next(talk)).choices.map((c) => c.text)).toEqual(['MORE?', BYE.text]);
  });

  it('branches on world facts', () => {
    expect(playThrough(TREE, {})[0]).toBe('them: HI!');
    expect(playThrough(TREE, { gotCrystal: true })[0]).toBe('them: I LOVE MY CRYSTAL!');
  });

  it('picking a choice has her say it, then follows the tree', () => {
    expect(playThrough(TREE, {}, ['WHAT DO YOU LIKE?'])).toEqual([
      'them: HI!', 'me: HELLO!',
      'me: WHAT DO YOU LIKE?', 'them: SHINY THINGS!',
      'them: HI!', 'me: HELLO!', // `next` carries on into hello again
      'me: BYE!', 'them: SEE YOU!',
    ]);
  });

  it('bye closes the chat after the goodbyes', () => {
    let talk = next(next(startTalk(TREE, {})));
    talk = choose(talk, current(talk).choices.length - 1);
    expect(current(talk)).toEqual({ line: { who: 'me', text: 'BYE!' } });
    talk = next(talk);
    expect(current(talk)).toEqual({ line: { who: 'them', text: 'SEE YOU!' } });
    expect(current(next(talk))).toBeNull();
  });

  it('a node with nothing more to say ends the chat', () => {
    const tree = { nodes: { start: { lines: [['them', 'BYE THEN.']] } } };
    expect(playThrough(tree, {})).toEqual(['them: BYE THEN.']);
  });

  it('complains about a missing node', () => {
    expect(() => startTalk({ nodes: { start: { next: 'nowhere' } } }, {})).toThrow(/nowhere/);
  });
});

describe('wrap', () => {
  it('breaks a line between words to fit', () => {
    expect(wrap('I LIKE SHINY THINGS A LOT', 12)).toEqual(['I LIKE SHINY', 'THINGS A LOT']);
  });

  it('leaves short lines alone', () => {
    expect(wrap('HI!', 12)).toEqual(['HI!']);
  });
});

// Every node a tree can reach, by following its links from the start.
function linksOf(node) {
  return [node.then, node.else, node.next, ...(node.choices ?? []).map((c) => c.go)].filter(Boolean);
}

describe.each(Object.entries(TALKS))('the %s chat', (name, tree) => {
  it('links only to nodes that exist, and every node is reachable', () => {
    const seen = new Set();
    const todo = ['start'];
    while (todo.length) {
      const id = todo.pop();
      expect(tree.nodes[id], `${name}: ${id}`).toBeDefined();
      if (!seen.has(id)) {
        seen.add(id);
        todo.push(...linksOf(tree.nodes[id]));
      }
    }
    expect([...seen].sort()).toEqual(Object.keys(tree.nodes).sort());
  });

  it('only uses letters the pixel font can draw', () => {
    const texts = [tree.bye ?? '', ...Object.values(tree.nodes).flatMap((n) => [
      ...(n.lines ?? []).map(([, text]) => text), ...(n.choices ?? []).map((c) => c.text),
    ])];
    for (const text of texts) {
      expect(canDraw(text), text).toBe(true);
    }
  });

  it('keeps choices short enough to fit across the screen', () => {
    for (const n of Object.values(tree.nodes)) {
      for (const c of n.choices ?? []) {
        expect(c.text.length, c.text).toBeLessThanOrEqual(30);
      }
    }
  });

  it('can always be said goodbye to, whatever the world facts', () => {
    const used = Object.values(tree.nodes).flatMap((n) => [n.if, ...(n.choices ?? []).map((c) => c.if)]).filter(Boolean);
    const names = [...new Set(used.map((f) => f.replace('!', '')))];
    for (const holds of [false, true]) {
      const facts = Object.fromEntries(names.map((f) => [f, holds]));
      expect(playThrough(tree, facts).at(-1)).toMatch(/^them: /);
    }
  });

  it('talks in a voice that has a sound, and a colour of its own', () => {
    const sounds = [];
    defineSfx({ define: (sound) => sounds.push(sound) });
    expect(sounds).toContain(tree.voice);
    expect(tree.color).toMatch(/^#[0-9a-f]{6}$/);
    const others = Object.entries(TALKS).filter(([other]) => other !== name);
    expect(others.map(([, t]) => t.voice)).not.toContain(tree.voice);
    expect(others.map(([, t]) => t.color)).not.toContain(tree.color);
  });
});
