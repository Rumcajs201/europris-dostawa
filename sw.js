const CACHE_NAME = "europris-app-v58-13-feedback";

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
  "./export-feedback.js",
  "./excel-column-widths.js",
  "./header-controls.css",
  "./header-controls.js",
  "./history-edit.js",
  "./info-feedback.css",
  "./info-feedback.js",
  "./app-version-feedback-fix.js",
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

async function withInjectedEnhancements(response) {
  if (!response || !response.ok) return response;

  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const html = await response.text();
  const headAssets = [];
  const bodyAssets = [];

  if (!html.includes('href="header-controls.css')) {
    headAssets.push('  <link rel="stylesheet" href="header-controls.css?v=58.13">\n');
  }

  if (!html.includes('href="info-feedback.css')) {
    headAssets.push('  <link rel="stylesheet" href="info-feedback.css?v=58.13">\n');
  }

  if (!html.includes('src="header-controls.js')) {
    bodyAssets.push('  <script src="header-controls.js?v=58.13"></script>\n');
  }

  if (!html.includes('src="info-feedback.js')) {
    bodyAssets.push('  <script src="info-feedback.js?v=58.13"></script>\n');
  }

  if (!html.includes('src="export-feedback.js')) {
    bodyAssets.push('  <script src="export-feedback.js?v=58.13"></script>\n');
  }

  if (!html.includes('src="excel-column-widths.js')) {
    bodyAssets.push('  <script src="excel-column-widths.js?v=58.13"></script>\n');
  }

  if (!html.includes('src="app-version-feedback-fix.js')) {
    bodyAssets.push('  <script src="app-version-feedback-fix.js?v=58.13"></script>\n');
  }

  let updated = html;

  if (headAssets.length) {
    const closingHeadIndex = updated.toLowerCase().lastIndexOf("</head>");
    if (closingHeadIndex >= 0) {
      updated = updated.slice(0, closingHeadIndex) + headAssets.join("") + updated.slice(closingHeadIndex);
    }
  }

  if (bodyAssets.length) {
    const closingBodyIndex = updated.toLowerCase().lastIndexOf("</body>");
    if (closingBodyIndex >= 0) {
      updated = updated.slice(0, closingBodyIndex) + bodyAssets.join("") + updated.slice(closingBodyIndex);
    }
  }

  if (updated === html) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.delete("content-length");

  return new Response(updated, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

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
        .then(async response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return isNavigation ? withInjectedEnhancements(response) : response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return isNavigation ? withInjectedEnhancements(cached) : cached;

          const fallback = await caches.match("./index.html");
          if (fallback) return isNavigation ? withInjectedEnhancements(fallback) : fallback;

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
