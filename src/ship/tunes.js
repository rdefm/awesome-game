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

export const TUNES = { cosy };
