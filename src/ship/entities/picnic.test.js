import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PICNIC } from '../layout.js';
import { isFriend, makeCarryable } from '../kinds.js';
import { defaultWorld, normalizeWorld } from '../world.js';
import { Critter } from './bluebell.js';
import { Girl } from './girl.js';
import { PICNIC_SNACKS, Snack, Teddy, isSnack } from './items.js';
import { Basket, Blanket, MAX_PICNIC_SNACKS } from './picnic.js';

const assets = {
  critter: {}, teddy: {}, snacks: { sandwich: {}, berryjuice: {} }, picnicBlanket: {}, picnicBasket: [{}, {}],
  girl: () => ({}), emotes: {},
};

// Just enough of the meadow for a picnic.
function setup() {
  const scene = {
    width: 512,
    busy: false,
    engine: {
      audio: { play: vi.fn() }, tweens: { to: vi.fn(() => Promise.resolve()), cancel: vi.fn() }, wait: () => Promise.resolve(),
    },
    entities: [],
    putDown: vi.fn((item, x, y) => Object.assign(item, { x, y }) && Promise.resolve()),
    spawn: vi.fn((kind, x, y) => {
      const item = makeCarryable(assets, { id: `${kind}${scene.entities.length}`, kind, x, y });
      item.scene = scene;
      scene.entities.push(item);
      return item;
    }),
    scripted: (run) => run(),
    interact: vi.fn(),
    settle: vi.fn(),
    persist: vi.fn(),
    toast: vi.fn(),
    hearts: vi.fn(),
    sparkles: vi.fn(),
    bits: vi.fn(),
    dust: vi.fn(),
  };
  scene.engine.scene = scene;
  const girl = new Girl(assets, 300, 140, {});
  const add = (e) => Object.assign(e, { scene }) && scene.entities.push(e) && e;
  add(girl);
  Object.assign(scene, { girl });
  const blanket = new Blanket(assets);
  const basket = new Basket(assets);
  add(blanket);
  add(basket);
  return { scene, girl, blanket, basket, add };
}

const onBlanket = (who) => {
  const { x, y, half, h } = PICNIC.blanket;
  return Math.abs(who.x - x) <= half && who.y >= y - h && who.y <= y;
};

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the picnic snacks', () => {
  it('are snacks like any other: carryable, feedable, and not friends', () => {
    for (const kind of PICNIC_SNACKS) {
      const item = makeCarryable(assets, { id: `${kind}0`, kind, x: 100, y: 140 });
      expect(item, kind).toBeInstanceOf(Snack);
      expect(isSnack(item)).toBe(true);
      expect(isFriend(kind)).toBe(false);
    }
  });

  it('can be fed to a friend anywhere', () => {
    const { add } = setup();
    const critter = add(new Critter(assets, { id: 'critter', kind: 'critter', x: 100, y: 140 }));
    const sandwich = makeCarryable(assets, { id: 'sandwich0', kind: 'sandwich', x: 100, y: 140 });
    expect(critter.accepts(sandwich)).toBe(true);
  });
});

describe('old saves', () => {
  it('load fine without any picnic things', () => {
    const old = { placed: { ship: [], bluebell: [{ id: 'critter', kind: 'critter', x: 200, y: 140 }] }, bag: [{ id: 'juice0', kind: 'juice' }] };
    const world = normalizeWorld(old);
    expect(world.bag).toEqual([{ id: 'juice0', kind: 'juice' }]);
    expect(world.placed.bluebell.length).toBe(defaultWorld().placed.bluebell.length);
  });

  it('keep picnic snacks in the bag', () => {
    const world = normalizeWorld({ placed: {}, bag: [{ id: 'sandwich0', kind: 'sandwich' }, { id: 'berryjuice0', kind: 'berryjuice' }] });
    expect(world.bag.map((e) => e.kind)).toEqual(['sandwich', 'berryjuice']);
  });
});

