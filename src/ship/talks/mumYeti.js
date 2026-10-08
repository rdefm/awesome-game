// Mum yeti on Frosty: soft, slow and kind, hooting as she talks. Hints at
// the warm fire flower she'd love (`warm` once she has one) and at a cuddle
// with her baby (`cuddled` once she's had one).
export const MUM_YETI = {
  color: '#c9d8ee',
  voice: 'chatMumYeti',
  bye: 'HOO HOO! TAKE CARE, DEAR.',
  nodes: {
    start: { lines: [['them', 'HOO HOO! HELLO, LITTLE ONE.']], next: 'menu' },
    menu: {
      choices: [
        { text: 'ARE YOU COLD?', go: 'cold' },
        { text: 'IS THAT YOUR BABY?', go: 'baby' },
        { text: 'WHAT DO YOU EAT?', go: 'eat' },
      ],
    },
    cold: { if: 'warm', then: 'coldNow', else: 'coldBefore' },
    coldBefore: {
      lines: [
        ['them', 'MY PAWS ARE ALWAYS CHILLY, DEAR.'],
        ['them', 'IF ONLY I HAD SOMETHING WARM...'],
        ['them', 'A GLOWING FIRE FLOWER, PERHAPS.'],
      ],
      choices: [{ text: 'I KNOW WHERE THEY GROW!', go: 'fire' }],
    },
    fire: {
      lines: [
        ['them', 'OH, HOW LOVELY! HOO!'],
        ['them', "SET ONE DOWN BY ME AND I'LL TOAST MY PAWS."],
      ],
      next: 'menu',
    },
    coldNow: {
      lines: [
        ['them', 'NOT SINCE YOUR FIRE FLOWER, DEAR.'],
        ['them', 'MY PAWS ARE ALL TOASTY. HOO!'],
      ],
      next: 'menu',
    },
    baby: { if: 'cuddled', then: 'babyNow', else: 'babyBefore' },
    babyBefore: {
      lines: [
        ['them', 'YES! MY LITTLE SNOWDROP.'],
        ['them', 'ALWAYS WANDERING OFF...'],
        ['them', 'WILL YOU BRING BABY TO ME FOR A CUDDLE?'],
      ],
      next: 'menu',
    },
    babyNow: {
      lines: [
        ['them', 'YES! YOU BROUGHT BABY BACK FOR A CUDDLE.'],
        ['them', 'BABY LOVES SNOWBALLS TOO, YOU KNOW.'],
      ],
      next: 'menu',
    },
    eat: {
      lines: [
        ['them', 'SNOW BERRIES, MOSTLY.'],
        ['them', 'AND ANY SNACK YOU BRING ME, DEAR!'],
      ],
      next: 'menu',
    },
  },
};
