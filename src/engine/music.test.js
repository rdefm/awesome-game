import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Music } from './audio.js';

// A pretend audio context that remembers each volume bus it makes.
function fakeSynth() {
  const buses = [];
  const ctx = {
    currentTime: 0,
    createGain: () => {
      const bus = {
        gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      buses.push(bus);
      return bus;
    },
  };
  return { ctx, master: {}, tone: vi.fn(), buses };
}

const tune = { tempo: 120, beats: 4, voices: [{ instrument: { type: 'sine' }, notes: [[0, 'A4', 1]] }] };

describe('Music', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function make() {
    const synth = fakeSynth();
    const music = new Music(synth);
    music.tunes = { one: tune, two: tune };
    music.stings = { hi: tune };
    return { synth, music };
  }

  it('fades the old tune out as the new one fades in, on separate buses', () => {
    const { synth, music } = make();
    music.setTune('one');
    music.setTune('two');
    const [first, second] = synth.buses;
    expect(first.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, expect.any(Number));
    expect(second.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(expect.any(Number), expect.any(Number));
    expect(second.gain.linearRampToValueAtTime.mock.calls.at(-1)[0]).toBeGreaterThan(0);
    expect(music.current.name).toBe('two');
  });

  it('keeps playing when the next place has the same tune', () => {
    const { synth, music } = make();
    music.setTune('one');
    music.setTune('one');
    expect(synth.buses).toHaveLength(1);
  });

  it('stays silent, stings too, while muted', () => {
    const { synth, music } = make();
    music.setEnabled(false);
    music.setTune('one');
    music.sting('hi');
    expect(synth.buses).toHaveLength(0);
    expect(synth.tone).not.toHaveBeenCalled();
    music.setEnabled(true);
    expect(music.current.name).toBe('one');
    music.sting('hi');
    expect(synth.tone).toHaveBeenCalled();
  });
});
