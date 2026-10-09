import { describe, expect, it } from 'vitest';
import { PLANETS } from './art/props.js';
import { H, W, spooks } from './layout.js';
import { arrivingBy, landedOn, placesOn, planetOf, tuneOf } from './planetScenes.js';
import { TUNES } from './tunes.js';
import { defaultWorld, find } from './world.js';

describe('landedOn', () => {
  it('finds the planet she was out on when the save was made', () => {
    expect(landedOn({ where: 'bluebell', landed: true })).toBe('bluebell');
    expect(landedOn({ where: 'ember', landed: true })).toBe('ember');
    expect(landedOn({ where: 'frosty', landed: true })).toBe('frosty');
    expect(landedOn({ where: 'candy', landed: true })).toBe('candy');
    expect(landedOn({ where: 'stripey', landed: true })).toBe('stripey');
  });

  it('puts her back inside the gingerbread house if that\'s where she was', () => {
    expect(landedOn({ where: 'gingerbread', landed: true })).toBe('gingerbread');
    expect(landedOn({ where: 'gingerbread', landed: false })).toBe(null);
  });

  it('puts her back inside the lava family\'s house if that\'s where she was', () => {
    expect(landedOn({ where: 'lavahouse', landed: true })).toBe('lavahouse');
    expect(landedOn({ where: 'lavahouse', landed: false })).toBe(null);
  });

  it('puts her back inside Zig\'s hut if that\'s where she was', () => {
    expect(landedOn({ where: 'zighut', landed: true })).toBe('zighut');
    expect(landedOn({ where: 'zighut', landed: false })).toBe(null);
  });

  it('puts her back inside the yetis\' ice cave if that\'s where she was', () => {
    expect(landedOn({ where: 'icecave', landed: true })).toBe('icecave');
    expect(landedOn({ where: 'icecave', landed: false })).toBe(null);
  });

  it('puts her back inside the pink alien\'s pod if that\'s where she was', () => {
    expect(landedOn({ where: 'pod', landed: true })).toBe('pod');
    expect(landedOn({ where: 'pod', landed: false })).toBe(null);
  });

  it('puts her back in the ship otherwise', () => {
    expect(landedOn({})).toBe(null);
    expect(landedOn({ where: 'ship', landed: true })).toBe(null);
    expect(landedOn({ where: 'bluebell', landed: false })).toBe(null);
  });

  it('ignores a place with no scene to go to', () => {
    expect(landedOn({ where: 'nowhere', landed: true })).toBe(null);
  });

  it('has a scene for exactly the planets she can land on', () => {
    for (const p of PLANETS) {
      expect(landedOn({ where: p.id, landed: true }), p.id).toBe(p.landable ? p.id : null);
    }
  });
});

