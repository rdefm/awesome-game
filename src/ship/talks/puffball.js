// The puffball on Bluebell: squeaky, bouncy, a few words at a time. Dreams
// of a round bouncy thing to chase, and can't stop talking about the ball
// once she's given it one to chase (`chased`).
export const PUFFBALL = {
  color: '#c9b6ff',
  voice: 'chatPuff',
  bye: 'SQUEAK SQUEAK! BYE!',
  nodes: {
    start: { if: 'chased', then: 'again', else: 'hello' },
    hello: { lines: [['them', 'SQUEAK! HELLO!']], next: 'menu' },
    again: { lines: [['them', 'SQUEAK! BALL FRIEND! HELLO!']], next: 'menu' },
    menu: {
      choices: [
        { text: 'ARE YOU A BUNNY?', go: 'bunny' },
        { text: 'WHAT DO YOU LIKE?', go: 'likes' },
        { text: 'WHAT ARE YOU DOING?', go: 'doing' },
      ],
    },
    bunny: {
      lines: [
        ['them', 'SQUEAK? NO! A PUFFBALL!'],
        ['them', 'ALL FLUFF. AND EARS!'],
      ],
      next: 'menu',
    },
    likes: { if: 'chased', then: 'likesNow', else: 'likesBefore' },
    likesBefore: {
      lines: [
        ['them', 'ROUND THINGS! BOUNCY ROUND THINGS!'],
        ['them', 'I WANT ONE TO CHASE. HOP HOP HOP!'],
      ],
      choices: [
        { text: "I'VE GOT A BALL!", go: 'ball' },
        { text: 'ANYTHING ELSE?', go: 'snacks' },
      ],
    },
    ball: {
      lines: [
        ['them', 'SQUEAK! DROP IT ON ME!'],
        ['them', "I'LL BOOP IT ALL ABOUT!"],
      ],
      next: 'menu',
    },
    likesNow: {
      lines: [
        ['them', 'THE BALL! THE BALL WAS SO FUN!'],
        ['them', 'BOOP, BOOP, BOOP! AGAIN SOON?'],
      ],
      choices: [{ text: 'ANYTHING ELSE?', go: 'snacks' }],
    },
    snacks: {
      lines: [
        ['them', 'NIBBLES! CRUNCHY NIBBLES!'],
        ['them', 'SQUEAK. NOW I AM HUNGRY.'],
      ],
      next: 'menu',
    },
    doing: {
      lines: [
        ['them', 'HOPPING!'],
        ['them', 'HOP, HOP, HOP... AND REST.'],
        ['them', 'HOP, HOP...'],
      ],
      next: 'menu',
    },
  },
};
