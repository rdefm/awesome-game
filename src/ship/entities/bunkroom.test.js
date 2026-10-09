import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FRIEND_BUNKS, HER_BUNK } from '../layout.js';
import { FriendBunk, HerBunk, LightSwitch } from './bunkroom.js';
import { MumYeti } from './frosty.js';
import { Girl } from './girl.js';
import { Snack } from './items.js';

const assets = {
  mumYeti: {}, snacks: {}, bed: {}, lightSwitch: [], blankets: { her: [], lower: [], upper: [] },
  girl: () => ({}), emotes: {},
};

// Just enough of the bunk room for its beds (and her and a yeti to sleep in them).
function setup() {
  const scene = {
    engine: {
      audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve(),
    },
    entities: [],
    busy: false,
    night: false,
    scripted: vi.fn((run) => run()),
    interact: vi.fn(),
    persist: vi.fn(),
    settle: vi.fn(),
    putDown: vi.fn(() => Promise.resolve()),
    setNight: vi.fn(),
    hearts: vi.fn(),
    dust: vi.fn(),
  };
  const girl = new Girl(assets, 100, 136, {});
  const yeti = new MumYeti(assets, { id: 'mumYeti', kind: 'mumYeti', x: 60, y: 136 });
  for (const e of [girl, yeti]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  scene.girl = girl;
  const make = (entity) => Object.assign(entity, { scene });
  return { scene, girl, yeti, make };
}

const played = (scene, sound) => scene.engine.audio.play.mock.calls.filter(([s]) => s === sound);

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('her bunk', () => {
  it('has her climb in, yawn and fall asleep there', async () => {
    const { scene, girl, make } = setup();
    const bunk = make(new HerBunk(assets));
    await bunk.use();
    expect(bunk.sleeper).toBe(girl);
    expect(bunk.asleep).toBe(true);
    expect(girl.riding).toBe(bunk);
    expect(girl.draggable).toBe(false);
    expect(played(scene, 'yawn')).toHaveLength(1);
    expect(scene.persist).toHaveBeenCalled();
  });

  it('wakes her when she is tapped: a stretch, then out of bed beside it', async () => {
    const { scene, girl, make } = setup();
    const bunk = make(new HerBunk(assets));
    await bunk.use();
    girl.onTap();
    await vi.waitFor(() => expect(bunk.sleeper).toBe(null));
    await vi.waitFor(() => expect(girl.mode).toBe('idle'));
    expect(girl.riding).toBe(null);
    expect(girl.draggable).toBe(true);
    expect({ x: girl.x, y: girl.y }).toEqual(HER_BUNK.spot);
    expect(played(scene, 'yawn')).toHaveLength(2);
  });

  it('wakes her when the bed is tapped, rather than her walking over', async () => {
    const { scene, make } = setup();
    const bunk = make(new HerBunk(assets));
    await bunk.use();
    bunk.onTap();
    await vi.waitFor(() => expect(bunk.sleeper).toBe(null));
    expect(scene.interact).not.toHaveBeenCalled();
  });

  it('is only for her: friends are not taken', () => {
    const { yeti, make } = setup();
    expect(make(new HerBunk(assets)).accepts?.(yeti) ?? false).toBe(false);
  });

  it('stops friends being dropped on her while she sleeps', async () => {
    const { girl, yeti, make } = setup();
    await make(new HerBunk(assets)).use();
    expect(girl.accepts(yeti)).toBe(false);
  });
});

describe('a friend bunk', () => {
  it('takes friends, not other things', () => {
    const { yeti, make } = setup();
    const bunk = make(new FriendBunk(assets, FRIEND_BUNKS[0], false));
    expect(bunk.accepts(yeti)).toBe(true);
    expect(bunk.accepts(make(new Snack(assets, { id: 'c', kind: 'cookie', x: 0, y: 0 })))).toBe(false);
  });

  it('tucks a friend in to sleep, remembering them on the floor beside it', () => {
    const { scene, yeti, make } = setup();
    const bunk = make(new FriendBunk(assets, FRIEND_BUNKS[1], true));
    bunk.receive(yeti);
    expect(bunk.sleeper).toBe(yeti);
    expect(bunk.asleep).toBe(true);
    expect(yeti.seat).toBe(bunk);
    expect(yeti.perch).toBe(FRIEND_BUNKS[1].deck);
    expect(bunk.accepts(yeti)).toBe(false);
    expect(scene.settle).toHaveBeenCalledWith(yeti, FRIEND_BUNKS[1].spot.x, FRIEND_BUNKS[1].spot.y);
  });

  it('snuggles a sleeper in deeper when tapped (as their seat), without waking them', () => {
    const { scene, yeti, make } = setup();
    const bunk = make(new FriendBunk(assets, FRIEND_BUNKS[0], false));
    bunk.receive(yeti);
    yeti.seat.spin();
    expect(bunk.sleeper).toBe(yeti);
    expect(scene.hearts).toHaveBeenCalled();
  });

  it('wakes a friend when they are picked up out of it', () => {
    const { scene, yeti, make } = setup();
    const bunk = make(new FriendBunk(assets, FRIEND_BUNKS[0], false));
    bunk.receive(yeti);
    expect(bunk.draggable).toBe(true);
    bunk.onDragStart({ x: bunk.x, y: bunk.top });
    expect(bunk.sleeper).toBe(null);
    expect(yeti.seat).toBe(null);
    expect(yeti.held).toBe(true);
    expect(played(scene, 'yawn')).toHaveLength(1);
  });

  it('in the morning, has a friend stretch, yawn and hop down out of it', async () => {
    const { scene, yeti, make } = setup();
    const bunk = make(new FriendBunk(assets, FRIEND_BUNKS[0], false));
    bunk.receive(yeti);
    await bunk.wakeUp();
    expect(bunk.sleeper).toBe(null);
    expect(yeti.seat).toBe(null);
    expect(scene.putDown).toHaveBeenCalledWith(yeti, FRIEND_BUNKS[0].spot.x, FRIEND_BUNKS[0].spot.y);
    expect(played(scene, 'yawn').length).toBeGreaterThan(0);
  });
});

describe('the light switch', () => {
  it('has her walk over to flick it while she is up', () => {
    const { scene, make } = setup();
    const sw = make(new LightSwitch(assets));
    sw.onTap();
    expect(scene.interact).toHaveBeenCalledWith(sw);
  });

  it('flicks the room to night and back', async () => {
    const { scene, make } = setup();
    const sw = make(new LightSwitch(assets));
    await sw.use();
    expect(scene.setNight).toHaveBeenLastCalledWith(true);
    scene.night = true;
    await sw.use();
    expect(scene.setNight).toHaveBeenLastCalledWith(false);
  });

  it('just flicks, without waking her, while she is in bed', () => {
    const { scene, make } = setup();
    scene.herAsleep = true;
    make(new LightSwitch(assets)).onTap();
    expect(scene.interact).not.toHaveBeenCalled();
    expect(scene.setNight).toHaveBeenCalledWith(true);
  });
});
