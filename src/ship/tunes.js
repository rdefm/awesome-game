// The game's music, as data for the sequencer (src/engine/sequencer.js).
// Each tune names its notes: [beat, note, length in beats].
// Add a tune here and ask for it by name (`engine.music.setTune`).

const soft = { type: 'triangle', vol: 0.07, attack: 0.03 };
const bell = { type: 'sine', vol: 0.06, attack: 0.01 };
const bass = { type: 'sine', vol: 0.09, attack: 0.04 };

// Four bars of 4/4 over C, Am, F, G: slow, warm and gentle.
const cosy = {
  tempo: 84,
  beats: 16,
  voices: [
    {
      instrument: bell,
      notes: [
        [0, 'E5', 1.5], [1.5, 'G5', 0.5], [2, 'E5', 2],
        [4, 'C5', 1.5], [5.5, 'E5', 0.5], [6, 'A4', 2],
        [8, 'A4', 1], [9, 'C5', 1], [10, 'F5', 1.5], [11.5, 'E5', 0.5],
        [12, 'D5', 2], [14, 'B4', 1], [15, 'D5', 1],
      ],
    },
    {
      instrument: soft,
      notes: [
        [0, 'C4', 2], [2, 'G4', 2], [4, 'A3', 2], [6, 'E4', 2],
        [8, 'F3', 2], [10, 'C4', 2], [12, 'G3', 2], [14, 'D4', 2],
      ],
    },
    {
      instrument: bass,
      notes: [[0, 'C3', 3.5], [4, 'A2', 3.5], [8, 'F2', 3.5], [12, 'G2', 3.5]],
    },
  ],
};


// Appended to src/ship/tunes.js (replacing the export line).
const run = (beat, names, step, len = step) => names.map((n, i) => [beat + i * step, n, len]);

const chime = { type: 'sine', vol: 0.05, attack: 0.008 };
const pluck = { type: 'square', vol: 0.03, attack: 0.005 };
const twang = { type: 'sawtooth', vol: 0.025, attack: 0.004 };
const rumble = { type: 'sine', vol: 0.11, attack: 0.08 };
const glow = { type: 'triangle', vol: 0.06, attack: 0.1 };

// Bluebell: twinkly. Fast little sparkles climbing and falling over a soft pad (C major pentatonic).
const bluebell = {
  tempo: 96,
  beats: 16,
  voices: [
    {
      instrument: bell,
      notes: [
        ...run(0, ['C6', 'E6', 'G6', 'E6', 'A6', 'G6', 'E6', 'G6'], 0.5),
        ...run(4, ['D6', 'G6', 'A6', 'G6', 'E6', 'D6', 'C6', 'D6'], 0.5),
        ...run(8, ['E6', 'G6', 'C7', 'G6', 'A6', 'G6', 'E6', 'C6'], 0.5),
        ...run(12, ['D6', 'E6', 'G6', 'A6'], 0.5), [14, 'G6', 1.5], [15.5, 'E6', 0.5],
      ],
    },
    { instrument: soft, notes: [[0, 'C4', 4], [4, 'A3', 4], [8, 'F4', 4], [12, 'G3', 4]] },
    { instrument: bass, notes: [[0, 'C3', 4], [4, 'A2', 4], [8, 'F2', 4], [12, 'G2', 4]] },
  ],
};

// Ember: warm and rumbly. Slow low notes that hum on and on, a glowing pad above (D minor).
const ember = {
  tempo: 72,
  beats: 16,
  voices: [
    {
      instrument: rumble,
      notes: [[0, 'D2', 3], [3, 'D2', 1], [4, 'F2', 3], [7, 'F2', 1], [8, 'G2', 3], [11, 'G2', 1], [12, 'A2', 3], [15, 'A2', 1]],
    },
    { instrument: glow, notes: [[0, 'D3', 4], [4, 'F3', 4], [8, 'G3', 4], [12, 'E3', 4]] },
    {
      instrument: glow,
      notes: [[0, 'A3', 2], [2, 'F3', 2], [4, 'C4', 2], [6, 'A3', 2], [8, 'D4', 2], [10, 'Bb3', 2], [12, 'A3', 3], [15, 'G3', 1]],
    },
  ],
};

// Frosty: chimey. Sparse high bells that ring and ring, with a hush underneath (A minor pentatonic).
const frosty = {
  tempo: 76,
  beats: 16,
  voices: [
    {
      instrument: chime,
      notes: [
        [0, 'E6', 3], [2, 'A6', 3], [4, 'C7', 2], [6, 'B6', 2],
        [8, 'A6', 3], [10, 'E6', 2], [12, 'G6', 2], [14, 'E6', 2],
      ],
    },
    { instrument: chime, notes: [[1, 'A5', 2], [5, 'E5', 2], [9, 'C6', 2], [13, 'D6', 2]] },
    { instrument: soft, notes: [[0, 'A3', 8], [8, 'F3', 4], [12, 'G3', 4]] },
  ],
};

