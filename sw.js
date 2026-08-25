const CACHE_NAME = "europris-app-v58-27-mail-tile-colors";

const STATIC_FILES = [
  "./", "./index.html", "./xlsx.full.min.js", "./rumcajs-logo.png", "./manifest.webmanifest", "./stores.json",
  "./stats.css", "./stats-panel.js", "./analytics.js", "./weather-humor.js", "./weather-humor.css", "./all-drivers.js", "./all-drivers.css",
  "./export-feedback.js", "./excel-column-widths.js", "./header-controls.css", "./pallet-history-fix.js", "./header-controls.js", "./history-edit.js",
  "./info-feedback.css", "./info-feedback.js", "./startup-info.css", "./startup-info.js", "./feedback-send-fix.js", "./app-version-feedback-fix.js",
  "./admin-mail.css", "./admin-mail.js",
  "./europris-app-icon-180-v28.png", "./europris-app-icon-192-v28.png", "./europris-app-icon-512-v28.png"
];

self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))); self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))), self.clients.claim()])); });

function injectFredrikProfile(html) {
  if (!html.includes('"2345": {')) {
    const oldProfile = `    "5678": {\n      id: "lukasz",\n      role: "driver",\n      name: "Łukasz",\n      phone: "",\n      aliases: ["Bartek"]\n    }\n  };`;
    const newProfile = `    "5678": {\n      id: "lukasz",\n      role: "driver",\n      name: "Łukasz",\n      phone: "",\n      aliases: ["Bartek"]\n    },\n    "2345": {\n      id: "fredrik",\n      role: "driver",\n      name: "Fredrik",\n      phone: "",\n      aliases: ["Fredrik"]\n    }\n  };`;
    html = html.replace(oldProfile, newProfile);
  }

  if (!html.includes('fredrik: "a7f2c91e54d84b6fa1d3902c7e58b413"')) {
    const oldBackup = `    kamil: "e5da7193b7c21bfda17db78b29c38971",\n    lukasz: "8bbf70654bf0524509d1ed85e4533aba"\n  });`;
    const newBackup = `    kamil: "e5da7193b7c21bfda17db78b29c38971",\n    lukasz: "8bbf70654bf0524509d1ed85e4533aba",\n    fredrik: "a7f2c91e54d84b6fa1d3902c7e58b413"\n  });`;
    html = html.replace(oldBackup, newBackup);
  }

  return html;
}

