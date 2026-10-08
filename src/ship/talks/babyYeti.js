// Baby yeti on Frosty: babbles in tiny words. Wants a snowball to throw up
// in the air, and giggles about the poof on its head once it's had one
// (`snowball`). Wants a hug from mum, too (`cuddled` once it's had one).
export const BABY_YETI = {
  color: '#ffffff',
  voice: 'chatBabyYeti',
  bye: 'BYE BYE!',
  nodes: {
    start: { if: 'snowball', then: 'again', else: 'hello' },
    hello: { lines: [['them', 'HI! HI!']], next: 'menu' },
    again: {
      lines: [
        ['them', 'POOF! HEE HEE!'],
        ['them', 'AGAIN! AGAIN!'],
      ],
      next: 'menu',
    },
    menu: {
      choices: [
        { text: "WHAT'S YOUR NAME?", go: 'name' },
        { text: 'WHAT DO YOU LIKE?', go: 'likes' },
        { text: "WHERE'S YOUR MUM?", go: 'mum' },
      ],
    },
    name: {
      lines: [
        ['them', 'BABA!'],
        ['me', "BABA? THAT'S A NICE NAME."],
        ['them', 'BABA! HEE!'],
      ],
      next: 'menu',
    },
    likes: { if: 'snowball', then: 'likesNow', else: 'likesBefore' },
    likesBefore: {
      lines: [
        ['them', 'BALL! SNOW BALL!'],
        ['them', 'UP UP UP!'],
      ],
      next: 'menu',
    },
    likesNow: {
      lines: [
        ['them', 'BALL GO UP...'],
        ['them', 'POOF! ON HEAD!'],
        ['them', 'HEE HEE HEE!'],
      ],
      next: 'menu',
    },
    mum: { if: 'cuddled', then: 'mumNow', else: 'mumBefore' },
    mumBefore: {
      lines: [
        ['them', 'MAMA!'],
        ['them', 'BIG MAMA. HUG?'],
      ],
      next: 'menu',
    },
    mumNow: {
      lines: [
        ['them', 'MAMA HUG! UP UP!'],
        ['them', 'ROCK ROCK. HEE!'],
      ],
      next: 'menu',
    },
  },
};
