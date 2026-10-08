// The lava family on Ember. Dad's big and jolly ("HO HO!"), mum's gentle
// and sing-song, and the baby babbles. They hint at a cuddle with the baby
// (`cuddled` once there's been one) and at a nap in its cradle (`napped`).

export const LAVA_DAD = {
  color: '#ff6a2a',
  voice: 'chatLavaDad',
  bye: 'HO HO! MIND HOW YOU GO!',
  nodes: {
    start: { lines: [['them', 'HO HO HO! WELCOME, LITTLE SPARK!']], next: 'menu' },
    menu: {
      choices: [
        { text: 'IS THIS YOUR HOUSE?', go: 'house' },
        { text: "WHERE'S THE BABY?", go: 'baby' },
        { text: 'ARE YOU HOT?', go: 'hot' },
      ],
    },
    house: {
      lines: [
        ['them', 'IT IS! DUG RIGHT INTO THE VOLCANO.'],
        ['them', 'COSY AND WARM. HO HO!'],
      ],
      next: 'menu',
    },
    baby: { if: 'cuddled', then: 'babyNow', else: 'babyBefore' },
    babyBefore: {
      lines: [
        ['them', 'TODDLING ABOUT SOMEWHERE, HO HO!'],
        ['them', 'BRING THE LITTLE ONE TO ME FOR A CUDDLE!'],
      ],
      next: 'menu',
    },
    babyNow: {
      lines: [
        ['them', 'THAT CUDDLE WAS THE BEST! HO HO!'],
        ['them', 'BRING BABY BACK ANY TIME.'],
      ],
      next: 'menu',
    },
    hot: {
      lines: [
        ['them', "I'M MADE OF LAVA, LITTLE ONE!"],
        ['them', "BUT I'M A COSY HOT, NOT AN OUCH HOT. HO HO!"],
      ],
      next: 'menu',
    },
  },
};

export const LAVA_MUM = {
  color: '#ffb347',
  voice: 'chatLavaMum',
  bye: 'BYE BYE, DEAR. LA LA...',
  nodes: {
    start: { lines: [['them', 'HELLO, DEAR. LA LA LA...']], next: 'menu' },
    menu: {
      choices: [
        { text: 'WHAT ARE YOU SINGING?', go: 'song' },
        { text: "WHERE'S THE BABY?", go: 'baby' },
        { text: 'I LIKE YOUR HAIR!', go: 'hair' },
      ],
    },
    song: { if: 'napped', then: 'songNow', else: 'songBefore' },
    songBefore: {
      lines: [
        ['them', 'A LULLABY, FOR BABY.'],
        ['them', "BUT BABY WON'T STAY STILL FOR A NAP!"],
        ['them', 'IF ONLY SOMEONE TUCKED BABY IN THE CRADLE...'],
      ],
      next: 'menu',
    },
    songNow: {
      lines: [
        ['them', 'THE LULLABY FROM THE CRADLE, DEAR.'],
        ['them', 'BABY HAD SUCH A LOVELY NAP IN IT.'],
      ],
      next: 'menu',
    },
    baby: { if: 'cuddled', then: 'babyNow', else: 'babyBefore' },
    babyBefore: {
      lines: [
        ['them', 'OFF EXPLORING, AS ALWAYS.'],
        ['them', "BRING BABY TO ME, DEAR? I'D LOVE A CUDDLE."],
      ],
      next: 'menu',
    },
    babyNow: {
      lines: [
        ['them', 'THANK YOU FOR THAT CUDDLE, DEAR.'],
        ['them', 'BABY WAS ALL GIGGLES. LA LA LA!'],
      ],
      next: 'menu',
    },
    hair: {
      lines: [
        ['them', "WHY, THANK YOU! IT'S A FLAME."],
        ['them', "IT FLARES UP WHEN I'M HAPPY."],
      ],
      next: 'menu',
    },
  },
};

export const LAVA_BABY = {
  color: '#ffe066',
  voice: 'chatLavaBaby',
  bye: 'BYE! BYE!',
  nodes: {
    start: { lines: [['them', 'HI! HI! HEE!']], next: 'menu' },
    menu: {
      choices: [
        { text: "WHAT'S YOUR NAME?", go: 'name' },
        { text: 'ARE YOU SLEEPY?', go: 'sleepy' },
        { text: 'WHERE ARE MUM AND DAD?', go: 'parents' },
      ],
    },
    name: {
      lines: [
        ['them', 'SPARKY!'],
        ['them', 'SPARK SPARK!'],
      ],
      next: 'menu',
    },
    sleepy: { if: 'napped', then: 'sleepyNow', else: 'sleepyBefore' },
    sleepyBefore: {
      lines: [
        ['them', 'NO! NO SLEEP!'],
        ['them', 'BED... ROCK ROCK?'],
      ],
      next: 'menu',
    },
    sleepyNow: {
      lines: [
        ['them', 'ROCK ROCK! LA LA!'],
        ['them', 'NICE NAP!'],
      ],
      next: 'menu',
    },
    parents: { if: 'cuddled', then: 'parentsNow', else: 'parentsBefore' },
    parentsBefore: {
      lines: [
        ['them', 'DADA! MAMA!'],
        ['them', 'HUG? BIG HUG?'],
      ],
      next: 'menu',
    },
    parentsNow: {
      lines: [
        ['them', 'BIG HUG! HEE HEE!'],
        ['them', 'UP UP! HUG!'],
      ],
      next: 'menu',
    },
  },
};
