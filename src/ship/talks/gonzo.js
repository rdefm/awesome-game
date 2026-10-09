// Gonzo, who's been on the ship since the start: a fuzzy blue daredevil with
// a long nose. Loves stunts, chickens, and anything a bit weird.
export const GONZO = {
  color: '#5f86d8',
  voice: 'chatGonzo',
  bye: 'TA-DA! GOODBYE!',
  nodes: {
    start: { lines: [['them', 'HELLO! WANT TO SEE A STUNT?']], next: 'menu' },
    menu: {
      choices: [
        { text: 'WHAT STUNTS CAN YOU DO?', go: 'stunts' },
        { text: 'WHO IS ON YOUR JUMPER?', go: 'chick' },
        { text: 'WHAT ARE YOU?', go: 'what' },
      ],
    },
    stunts: {
      lines: [
        ['them', 'BIG JUMPS! SPINNY SPINS! SPLATS!'],
        ['them', 'TAP ME AND I WILL SHOW YOU.'],
      ],
      next: 'menu',
    },
    chick: {
      lines: [
        ['them', 'A LITTLE CHICK! I LOVE CHICKENS.'],
        ['them', 'BAWK BAWK!'],
      ],
      next: 'menu',
    },
    what: {
      lines: [
        ['them', 'NOBODY KNOWS! NOT EVEN ME.'],
        ['them', 'A WEIRDO, I THINK. THE BEST KIND!'],
      ],
      next: 'menu',
    },
  },
};
