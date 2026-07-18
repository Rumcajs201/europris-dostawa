(() => {
  "use strict";

  const ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzalC81iNvpLXuymmbMVI4pYB1FzuTXHgnvG4kegKspl7Mfd5j11BGW9W5Gv9xXsM1lMg/exec";
  const TOKEN = "hBsuU2uyQQ6WO3MbA30DtVLb2SJhuiblRqH77g1Ns9M";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function rows(obj) {
    return Object.entries(obj || {})
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) =>
        `<div class="stats-row"><span>${escapeHtml(name)}</span><strong>${Number(count) || 0}</strong></div>`
      ).join("") || `<div class="stats-empty">Brak danych</div>`;
  }

  function card(title, content) {
    return `<section class="stats-card"><h3>${escapeHtml(title)}</h3>${content}</section>`;
  }

  function summaryTile(label, value) {
    return `<div class="stats-tile"><strong>${Number(value) || 0}</strong><span>${escapeHtml(label)}</span></div>`;
  }

  function render(root, data) {
    const summary = data.summary || {};
    root.innerHTML = `
      <div class="stats-toolbar">
        <div>
          <h2>Statystyki aplikacji</h2>
          <p>Anonimowe dane techniczne. Bez GPS, IP, nazwisk, PIN-ów i historii tras.</p>
        </div>
        <button type="button" id="statsRefresh">Odśwież</button>
      </div>

      <div class="stats-tiles">
        ${summaryTile("Aktywne urządzenia dzisiaj", summary.devicesToday)}
        ${summaryTile("Uruchomienia dzisiaj", summary.opensToday)}
        ${summaryTile("Aktywne urządzenia 7 dni", summary.devices7d)}
        ${summaryTile("Aktywne urządzenia 30 dni", summary.devices30d)}
      </div>

      <div class="stats-grid">
        ${card("Systemy operacyjne – 30 dni", rows(data.os))}
        ${card("Typ urządzenia – 30 dni", rows(data.device))}
        ${card("Przeglądarki – 30 dni", rows(data.browser))}
        ${card("Sposób uruchomienia – 30 dni", rows(data.displayMode))}
        ${card("Wersje aplikacji – 30 dni", rows(data.version))}
        ${card("Języki – 30 dni", rows(data.language))}
        ${card("Klasy ekranu – 30 dni", rows(data.screenClass))}
        ${card("Zdarzenia – 30 dni", rows(data.events))}
      </div>

      <p class="stats-updated">Ostatnia aktualizacja: ${escapeHtml(data.generatedAt || "—")}</p>
    `;

    root.querySelector("#statsRefresh")?.addEventListener("click", () => load(root));
  }

  async function load(root) {
    root.innerHTML = `<div class="stats-loading">Pobieranie statystyk…</div>`;
    try {
      const url = `${ENDPOINT}?action=stats_summary&token=${encodeURIComponent(TOKEN)}&_=${Date.now()}`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data || data.ok !== true) throw new Error(data?.error || "Błąd API");
      render(root, data);
    } catch (error) {
      root.innerHTML = `
        <div class="stats-error">
          Nie udało się pobrać statystyk.<br>
          <small>${escapeHtml(error.message)}</small>
        </div>`;
    }
  }

  window.EuroprisStatsPanel = Object.freeze({ load });
})();