describe('the picnic basket', () => {
  it('opens and gives a sandwich, then a berry juice, then a sandwich...', async () => {
    const { scene, basket } = setup();
    await basket.use();
    await basket.use();
    await basket.use();
    expect(scene.spawn.mock.calls.map(([kind]) => kind)).toEqual(['sandwich', 'berryjuice', 'sandwich']);
    expect(scene.putDown).toHaveBeenCalledTimes(3);
  });

  it('flips its lid open while giving, and shut again after', async () => {
    const { scene, basket } = setup();
    let lidWhenOut = null;
    scene.putDown.mockImplementation(() => {
      lidWhenOut = basket.open;
      return Promise.resolve();
    });
    await basket.use();
    expect(lidWhenOut).toBe(true);
    expect(basket.open).toBe(false);
  });

  it('stops giving once there are plenty of picnic snacks about', async () => {
    const { scene, basket } = setup();
    for (let i = 0; i < MAX_PICNIC_SNACKS + 2; i++) {
      await basket.use();
    }
    expect(scene.spawn).toHaveBeenCalledTimes(MAX_PICNIC_SNACKS);
    expect(scene.toast).toHaveBeenCalled();
  });

  it('only counts picnic snacks lying about the picnic, not ones taken off elsewhere', async () => {
    const { scene, basket } = setup();
    for (let i = 0; i < MAX_PICNIC_SNACKS; i++) {
      await basket.use();
    }
    for (const e of scene.entities.filter((e) => e.kind === 'sandwich' || e.kind === 'berryjuice')) {
      e.x = 100; // carried off back to the ship's end of the meadow
    }
    await basket.use();
    expect(scene.spawn).toHaveBeenCalledTimes(MAX_PICNIC_SNACKS + 1);
  });
});

describe('the picnic blanket', () => {
  it('tapped, she sits down on it', async () => {
    const { girl, blanket } = setup();
    expect(onBlanket(blanket.spot)).toBe(true);
    Object.assign(girl, blanket.spot);
    await blanket.use();
    expect(girl.pose?.frame).toBe('picnic');
    expect(girl.accepts(new Teddy(assets, { id: 't', kind: 'teddy', x: 0, y: 0 }))).toBe(true); // she's still about
  });

  it('tapped again while she is sat on it, she stays sat', async () => {
    const { scene, girl, blanket } = setup();
    Object.assign(girl, blanket.spot);
    await blanket.use();
    blanket.onTap();
    expect(scene.interact).not.toHaveBeenCalled();
    expect(girl.pose?.frame).toBe('picnic');
  });

  it('she gets up again when she walks off', async () => {
    const { girl, blanket } = setup();
    Object.assign(girl, blanket.spot);
    await blanket.use();
    girl.walkTo(100, 140);
    expect(girl.pose).toBeNull();
    expect(girl.mode).toBe('walk');
  });

  it('takes friends, not other things', () => {
    const { blanket } = setup();
    const critter = new Critter(assets, { id: 'critter', kind: 'critter', x: 0, y: 0 });
    const teddy = new Teddy(assets, { id: 't', kind: 'teddy', x: 0, y: 0 });
    expect(blanket.accepts(critter)).toBe(true);
    expect(blanket.accepts(teddy)).toBe(false);
  });

  it('a friend dropped on it sits down on it, and is remembered there', async () => {
    const { scene, blanket, add } = setup();
    const critter = add(new Critter(assets, { id: 'critter', kind: 'critter', x: PICNIC.blanket.x + 40, y: 120 }));
    await blanket.receive(critter);
    expect(onBlanket(critter)).toBe(true);
    expect(scene.settle).toHaveBeenCalledWith(critter);
    expect(critter.draggable).toBe(true);
    expect(critter.busy).toBe(false);
  });

  it('a friend sat on it stays sat, till it is picked up', async () => {
    const { blanket, add } = setup();
    const critter = add(new Critter(assets, { id: 'critter', kind: 'critter', x: PICNIC.blanket.x, y: PICNIC.blanket.y - 4 }));
    await blanket.receive(critter);
    const at = { x: critter.x, y: critter.y };
    for (let i = 0; i < 100; i++) {
      critter.update(0.1);
    }
    expect({ x: critter.x, y: critter.y }).toEqual(at);
    critter.onDragStart({ x: critter.x, y: critter.y - 5 });
    expect(critter.picnicking).toBe(false);
  });

  it('a friend sat on it still munches a snack given to it there', async () => {
    const { blanket, add } = setup();
    const critter = add(new Critter(assets, { id: 'critter', kind: 'critter', x: PICNIC.blanket.x, y: PICNIC.blanket.y - 4 }));
    await blanket.receive(critter);
    const juice = makeCarryable(assets, { id: 'berryjuice0', kind: 'berryjuice', x: critter.x, y: critter.y });
    expect(critter.accepts(juice)).toBe(true);
  });
});
