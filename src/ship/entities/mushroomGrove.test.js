import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isFriend, makeCarryable } from '../kinds.js';
import { MUSHROOM_GROVE } from '../layout.js';
import { TALKS } from '../talks/index.js';
import { defaultWorld, find, normalizeWorld } from '../world.js';
import { isFriendItem } from './friends.js';
import { Girl } from './girl.js';
import {
  FairyRing, GlowPond, HollowLog, LANTERN_OFFSET, LANTERN_SPORES, MAX_LILIES, MushroomCreature, SnailRace, SporeJar, SporeLantern,
  Spores, TINY, normalizeJarFill,
} from './mushroomGrove.js';

const RACE = MUSHROOM_GROVE.race;

const assets = { shroomCreature: {}, girl: () => ({}), emotes: {}, snacks: {} };

// Just enough of the mushroom grove for the creature (tweens jump straight to
// where they're going).
function setup(stage) {
  const scene = {
    where: 'mushroomgrove',
    engine: {
      audio: { play: vi.fn() },
      tweens: { to: vi.fn((obj, props) => Promise.resolve(Object.assign(obj, props))), cancel: vi.fn() },
      wait: () => Promise.resolve(),
    },
    entities: [],
    busy: false,
    width: 320,
    stickers: [],
    memories: [],
    bits: vi.fn(),
    sparkles: vi.fn(),
    musicNote: vi.fn(),
    hearts: vi.fn(),
    settle: vi.fn(),
    saveStage: vi.fn(),
    interact: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  };
  scene.engine.scene = scene;
  const girl = new Girl(assets, 60, 140, {});
  const shroom = new MushroomCreature(assets, { id: 'shroom', kind: 'shroom', x: 156, y: 128, ...(stage === undefined ? {} : { stage }) });
  for (const e of [girl, shroom]) {
    e.scene = scene;
    scene.entities.push(e);
  }
  scene.girl = girl;
  return { scene, girl, shroom };
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the shy mushroom creature', () => {
  it('lives in the mushroom grove, and turns up there in an old save', () => {
    expect(find(defaultWorld(), 'shroom')).toMatchObject({ kind: 'shroom' });
    const old = { placed: { bluebell: [], mushroomgrove: [] }, bag: [] };
    expect(normalizeWorld(old).placed.mushroomgrove.map((e) => e.id)).toContain('shroom');
    expect(isFriend('shroom')).toBe(true);
    expect(makeCarryable(assets, find(defaultWorld(), 'shroom'))).toBeInstanceOf(MushroomCreature);
  });

  it("can't be picked up, fed or played with before its first dance", () => {
    const { shroom } = setup();
    expect(shroom.friendly).toBe(false);
    expect(shroom.draggable).toBe(false);
    expect(shroom.free).toBe(false);
    expect(shroom.accepts({ kind: 'cookie', seatFrame: undefined })).toBe(false);
  });

  it('hides when she comes near, and pops out again when she steps away', () => {
    const { girl, shroom } = setup();
    girl.x = shroom.x - 10;
    girl.y = shroom.y;
    shroom.update(0.1);
    expect(shroom.hidden).toBe(true);
    girl.x = shroom.x - 120;
    shroom.update(1);
    shroom.update(1);
    expect(shroom.hidden).toBe(false);
  });

  it('only peeks the first two times, then dances and becomes a friend for good', async () => {
    const { scene, shroom } = setup();
    await shroom.use();
    await shroom.use();
    expect(shroom.friendly).toBe(false);
    expect(scene.saveStage).not.toHaveBeenCalled();
    await shroom.use();
    expect(shroom.friendly).toBe(true);
    expect(shroom.draggable).toBe(true);
    expect(scene.saveStage).toHaveBeenCalledWith(shroom, 1);
  });

  it('is a friend straight away once it has danced (in the save)', () => {
    const { girl, shroom } = setup(1);
    expect(shroom.friendly).toBe(true);
    expect(shroom.draggable).toBe(true);
    expect(shroom.free).toBe(true);
    expect(isFriendItem(shroom)).toBe(true);
    // ...and doesn't hide from her any more.
    girl.x = shroom.x - 10;
    girl.y = shroom.y;
    shroom.update(0.1);
    expect(shroom.hidden).toBe(false);
  });

  it('as a friend, takes snacks and other friends', () => {
    const { shroom } = setup(1);
    expect(shroom.accepts({ kind: 'cookie' })).toBe(true);
    expect(shroom.accepts({ kind: 'ball' })).toBe(false);
    expect(shroom.accepts({ kind: 'monkey', seatFrame: () => null })).toBe(true);
  });

  it('as a friend, giggles and dances when tapped and then offers a chat', async () => {
    const { scene, shroom } = setup(1);
    await shroom.onTap();
    expect(scene.interact).not.toHaveBeenCalled();
    expect(shroom.busy).toBe(false);
    expect(shroom.chat().tree).toBe(TALKS.shroom);
    expect(shroom.chat().facts).toEqual({ home: true });
    expect(scene.add).toHaveBeenCalled(); // the chat bubble
  });
});

