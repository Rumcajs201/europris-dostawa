(() => {
  "use strict";

  const API = "https://script.google.com/macros/s/AKfycbzalC81iNvpLXuymmbMVI4pYB1FzuTXHgnvG4kegKspl7Mfd5j11BGW9W5Gv9xXsM1lMg/exec";
  const TOKEN = "hBsuU2uyQQ6WO3MbA30DtVLb2SJhuiblRqH77g1Ns9M";

  function language() {
    const value = document.documentElement.lang || "pl";
    if (value.startsWith("no") || value.startsWith("nb")) return "no";
    if (value.startsWith("en")) return "en";
    return "pl";
  }

  function labels() {
    if (language() === "no") return {
      loading: "Laster statistikk…", error: "Kunne ikke laste statistikken.",
      todayDevices: "Enheter i dag", todayOpens: "Åpninger i dag",
      sevenDays: "Enheter — 7 dager", thirtyDays: "Enheter — 30 dager",
      os: "Operativsystemer", browsers: "Nettlesere", devices: "Enhetstyper",
      modes: "PWA / nettleser", languages: "Språk", versions: "Appversjoner",
      events: "Tekniske hendelser", activity: "Aktivitet per anonym enhet",
      code: "Enhet", opens: "Åpninger", system: "System", mode: "Modus",
      lastActive: "Sist aktiv", noData: "Ingen data", updated: "Oppdatert",
      privacy: "Tilfeldig installasjonskode. Ingen navn, GPS, butikker, ruter, telefonnummer eller PIN lagres."
    };
    if (language() === "en") return {
      loading: "Loading statistics…", error: "Unable to load statistics.",
      todayDevices: "Devices today", todayOpens: "Opens today",
      sevenDays: "Devices — 7 days", thirtyDays: "Devices — 30 days",
      os: "Operating systems", browsers: "Browsers", devices: "Device types",
      modes: "PWA / browser", languages: "Languages", versions: "App versions",
      events: "Technical events", activity: "Activity per anonymous device",
      code: "Device", opens: "Opens", system: "System", mode: "Mode",
      lastActive: "Last active", noData: "No data", updated: "Updated",
      privacy: "Random installation code. No name, GPS, stores, routes, phone number or PIN is stored."
    };
    return {
      loading: "Ładowanie statystyk…", error: "Nie udało się pobrać statystyk.",
      todayDevices: "Urządzenia dzisiaj", todayOpens: "Uruchomienia dzisiaj",
      sevenDays: "Urządzenia — 7 dni", thirtyDays: "Urządzenia — 30 dni",
      os: "Systemy operacyjne", browsers: "Przeglądarki", devices: "Typy urządzeń",
      modes: "PWA / przeglądarka", languages: "Języki", versions: "Wersje aplikacji",
      events: "Zdarzenia techniczne", activity: "Aktywność anonimowych urządzeń",
      code: "Urządzenie", opens: "Uruchomienia", system: "System", mode: "Tryb",
      lastActive: "Ostatnia aktywność", noData: "Brak danych", updated: "Aktualizacja",
      privacy: "Losowy kod instalacji. Nie zapisujemy imienia, GPS, sklepów, tras, telefonu ani PIN-u."
    };
  }

  const metric = (label, value) =>
    `<div class="stats-metric"><strong>${Number(value) || 0}</strong><span>${label}</span></div>`;

  function chart(title, object, noData) {
    const entries = Object.entries(object || {}).sort((a, b) => Number(b[1]) - Number(a[1]));
    if (!entries.length) {
      return `<section class="stats-chart"><h4>${title}</h4><div class="stats-empty">${noData}</div></section>`;
    }

    const max = Math.max(...entries.map(([, value]) => Number(value) || 0), 1);
    return `<section class="stats-chart">
      <h4>${title}</h4>
      <div class="stats-bars">
        ${entries.map(([name, value]) => {
          const count = Number(value) || 0;
          return `<div class="stats-bar-row">
            <div class="stats-bar-label"><span>${name}</span><strong>${count}</strong></div>
            <div class="stats-bar-track"><span style="width:${Math.max(4, Math.round(count / max * 100))}%"></span></div>
          </div>`;
        }).join("")}
      </div>
    </section>`;
  }

  function deviceActivityTable(items, text) {
    if (!Array.isArray(items) || !items.length) {
      return `<section class="stats-device-activity">
        <h4>${text.activity}</h4>
        <div class="stats-empty">${text.noData}</div>
      </section>`;
    }

    return `<section class="stats-device-activity">
      <h4>${text.activity}</h4>
      <div class="stats-device-table-wrap">
        <table class="stats-device-table">
          <thead>
            <tr>
              <th>${text.code}</th>
              <th>${text.opens}</th>
              <th>${text.system}</th>
              <th>${text.mode}</th>
              <th>${text.lastActive}</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `<tr>
              <td><strong>${item.code || "—"}</strong></td>
              <td>${Number(item.opens) || 0}</td>
              <td>${item.os || "Other"}</td>
              <td>${item.displayMode || "Browser"}</td>
              <td>${item.lastActive || "—"}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="stats-privacy-note">${text.privacy}</div>
    </section>`;
  }

  async function load(container, force = false) {
    if (!container) return;
    if (!force && container.dataset.loaded === "1") return;

    const text = labels();
    container.innerHTML = `<div class="stats-loading">${text.loading}</div>`;

    try {
      const response = await fetch(
        `${API}?action=stats_summary&token=${encodeURIComponent(TOKEN)}`,
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
        ${deviceActivityTable(data.deviceActivity, text)}
        <div class="stats-grid">
          ${chart(text.os, data.os, text.noData)}
          ${chart(text.devices, data.device, text.noData)}
          ${chart(text.browsers, data.browser, text.noData)}
          ${chart(text.modes, data.displayMode, text.noData)}
          ${chart(text.languages, data.language, text.noData)}
          ${chart(text.versions, data.version, text.noData)}
          ${chart(text.events, data.events, text.noData)}
        </div>
        <div class="stats-generated">${text.updated}: ${data.generatedAt || "—"}</div>
      `;
      container.dataset.loaded = "1";
    } catch (error) {
      console.error("Europris stats:", error);
      container.innerHTML = `<div class="stats-error">${text.error}</div>`;
    }
  }

  window.EuroprisStatsPanel = Object.freeze({ load });
})();