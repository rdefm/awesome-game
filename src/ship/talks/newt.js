// The fire newt on Ember: slow and puffed out, always far too hot. Hints at
// the shady bluebell it longs for (`shady` once it has one) and at its
// rock-cracking tail (`cracked` once it's opened a geode).
export const NEWT = {
  color: '#ff8a3a',
  voice: 'chatNewt',
  bye: 'BYE... STAY COOL...',
  nodes: {
    start: { if: 'shady', then: 'cool', else: 'hot' },
    hot: {
      lines: [
        ['them', 'PHEW... HELLO...'],
        ['them', "I'M SOOO HOT..."],
      ],
      next: 'menu',
    },
    cool: {
      lines: [
        ['them', 'HELLO, FRIEND!'],
        ['them', 'AH, MY SHADY FLOWER. SO NICE AND COOL.'],
      ],
      next: 'menu',
    },
    menu: {
      choices: [
        { text: 'WHY ARE YOU SO HOT?', go: 'why' },
        { text: "WHAT'S YOUR TAIL FOR?", go: 'tail' },
        { text: 'DO YOU LIVE HERE?', go: 'home' },
      ],
    },
    why: { if: 'shady', then: 'whyNow', else: 'whyBefore' },
    whyBefore: {
      lines: [
        ['them', "IT'S A VOLCANO! IT'S ALWAYS HOT!"],
        ['them', 'IF ONLY I HAD SOME SHADE...'],
        ['them', 'A BIG COOL FLOWER, FROM SOMEWHERE BLUE AND SHADY...'],
      ],
      choices: [{ text: 'I KNOW A BLUE PLANET!', go: 'bluebell' }],
    },
    bluebell: {
      lines: [
        ['them', 'REALLY? A FLOWER TO SIT UNDER?'],
        ['them', 'PUT IT RIGHT BY ME. PLEASE...'],
      ],
      next: 'menu',
    },
    whyNow: {
      lines: [
        ['them', "I'M NOT, NOW! I HAVE MY FLOWER!"],
        ['them', 'THANK YOU FOR THE SHADE.'],
      ],
      next: 'menu',
    },
    tail: { if: 'cracked', then: 'tailNow', else: 'tailBefore' },
    tailBefore: {
      lines: [
        ['them', "MY TAIL? IT'S SUPER STRONG!"],
        ['them', 'IT CAN CRACK ROCKS. WHACK!'],
        ['them', 'THE ROUND KNOBBLY ONES ARE BEST.'],
        ['me', 'LIKE A GEODE?'],
        ['them', 'YES! DROP ONE ON ME!'],
      ],
      next: 'menu',
    },
    tailNow: {
      lines: [
        ['them', 'REMEMBER THAT GEODE? WHACK!'],
        ['them', 'ALL SPARKLY INSIDE!'],
      ],
      next: 'menu',
    },
    home: {
      lines: [
        ['them', 'YES. I SCURRY ABOUT THE ROCKS.'],
        ['them', 'MIND THE STEAMY VENT. WHOOSH!'],
      ],
      next: 'menu',
    },
  },
};
