// The mushroom creature from Bluebell's grove: shy, whispery and giggly,
// all little dots and trailing off. Talks about being shy, and about the
// grove: missing it a bit when it's away (`home` while it's there).
export const SHROOM = {
  color: '#9dffd8',
  voice: 'chatShroom',
  bye: '...BYE... HEE HEE...',
  nodes: {
    start: { if: 'home', then: 'hiHome', else: 'hiAway' },
    hiHome: {
      lines: [
        ['them', '...HI...'],
        ['them', 'HEE HEE... SORRY. I GIGGLE WHEN I TALK.'],
      ],
      next: 'menu',
    },
    hiAway: {
      lines: [
        ['them', '...PSST... HI...'],
        ['them', "IT'S ALL BIG AND NEW HERE. I'M STAYING BY YOU."],
      ],
      next: 'menu',
    },
    menu: {
      choices: [
        { text: 'WHY ARE YOU SO SHY?', go: 'shy' },
        { text: 'WHAT IS THE GROVE LIKE?', go: 'grove' },
        { text: 'DO YOU LIKE DANCING?', go: 'dance' },
      ],
    },
    shy: {
      lines: [
        ['them', "I DON'T KNOW... I JUST AM."],
        ['them', 'WHEN SOMEONE COMES NEAR, MY CAP GOES DOWN ALL BY ITSELF.'],
        ['them', 'FLOMP!'],
        ['me', "BUT YOU'RE NOT HIDING FROM ME NOW!"],
        ['them', "...NO. YOU'RE MY FRIEND. HEE HEE!"],
      ],
      next: 'menu',
    },
    grove: { if: 'home', then: 'groveHere', else: 'groveAway' },
    groveHere: {
      lines: [
        ['them', "IT'S SHADY AND SOFT AND IT GLOWS."],
        ['them', 'TRY BOUNCING ON THE BIG MUSHROOMS. BOING!'],
        ['them', 'AND POP THE SPORES. THEY GO TING!'],
      ],
      next: 'menu',
    },
    groveAway: {
      lines: [
        ['them', 'OH... I MISS THE MOSS A LITTLE.'],
        ['them', 'IT GLOWS AT NIGHT. AND THE SPORES GO TING!'],
        ['them', "BUT IT'S FUN BEING OUT WITH YOU."],
      ],
      next: 'menu',
    },
    dance: {
      lines: [
        ['them', '...ONLY WHEN NOBODY IS LOOKING.'],
        ['them', '...AND YOU. YOU CAN LOOK.'],
        ['them', 'WIGGLE WIGGLE! HEE HEE!'],
      ],
      next: 'menu',
    },
  },
};