describe('the fairy ring', () => {
  // The grove with a fairy ring in it; `steps` seconds of frames pass.
  function withRing(stage) {
    const s = setup(stage);
    const ring = new FairyRing({});
    ring.scene = s.scene;
    s.scene.entities.push(ring);
    const run = (seconds) => {
      for (let t = 0; t < seconds; t += 0.05) {
        ring.update(0.05);
      }
    };
    return { ...s, ring, run };
  }

  const into = (who, ring) => Object.assign(who, { x: ring.x, y: ring.y });

  it('shrinks her down tiny when she steps inside, and grows her back with a pop when she steps out', () => {
    const { scene, girl, ring, run } = withRing();
    girl.x = ring.x + ring.rx + 30;
    run(0.2); // settles in (she's outside)
    expect(girl.scale).toBe(1);
    into(girl, ring);
    run(1);
    expect(girl.scale).toBe(TINY);
    girl.x = ring.x - ring.rx - 20;
    run(1);
    expect(girl.scale).toBe(1);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('pop');
  });

  it('sends her to the middle when tapped, and back out (on her side) when tapped with her in it', () => {
    const { girl, ring } = withRing();
    girl.x = ring.x - 40;
    expect(ring.spot).toEqual({ x: ring.x, y: ring.y });
    into(girl, ring);
    girl.x -= 2;
    expect(ring.holds(ring.spot)).toBe(false);
    expect(ring.spot.x).toBeLessThan(ring.x);
  });

  it("doesn't shrink her while she's just walking through it on her way somewhere", () => {
    const { girl, ring, run } = withRing();
    girl.x = ring.x + ring.rx + 30;
    run(0.1);
    into(girl, ring);
    girl.mode = 'walk';
    run(1);
    expect(girl.scale).toBe(1);
  });

  it('makes her steps squeak while she is tiny', () => {
    const { scene, girl, ring, run } = withRing();
    into(girl, ring);
    run(1);
    scene.engine.audio.play.mockClear();
    girl.mode = 'walk';
    run(0.5);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('tinystep');
  });

  it('grows her back if she is picked up out of it', () => {
    const { girl, ring, run } = withRing();
    into(girl, ring);
    run(1);
    girl.mode = 'held';
    run(1);
    expect(girl.scale).toBe(1);
  });

  it('shrinks a friend dropped in it, and grows it back when it is picked up', () => {
    const { shroom, ring, run } = withRing(1);
    into(shroom, ring);
    run(1);
    expect(shroom.shrinkScale).toBe(TINY);
    shroom.held = true;
    run(1);
    expect(shroom.shrinkScale).toBe(1);
  });

  it("doesn't shrink a friend while it's still falling in", () => {
    const { shroom, ring, run } = withRing(1);
    into(shroom, ring);
    shroom.falling = true;
    run(1);
    expect(shroom.shrinkScale).toBe(1);
  });

  it('is already tiny on a reload inside it, and never saves anyone being tiny', () => {
    const { scene, girl, shroom, ring } = withRing(1);
    into(girl, ring);
    into(shroom, ring);
    ring.update(0.05);
    expect(girl.scale).toBe(TINY);
    expect(shroom.shrinkScale).toBe(TINY);
    expect(scene.saveStage).not.toHaveBeenCalled();
    expect(scene.settle).not.toHaveBeenCalled();
    // Anywhere else she's a new girl, full size.
    expect(new Girl(assets, ring.x, ring.y, {}).scale).toBe(1);
  });
});

