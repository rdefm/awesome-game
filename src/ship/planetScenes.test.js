import { describe, expect, it } from 'vitest';
import { PLANETS } from './art/props.js';
import { H, W } from './layout.js';
import { arrivingBy, landedOn, placesOn, planetOf } from './planetScenes.js';

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
