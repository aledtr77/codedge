import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const origin = 'https://codedge.test';
const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const urlOf = (request) => typeof request === 'string' ? new URL(request, origin).href : request.url;

function worker(fetchResponse = async () => new Response('fresh')) {
  const stores = new Map();
  const listeners = {};
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async match(request) { return entries.get(urlOf(request))?.clone(); },
        async put(request, response) { entries.set(urlOf(request), response.clone()); },
        async delete(request) { return entries.delete(urlOf(request)); },
        async keys() { return [...entries.keys()].map((url) => new Request(url)); },
        async addAll(urls) { for (const url of urls) entries.set(urlOf(url), new Response(url)); },
      };
    },
    async match(request) {
      for (const name of stores.keys()) {
        const cached = await (await caches.open(name)).match(request);
        if (cached) return cached;
      }
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  runInNewContext(source, {
    self: { location: { origin }, addEventListener: (name, listener) => { listeners[name] = listener; }, clients: { claim: async () => {} }, skipWaiting: async () => {} },
    caches, fetch: fetchResponse, Request, Response, Headers, URL, AbortController, setTimeout, clearTimeout,
  });
  async function dispatch(name, request) {
    const pending = [];
    let response;
    listeners[name]({ request, waitUntil: (promise) => pending.push(promise), respondWith: (promise) => { response = promise; } });
    const result = await response;
    await Promise.all(pending);
    return result;
  }
  const runtime = () => caches.open('codedge-runtime-__CODEDGE_BUILD_VERSION__');
  function request(path, destination = 'image') {
    const req = new Request(new URL(path, origin));
    Object.defineProperties(req, { destination: { value: destination }, ...(destination === 'document' ? { mode: { value: 'navigate' } } : {}) });
    return req;
  }
  return { caches, runtime, dispatch, request };
}

const offline = async () => { throw new TypeError('Network unavailable'); };

describe('service worker network and storage failures', () => {
  it('returns the updated public image on the first request', async () => {
    const w = worker();
    await (await w.runtime()).put('/image.webp', new Response('stale'));
    expect(await (await w.dispatch('fetch', w.request('/image.webp'))).text()).toBe('fresh');
    expect(await (await (await w.runtime()).match('/image.webp')).text()).toBe('fresh');
  });

  it('serves fingerprinted bundles from cache', async () => {
    const w = worker(offline);
    await (await w.runtime()).put('/assets/main-12345678.js', new Response('bundle'));
    expect(await (await w.dispatch('fetch', w.request('/assets/main-12345678.js', 'script'))).text()).toBe('bundle');
  });

  it('serves a visited page when offline', async () => {
    const w = worker(offline);
    await (await w.runtime()).put('/it/tutorial/', new Response('visited'));
    expect(await (await w.dispatch('fetch', w.request('/it/tutorial/', 'document'))).text()).toBe('visited');
  });

  it('falls back to a cached page when the network stalls', async () => {
    vi.useFakeTimers();
    try {
      const w = worker((request) => new Promise((resolve, reject) => {
        request.signal.addEventListener('abort', () => reject(new Error('Timed out')), { once: true });
      }));
      await (await w.runtime()).put('/tutorials/', new Response('visited'));
      const response = w.dispatch('fetch', w.request('/tutorials/', 'document'));
      await vi.advanceTimersByTimeAsync(5000);
      expect(await (await response).text()).toBe('visited');
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses a cached page when the server returns a temporary error', async () => {
    const w = worker(async () => new Response('unavailable', { status: 503 }));
    await (await w.runtime()).put('/tutorials/', new Response('visited'));
    expect(await (await w.dispatch('fetch', w.request('/tutorials/', 'document'))).text()).toBe('visited');
  });

  it('keeps a real 404 instead of replacing it with old content', async () => {
    const w = worker(async () => new Response('not found', { status: 404 }));
    await (await w.runtime()).put('/removed/', new Response('old page'));
    expect((await w.dispatch('fetch', w.request('/removed/', 'document'))).status).toBe(404);
  });

  it('shows the offline page with a 503 for an unvisited document', async () => {
    const w = worker(offline);
    await (await w.runtime()).put('/offline.html', new Response('offline help', { headers: { 'Content-Security-Policy': "default-src 'self'", 'X-Frame-Options': 'DENY' } }));
    const response = await w.dispatch('fetch', w.request('/unvisited/', 'document'));
    expect(response.status).toBe(503);
    expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(await response.text()).toBe('offline help');
  });

  it('returns a valid error response for an uncached offline image', async () => {
    const w = worker(offline);
    expect((await w.dispatch('fetch', w.request('/missing.webp'))).type).toBe('error');
  });

  it('still returns network content when cache storage is unavailable', async () => {
    const w = worker();
    w.caches.open = async () => { throw new Error('Storage denied'); };
    expect(await (await w.dispatch('fetch', w.request('/image.webp'))).text()).toBe('fresh');
  });

  it('limits runtime entries even during concurrent downloads', async () => {
    const w = worker();
    await Promise.all(Array.from({ length: 180 }, (_, index) => w.dispatch('fetch', w.request(`/images/${index}.webp`))));
    const keys = await (await w.runtime()).keys();
    expect(keys).toHaveLength(160);
    expect(keys[0].url).toBe(`${origin}/images/20.webp`);
  });

  it.each(['private', 'no-store'])('does not cache a %s response', async (policy) => {
    const w = worker(async () => new Response('fresh', { headers: { 'cache-control': policy } }));
    await w.dispatch('fetch', w.request('/image.webp'));
    expect(await (await w.runtime()).keys()).toHaveLength(0);
  });

  it('does not cache resources larger than the configured size limit', async () => {
    const w = worker(async () => new Response('large', { headers: { 'content-length': String(9 * 1024 * 1024) } }));
    await w.dispatch('fetch', w.request('/large.webp'));
    expect(await (await w.runtime()).keys()).toHaveLength(0);
  });

  it('only deletes this site’s old caches during activation', async () => {
    const w = worker();
    await w.caches.open('codedge-static-v9');
    await w.caches.open('another-app');
    await w.runtime();
    await w.dispatch('activate');
    expect(await w.caches.keys()).toEqual(['another-app', 'codedge-runtime-__CODEDGE_BUILD_VERSION__']);
  });

  it('leaves API, cross-origin and non-GET requests to the browser', async () => {
    const w = worker();
    expect(await w.dispatch('fetch', w.request('/api/data'))).toBeUndefined();
    expect(await w.dispatch('fetch', w.request('https://other.test/image.webp'))).toBeUndefined();
    expect(await w.dispatch('fetch', new Request(`${origin}/contact`, { method: 'POST' }))).toBeUndefined();
  });
});
