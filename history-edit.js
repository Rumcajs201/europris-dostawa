(() => {
  "use strict";

  const DB_NAME = "europris_delivery_history";
  const DB_VERSION = 2;
  const DB_STORE = "deliveries";
  const labels = {
    pl: { edit:"Edytuj", tour:"Numer kursu", trailer:"Numer naczepy", pallets:"Liczba palet", invalid:"Wpisz prawidłową liczbę palet." },
    no: { edit:"Rediger", tour:"Turnummer", trailer:"Tilhengernummer", pallets:"Antall paller", invalid:"Skriv inn et gyldig antall paller." },
    en: { edit:"Edit", tour:"Trip number", trailer:"Trailer number", pallets:"Number of pallets", invalid:"Enter a valid number of pallets." },
    de: { edit:"Bearbeiten", tour:"Tournummer", trailer:"Aufliegernummer", pallets:"Anzahl der Paletten", invalid:"Geben Sie eine gültige Palettenzahl ein." }
  };

  function language() {
    const value = String(document.documentElement.lang || "pl").toLowerCase();
    if (value.startsWith("no") || value.startsWith("nb") || value.startsWith("nn")) return "no";
    if (value.startsWith("en")) return "en";
    if (value.startsWith("de")) return "de";
    return "pl";
  }

  function cleanTwoDigits(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 2);
  }

  function localDateKey(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getAll() {
    const db = await openDatabase();
    const rows = await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const request = tx.objectStore(DB_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  async function save(item) {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(item);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  function flattenVisible(rows, month) {
    const entries = rows.filter(item => localDateKey(item.createdAt).slice(0, 7) === month);
    const result = [];
    const days = new Map();

    for (const item of entries) {
      const day = localDateKey(item.createdAt);
      if (!days.has(day)) days.set(day, []);
      days.get(day).push(item);
    }

    for (const dayEntries of days.values()) {
      const tours = new Map();
      for (const item of dayEntries) {
        const key = cleanTwoDigits(item.tourNumber);
        if (!tours.has(key)) tours.set(key, []);
        tours.get(key).push(item);
      }

      for (const tourEntries of tours.values()) {
        const trailers = new Map();
        for (const item of tourEntries) {
          const key = cleanTwoDigits(item.trailerNumber);
          if (!trailers.has(key)) trailers.set(key, []);
          trailers.get(key).push(item);
        }
        for (const trailerEntries of trailers.values()) result.push(...trailerEntries);
      }
    }

    return result;
  }

  async function editItem(item) {
    const text = labels[language()] || labels.pl;
    const tour = window.prompt(text.tour, cleanTwoDigits(item.tourNumber));
    if (tour === null) return;
    const trailer = window.prompt(text.trailer, cleanTwoDigits(item.trailerNumber));
    if (trailer === null) return;
    const palletsRaw = window.prompt(text.pallets, String(Number(item.pallets) || 0));
    if (palletsRaw === null) return;

    const pallets = Number(String(palletsRaw).replace(",", "."));
    if (!Number.isFinite(pallets) || pallets < 0) {
      window.alert(text.invalid);
      return;
    }

    await save({
      ...item,
      tourNumber: cleanTwoDigits(tour),
      trailerNumber: cleanTwoDigits(trailer),
      pallets: Math.round(pallets)
    });

    const month = document.getElementById("historyMonth");
    if (month) month.dispatchEvent(new Event("change", { bubbles:true }));
  }

  let enhancing = false;
  async function enhance() {
    if (enhancing) return;
    const list = document.getElementById("historyList");
    const month = document.getElementById("historyMonth");
    if (!list || !month) return;

    const cards = Array.from(list.querySelectorAll(".history-item"));
    if (!cards.length) return;

    enhancing = true;
    try {
      const items = flattenVisible(await getAll(), month.value);
      const text = labels[language()] || labels.pl;

      cards.forEach((card, index) => {
        const actions = card.querySelector(".history-item-actions");
        const item = items[index];
        if (!actions || !item) return;

        let button = actions.querySelector(".history-edit-isolated");
        if (!button) {
          button = document.createElement("button");
          button.type = "button";
          button.className = "history-edit-isolated";
          const remove = actions.querySelector(".delete");
          actions.insertBefore(button, remove || null);
          button.addEventListener("click", () => void editItem(item));
        }
        button.textContent = text.edit;

        const remove = actions.querySelector(".delete");
        if (remove && remove !== actions.lastElementChild) actions.appendChild(remove);
      });
    } finally {
      enhancing = false;
    }
  }

  function start() {
    const list = document.getElementById("historyList");
    if (!list) return;

    const observer = new MutationObserver(() => window.setTimeout(() => void enhance(), 0));
    observer.observe(list, { childList:true, subtree:true });

    document.getElementById("historyToggle")?.addEventListener("click", () => window.setTimeout(() => void enhance(), 50));
    document.getElementById("historyMonth")?.addEventListener("change", () => window.setTimeout(() => void enhance(), 50));
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) window.setTimeout(() => void enhance(), 50);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
})();