// The friendly pink alien on Bluebell: bouncy, giggly, mad about shiny
// things. Hints at the crystal it'd love, and is all thank-yous once it has
// one (`gotCrystal`).
export const PINK_ALIEN = {
  color: '#ff8fc8',
  voice: 'chatAlien',
  bye: 'BYE BYE! COME BACK SOON!',
  nodes: {
    start: { if: 'gotCrystal', then: 'thanks', else: 'hello' },
    hello: {
      lines: [['them', 'BLIP BLOOP! HELLO, SPACE GIRL!']],
      next: 'menu',
    },
    thanks: {
      lines: [
        ['them', "BLIP! IT'S YOU! MY CRYSTAL FRIEND!"],
        ['them', 'I LOOK AT IT ALL DAY. SO SPARKLY!'],
      ],
      next: 'menu',
    },
    menu: {
      choices: [
        { text: "WHAT'S YOUR NAME?", go: 'name' },
        { text: 'WHAT DO YOU LIKE?', go: 'likes' },
        { text: 'WHAT IS THIS PLACE?', go: 'place' },
      ],
    },
    name: {
      lines: [
        ['them', 'MY NAME IS BLOOPIBLIP!'],
        ['me', "THAT'S A BIG NAME!"],
        ['them', 'HEE HEE! YOU CAN SAY BLOOP.'],
      ],
      next: 'menu',
    },
    likes: { if: 'gotCrystal', then: 'likesNow', else: 'likesBefore' },
    likesBefore: {
      lines: [
        ['them', 'SHINY THINGS! I LOVE SHINY THINGS!'],
        ['them', 'BUT THERE ARE NO CRYSTALS ON BLUEBELL...'],
      ],
      choices: [
        { text: 'I COULD FIND YOU ONE!', go: 'promise' },
        { text: 'ANYTHING ELSE?', go: 'snacks' },
      ],
    },
    promise: {
      lines: [
        ['them', 'REALLY? BLIP BLIP HOORAY!'],
        ['them', "JUST DROP IT ON ME. I'LL MIND IT!"],
      ],
      next: 'menu',
    },
    likesNow: {
      lines: [
        ['them', 'MY CRYSTAL, OF COURSE!'],
        ['them', 'AND YOU, FOR GIVING IT TO ME!'],
      ],
      choices: [
        { text: 'ANYTHING ELSE?', go: 'snacks' },
      ],
    },
    snacks: {
      lines: [
        ['them', 'SNACKS! YUM YUM IN MY TUM!'],
        ['them', 'AND PLAYING WITH FRIENDS.'],
      ],
      next: 'menu',
    },
    place: {
      lines: [
        ['them', 'BLUEBELL! THE FLOWERS SING IF YOU TAP THEM.'],
        ['them', 'AND LOOK UNDER THE ROCK... WIGGLY!'],
      ],
      next: 'menu',
    },
  },
};
