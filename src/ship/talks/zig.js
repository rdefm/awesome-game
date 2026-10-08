// Zig on Stripey: zippy and dreamy, "ZIG-ZIG!". Dreams of other planets'
// colours (`restriped` once it's twirled into some) and of a stripe stone to
// play its stripes with (`tune` once it's played one).
export const ZIG = {
  color: '#7cf28a',
  voice: 'chatZig',
  bye: 'ZIG-ZIG! BYE!',
  nodes: {
    start: { lines: [['them', 'ZIG-ZIG! HELLO!']], next: 'menu' },
    menu: {
      choices: [
        { text: 'WHY ARE YOU STRIPY?', go: 'stripes' },
        { text: 'WHAT DO YOU DREAM OF?', go: 'dream' },
        { text: 'CAN YOU PLAY MUSIC?', go: 'music' },
      ],
    },
    stripes: {
      lines: [
        ['them', 'EVERYTHING HERE IS STRIPY!'],
        ['them', 'THE STONES, THE SAND, THE CACTUSES...'],
        ['them', 'EVEN ME! ZIG!'],
      ],
      next: 'menu',
    },
    dream: { if: 'restriped', then: 'dreamNow', else: 'dreamBefore' },
    dreamBefore: {
      lines: [
        ['them', 'OTHER PLANETS! WHAT COLOURS ARE THEY?'],
        ['them', 'I DREAM OF STRIPES IN NEW COLOURS...'],
      ],
      choices: [{ text: "I'VE BEEN TO OTHER PLANETS!", go: 'planets' }],
    },
    planets: {
      lines: [
        ['them', 'ZIG! BRING ME SOMETHING FROM THERE!'],
        ['them', "I'LL TWIRL INTO ITS COLOURS!"],
      ],
      next: 'menu',
    },
    dreamNow: {
      lines: [
        ['them', 'I DID IT! NEW STRIPES! ZIG-ZIG!'],
        ['them', "BRING MORE PLANETS. I'LL TRY THEM ALL!"],
      ],
      next: 'menu',
    },
    music: { if: 'tune', then: 'musicNow', else: 'musicBefore' },
    musicBefore: {
      lines: [
        ['them', 'MY STRIPES PLAY NOTES! PLINK!'],
        ['them', 'BUT I NEED A STRIPE STONE TO TAP THEM.'],
        ['them', 'THERE ARE SOME LYING ABOUT HERE...'],
      ],
      next: 'menu',
    },
    musicNow: {
      lines: [
        ['them', 'YES! PLINK PLONK, LIKE BEFORE!'],
        ['them', "BRING A STONE AND I'LL PLAY AGAIN."],
      ],
      next: 'menu',
    },
  },
};
