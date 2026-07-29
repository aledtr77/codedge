const SW_VERSION = "v9";
const STATIC_CACHE = `codedge-static-${SW_VERSION}`;
const RUNTIME_CACHE = `codedge-runtime-${SW_VERSION}`;

const PRECACHE_URLS = [
  "/",
  // Chi non ha ancora scelto una lingua viene mandato qui appena apre "/", quindi
  // offline la home italiana da sola non basta più: senza questa, il redirect
  // atterrerebbe su una pagina non in cache.
  "/en/",
  "/site.webmanifest",
  "/favicon.ico",
  "/icons/android-chrome-192.png",
  "/icons/android-chrome-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-16.png",
  "/icons/favicon-32.png",
  "/icons/favicon-mask.svg",
  "/og/opengraph.jpg",
  "/og/opengraph-1200x630.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) || (await caches.match(request));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(new Request(request, { cache: "no-store" }))
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise || Response.error();
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!isSameOrigin(request)) return;

  const url = new URL(request.url);
  const isAsset = url.pathname.includes("/assets/");
  const destination = request.destination;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Se è un asset compilato da Vite (JS, CSS o Font in /assets/), usa Cache-First
  if (isAsset && (destination === "script" || destination === "style" || destination === "font")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (
    destination === "script" ||
    destination === "style" ||
    destination === "manifest"
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (destination === "image" || destination === "font") {
    event.respondWith(staleWhileRevalidate(request));
  }
});
