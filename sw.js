const CACHE_NAME = "europris-app-v58-09-emergency-restore";

const STATIC_FILES = [
  "./",
  "./index.html",
  "./xlsx.full.min.js",
  "./rumcajs-logo.png",
  "./manifest.webmanifest",
  "./stores.json",
  "./stats.css",
  "./stats-panel.js",
  "./analytics.js",
  "./weather-humor.js",
  "./weather-humor.css",
  "./all-drivers.js",
  "./all-drivers.css",
  "./europris-app-icon-180-v28.png",
  "./europris-app-icon-192-v28.png",
  "./europris-app-icon-512-v28.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const isNavigation = request.mode === "navigate";
  const isCoreFile =
    requestUrl.pathname.endsWith("/index.html") ||
    requestUrl.pathname.endsWith("/manifest.webmanifest") ||
    requestUrl.pathname.endsWith("/stores.json");

  if (isNavigation || isCoreFile) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;

          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain; charset=UTF-8" }
          });
        })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        return new Response("", {
          status: 504,
          statusText: "Gateway Timeout"
        });
      })
  );
});