describe('the glow pond', () => {
  // The grove with the pond in it, and the spores drifting over it.
  function withPond() {
    const s = setup(1);
    s.scene.engine.time = 0;
    s.scene.persist = vi.fn();
    const pond = new GlowPond({});
    const spores = new Spores(pond);
    for (const e of [pond, spores]) {
      e.scene = s.scene;
      s.scene.entities.push(e);
    }
    const run = (seconds) => {
      for (let t = 0; t < seconds; t += 0.05) {
        pond.update(0.05);
      }
    };
    // A spore hanging still at (x, y).
    const sporeAt = (x, y) => Object.assign(spores.motes[0], { x, base: y + 14, k: 0.2, phase: 0 });
    return { ...s, pond, spores, run, sporeAt };
  }

  const lit = (pond) => pond.fish.filter((f) => f.glow > 0);

  it('is only tapped on the water', () => {
    const { pond } = withPond();
    expect(pond.hitTest(pond.x, pond.y)).toBe(true);
    expect(pond.hitTest(pond.x + pond.rx - 2, pond.y)).toBe(true);
    expect(pond.hitTest(pond.x + pond.rx + 12, pond.y)).toBe(false);
    expect(pond.hitTest(pond.x, pond.y - pond.ry - 10)).toBe(false);
  });

  it('sends ripples out and lights up fish when tapped, which swim about and fade out again', () => {
    const { scene, pond, run } = withPond();
    expect(lit(pond)).toHaveLength(0);
    pond.onTap({ x: pond.x + 4, y: pond.y });
    expect(pond.ripples).toHaveLength(1);
    expect(lit(pond).length).toBeGreaterThan(0);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('bloop');
    const before = pond.fish.map((f) => pond.fishPos(f));
    run(1);
    expect(pond.fish.map((f) => pond.fishPos(f))).not.toEqual(before);
    for (const f of pond.fish) {
      expect(pond.holds(pond.fishPos(f))).toBe(true);
    }
    run(10);
    expect(pond.ripples).toHaveLength(0);
    expect(lit(pond)).toHaveLength(0);
  });

  it('blooms a glowing lily when a spore is popped over it, which closes up and goes after a while', () => {
    const { scene, pond, spores, run, sporeAt } = withPond();
    sporeAt(pond.x + 6, pond.y - 20);
    spores.onTap({ x: pond.x + 6, y: pond.y - 20 });
    expect(pond.lilies).toHaveLength(1);
    expect(pond.holds(pond.lilies[0])).toBe(true);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('bloom');
    run(5);
    expect(pond.lilies).toHaveLength(1);
    run(30);
    expect(pond.lilies).toHaveLength(0);
  });

  it("doesn't bloom a lily for a spore popped away from it", () => {
    const { pond, spores, sporeAt } = withPond();
    sporeAt(pond.x + pond.rx + 40, pond.y - 20);
    spores.onTap({ x: pond.x + pond.rx + 40, y: pond.y - 20 });
    expect(pond.lilies).toHaveLength(0);
  });

  it('never has more than a few lilies at once', () => {
    const { pond } = withPond();
    for (let i = 0; i < 10; i++) {
      pond.bloom(pond.x);
    }
    expect(pond.lilies.length).toBe(MAX_LILIES);
  });

  it("isn't saved: an old save of the grove loads with nothing new in it", () => {
    const old = { placed: { bluebell: [], mushroomgrove: [] }, bag: [] };
    expect(normalizeWorld(old).placed.mushroomgrove.map((e) => e.kind)).toEqual(['shroom']);
  });
});

