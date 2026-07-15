const CACHE_NAME = "europris-app-v27-europris-icons-voice-off";

const STATIC_FILES = [
  "./",
  "./index.html",
  "./xlsx.full.min.js",
  "./rumcajs-logo.png",
  "./manifest-v27.webmanifest",
  "./stores.json",
  "./europris-app-icon-180-v27.png",
  "./europris-app-icon-192-v27.png",
  "./europris-app-icon-512-v27.png"
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
