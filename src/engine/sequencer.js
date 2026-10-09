// A tiny music sequencer. A tune is plain data:
//   { tempo: beats per minute, beats: length of the loop in beats,
//     voices: [{ instrument: { type, vol, attack }, notes: [[beat, 'E4', beats long], ...] }] }
// Everything here is pure (no audio), so it can be tested; `Music` in
// audio.js turns the events it yields into synth tones.

const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// 'A4' -> 440, 'F#3', 'Bb4'. Throws on anything else so typos in a tune show up in tests.
export function noteFreq(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) {
    throw new Error(`Bad note name: ${name}`);
  }
  const semis = SEMITONES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((semis - 69) / 12);
}

export const beatSeconds = (tune) => 60 / tune.tempo;
export const loopSeconds = (tune) => tune.beats * beatSeconds(tune);

// Every note that starts in [from, to) seconds after the tune began, looping
// forever, soonest first: { time, freq, dur, instrument }.
export function eventsBetween(tune, from, to) {
  const spb = beatSeconds(tune);
  const loop = loopSeconds(tune);
  const events = [];
  for (let k = Math.max(0, Math.floor(from / loop)); k * loop < to; k++) {
    for (const voice of tune.voices) {
      for (const [beat, note, length] of voice.notes) {
        const time = k * loop + beat * spb;
        if (time >= from && time < to) {
          events.push({ time, freq: noteFreq(note), dur: length * spb, instrument: voice.instrument });
        }
      }
    }
  }
  return events.sort((a, b) => a.time - b.time);
}

// Walks along a tune handing out its notes a little ahead of the audio clock.
// `take(now, ahead)` returns the events to schedule; if the clock jumped
// (a backgrounded tab), the notes it missed are skipped, not played in a burst.
export class Cursor {
  constructor(tune) {
    this.tune = tune;
    this.done = 0; // seconds into the tune already handed out
  }

  take(now, ahead) {
    const from = Math.max(this.done, now);
    const to = now + ahead;
    if (to <= from) {
      return [];
    }
    this.done = to;
    return eventsBetween(this.tune, from, to);
  }
}
