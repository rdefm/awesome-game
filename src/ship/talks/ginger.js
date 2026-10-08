// Ginger, the gingerbread girl on Candy: chatty, curious and full of
// questions. She's never seen snow and wonders what it is, until she's had
// a snowball (`snow`).
export const GINGER = {
  color: '#e0a060',
  voice: 'chatGinger',
  bye: 'BYE! COME FOR CUPCAKES!',
  nodes: {
    start: { if: 'snow', then: 'snowy', else: 'hello' },
    hello: { lines: [['them', "HELLO! I'M GINGER!"]], next: 'menu' },
    snowy: { lines: [['them', 'HELLO! MY SNOW FRIEND!']], next: 'menu' },
    menu: {
      choices: [
        { text: 'DO YOU LIVE HERE?', go: 'home' },
        { text: 'WHAT DO YOU WISH FOR?', go: 'wish' },
        { text: 'WHAT DO YOU LIKE?', go: 'likes' },
      ],
    },
    home: {
      lines: [
        ['them', 'YES! IN THE GINGERBREAD HOUSE.'],
        ['them', 'MY OVEN BAKES THE BEST CUPCAKES!'],
      ],
      next: 'menu',
    },
    wish: { if: 'snow', then: 'wishNow', else: 'wishBefore' },
    wishBefore: {
      lines: [
        ['them', 'I WISH I COULD SEE SNOW.'],
        ['them', 'WHAT IS SNOW, ANYWAY?'],
      ],
      choices: [
        { text: "IT'S COLD AND WHITE!", go: 'what' },
        { text: 'I CAN BRING YOU SOME!', go: 'bring' },
      ],
    },
    what: {
      lines: [
        ['them', 'COLD? AND WHITE? LIKE ICING?'],
        ['them', "BUT FLUFFY? I CAN'T PICTURE IT!"],
      ],
      choices: [{ text: 'I CAN BRING YOU SOME!', go: 'bring' }],
    },
    bring: {
      lines: [
        ['them', 'OH, WOULD YOU? A REAL SNOWBALL?'],
        ['them', "PUT IT DOWN BY ME. I'LL GIVE IT A POKE!"],
      ],
      next: 'menu',
    },
    wishNow: {
      lines: [
        ['them', "I'VE SEEN SNOW NOW, THANKS TO YOU!"],
        ['them', 'POOF! ALL OVER ME! I TWIRLED AND TWIRLED.'],
      ],
      next: 'menu',
    },
    likes: {
      lines: [
        ['them', 'DANCING! JINGLE JINGLE!'],
        ['them', 'AND SPRINKLES. LOTS OF SPRINKLES.'],
      ],
      next: 'menu',
    },
  },
};
