// One shared palette keeps every sprite looking like it belongs together.
export const C = {
  outline: '#1b1427',
  white: '#f4f1ea',

  hair: '#d9452b',
  hairDark: '#a12c27',
  hairLight: '#f57a45',
  skin: '#f7c8a1',
  skinShade: '#e09d7c',
  cheek: '#f2878a',
  suit: '#4b8bdc',
  suitDark: '#335fb0',
  suitLight: '#7db3f0',
  belt: '#ffcf4a',
  boot: '#7a4a33',
  bootDark: '#55311f',

  ceiling: '#1d2236',
  wallDark: '#2a3150',
  wall: '#384265',
  wallLight: '#4b5784',
  wallHi: '#64729f',
  floorDark: '#1e2135',
  floor: '#2c3150',
  floorLight: '#424a73',
  metalDark: '#4d5677',
  metal: '#7d88ab',
  metalLight: '#b4bdd6',
  metalHi: '#e1e6f2',

  teal: '#3fd0c9',
  tealDark: '#1f8a90',
  tealDeep: '#114a55',
  orange: '#ff9d3c',
  red: '#ff5a5a',
  redDark: '#b8323f',
  yellow: '#ffe066',
  green: '#7cf28a',
  greenDark: '#2f9e57',
  pink: '#ff8fc8',
  purple: '#9a6cf0',
  screen: '#0d2a2e',

  space: '#0a0a1c',
  spaceMid: '#151634',
  nebula: '#2b1f52',
  nebula2: '#3a2063',
};

// Hair colours from her wardrobe, in the order the picker shows them.
// Red (the first) is how she starts out.
export const HAIR_COLORS = {
  red: { hair: C.hair, dark: C.hairDark, light: C.hairLight },
  gold: { hair: '#f2b632', dark: '#c07a1e', light: '#ffe27a' },
  brown: { hair: '#8a5432', dark: '#5e3420', light: '#b67a4a' },
  pink: { hair: '#ff7bbf', dark: '#c74a8e', light: '#ffb3dc' },
  blue: { hair: '#4fa8f0', dark: '#2f68b8', light: '#8fd2ff' },
};

// Flight-suit colours from her wardrobe. Blue (the first) is how she starts out.
export const SUIT_COLORS = {
  blue: { suit: C.suit, dark: C.suitDark, light: C.suitLight },
  pink: { suit: '#f278b4', dark: '#c24e8c', light: '#ffa8d4' },
  green: { suit: '#4fbf6a', dark: '#2f8a4c', light: '#84e29a' },
  purple: { suit: '#9068e0', dark: '#6244b0', light: '#b99cf6' },
  orange: { suit: '#f08a3a', dark: '#c05e22', light: '#ffb878' },
};
