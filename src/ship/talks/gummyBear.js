// The gummy bear on Candy: wibbly-wobbly and a bit shy. Dreams of a lick of
// a lollipop, and is still wobbly with joy once it's had one (`licked`).
export const GUMMY_BEAR = {
  color: '#ff5a6a',
  voice: 'chatGummy',
  bye: 'WIBBLE WOBBLE, BYE BYE!',
  nodes: {
    start: { lines: [['them', 'WIBBLE WOBBLE! HELLO!']], next: 'menu' },
    menu: {
      choices: [
        { text: 'WHY DO YOU WOBBLE?', go: 'wobble' },
        { text: 'WHAT DO YOU LIKE?', go: 'likes' },
        { text: 'ARE YOU MADE OF JELLY?', go: 'jelly' },
      ],
    },
    wobble: {
      lines: [
        ['them', "I CAN'T HELP IT! I'M A GUMMY BEAR!"],
        ['them', 'WIBBLE, WOBBLE, ALL DAY LONG.'],
      ],
      next: 'menu',
    },
    jelly: {
      lines: [
        ['them', 'YES! STRAWBERRY JELLY!'],
        ['them', "PLEASE DON'T NIBBLE ME."],
        ['me', "I WON'T!"],
      ],
      next: 'menu',
    },
    likes: { if: 'licked', then: 'likesNow', else: 'likesBefore' },
    likesBefore: {
      lines: [
        ['them', 'LOLLIPOPS! BIG SWIRLY ONES!'],
        ['them', 'BUT MY PAWS ARE TOO WOBBLY TO HOLD ONE.'],
      ],
      choices: [{ text: "I'LL BRING YOU ONE!", go: 'lolly' }],
    },
    lolly: {
      lines: [
        ['them', 'OH WIBBLE! YES PLEASE!'],
        ['them', 'STAND IT UP NEXT TO ME.'],
      ],
      next: 'menu',
    },
    likesNow: {
      lines: [
        ['them', 'THAT LOLLIPOP! LICK, LICK, LICK!'],
        ['them', "I'M STILL WOBBLY WITH JOY."],
      ],
      next: 'menu',
    },
  },
};