describe('placesOn', () => {
  const landable = PLANETS.filter((p) => p.landable);

  it('lists nothing for a planet she can\'t land on', () => {
    for (const p of PLANETS.filter((q) => !q.landable)) {
      expect(placesOn(p.id), p.id).toEqual([]);
    }
    expect(placesOn('nowhere')).toEqual([]);
  });

  it('gives every landable planet one landing site, listed first and named for the planet', () => {
    for (const p of landable) {
      const landings = placesOn(p.id).filter((place) => place.kind === 'landing');
      expect(landings.map((place) => place.where), p.id).toEqual([p.id]);
      expect(placesOn(p.id)[0].kind, p.id).toBe('landing');
    }
  });

  it('gives every place a name, a kind, a spot on the town map and a scene', () => {
    for (const p of landable) {
      for (const place of placesOn(p.id)) {
        expect(place.name, place.where).toEqual(expect.any(String));
        expect(['landing', 'house', 'site'], place.where).toContain(place.kind);
        expect(place.spot.x, place.where).toBeGreaterThanOrEqual(0);
        expect(place.spot.x, place.where).toBeLessThanOrEqual(W);
        expect(place.spot.y, place.where).toBeGreaterThanOrEqual(0);
        expect(place.spot.y, place.where).toBeLessThanOrEqual(H);
        expect(place.scene, place.where).toEqual(expect.any(Function));
        expect(landedOn({ where: place.where, landed: true }), place.where).toBe(place.where);
      }
    }
  });

  it('never gives two places the same where', () => {
    const all = landable.flatMap((p) => placesOn(p.id).map((place) => place.where));
    expect(new Set(all).size).toBe(all.length);
  });

  it('knows the houses', () => {
    expect(placesOn('candy').find((place) => place.where === 'gingerbread').kind).toBe('house');
    expect(placesOn('ember').find((place) => place.where === 'lavahouse').kind).toBe('house');
    expect(placesOn('stripey').find((place) => place.where === 'zighut').kind).toBe('house');
    expect(placesOn('frosty').find((place) => place.where === 'icecave').kind).toBe('house');
    expect(placesOn('bluebell').find((place) => place.where === 'pod').kind).toBe('house');
    expect(placesOn('mrmonkey').find((place) => place.where === 'treehouse').kind).toBe('house');
  });

  it('has the tree family\'s house on Mr Monkey, with the forest\'s own tune outside and the cosy one in', () => {
    expect(placesOn('mrmonkey').map((place) => place.where)).toEqual(['mrmonkey', 'treehouse']);
    expect(planetOf('treehouse')).toBe('mrmonkey');
    expect(landedOn({ where: 'treehouse', landed: true })).toBe('treehouse');
    expect(tuneOf('mrmonkey')).toBe('mrmonkey');
    expect(tuneOf('treehouse')).toBe('indoors');
    expect(TUNES.mrmonkey).toBeDefined();
  });

  it('has the milkshake lake on Candy, out of doors with no ship', () => {
    expect(placesOn('candy').map((place) => place.where)).toEqual(['candy', 'gingerbread', 'milkshake']);
    expect(placesOn('candy').find((place) => place.where === 'milkshake').kind).toBe('site');
  });

  it('keeps places on a town map far enough apart to tap', () => {
    for (const p of landable) {
      const spots = placesOn(p.id).map((place) => place.spot);
      for (const [i, a] of spots.entries()) {
        for (const b of spots.slice(i + 1)) {
          expect(Math.hypot(a.x - b.x, a.y - b.y), p.id).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

describe('planetOf', () => {
  it('finds the planet any place is on', () => {
    expect(planetOf('candy')).toBe('candy');
    expect(planetOf('gingerbread')).toBe('candy');
    expect(planetOf('milkshake')).toBe('candy');
    expect(planetOf('lavahouse')).toBe('ember');
    expect(planetOf('zighut')).toBe('stripey');
    expect(planetOf('icecave')).toBe('frosty');
    expect(planetOf('pod')).toBe('bluebell');
    expect(planetOf('ship')).toBe(null);
  });
});

describe('arrivingBy', () => {
  it('rides up to a place out of doors and parks the bike', () => {
    expect(arrivingBy('candy')).toEqual({ fromShip: false, byBike: true });
    expect(arrivingBy('milkshake')).toEqual({ fromShip: false, byBike: true });
  });

  it('takes her straight in through a house\'s front door', () => {
    expect(arrivingBy('gingerbread')).toEqual({ fromDoor: true });
    expect(arrivingBy('zighut')).toEqual({ fromDoor: true });
    expect(arrivingBy('icecave')).toEqual({ fromDoor: true });
    expect(arrivingBy('pod')).toEqual({ fromDoor: true });
  });
});

describe('a reload at the milkshake lake', () => {
  it('puts her back by the lake', () => {
    expect(landedOn({ where: 'milkshake', landed: true })).toBe('milkshake');
  });
});

describe('the lava falls on Ember', () => {
  it('is out of doors on Ember, after the landing site and the lava house', () => {
    expect(placesOn('ember').map((place) => place.where)).toEqual(['ember', 'lavahouse', 'lavafalls']);
    expect(placesOn('ember').find((place) => place.where === 'lavafalls').kind).toBe('site');
    expect(planetOf('lavafalls')).toBe('ember');
  });

  it('is ridden to on the hoverbike', () => {
    expect(arrivingBy('lavafalls')).toEqual({ fromShip: false, byBike: true });
    expect(arrivingBy('lavahouse')).toEqual({ fromDoor: true });
  });

  it('puts her back by the falls on a reload', () => {
    expect(landedOn({ where: 'lavafalls', landed: true })).toBe('lavafalls');
  });
});

describe('the oasis on Stripey', () => {
  it('is out of doors on Stripey, after the landing site and Zig\'s hut', () => {
    expect(placesOn('stripey').map((place) => place.where)).toEqual(['stripey', 'zighut', 'oasis']);
    expect(placesOn('stripey').find((place) => place.where === 'oasis').kind).toBe('site');
    expect(planetOf('oasis')).toBe('stripey');
  });

  it('is ridden to on the hoverbike', () => {
    expect(arrivingBy('oasis')).toEqual({ fromShip: false, byBike: true });
  });

  it('puts her back by the pool on a reload', () => {
    expect(landedOn({ where: 'oasis', landed: true })).toBe('oasis');
  });
});

describe('the frozen lake on Frosty', () => {
  it('is out of doors on Frosty, after the landing site and the ice cave', () => {
    expect(placesOn('frosty').map((place) => place.where)).toEqual(['frosty', 'icecave', 'frozenlake']);
    expect(placesOn('frosty').find((place) => place.where === 'frozenlake').kind).toBe('site');
    expect(planetOf('frozenlake')).toBe('frosty');
  });

  it('is ridden to on the hoverbike', () => {
    expect(arrivingBy('frozenlake')).toEqual({ fromShip: false, byBike: true });
  });

  it('puts her back by the ice on a reload', () => {
    expect(landedOn({ where: 'frozenlake', landed: true })).toBe('frozenlake');
  });
});

describe('the mushroom grove on Bluebell', () => {
  it('is out of doors on Bluebell, after the landing site and the pod', () => {
    expect(placesOn('bluebell').map((place) => place.where)).toEqual(['bluebell', 'pod', 'mushroomgrove']);
    expect(placesOn('bluebell').find((place) => place.where === 'mushroomgrove').kind).toBe('site');
    expect(planetOf('mushroomgrove')).toBe('bluebell');
  });

  it('is ridden to on the hoverbike', () => {
    expect(arrivingBy('mushroomgrove')).toEqual({ fromShip: false, byBike: true });
  });

  it('puts her back among the mushrooms on a reload', () => {
    expect(landedOn({ where: 'mushroomgrove', landed: true })).toBe('mushroomgrove');
  });

  it('keeps the shy creature hiding only when she is close', () => {
    const at = find(defaultWorld(), 'shroom');
    expect(spooks({ x: at.x + 10, y: at.y + 4 }, at)).toBe(true);
    expect(spooks({ x: at.x + 90, y: at.y }, at)).toBe(false);
    expect(spooks({ x: at.x, y: at.y + 40 }, at)).toBe(false);
  });
});

describe('tuneOf', () => {
  it('gives every place on every planet a tune that exists', () => {
    for (const planet of PLANETS.filter((p) => p.landable)) {
      for (const place of placesOn(planet.id)) {
        expect(TUNES[tuneOf(place.where)], place.where).toBeDefined();
      }
    }
  });

  it('gives each planet its own tune, shared by its outdoor places', () => {
    expect(tuneOf('bluebell')).toBe('bluebell');
    expect(tuneOf('mushroomgrove')).toBe('bluebell');
    expect(tuneOf('lavafalls')).toBe('ember');
    expect(tuneOf('frozenlake')).toBe('frosty');
    expect(tuneOf('milkshake')).toBe('candy');
    expect(tuneOf('oasis')).toBe('stripey');
  });

  it('gives every house the cosy indoor tune', () => {
    for (const where of ['pod', 'lavahouse', 'icecave', 'gingerbread', 'zighut']) {
      expect(tuneOf(where)).toBe('indoors');
    }
  });
});