// Candy: bouncy. Short hopping notes on the beat, a skipping tune over oom-pah bass (C major).
const candy = {
  tempo: 132,
  beats: 16,
  voices: [
    {
      instrument: pluck,
      notes: [
        [0, 'G5', 0.5], [1, 'E5', 0.5], [1.5, 'G5', 0.5], [2, 'C6', 1], [3.5, 'B5', 0.5],
        [4, 'A5', 0.5], [5, 'F5', 0.5], [5.5, 'A5', 0.5], [6, 'D6', 1], [7.5, 'C6', 0.5],
        [8, 'G5', 0.5], [9, 'E5', 0.5], [9.5, 'G5', 0.5], [10, 'E6', 1], [11.5, 'D6', 0.5],
        [12, 'C6', 0.5], [13, 'G5', 0.5], [13.5, 'B5', 0.5], [14, 'C6', 1.5],
      ],
    },
    {
      instrument: bass,
      notes: [
        ...run(0, ['C3', 'G3', 'C3', 'G3'], 1, 0.6), ...run(4, ['F3', 'C4', 'F3', 'C4'], 1, 0.6),
        ...run(8, ['C3', 'G3', 'C3', 'G3'], 1, 0.6), ...run(12, ['G2', 'D3', 'G2', 'D3'], 1, 0.6),
      ],
    },
  ],
};

// Stripey: twangy. Plucky sawtooth notes like a banjo, over a loping two-step (G mixolydian).
const stripey = {
  tempo: 104,
  beats: 16,
  voices: [
    {
      instrument: twang,
      notes: [
        [0, 'D5', 0.5], [0.5, 'G5', 0.5], [1, 'B5', 1], [2.5, 'A5', 0.5], [3, 'G5', 1],
        [4, 'F5', 0.5], [4.5, 'A5', 0.5], [5, 'C6', 1], [6.5, 'B5', 0.5], [7, 'A5', 1],
        [8, 'D5', 0.5], [8.5, 'G5', 0.5], [9, 'B5', 1], [10.5, 'D6', 0.5], [11, 'B5', 1],
        [12, 'A5', 0.5], [12.5, 'F5', 0.5], [13, 'G5', 2], [15, 'D5', 1],
      ],
    },
    {
      instrument: bass,
      notes: [
        ...run(0, ['G2', 'D3', 'G2', 'D3'], 1, 0.7), ...run(4, ['F2', 'C3', 'F2', 'C3'], 1, 0.7),
        ...run(8, ['G2', 'D3', 'G2', 'D3'], 1, 0.7), ...run(12, ['D2', 'A2', 'G2', 'D3'], 1, 0.7),
      ],
    },
  ],
};

// Inside any house: cosy. A slow lullaby in three-time, soft and close (F major).
const indoors = {
  tempo: 66,
  beats: 12,
  voices: [
    {
      instrument: bell,
      notes: [
        [0, 'A5', 2], [2, 'C6', 1], [3, 'A5', 1.5], [4.5, 'G5', 1.5],
        [6, 'F5', 2], [8, 'G5', 1], [9, 'A5', 1], [10, 'G5', 2],
      ],
    },
    { instrument: soft, notes: [[0, 'F3', 3], [3, 'C4', 3], [6, 'Bb3', 3], [9, 'C4', 3]] },
    { instrument: bass, notes: [[0, 'F2', 5.5], [6, 'Bb2', 2.5], [9, 'C3', 2.5]] },
  ],
};

export const TUNES = { cosy, bluebell, ember, frosty, candy, stripey, indoors };

// Little stings, played once (not looped) with `engine.music.sting(name)`.
const landed = {
  tempo: 120,
  beats: 4,
  voices: [
    { instrument: bell, notes: [[0, 'G5', 0.5], [0.5, 'C6', 0.5], [1, 'E6', 0.5], [1.5, 'G6', 1.5]] },
    { instrument: soft, notes: [[1.5, 'C4', 2], [1.5, 'E4', 2]] },
  ],
};

const blastedOff = {
  tempo: 140,
  beats: 4,
  voices: [
    { instrument: bell, notes: [[0, 'C5', 0.5], [0.5, 'G5', 0.5], [1, 'C6', 0.5], [1.5, 'E6', 0.5], [2, 'G6', 1.5]] },
    { instrument: soft, notes: [[0, 'C3', 1.5], [2, 'C4', 2]] },
  ],
};

export const STINGS = { landed, blastedOff };
