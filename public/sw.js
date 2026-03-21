const SW_VERSION = "v1";
const STATIC_CACHE = `codedge-static-${SW_VERSION}`;
const RUNTIME_CACHE = `codedge-runtime-${SW_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/site.webmanifest",
  "/favicon.ico",
  "/icons/android-chrome-192.png",
  "/icons/android-chrome-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-16.png",
  "/icons/favicon-32.png",
  "/icons/favicon-mask.svg",
  "/partials/nav.html",
  "/partials/footer.html",
  "/og/opengraph.jpg"
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
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await caches.match(request));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!isSameOrigin(request)) return;

  const destination = request.destination;
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    destination === "script" ||
    destination === "style" ||
    destination === "image" ||
    destination === "font" ||
    destination === "manifest"
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
