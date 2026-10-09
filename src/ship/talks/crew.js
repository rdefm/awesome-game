// A crewmate she made herself in the crew pod: new to the world, cheerful and
// full of "first time" wonder. They all share these friendly words.
export const CREW = {
  color: '#5fd9a8',
  voice: 'chatCrew',
  bye: 'BYE! SEE YOU SOON!',
  nodes: {
    start: { lines: [['them', 'HELLO! I AM NEW!']], next: 'menu' },
    menu: {
      choices: [
        { text: 'WHERE ARE YOU FROM?', go: 'from' },
        { text: 'DO YOU LIKE THE SHIP?', go: 'ship' },
        { text: 'WHAT SHALL WE DO?', go: 'do' },
      ],
    },
    from: {
      lines: [
        ['them', 'I CAME OUT OF THE POD! HISS!'],
        ['them', 'YOU MADE ME. THANK YOU!'],
      ],
      next: 'menu',
    },
    ship: {
      lines: [
        ['them', 'IT IS SO COSY! AND THERE ARE SNACKS!'],
        ['them', 'I LIKE THE SPINNY CHAIR BEST.'],
      ],
      next: 'menu',
    },
    do: {
      lines: [
        ['them', 'LET US PLAY! OR GO TO A PLANET!'],
        ['them', 'OR JUST SIT TOGETHER. THAT IS NICE TOO.'],
      ],
      next: 'menu',
    },
  },
};