async function withInjectedEnhancements(response) {
  if (!response || !response.ok) return response;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = injectFredrikProfile(await response.text());
  const version = "58.27";
  html = html
    .replace(/header-controls\.css\?v=[^"']+/g, `header-controls.css?v=${version}`)
    .replace(/info-feedback\.css\?v=[^"']+/g, `info-feedback.css?v=${version}`)
    .replace(/startup-info\.css\?v=[^"']+/g, `startup-info.css?v=${version}`)
    .replace(/admin-mail\.css\?v=[^"']+/g, `admin-mail.css?v=${version}`)
    .replace(/pallet-history-fix\.js\?v=[^"']+/g, `pallet-history-fix.js?v=${version}`)
    .replace(/header-controls\.js\?v=[^"']+/g, `header-controls.js?v=${version}`)
    .replace(/info-feedback\.js\?v=[^"']+/g, `info-feedback.js?v=${version}`)
    .replace(/startup-info\.js\?v=[^"']+/g, `startup-info.js?v=${version}`)
    .replace(/admin-mail\.js\?v=[^"']+/g, `admin-mail.js?v=${version}`)
    .replace(/feedback-send-fix\.js\?v=[^"']+/g, `feedback-send-fix.js?v=${version}`)
    .replace(/export-feedback\.js\?v=[^"']+/g, `export-feedback.js?v=${version}`)
    .replace(/excel-column-widths\.js\?v=[^"']+/g, `excel-column-widths.js?v=${version}`)
    .replace(/app-version-feedback-fix\.js\?v=[^"']+/g, `app-version-feedback-fix.js?v=${version}`);
  const headAssets = [], bodyAssets = [];
  if (!html.includes('href="header-controls.css')) headAssets.push(`  <link rel="stylesheet" href="header-controls.css?v=${version}">\n`);
  if (!html.includes('href="info-feedback.css')) headAssets.push(`  <link rel="stylesheet" href="info-feedback.css?v=${version}">\n`);
  if (!html.includes('href="startup-info.css')) headAssets.push(`  <link rel="stylesheet" href="startup-info.css?v=${version}">\n`);
  if (!html.includes('href="admin-mail.css')) headAssets.push(`  <link rel="stylesheet" href="admin-mail.css?v=${version}">\n`);
  if (!html.includes('src="pallet-history-fix.js')) bodyAssets.push(`  <script src="pallet-history-fix.js?v=${version}"></script>\n`);
  if (!html.includes('src="header-controls.js')) bodyAssets.push(`  <script src="header-controls.js?v=${version}"></script>\n`);
  if (!html.includes('src="info-feedback.js')) bodyAssets.push(`  <script src="info-feedback.js?v=${version}"></script>\n`);
  if (!html.includes('src="startup-info.js')) bodyAssets.push(`  <script src="startup-info.js?v=${version}"></script>\n`);
  if (!html.includes('src="admin-mail.js')) bodyAssets.push(`  <script src="admin-mail.js?v=${version}"></script>\n`);
  if (!html.includes('src="feedback-send-fix.js')) bodyAssets.push(`  <script src="feedback-send-fix.js?v=${version}"></script>\n`);
  if (!html.includes('src="export-feedback.js')) bodyAssets.push(`  <script src="export-feedback.js?v=${version}"></script>\n`);
  if (!html.includes('src="excel-column-widths.js')) bodyAssets.push(`  <script src="excel-column-widths.js?v=${version}"></script>\n`);
  if (!html.includes('src="app-version-feedback-fix.js')) bodyAssets.push(`  <script src="app-version-feedback-fix.js?v=${version}"></script>\n`);
  if (headAssets.length) { const i = html.toLowerCase().lastIndexOf("</head>"); if (i >= 0) html = html.slice(0,i)+headAssets.join("")+html.slice(i); }
  if (bodyAssets.length) { const i = html.toLowerCase().lastIndexOf("</body>"); if (i >= 0) html = html.slice(0,i)+bodyAssets.join("")+html.slice(i); }
  const headers = new Headers(response.headers); headers.set("content-type","text/html; charset=UTF-8"); headers.delete("content-length");
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

async function withoutObsoleteOtta(response) {
  if (!response || !response.ok) return response;
  try {
    const data = await response.clone().json();
    if (!Array.isArray(data)) return response;
    const cleaned = data.filter(store => !(
      Number(store?.number) === 210 &&
      String(store?.name || "").toLowerCase().includes("otta")
    ));
    const headers = new Headers(response.headers);
    headers.set("content-type", "application/json; charset=UTF-8");
    headers.delete("content-length");
    return new Response(JSON.stringify(cleaned, null, 2), {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (_) {
    return response;
  }
}

self.addEventListener("fetch", event => {
  const request=event.request; if(request.method!=="GET")return;
  const requestUrl=new URL(request.url); if(requestUrl.origin!==self.location.origin)return;
  const isNavigation=request.mode==="navigate";
  const isStoresFile=requestUrl.pathname.endsWith("/stores.json");
  const isCoreFile=requestUrl.pathname.endsWith("/index.html")||requestUrl.pathname.endsWith("/manifest.webmanifest")||isStoresFile;
  if(isNavigation||isCoreFile){event.respondWith(fetch(request,{cache:"no-store"}).then(async response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}if(isNavigation)return withInjectedEnhancements(response);if(isStoresFile)return withoutObsoleteOtta(response);return response;}).catch(async()=>{const cached=await caches.match(request);if(cached){if(isNavigation)return withInjectedEnhancements(cached);if(isStoresFile)return withoutObsoleteOtta(cached);return cached;}const fallback=await caches.match("./index.html");if(fallback)return isNavigation?withInjectedEnhancements(fallback):fallback;return new Response("Offline",{status:503,statusText:"Service Unavailable",headers:{"Content-Type":"text/plain; charset=UTF-8"}});}));return;}
  event.respondWith(fetch(request).then(response=>{if(response&&response.ok&&response.type==="basic"){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;}).catch(async()=>{const cached=await caches.match(request);if(cached)return cached;return new Response("",{status:504,statusText:"Gateway Timeout"});}));
});