describe('the snail race', () => {
  function withRace() {
    const s = setup(1);
    const race = new SnailRace({});
    race.scene = s.scene;
    s.scene.entities.push(race);
    const run = (seconds) => {
      for (let t = 0; t < seconds; t += 0.05) {
        race.update(0.05);
      }
    };
    return { ...s, race, run };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('waits at the start line until a snail is tapped', () => {
    const { race, run } = withRace();
    run(5);
    expect(race.snails.map((sn) => sn.x)).toEqual([RACE.start, RACE.start]);
    expect(race.hitTest(RACE.start, RACE.lanes[0] - 2)).toBe(true);
    expect(race.hitTest(RACE.start, RACE.lanes[0] - 30)).toBe(false);
  });

  it('sets both off when one is cheered, and the cheered one usually wins, with a fanfare', () => {
    const { scene, race, run } = withRace();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    race.onTap({ x: RACE.start, y: RACE.lanes[1] - 2 });
    expect(race.cheered).toBe(1);
    run(1);
    expect(race.snails.every((sn) => sn.x > RACE.start)).toBe(true);
    run(8.5); // both over the line, not yet back at the start
    expect(race.winner).toBe(1);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('fanfare');
  });

  it("doesn't always let the cheered one win", () => {
    const { race, run } = withRace();
    vi.spyOn(Math, 'random').mockReturnValue(0.95);
    race.onTap({ x: RACE.start, y: RACE.lanes[0] - 2 });
    run(8.5);
    expect(race.winner).toBe(1);
  });

  it('never goes backwards, and both go back to the start line for another go', () => {
    const { race, run } = withRace();
    race.onTap({ x: RACE.start, y: RACE.lanes[0] - 2 });
    let last = race.snails.map((sn) => sn.x);
    for (let i = 0; i < 200 && race.racing; i++) {
      run(0.05);
      race.snails.forEach((sn, j) => expect(sn.x).toBeGreaterThanOrEqual(last[j]));
      last = race.snails.map((sn) => sn.x);
    }
    expect(race.snails.every((sn) => sn.x === RACE.finish)).toBe(true);
    run(10);
    expect(race.racing).toBe(false);
    expect(race.winner).toBe(null);
    expect(race.snails.map((sn) => sn.x)).toEqual([RACE.start, RACE.start]);
    expect(race.snails.every((sn) => sn.alpha === 1)).toBe(true);
  });
});

describe('the hollow log', () => {
  function withLog() {
    const s = setup(1);
    s.scene.scripted = (run) => run();
    s.scene.dust = vi.fn();
    const log = new HollowLog({ logCritters: {} });
    log.scene = s.scene;
    s.scene.entities.push(log);
    return { ...s, log };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends her to the nearer end', () => {
    const { girl, log } = withLog();
    girl.x = log.x - 60;
    expect(log.spot.x).toBeLessThan(log.x - log.hl);
    girl.x = log.x + 60;
    expect(log.spot.x).toBeGreaterThan(log.x + log.hl);
  });

  it('has her crawl in one end and pop out of the other', async () => {
    const { girl, log } = withLog();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    girl.x = log.x - log.hl - 8;
    girl.y = log.y;
    await log.use();
    expect(girl.x).toBeGreaterThan(log.x + log.hl);
    expect(girl.alpha).toBe(1);
    expect(girl.onFeet).toBe(true);
    expect(log.critter).toBe(null);
  });

  it('sometimes has a beetle or a hedgehog scuttle out of the far end first, which runs off', async () => {
    const { girl, log } = withLog();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    girl.x = log.x + log.hl + 8;
    girl.y = log.y;
    await log.use();
    expect(['beetle', 'hedgehog']).toContain(log.critter.kind);
    expect(log.critter.dir).toBe(-1);
    expect(girl.x).toBeLessThan(log.x - log.hl);
    for (let t = 0; t < 5; t += 0.05) {
      log.update(0.05);
    }
    expect(log.critter).toBe(null);
  });
});

