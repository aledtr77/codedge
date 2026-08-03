// The route map is the one table the whole site agrees on: the language switch
// reads it, the hreflang tags are generated from it, the sitemap and the 301s
// in _redirects come out of it, and i18n-drift walks it to decide what to
// compare. A wrong entry here is not a broken page — it is a page that quietly
// points somewhere else, which is exactly the kind of thing nobody notices.

import { describe, expect, it } from 'vitest';
import {
  alternatesOf,
  counterpartOf,
  IT_PREFIX,
  langOf,
  LEGACY_REDIRECTS,
  normalizeRoute,
  ROUTE_MAP,
  routeFromSourceDir,
  routePairs,
  sourceDirForRoute,
} from '@/i18n/routes.mjs';

const allRoutes = [...Object.keys(ROUTE_MAP), ...Object.values(ROUTE_MAP)];

describe('normalizeRoute', () => {
  it('settles every spelling of the same page on one form', () => {
    for (const input of ['/resources', '/resources/', '/resources/index.html', '/resources//']) {
      expect(normalizeRoute(input)).toBe('/resources/');
    }
  });

  it('drops the query string and the fragment', () => {
    expect(normalizeRoute('/resources/?utm_source=x')).toBe('/resources/');
    expect(normalizeRoute('/resources/#top')).toBe('/resources/');
    expect(normalizeRoute('/resources/index.html#top')).toBe('/resources/');
  });

  it('turns nothing at all into the home page', () => {
    expect(normalizeRoute('')).toBe('/');
    expect(normalizeRoute('/')).toBe('/');
    expect(normalizeRoute(null)).toBe('/');
    expect(normalizeRoute(undefined)).toBe('/');
  });

  it('is idempotent', () => {
    for (const route of allRoutes) {
      expect(normalizeRoute(normalizeRoute(route))).toBe(normalizeRoute(route));
    }
  });
});

describe('langOf', () => {
  it('reads the prefix, not the first two letters', () => {
    expect(langOf('/it/')).toBe('it');
    expect(langOf('/it/risorse/')).toBe('it');
    expect(langOf('/')).toBe('en');
    expect(langOf('/resources/')).toBe('en');
  });

  // '/italian-basics/' starts with '/it' and is an English route. A prefix
  // test written without the trailing slash would send it to /it/.
  it('does not mistake an English route that happens to start with "it"', () => {
    expect(langOf('/italian-basics/')).toBe('en');
    expect(langOf('/items/')).toBe('en');
  });

  it('agrees with the map on every route in it', () => {
    for (const itRoute of Object.keys(ROUTE_MAP)) expect(langOf(itRoute)).toBe('it');
    for (const enRoute of Object.values(ROUTE_MAP)) expect(langOf(enRoute)).toBe('en');
  });
});

describe('ROUTE_MAP', () => {
  it('pairs each Italian page with one English page and no other', () => {
    const enRoutes = Object.values(ROUTE_MAP);
    expect(new Set(enRoutes).size).toBe(enRoutes.length);
  });

  it('has every key under /it/ and every value at the root', () => {
    for (const [itRoute, enRoute] of routePairs()) {
      expect(itRoute.startsWith(`${IT_PREFIX}/`)).toBe(true);
      expect(enRoute.startsWith(IT_PREFIX + '/')).toBe(false);
      expect(itRoute).toBe(normalizeRoute(itRoute));
      expect(enRoute).toBe(normalizeRoute(enRoute));
    }
  });
});

describe('counterpartOf', () => {
  it('goes both ways for every pair', () => {
    for (const [itRoute, enRoute] of routePairs()) {
      expect(counterpartOf(itRoute)).toBe(enRoute);
      expect(counterpartOf(enRoute)).toBe(itRoute);
    }
  });

  it('accepts an un-normalized path', () => {
    expect(counterpartOf('/it/risorse')).toBe('/resources/');
    expect(counterpartOf('/resources/index.html')).toBe('/it/risorse/');
  });

  it('returns null for a page that has no twin', () => {
    expect(counterpartOf('/nothing-here/')).toBeNull();
    expect(counterpartOf('/it/niente-qui/')).toBeNull();
  });
});

describe('alternatesOf', () => {
  it('lists both languages for a translated page', () => {
    expect(alternatesOf('/resources/')).toEqual({ en: '/resources/', it: '/it/risorse/' });
    expect(alternatesOf('/it/risorse/')).toEqual({ it: '/it/risorse/', en: '/resources/' });
  });

  it('lists only the page itself when there is no twin', () => {
    expect(alternatesOf('/nothing-here/')).toEqual({ en: '/nothing-here/' });
  });
});

describe('sourceDirForRoute and routeFromSourceDir', () => {
  it('maps the two home pages onto their language directory', () => {
    expect(sourceDirForRoute('/')).toBe('en');
    expect(sourceDirForRoute('/it/')).toBe('it');
    expect(routeFromSourceDir('en')).toBe('/');
    expect(routeFromSourceDir('it')).toBe('/it/');
  });

  it('round-trips every route in the map', () => {
    for (const route of allRoutes) {
      expect(routeFromSourceDir(sourceDirForRoute(route))).toBe(route);
    }
  });

  it('never produces a directory with a leading or trailing slash', () => {
    for (const route of allRoutes) {
      const dir = sourceDirForRoute(route);
      expect(dir.startsWith('/')).toBe(false);
      expect(dir.endsWith('/')).toBe(false);
    }
  });

  it('accepts a path with Windows separators', () => {
    expect(routeFromSourceDir('en\\resources')).toBe('/resources/');
    expect(routeFromSourceDir('it\\risorse\\glossario-css')).toBe('/it/risorse/glossario-css/');
  });

  it('returns null for a directory outside a language folder', () => {
    expect(routeFromSourceDir('assets/images')).toBeNull();
    expect(routeFromSourceDir('')).toBeNull();
  });
});

describe('LEGACY_REDIRECTS', () => {
  // A 301 is only useful if it lands somewhere. One that points at a route the
  // build no longer emits is a 404 that used to be a page, which is the worst
  // possible outcome for the links already out there.
  it('sends every old URL to a page that still exists', () => {
    const known = new Set(allRoutes);
    for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
      expect(known.has(to), `${from} → ${to} is not a route in ROUTE_MAP`).toBe(true);
    }
  });

  it('never redirects a URL that is itself a live route', () => {
    const known = new Set(allRoutes);
    for (const from of Object.keys(LEGACY_REDIRECTS)) {
      expect(known.has(from), `${from} is redirected but is also a live route`).toBe(false);
    }
  });

  it('does not chain one redirect into another', () => {
    for (const to of Object.values(LEGACY_REDIRECTS)) {
      expect(Object.keys(LEGACY_REDIRECTS)).not.toContain(to);
    }
  });
});
