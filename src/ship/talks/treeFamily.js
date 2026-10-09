// The tree family on Mr Monkey. Dad's a slow, deep old oak ("HRRMM..."),
// mum's a gentle willow who talks about their pet leaf dragon, and their
// little sapling is full of beans. They hint at a cuddle with the little
// one (`cuddled` once there's been one), at the rope swing out in the
// forest (`swung`, once she's swung across), and at what happens when
// Monkey or Gonzo have a go on it (`smacked`).

export const TREE_DAD = {
  color: '#b07a4e',
  voice: 'chatTreeDad',
  bye: 'HRRMM. GROW TALL, LITTLE ONE.',
  nodes: {
    start: { lines: [['them', 'HRRMM... HELLO THERE, LITTLE ONE.']], next: 'menu' },
    menu: {
      choices: [
        { text: 'IS YOUR HOUSE A TREE?', go: 'house' },
        { text: 'HOW OLD ARE YOU?', go: 'old' },
        { text: "WHERE'S YOUR LITTLE ONE?", go: 'kid' },
      ],
    },
    house: {
      lines: [
        ['them', 'HRRMM. IT IS. THE BIGGEST TREE IN THE FOREST.'],
        ['them', 'MY GREAT-GREAT-GRANDAD WAS AN ACORN IN IT.'],
      ],
      next: 'menu',
    },
    old: {
      lines: [
        ['them', 'COUNT MY RINGS AND SEE... HRRMM...'],
        ['them', '...ONE... TWO...'],
        ['me', 'THAT MIGHT TAKE A WHILE!'],
        ['them', 'HRRMM. HO HO. IT MIGHT.'],
      ],
      next: 'menu',
    },
    kid: { if: 'cuddled', then: 'kidNow', else: 'kidBefore' },
    kidBefore: {
      lines: [
        ['them', 'TWIGGY? ROOTLING ABOUT SOMEWHERE...'],
        ['them', 'BRING THE LITTLE SPROUTLING TO ME FOR A HUG, WOULD YOU?'],
      ],
      next: 'menu',
    },
    kidNow: {
      lines: [
        ['them', 'HRRMM. THAT WAS A FINE HUG.'],
        ['them', 'TWIGGY GREW A WHOLE NEW LEAF, I THINK.'],
      ],
      next: 'menu',
    },
  },
};

export const TREE_MUM = {
  color: '#7cc85a',
  voice: 'chatTreeMum',
  bye: 'BYE, PETAL! MIND THE ROOTS!',
  nodes: {
    start: { lines: [['them', 'OH, HELLO, PETAL! COME IN, COME IN.']], next: 'menu' },
    menu: {
      choices: [
        { text: 'WHO IS THE DRAGON?', go: 'sprout' },
        { text: 'WHAT IS OUTSIDE?', go: 'forest' },
        { text: 'I LIKE YOUR FLOWER!', go: 'flower' },
      ],
    },
    sprout: {
      lines: [
        ['them', 'THAT IS SPROUT, OUR LEAF DRAGON!'],
        ['them', "SPROUT DOESN'T BREATHE FIRE. JUST PETALS."],
        ['them', 'TAP SPROUT AND SEE. BUT WATCH OUT FOR THE SNEEZE!'],
      ],
      next: 'menu',
    },
    forest: { if: 'swung', then: 'forestNow', else: 'forestBefore' },
    forestBefore: {
      lines: [
        ['them', 'THE TALLEST TREES ON ANY PLANET!'],
        ['them', 'THERE IS A ROPE SWING BETWEEN TWO OF THEM.'],
        ['them', 'CLIMB THE LADDER AND TAP THE ROPE. WHEEE!'],
      ],
      next: 'menu',
    },
    forestNow: {
      lines: [
        ['them', 'YOU SWUNG ON THE ROPE! I SAW YOU FROM THE WINDOW.'],
        ['them', 'YOU WERE AS GOOD AS A MONKEY. BETTER, EVEN!'],
      ],
      next: 'menu',
    },
    flower: {
      lines: [
        ['them', 'THANK YOU, PETAL! IT GREW THERE ALL BY ITSELF.'],
        ['them', 'A NEW ONE COMES OUT EVERY SPRING.'],
      ],
      next: 'menu',
    },
  },
};

export const TREE_KID = {
  color: '#d8aa78',
  voice: 'chatTreeKid',
  bye: 'BYEEE! COME BACK SOON!',
  nodes: {
    start: { lines: [['them', "HI! I'M TWIGGY! I'M NEARLY A WHOLE TREE!"]], next: 'menu' },
    menu: {
      choices: [
        { text: 'IS SPROUT YOUR PET?', go: 'sprout' },
        { text: 'DO YOU LIKE THE ROPE SWING?', go: 'rope' },
        { text: 'DO YOU LIKE MONKEYS?', go: 'monkeys' },
      ],
    },
    sprout: {
      lines: [
        ['them', 'YES! SPROUT FOLLOWS ME EVERYWHERE!'],
        ['them', 'WE PLAY HIDE AND SEEK. SPROUT ALWAYS HIDES IN A BUSH.'],
        ['them', '...ALL THE BUSHES LOOK LIKE SPROUT.'],
      ],
      next: 'menu',
    },
    rope: {
      lines: [
        ['them', "I'M TOO LITTLE. MY ARMS ARE TWIGS!"],
        ['them', 'BUT YOU CAN DROP A FRIEND ON THE ROPE. THEY SWING TOO!'],
      ],
      next: 'menu',
    },
    monkeys: { if: 'smacked', then: 'monkeysNow', else: 'monkeysBefore' },
    monkeysBefore: {
      lines: [
        ['them', 'THIS PLANET IS CALLED MR MONKEY!'],
        ['them', 'BUT MONKEYS ALWAYS GO TOO FAST ON THE ROPE.'],
        ['them', 'TRY IT WITH A MONKEY. HEE HEE!'],
      ],
      next: 'menu',
    },
    monkeysNow: {
      lines: [
        ['them', 'SMACK! RIGHT INTO THE TREE! HEE HEE HEE!'],
        ['them', "IT DIDN'T HURT. TREES ARE VERY HUGGY."],
      ],
      next: 'menu',
    },
  },
};
