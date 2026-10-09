import { describe, expect, it } from 'vitest';
import { Cursor, eventsBetween, loopSeconds, noteFreq } from './sequencer.js';
import { TUNES } from '../ship/tunes.js';

const inst = { type: 'sine', vol: 0.1 };
// 120 bpm: half a second per beat, a two-second loop.
const tune = { tempo: 120, beats: 4, voices: [{ instrument: inst, notes: [[0, 'A4', 1], [2, 'A5', 2]] }] };

describe('noteFreq', () => {
  it('knows concert pitch', () => {
    expect(noteFreq('A4')).toBeCloseTo(440);
    expect(noteFreq('A5')).toBeCloseTo(880);
    expect(noteFreq('C4')).toBeCloseTo(261.63, 1);
    expect(noteFreq('Bb3')).toBeCloseTo(noteFreq('A#3'));
  });

  it('rejects nonsense', () => {
    expect(() => noteFreq('H4')).toThrow();
  });
});

describe('eventsBetween', () => {
  it('turns beats into seconds', () => {
    const [a, b] = eventsBetween(tune, 0, 2);
    expect(a).toMatchObject({ time: 0, dur: 0.5, instrument: inst });
    expect(b.time).toBeCloseTo(1);
    expect(b.dur).toBeCloseTo(1);
  });

  it('loops forever', () => {
    expect(eventsBetween(tune, 2, 4).map((e) => e.time)).toEqual([2, 3]);
    expect(eventsBetween(tune, 20, 22).map((e) => e.time)).toEqual([20, 21]);
  });

  it('takes the start but not the end of a window', () => {
    expect(eventsBetween(tune, 1, 2)).toHaveLength(1);
    expect(eventsBetween(tune, 1.01, 2)).toHaveLength(0);
  });

  it('plays notes from every voice in time order', () => {
    const two = { ...tune, voices: [...tune.voices, { instrument: inst, notes: [[1, 'C4', 1]] }] };
    const times = eventsBetween(two, 0, 2).map((e) => e.time);
    expect(times).toEqual([0, 0.5, 1]);
  });
});

describe('Cursor', () => {
  it('hands out each note exactly once as the clock moves on', () => {
    const cursor = new Cursor(tune);
    const times = [];
    for (let now = 0; now < 6; now += 0.25) {
      times.push(...cursor.take(now, 0.5).map((e) => e.time));
    }
    expect(times).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('skips what a jump in the clock missed', () => {
    const cursor = new Cursor(tune);
    cursor.take(0, 0.5);
    expect(cursor.take(100, 0.5).map((e) => e.time)).toEqual([100]);
  });
});

describe('the game tunes', () => {
  it('all parse and fit their loop', () => {
    for (const t of Object.values(TUNES)) {
      const events = eventsBetween(t, 0, loopSeconds(t));
      expect(events.length).toBeGreaterThan(0);
      for (const voice of t.voices) {
        for (const [beat, , length] of voice.notes) {
          expect(beat + length).toBeLessThanOrEqual(t.beats);
        }
      }
    }
  });
});
