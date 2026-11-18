const SW_VERSION = "__CODEDGE_BUILD_VERSION__";
const STATIC_CACHE = `codedge-static-${SW_VERSION}`;
const RUNTIME_CACHE = `codedge-runtime-${SW_VERSION}`;
const MAX_RUNTIME_ENTRIES = 160;
const MAX_RESOURCE_BYTES = 8 * 1024 * 1024;
const NETWORK_TIMEOUT_MS = 5000;

const PRECACHE_URLS = [
  "/",
  "/it/",
  "/offline.html",
  "/site.webmanifest",
  "/site.it.webmanifest",
  "/favicon.ico",
  "/icons/android-chrome-192.png",
  "/icons/android-chrome-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-16.png",
  "/icons/favicon-32.png",
  "/icons/favicon-mask.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("codedge-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function cachedResponse(request) {
  try {
    return await caches.match(request);
  } catch {
    return undefined;
  }
}

// Serialize writes so concurrent image/font downloads cannot race eviction.
// Storage failure must never prevent an otherwise successful network response.
let pendingWrite = Promise.resolve();
function remember(event, request, response) {
  const size = Number(response.headers.get("content-length"));
  const policy = response.headers.get("cache-control") || "";
  if (!response.ok || response.redirected || size > MAX_RESOURCE_BYTES || /no-store|private/i.test(policy)) return;
  const copy = response.clone();
  pendingWrite = pendingWrite.then(async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.delete(request);
    await cache.put(request, copy);
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_RUNTIME_ENTRIES)).map((key) => cache.delete(key)));
  }).catch(() => {});
  event.waitUntil(pendingWrite);
}

async function networkFirst(event) {
  const { request } = event;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    const response = await fetch(new Request(request, { cache: "no-cache", signal: controller.signal }));
    if (response.status >= 500) {
      const cached = await cachedResponse(request);
      if (cached) return cached;
    }
    remember(event, request, response);
    return response;
  } catch {
    const cached = await cachedResponse(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const offline = await cachedResponse("/offline.html");
      if (offline) {
        const headers = new Headers(offline.headers);
        headers.delete("content-encoding");
        headers.delete("content-length");
        headers.set("Content-Type", "text/html; charset=utf-8");
        headers.set("Cache-Control", "no-store");
        return new Response(await offline.text(), { status: 503, headers });
      }
    }
    return Response.error();
  } finally {
    clearTimeout(timeout);
  }
}

async function cacheFirst(event) {
  const cached = await cachedResponse(event.request);
  return cached || networkFirst(event);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const destination = request.destination;
  // Vite fingerprints compiled files. Public files keep stable names and must
  // be revalidated to show edits on the first visit after a release.
  if (url.pathname.startsWith("/assets/") && ["script", "style", "font", "image"].includes(destination)) {
    event.respondWith(cacheFirst(event));
  } else if (request.mode === "navigate" || ["script", "style", "manifest", "image", "font"].includes(destination)) {
    event.respondWith(networkFirst(event));
  }
});
