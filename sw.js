const CACHE_NAME = "europris-app-v57-21-stats-backup-fix";

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
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === "navigate";
  const isCoreFile =
    requestUrl.pathname.endsWith("/index.html") ||
    requestUrl.pathname.endsWith("/manifest.webmanifest") ||
    requestUrl.pathname.endsWith("/stores.json");

  if (isNavigation || isCoreFile) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(cached =>
            cached || caches.match("./index.html")
          )
        )
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