describe('the spore jar', () => {
  // The grove with the jar (holding `fill` spores already) and the pond in
  // it, and the spores drifting about.
  function withJar(fill = 0) {
    const s = setup(1);
    s.scene.engine.time = 0;
    s.scene.saveJar = vi.fn();
    s.scene.spawn = vi.fn((kind, x, y) => ({ kind, x, y }));
    const pond = new GlowPond({});
    const jar = new SporeJar({}, fill);
    const spores = new Spores(pond, jar);
    for (const e of [pond, jar, spores]) {
      e.scene = s.scene;
      s.scene.entities.push(e);
    }
    const run = (seconds) => {
      for (let t = 0; t < seconds; t += 0.05) {
        jar.update(0.05);
      }
    };
    // Pops a spore hanging still at (x, y).
    const pop = (x, y) => {
      Object.assign(spores.motes[0], { x, base: y + 14, k: 0.2, phase: 0 });
      spores.onTap({ x, y });
    };
    return { ...s, pond, jar, spores, run, pop };
  }

  it('remembers how full it was, and starts empty in an old save', () => {
    expect(normalizeJarFill(undefined)).toBe(0);
    expect(normalizeJarFill('lots')).toBe(0);
    expect(normalizeJarFill(-1)).toBe(0);
    expect(normalizeJarFill(LANTERN_SPORES)).toBe(0);
    expect(normalizeJarFill(3)).toBe(3);
    expect(withJar(3).jar.fill).toBe(3);
  });

  it('catches a spore popped near it, which floats in, and remembers it', () => {
    const { scene, jar, run, pop } = withJar();
    pop(jar.x + 10, jar.y - 30);
    expect(jar.fill).toBe(0);
    run(2);
    expect(jar.fill).toBe(1);
    expect(scene.saveJar).toHaveBeenCalledWith(1);
  });

  it("doesn't catch a spore popped far from it", () => {
    const { scene, jar, pond, run, pop } = withJar();
    pop(pond.x, pond.y - 20);
    run(2);
    expect(jar.fill).toBe(0);
    expect(scene.saveJar).not.toHaveBeenCalled();
  });

  it(`glows and turns into a lantern at ${LANTERN_SPORES} spores, and a new empty jar turns up after a while`, () => {
    const { scene, jar, run, pop } = withJar(LANTERN_SPORES - 2);
    // Three popped at once: only as many as it has room for float in.
    for (let i = 0; i < 3; i++) {
      pop(jar.x, jar.y - 30);
    }
    run(2);
    expect(scene.spawn).toHaveBeenCalledTimes(1);
    expect(scene.spawn).toHaveBeenCalledWith('lantern', jar.x - LANTERN_OFFSET.x, jar.y + LANTERN_OFFSET.y);
    expect(scene.engine.audio.play).toHaveBeenCalledWith('lanternlit');
    expect(scene.saveJar).toHaveBeenLastCalledWith(0);
    expect(jar.here).toBe(false);
    expect(jar.hitTest(jar.x, jar.y - 6)).toBe(false);
    // No catching spores while it's gone.
    pop(jar.x, jar.y - 30);
    run(2);
    expect(jar.fill).toBe(0);
    run(60);
    expect(jar.here).toBe(true);
    expect(jar.fill).toBe(0);
    expect(jar.hitTest(jar.x, jar.y - 6)).toBe(true);
  });
});

describe('the spore lantern', () => {
  it('is a carryable thing (not a friend) she can take anywhere', () => {
    expect(isFriend('lantern')).toBe(false);
    expect(makeCarryable(assets, { id: 'lantern0', kind: 'lantern', x: 100, y: 140 })).toBeInstanceOf(SporeLantern);
  });

  it('pulses and chimes when tapped, then settles back to a soft glow', () => {
    const { scene } = setup(1);
    const lantern = new SporeLantern(assets, { id: 'lantern0', kind: 'lantern', x: 100, y: 140 });
    lantern.scene = scene;
    lantern.onTap();
    expect(scene.engine.audio.play).toHaveBeenCalledWith('lanternchime');
    expect(lantern.pulse).toBeGreaterThan(0);
    for (let t = 0; t < 5; t += 0.05) {
      lantern.update(0.05);
    }
    expect(lantern.pulse).toBe(0);
  });
});
