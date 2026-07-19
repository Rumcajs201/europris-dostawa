(() => {
  "use strict";

  const API = "https://script.google.com/macros/s/AKfycbzalC81iNvpLXuymmbMVI4pYB1FzuTXHgnvG4kegKspl7Mfd5j11BGW9W5Gv9xXsM1lMg/exec";
  const TOKEN = "hBsuU2uyQQ6WO3MbA30DtVLb2SJhuiblRqH77g1Ns9M";

  function localDayKey() {
    const date = new Date();
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function language() {
    const value = document.documentElement.lang || "pl";
    if (value.startsWith("no") || value.startsWith("nb")) return "no";
    if (value.startsWith("en")) return "en";
    return "pl";
  }

  function labels() {
    if (language() === "no") return {
      loading: "Laster statistikk…", error: "Kunne ikke laste statistikken.",
      expand: "Vis statistikk", collapse: "Skjul statistikk",
      todayDevices: "Enheter i dag", todayOpens: "Åpninger i dag",
      sevenDays: "Enheter — 7 dager", thirtyDays: "Enheter — 30 dager",
      os: "Operativsystemer", browsers: "Nettlesere", devices: "Enhetstyper",
      modes: "PWA / nettleser", languages: "Språk", versions: "Appversjoner",
      events: "Tekniske hendelser", activity: "Anonyme enheter",
      code: "Enhet", opens: "Åpninger", system: "System", mode: "Modus",
      lastActive: "Sist aktiv", noData: "Ingen data", updated: "Oppdatert",
      privacy: "Tilfeldig installasjonskode. Ingen navn, GPS, butikker, ruter, telefonnummer eller PIN lagres."
    };
    if (language() === "en") return {
      loading: "Loading statistics…", error: "Unable to load statistics.",
      expand: "Expand statistics", collapse: "Collapse statistics",
      todayDevices: "Devices today", todayOpens: "Opens today",
      sevenDays: "Devices — 7 days", thirtyDays: "Devices — 30 days",
      os: "Operating systems", browsers: "Browsers", devices: "Device types",
      modes: "PWA / browser", languages: "Languages", versions: "App versions",
      events: "Technical events", activity: "Anonymous devices",
      code: "Device", opens: "Opens", system: "System", mode: "Mode",
      lastActive: "Last active", noData: "No data", updated: "Updated",
      privacy: "Random installation code. No name, GPS, stores, routes, phone number or PIN is stored."
    };
    return {
      loading: "Ładowanie statystyk…", error: "Nie udało się pobrać statystyk.",
      expand: "Rozwiń statystyki", collapse: "Zwiń statystyki",
      todayDevices: "Urządzenia dzisiaj", todayOpens: "Uruchomienia dzisiaj",
      sevenDays: "Urządzenia — 7 dni", thirtyDays: "Urządzenia — 30 dni",
      os: "Systemy operacyjne", browsers: "Przeglądarki", devices: "Typy urządzeń",
      modes: "PWA / przeglądarka", languages: "Języki", versions: "Wersje aplikacji",
      events: "Zdarzenia techniczne", activity: "Anonimowe urządzenia",
      code: "Urządzenie", opens: "Uruchomienia", system: "System", mode: "Tryb",
      lastActive: "Ostatnia aktywność", noData: "Brak danych", updated: "Aktualizacja",
      privacy: "Losowy kod instalacji. Nie zapisujemy imienia, GPS, sklepów, tras, telefonu ani PIN-u."
    };
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    }[character]));
  }

  const metric = (label, value) =>
    `<div class="stats-metric"><strong>${Number(value) || 0}</strong><span>${escapeHtml(label)}</span></div>`;

  function compactChart(title, object, noData) {
    const entries = Object.entries(object || {})
      .sort((a, b) => Number(b[1]) - Number(a[1]));

    const content = entries.length
      ? entries.slice(0, 6).map(([name, value]) =>
          `<div class="stats-compact-row">
            <span>${escapeHtml(name)}</span>
            <strong>${Number(value) || 0}</strong>
          </div>`
        ).join("")
      : `<div class="stats-empty">${escapeHtml(noData)}</div>`;

    return `<section class="stats-compact-card">
      <h4>${escapeHtml(title)}</h4>
      <div class="stats-compact-list">${content}</div>
    </section>`;
  }

  function deviceActivity(items, text) {
    if (!Array.isArray(items) || !items.length) {
      return `<details class="stats-device-details">
        <summary>${escapeHtml(text.activity)}</summary>
        <div class="stats-empty">${escapeHtml(text.noData)}</div>
      </details>`;
    }

    return `<details class="stats-device-details">
      <summary>${escapeHtml(text.activity)} <span>${items.length}</span></summary>
      <div class="stats-device-list">
        ${items.map(item => `<article class="stats-device-card">
          <div class="stats-device-card-head">
            <strong>${escapeHtml(item.code || "—")}</strong>
            <span>${escapeHtml(text.opens)}: ${Number(item.opens) || 0}</span>
          </div>
          <div class="stats-device-card-meta">
            ${escapeHtml(item.os || "Other")} •
            ${escapeHtml(item.displayMode || "Browser")} •
            ${escapeHtml(item.lastActive || "—")}
          </div>
        </article>`).join("")}
      </div>
      <div class="stats-privacy-note">${escapeHtml(text.privacy)}</div>
    </details>`;
  }

  function ensureToggle(container) {
    const panel = container.closest(".stats-panel");
    if (!panel) return null;

    let button = panel.querySelector(".stats-main-toggle");
    if (button) return button;

    const text = labels();
    button = document.createElement("button");
    button.type = "button";
    button.className = "stats-main-toggle";
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = `<span>${escapeHtml(text.expand)}</span><b>⌄</b>`;

    const header = panel.querySelector(".stats-panel-header");
    header?.insertAdjacentElement("afterend", button);

    container.hidden = true;

    button.addEventListener("click", () => {
      const open = container.hidden;
      container.hidden = !open;
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.querySelector("span").textContent = open ? labels().collapse : labels().expand;

      if (open && container.dataset.loaded !== "1") {
        load(container, true);
      }
    });

    return button;
  }

  async function load(container, force = false) {
    if (!container) return;

    ensureToggle(container);

    // Pierwsze otwarcie panelu administratora nie pobiera danych i nie zajmuje miejsca.
    if (container.hidden && !force) return;
    if (!force && container.dataset.loaded === "1") return;

    const text = labels();
    container.innerHTML = `<div class="stats-loading">${escapeHtml(text.loading)}</div>`;

    try {
      const response = await fetch(
        `${API}?action=stats_summary&token=${encodeURIComponent(TOKEN)}&day=${encodeURIComponent(localDayKey())}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data?.ok) throw new Error(data?.error || "API");

      const summary = data.summary || {};
      container.innerHTML = `
        <div class="stats-metrics">
          ${metric(text.todayDevices, summary.devicesToday)}
          ${metric(text.todayOpens, summary.opensToday)}
          ${metric(text.sevenDays, summary.devices7d)}
          ${metric(text.thirtyDays, summary.devices30d)}
        </div>

        ${deviceActivity(data.deviceActivity, text)}

        <div class="stats-compact-grid">
          ${compactChart(text.os, data.os, text.noData)}
          ${compactChart(text.devices, data.device, text.noData)}
          ${compactChart(text.browsers, data.browser, text.noData)}
          ${compactChart(text.modes, data.displayMode, text.noData)}
          ${compactChart(text.languages, data.language, text.noData)}
          ${compactChart(text.versions, data.version, text.noData)}
          ${compactChart(text.events, data.events, text.noData)}
        </div>

        <div class="stats-generated">${escapeHtml(text.updated)}: ${escapeHtml(data.generatedAt || "—")}</div>
      `;
      container.dataset.loaded = "1";
    } catch (error) {
      console.error("Europris stats:", error);
      container.innerHTML = `<div class="stats-error">${escapeHtml(text.error)}</div>`;
    }
  }

  function refreshLanguage(container) {
    const button = container?.closest(".stats-panel")?.querySelector(".stats-main-toggle");
    if (!button) return;

    const expanded = button.getAttribute("aria-expanded") === "true";
    button.querySelector("span").textContent = expanded ? labels().collapse : labels().expand;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("adminStatsContent");
    if (container) ensureToggle(container);

    document.querySelectorAll("[data-lang]").forEach(button => {
      button.addEventListener("click", () => setTimeout(() => refreshLanguage(container), 0));
    });
  });

  window.EuroprisStatsPanel = Object.freeze({ load });
})();