(() => {
  "use strict";

  const ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzalC81iNvpLXuymmbMVI4pYB1FzuTXHgnvG4kegKspl7Mfd5j11BGW9W5Gv9xXsM1lMg/exec";
  const TOKEN =
    "hBsuU2uyQQ6WO3MbA30DtVLb2SJhuiblRqH77g1Ns9M";
  const VERSION = "v58.07";

  const ALLOWED_EVENTS = new Set([
    "app_open",
    "plan_load_ok",
    "plan_load_error",
    "route_open",
    "excel_export",
    "gps_ok",
    "gps_denied",
    "gps_error",
    "offline",
    "online",
    "pwa_installed"
  ]);

  const pendingScripts = new Set();
  let lastOpenSentAt = 0;
  let hiddenAt = 0;

  function randomHex(bytesLength) {
    const bytes = new Uint8Array(bytesLength);
    crypto.getRandomValues(bytes);
    return Array.from(
      bytes,
      value => value.toString(16).padStart(2, "0")
    ).join("");
  }

  function installationId() {
    const key = "europris_stats_installation_id_v2";

    try {
      let id = localStorage.getItem(key);

      if (/^[a-f0-9]{24}$/.test(String(id || ""))) {
        return id;
      }

      id = randomHex(12);
      localStorage.setItem(key, id);
      return id;
    } catch {
      /*
        Pamięciowy fallback działa w bieżącej sesji.
        Nie używamy IP, GPS, telefonu, konta ani danych sprzętowych.
      */
      if (!window.__EUROPRIS_STATS_SESSION_ID__) {
        window.__EUROPRIS_STATS_SESSION_ID__ = randomHex(12);
      }

      return window.__EUROPRIS_STATS_SESSION_ID__;
    }
  }

  function eventId() {
    return randomHex(16);
  }

  function detectOS() {
    const ua = navigator.userAgent || "";
    const platform =
      navigator.userAgentData?.platform ||
      navigator.platform ||
      "";

    if (/android/i.test(ua)) return "Android";

    if (
      /iPad|iPhone|iPod/.test(ua) ||
      (platform === "MacIntel" && navigator.maxTouchPoints > 1)
    ) {
      return "iOS";
    }

    if (/windows/i.test(platform) || /windows/i.test(ua)) return "Windows";
    if (/mac/i.test(platform)) return "macOS";
    if (/linux/i.test(platform)) return "Linux";
    return "Other";
  }

  function detectBrowser() {
    const ua = navigator.userAgent || "";

    if (/Edg\//.test(ua)) return "Edge";
    if (/OPR\//.test(ua)) return "Opera";
    if (/CriOS\//.test(ua)) return "Chrome iOS";
    if (/FxiOS\//.test(ua)) return "Firefox iOS";
    if (/Chrome\//.test(ua)) return "Chrome";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/Safari\//.test(ua)) return "Safari";
    return "Other";
  }

  function detectDevice() {
    const ua = navigator.userAgent || "";

    if (/iPad|Tablet/i.test(ua)) return "Tablet";
    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "Tablet";
    if (/Mobile|iPhone|iPod|Android/i.test(ua)) return "Phone";
    return "Desktop";
  }

  function detectDisplayMode() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      navigator.standalone === true
      ? "PWA"
      : "Browser";
  }

  function screenClass() {
    const width = Math.max(
      window.screen?.width || 0,
      window.innerWidth || 0
    );

    if (width < 430) return "<430";
    if (width < 600) return "430-599";
    if (width < 900) return "600-899";
    return "900+";
  }

  function language() {
    const htmlLanguage = String(document.documentElement.lang || "").toLowerCase();

    if (htmlLanguage.startsWith("no") || htmlLanguage.startsWith("nb")) return "no";
    if (htmlLanguage.startsWith("en")) return "en";
    if (htmlLanguage.startsWith("pl")) return "pl";
    return "other";
  }

  function jsonp(parameters) {
    return new Promise(resolve => {
      const callback =
        `__europrisStats_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement("script");
      let completed = false;

      const finish = result => {
        if (completed) return;
        completed = true;
        window.clearTimeout(timeout);
        delete window[callback];
        pendingScripts.delete(script);
        script.remove();
        resolve(result);
      };

      const timeout = window.setTimeout(
        () => finish({ ok: false, error: "timeout" }),
        15000
      );

      window[callback] = data => finish(data || { ok: false });

      const query = new URLSearchParams({
        ...parameters,
        callback,
        _: String(Date.now())
      });

      script.async = true;
      script.src = `${ENDPOINT}?${query}`;
      script.onerror = () => finish({ ok: false, error: "network" });

      pendingScripts.add(script);
      document.head.appendChild(script);
    });
  }

  function track(eventName, extra = {}) {
    if (!ALLOWED_EVENTS.has(eventName)) {
      return Promise.resolve(false);
    }

    const parameters = {
      action: "stats_event_v2",
      token: TOKEN,
      eventId: eventId(),
      installationId: installationId(),
      event: eventName,
      os: detectOS(),
      browser: detectBrowser(),
      device: detectDevice(),
      displayMode: detectDisplayMode(),
      screenClass: screenClass(),
      language: language(),
      version: VERSION,
      online: navigator.onLine ? "true" : "false",
      result: String(extra.result || "").slice(0, 40)
    };

    return jsonp(parameters).then(result => Boolean(result?.ok));
  }

  function sendAppOpen(reason) {
    const now = Date.now();

    if (now - lastOpenSentAt < 10000) return;

    lastOpenSentAt = now;
    void track("app_open", { result: reason });
  }

  window.EuroprisStats = Object.freeze({
    track,
    version: VERSION,
    installationId
  });

  if (document.readyState === "complete") {
    sendAppOpen("ready");
  } else {
    window.addEventListener(
      "load",
      () => sendAppOpen("load"),
      { once: true }
    );
  }

  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      sendAppOpen("pageshow");
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      return;
    }

    if (hiddenAt && Date.now() - hiddenAt >= 15000) {
      sendAppOpen("resume");
    }

    hiddenAt = 0;
  });

  window.addEventListener("online", () => {
    void track("online", { result: "online" });
  });

  window.addEventListener("offline", () => {
    void track("offline", { result: "offline" });
  });

  window.addEventListener("appinstalled", () => {
    void track("pwa_installed", { result: "installed" });
  });
})();
