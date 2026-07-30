(() => {
  "use strict";

  const DB_NAME = "europris_delivery_history";
  const DB_VERSION = 2;
  const DB_STORE = "deliveries";
  const labels = {
    pl: { edit:"Edytuj", tour:"Numer kursu", trailer:"Numer naczepy", pallets:"Liczba palet", emptyPallets:"Puste palety", palletsDisplay:value=>`📦 Dostawa: ${value} palet`, emptyDisplay:value=>`↩ Puste palety: ${value}`, invalid:"Wpisz prawidłową liczbę palet." },
    no: { edit:"Rediger", tour:"Turnummer", trailer:"Tilhengernummer", pallets:"Antall paller", emptyPallets:"Tomme paller", palletsDisplay:value=>`📦 Levering: ${value} paller`, emptyDisplay:value=>`↩ Tomme paller: ${value}`, invalid:"Skriv inn et gyldig antall paller." },
    en: { edit:"Edit", tour:"Trip number", trailer:"Trailer number", pallets:"Number of pallets", emptyPallets:"Empty pallets", palletsDisplay:value=>`📦 Delivery: ${value} pallets`, emptyDisplay:value=>`↩ Empty pallets: ${value}`, invalid:"Enter a valid number of pallets." },
    de: { edit:"Bearbeiten", tour:"Tournummer", trailer:"Aufliegernummer", pallets:"Anzahl der Paletten", emptyPallets:"Leere Paletten", palletsDisplay:value=>`📦 Lieferung: ${value} Paletten`, emptyDisplay:value=>`↩ Leere Paletten: ${value}`, invalid:"Geben Sie eine gültige Palettenzahl ein." }
  };

  const germanHumor = [
    ["Montag. Erst Kaffee, dann der Rest der Welt.","Der Motor läuft. Jetzt ist der Fahrer dran.","Neue Woche, neue Filialen, derselbe Kaffee."],
    ["Dienstag — dem Wochenende näher als gestern.","Montag ist erledigt. Weiter geht’s.","Der Motor ist warm, die Woche kommt ins Rollen."],
    ["Mittwoch — die halbe Woche liegt im Rückspiegel.","Der Gipfel ist geschafft. Jetzt geht es bergab Richtung Wochenende.","Das Wochenende ist schon am Horizont."],
    ["Donnerstag — Freitag blinkt schon mit der Lichthupe.","Bald fährt das Wochenende an die Rampe.","Donnerstag ist fast Freitag, nur mit einer zusätzlichen Tour."],
    ["Freitag! Noch eine Filiale, dann entlädt sich das Wochenende von selbst.","Es riecht nach Wochenende und frischem Kaffee.","Sogar der Tachograph sieht heute fröhlicher aus."],
    ["Samstag — heute wird der Fahrer geladen, nicht der Auflieger.","Der Tachograph ruht. Du darfst das auch.","Die einzige Tour heute führt zum Kühlschrank."],
    ["Sonntag — ruh dich aus, morgen fragt der Motor wieder nach Kaffee.","Heute werden die Batterien geladen. Die Route kann warten.","Der letzte ruhige Parkplatz vor Montag."]
  ];

  let pendingEmptyPallets = null;
  const originalAdd = IDBObjectStore.prototype.add;
  IDBObjectStore.prototype.add = function(value, key) {
    if (this.name === DB_STORE && pendingEmptyPallets !== null && value && typeof value === "object") {
      value = { ...value, emptyPallets: pendingEmptyPallets };
      pendingEmptyPallets = null;
    }
    return arguments.length > 1 ? originalAdd.call(this, value, key) : originalAdd.call(this, value);
  };

  function language() {
    const value = String(document.documentElement.lang || "pl").toLowerCase();
    if (value.startsWith("no") || value.startsWith("nb") || value.startsWith("nn")) return "no";
    if (value.startsWith("en")) return "en";
    if (value.startsWith("de")) return "de";
    return "pl";
  }

  function renderGermanHumor() {
    if (language() !== "de") return;
    const card = document.getElementById("dailyHumorCard");
    if (!card) return;
    const title = card.querySelector(".daily-humor-title");
    const text = card.querySelector(".daily-humor-text");
    const day = (new Date().getDay() + 6) % 7;
    const pool = germanHumor[day];
    const index = new Date().getDate() % pool.length;
    if (title && title.textContent !== "☕ Humor des Tages") title.textContent = "☕ Humor des Tages";
    if (text && text.textContent !== pool[index]) text.textContent = pool[index];
  }

  function cleanTwoDigits(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 2);
  }

  function localDateKey(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function cleanCount(value) {
    const raw = String(value ?? "").trim().replace(",", ".");
    if (raw === "") return 0;
    const number = Number(raw);
    return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
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

  function askForEmptyPallets(event) {
    const text = labels[language()] || labels.pl;
    const raw = window.prompt(text.emptyPallets, "0");
    if (raw === null) {
      pendingEmptyPallets = null;
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const value = cleanCount(raw);
    if (value === null) {
      pendingEmptyPallets = null;
      window.alert(text.invalid);
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    pendingEmptyPallets = value;
  }

  async function editItem(item) {
    const text = labels[language()] || labels.pl;
    const tour = window.prompt(text.tour, cleanTwoDigits(item.tourNumber));
    if (tour === null) return;
    const trailer = window.prompt(text.trailer, cleanTwoDigits(item.trailerNumber));
    if (trailer === null) return;
    const palletsRaw = window.prompt(text.pallets, String(Number(item.pallets) || 0));
    if (palletsRaw === null) return;
    const emptyRaw = window.prompt(text.emptyPallets, String(Number(item.emptyPallets) || 0));
    if (emptyRaw === null) return;

    const pallets = cleanCount(palletsRaw);
    const emptyPallets = cleanCount(emptyRaw);
    if (pallets === null || emptyPallets === null) {
      window.alert(text.invalid);
      return;
    }

    await save({ ...item, tourNumber:cleanTwoDigits(tour), trailerNumber:cleanTwoDigits(trailer), pallets, emptyPallets });
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
    if (!cards.length) {
      renderGermanHumor();
      return;
    }

    enhancing = true;
    try {
      const items = flattenVisible(await getAll(), month.value);
      const text = labels[language()] || labels.pl;

      cards.forEach((card, index) => {
        const actions = card.querySelector(".history-item-actions");
        const main = card.querySelector(".history-item-main");
        const item = items[index];
        if (!actions || !main || !item) return;

        let detail = main.querySelector(".history-pallets-isolated");
        if (!detail) {
          detail = main.children[2] || document.createElement("div");
          detail.classList.add("history-pallets-isolated");
          if (!detail.parentNode) main.appendChild(detail);
        }
        detail.textContent = text.palletsDisplay(Number(item.pallets) || 0);

        let emptyDetail = main.querySelector(".history-empty-pallets-isolated");
        if (!emptyDetail) {
          emptyDetail = document.createElement("div");
          emptyDetail.className = "history-empty-pallets-isolated";
          main.appendChild(emptyDetail);
        }
        emptyDetail.textContent = text.emptyDisplay(Number(item.emptyPallets) || 0);

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
      renderGermanHumor();
    } finally {
      enhancing = false;
    }
  }

  function start() {
    const list = document.getElementById("historyList");
    if (!list) return;

    document.getElementById("openSave")?.addEventListener("click", askForEmptyPallets, true);

    const observer = new MutationObserver(() => window.setTimeout(() => void enhance(), 0));
    observer.observe(list, { childList:true, subtree:true });

    const languageObserver = new MutationObserver(() => {
      window.setTimeout(() => { renderGermanHumor(); void enhance(); }, 0);
    });
    languageObserver.observe(document.documentElement, { attributes:true, attributeFilter:["lang"] });

    document.getElementById("historyToggle")?.addEventListener("click", () => window.setTimeout(() => void enhance(), 50));
    document.getElementById("historyMonth")?.addEventListener("change", () => window.setTimeout(() => void enhance(), 50));
    document.querySelector(".europris-language-select")?.addEventListener("change", () => window.setTimeout(() => { renderGermanHumor(); void enhance(); }, 180));
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) window.setTimeout(() => { renderGermanHumor(); void enhance(); }, 50);
    });

    window.setTimeout(renderGermanHumor, 200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
})();
