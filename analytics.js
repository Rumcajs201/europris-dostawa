(() => {
  "use strict";

  const EUROPRIS_ANALYTICS_VERSION = "v57.7";
  const EUROPRIS_ANALYTICS_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzalC81iNvpLXuymmbMVI4pYB1FzuTXHgnvG4kegKspl7Mfd5j11BGW9W5Gv9xXsM1lMg/exec";
  const EUROPRIS_ANALYTICS_TOKEN =
    "hBsuU2uyQQ6WO3MbA30DtVLb2SJhuiblRqH77g1Ns9M";

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

  function simpleHash(text) {
    let h1 = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h1 ^= text.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    return (h1 >>> 0).toString(36);
  }

  function dayKey() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function installationId() {
    // Losowy identyfikator instalacji. Nie korzysta z numeru telefonu,
    // konta, GPS, IP, IMEI ani innych identyfikatorów sprzętowych.
    const key = "europris_stats_installation_id_v1";
    try {
      let id = localStorage.getItem(key);
      if (id && /^[a-f0-9]{24}$/.test(id)) return id;

      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);
      id = Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(key, id);
      return id;
    } catch {
      // Tryb awaryjny dla przeglądarek blokujących localStorage.
      const bytes = new Uint32Array(3);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, value => value.toString(16).padStart(8, "0")).join("");
    }
  }

  function dailyAnonymousId() {
    // Osobny identyfikator do liczenia unikalnych urządzeń w konkretnym dniu.
    return simpleHash(`${dayKey()}|${installationId()}`);
  }

  function detectOS() {
    const ua = navigator.userAgent || "";
    const platform = navigator.userAgentData?.platform || navigator.platform || "";

    if (/android/i.test(ua)) return "Android";
    if (/iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iOS";
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
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
    return "Other";
  }

  function detectDeviceType() {
    const shortest = Math.min(screen.width, screen.height);
    const touch = navigator.maxTouchPoints > 0;
    if (touch && shortest < 600) return "Phone";
    if (touch && shortest < 1000) return "Tablet";
    return "Desktop";
  }

  function detectDisplayMode() {
    if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) {
      return "PWA";
    }
    return "Browser";
  }

  function screenClass() {
    const width = Math.min(screen.width, screen.height);
    if (width < 360) return "<360";
    if (width < 430) return "360-429";
    if (width < 600) return "430-599";
    if (width < 900) return "600-899";
    return "900+";
  }

  function currentLanguage() {
    const htmlLang = document.documentElement.lang;
    if (["pl", "no", "en"].includes(htmlLang)) return htmlLang;
    try {
      const stored = localStorage.getItem("europris_language_v6");
      return ["pl", "no", "en"].includes(stored) ? stored : "other";
    } catch {
      return "other";
    }
  }

  function payload(eventName, extra = {}) {
    return {
      action: "stats_event",
      token: EUROPRIS_ANALYTICS_TOKEN,
      version: EUROPRIS_ANALYTICS_VERSION,
      event: eventName,
      day: dayKey(),
      anonymousDayId: dailyAnonymousId(),
      installationId: installationId(),
      os: detectOS(),
      browser: detectBrowser(),
      device: detectDeviceType(),
      displayMode: detectDisplayMode(),
      screenClass: screenClass(),
      language: currentLanguage(),
      online: navigator.onLine,
      // extra może zawierać wyłącznie zdefiniowane bezpieczne kategorie.
      result: String(extra.result || "").slice(0, 40)
    };
  }

  function send(eventName, extra = {}) {
    if (!ALLOWED_EVENTS.has(eventName)) return;

    const body = JSON.stringify(payload(eventName, extra));
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
        if (navigator.sendBeacon(EUROPRIS_ANALYTICS_ENDPOINT, blob)) return;
      }
    } catch {}

    fetch(EUROPRIS_ANALYTICS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      cache: "no-store",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body
    }).catch(() => {});
  }

  const OPEN_COOLDOWN_MS = 60 * 1000;
  let lastOpenSentAt = 0;

  function sendAppOpen(reason) {
    const now = Date.now();
    if (now - lastOpenSentAt < OPEN_COOLDOWN_MS) return;
    lastOpenSentAt = now;
    send("app_open", { result: reason });
  }

  function registerCurrentSession() {
    sendAppOpen(document.visibilityState === "visible" ? "initial_visible" : "initial_hidden");
  }

  window.EuroprisStats = Object.freeze({
    track: send,
    version: EUROPRIS_ANALYTICS_VERSION
  });

  if (document.readyState === "complete" || document.readyState === "interactive") {
    registerCurrentSession();
  } else {
    window.addEventListener("DOMContentLoaded", registerCurrentSession, { once: true });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") sendAppOpen("foreground");
  });

  window.addEventListener("pageshow", event => {
    if (event.persisted) sendAppOpen("pageshow_cache");
  });

  window.addEventListener("online", () => send("online"));
  window.addEventListener("offline", () => send("offline"));
  window.addEventListener("appinstalled", () => send("pwa_installed"));
})();