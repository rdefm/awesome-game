// Chatting with a friend, Monkey Island style: they and she take turns
// saying lines, then she picks what to say next from a few choices. A chat
// is plain data, a little tree of nodes keyed by name, starting at 'start':
//   { lines: [['them' | 'me', text], ...], choices: [{ text, go, if? }], next? }
//   or a branch on a world fact: { if: fact, then: node, else: node }
// A choice can show only `if` a world fact holds ('!fact' for when it
// doesn't). After its lines a node offers its choices, or carries `next`, or
// ends the chat. "Bye!" is offered with every set of choices, and closes the
// chat after the tree's own `bye` line. World facts are a plain object of
// booleans, e.g. { gotCrystal: true }.
//
// A chat in progress is an immutable value: `current` says what's showing,
// `next` taps past a line and `choose` picks a choice.

export const BYE = { text: 'BYE!', go: null };

const holds = (facts, fact) => (fact.startsWith('!') ? !facts[fact.slice(1)] : Boolean(facts[fact]));

const toLines = (pairs = []) => pairs.map(([who, text]) => ({ who, text }));

// The chat as it stands on arriving at node `id`, with any `lead` lines
// (what she just picked to say) said first.
function arrive(tree, facts, id, lead = []) {
  let node = tree.nodes[id];
  while (node?.if) {
    id = holds(facts, node.if) ? node.then : node.else;
    node = tree.nodes[id];
  }
  if (!node) {
    throw new Error(`no chat node "${id}"`);
  }
  const lines = [...lead, ...toLines(node.lines)];
  if (!lines.length && !node.choices && node.next) {
    return arrive(tree, facts, node.next);
  }
  const choices = node.choices ? [...node.choices.filter((c) => !c.if || holds(facts, c.if)), BYE] : null;
  return { tree, facts, lines, at: 0, choices, next: node.next ?? null };
}

export function startTalk(tree, facts) {
  return arrive(tree, facts, 'start');
}

// What's showing: { line: { who, text } }, { choices }, or null once it's over.
export function current(talk) {
  if (talk.at < talk.lines.length) {
    return { line: talk.lines[talk.at] };
  }
  return talk.choices ? { choices: talk.choices } : null;
}

// Moves on past the line showing.
export function next(talk) {
  const moved = { ...talk, at: talk.at + 1 };
  if (moved.at >= moved.lines.length && !moved.choices && moved.next) {
    return arrive(talk.tree, talk.facts, moved.next);
  }
  return moved;
}

// Picks choice `i`: she says it, then the tree carries on from where it goes.
export function choose(talk, i) {
  const choice = talk.choices[i];
  const said = { who: 'me', text: choice.text };
  if (!choice.go) {
    const bye = talk.tree.bye ? [{ who: 'them', text: talk.tree.bye }] : [];
    return { ...talk, lines: [said, ...bye], at: 0, choices: null, next: null };
  }
  return arrive(talk.tree, talk.facts, choice.go, [said]);
}

// Breaks `text` into lines of at most `width` characters, between words.
export function wrap(text, width) {
  const rows = [];
  for (const word of text.split(' ')) {
    const last = rows.at(-1);
    if (last !== undefined && last.length + 1 + word.length <= width) {
      rows[rows.length - 1] = `${last} ${word}`;
    } else {
      rows.push(word);
    }
  }
  return rows;
}
