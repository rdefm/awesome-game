// Monkey, who's been on the ship since the start: cheeky, bouncy and always
// up to something. He crash-landed his own spaceship once (oops).
export const MONKEY = {
  color: '#c07a42',
  voice: 'chatMonkey',
  bye: 'OOH OOH! LATER!',
  nodes: {
    start: { lines: [['them', 'OOH OOH! IT IS ME, MONKEY!']], next: 'menu' },
    menu: {
      choices: [
        { text: 'WHAT ARE YOU UP TO?', go: 'up' },
        { text: 'DID YOU HAVE A SHIP?', go: 'ship' },
        { text: 'WHAT DO YOU LIKE?', go: 'likes' },
      ],
    },
    up: {
      lines: [
        ['them', 'NOTHING! NOTHING AT ALL!'],
        ['them', '...MAYBE A TINY BIT OF MISCHIEF.'],
        ['me', 'MONKEY!'],
      ],
      next: 'menu',
    },
    ship: {
      lines: [
        ['them', 'YES! BUT I CRASHED IT. BOOM!'],
        ['them', 'YOUR SHIP IS MUCH BETTER. NO BOOMS.'],
      ],
      next: 'menu',
    },
    likes: {
      lines: [
        ['them', 'BACKFLIPS! AND KICKING THE BALL!'],
        ['them', 'DROP IT ON ME AND WATCH. WHEEE!'],
      ],
      next: 'menu',
    },
  },
};
