const CACHE_NAME = "europris-app-v58-18-feedback-email-required";

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
  "./feedback-send-fix.js",
  "./app-version-feedback-fix.js",
  "./europris-app-icon-180-v28.png",
  "./europris-app-icon-192-v28.png",
  "./europris-app-icon-512-v28.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

async function withInjectedEnhancements(response) {
  if (!response || !response.ok) return response;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  let html = await response.text();
  const version = "58.18";

  html = html
    .replace(/header-controls\.css\?v=[^"']+/g, `header-controls.css?v=${version}`)
    .replace(/info-feedback\.css\?v=[^"']+/g, `info-feedback.css?v=${version}`)
    .replace(/header-controls\.js\?v=[^"']+/g, `header-controls.js?v=${version}`)
    .replace(/info-feedback\.js\?v=[^"']+/g, `info-feedback.js?v=${version}`)
    .replace(/feedback-send-fix\.js\?v=[^"']+/g, `feedback-send-fix.js?v=${version}`)
    .replace(/export-feedback\.js\?v=[^"']+/g, `export-feedback.js?v=${version}`)
    .replace(/excel-column-widths\.js\?v=[^"']+/g, `excel-column-widths.js?v=${version}`)
    .replace(/app-version-feedback-fix\.js\?v=[^"']+/g, `app-version-feedback-fix.js?v=${version}`);

  const headAssets = [];
  const bodyAssets = [];

  if (!html.includes('href="header-controls.css')) headAssets.push(`  <link rel="stylesheet" href="header-controls.css?v=${version}">\n`);
  if (!html.includes('href="info-feedback.css')) headAssets.push(`  <link rel="stylesheet" href="info-feedback.css?v=${version}">\n`);
  if (!html.includes('src="header-controls.js')) bodyAssets.push(`  <script src="header-controls.js?v=${version}"></script>\n`);
  if (!html.includes('src="info-feedback.js')) bodyAssets.push(`  <script src="info-feedback.js?v=${version}"></script>\n`);
  if (!html.includes('src="feedback-send-fix.js')) bodyAssets.push(`  <script src="feedback-send-fix.js?v=${version}"></script>\n`);
  if (!html.includes('src="export-feedback.js')) bodyAssets.push(`  <script src="export-feedback.js?v=${version}"></script>\n`);
  if (!html.includes('src="excel-column-widths.js')) bodyAssets.push(`  <script src="excel-column-widths.js?v=${version}"></script>\n`);
  if (!html.includes('src="app-version-feedback-fix.js')) bodyAssets.push(`  <script src="app-version-feedback-fix.js?v=${version}"></script>\n`);

  if (headAssets.length) {
    const closingHeadIndex = html.toLowerCase().lastIndexOf("</head>");
    if (closingHeadIndex >= 0) html = html.slice(0, closingHeadIndex) + headAssets.join("") + html.slice(closingHeadIndex);
  }

  if (bodyAssets.length) {
    const closingBodyIndex = html.toLowerCase().lastIndexOf("</body>");
    if (closingBodyIndex >= 0) html = html.slice(0, closingBodyIndex) + bodyAssets.join("") + html.slice(closingBodyIndex);
  }

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.delete("content-length");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate";
  const isCoreFile = requestUrl.pathname.endsWith("/index.html") || requestUrl.pathname.endsWith("/manifest.webmanifest") || requestUrl.pathname.endsWith("/stores.json");

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
        return new Response("", { status: 504, statusText: "Gateway Timeout" });
      })
  );
});