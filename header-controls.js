(() => {
  "use strict";

  const SUPPORTED = ["pl", "no", "en", "de"];
  const LANGUAGE_KEY = "europris_language_v6";
  const DB_NAME = "europris_delivery_history";
  const DB_STORE = "deliveries";

  const labels = {
    pl: { language:"Język", information:"Informacje", title:"Informacje", text:"Ta sekcja jest przygotowana. Jej zawartość ustalimy w następnym kroku.", close:"Zamknij", edit:"Edytuj", tour:"Numer kursu", trailer:"Numer naczepy", pallets:"Liczba palet", invalid:"Wpisz prawidłową liczbę palet." },
    no: { language:"Språk", information:"Informasjon", title:"Informasjon", text:"Denne delen er klargjort. Innholdet bestemmer vi i neste trinn.", close:"Lukk", edit:"Rediger", tour:"Turnummer", trailer:"Tilhengernummer", pallets:"Antall paller", invalid:"Skriv inn et gyldig antall paller." },
    en: { language:"Language", information:"Information", title:"Information", text:"This section is ready. We will decide its content in the next step.", close:"Close", edit:"Edit", tour:"Trip number", trailer:"Trailer number", pallets:"Number of pallets", invalid:"Enter a valid number of pallets." },
    de: { language:"Sprache", information:"Informationen", title:"Informationen", text:"Dieser Bereich ist vorbereitet. Den Inhalt legen wir im nächsten Schritt fest.", close:"Schließen", edit:"Bearbeiten", tour:"Tournummer", trailer:"Aufliegernummer", pallets:"Anzahl der Paletten", invalid:"Geben Sie eine gültige Palettenzahl ein." }
  };

  const languageOptions = [
    ["pl", "🇵🇱 PL"], ["no", "🇳🇴 NO"], ["en", "🇬🇧 EN"], ["de", "🇩🇪 DE"]
  ];

  const germanText = {
    title:"Europris-Lieferbestätigung", description:"Geben Sie die Filialnummer ein oder beginnen Sie mit der Eingabe des Filialnamens.",
    locationHeading:"Standort", retryLocation:"Erneut versuchen", forceLocation:"Standort verwenden", useNearest:"Nächste Filiale wählen",
    trailerLabel:"Aktuelle Tour und Auflieger", trailerHint:"Interne Nummern eingeben", tourFieldLabel:"Tour", trailerFieldLabel:"Auflieger",
    open:"Lieferseite öffnen", openSave:"Öffnen und Lieferung speichern", navigate:"In Google Maps navigieren", call:"Anrufen",
    callPrivate:"Privat anrufen", editPrivate:"Private Nummer hinzufügen / bearbeiten", historyToggle:"Lieferverlauf", historyTitle:"Lieferverlauf",
    historyPrint:"Detaillierten Bericht drucken", historyPrintSummary:"Monatsübersicht A4 drucken", historyCsv:"Nach Excel exportieren (.xlsx)",
    historyJson:"JSON-Sicherung", historyImport:"Sicherung importieren", historyCloudBackup:"Cloud-Sicherung", historyCloudRestore:"Cloud-Sicherung wiederherstellen",
    historyClear:"Ausgewählten Monat löschen", footer:"Erstellt von Rumcajs mit Hilfe künstlicher Intelligenz.", adminTitle:"Lieferpläne",
    adminDriverNameLabel:"Fahrer", adminDriverPhoneLabel:"Telefon", adminDriverAliasesLabel:"Zusätzliche Namen", adminDeliveryDateLabel:"Lieferdatum",
    adminImportLabel:"Excel-Datei importieren", adminDeletePlan:"Plan löschen", adminStatsTitle:"App-Statistiken",
    adminStatsDescription:"Anonyme technische Daten und App-Nutzung.", adminStatsRefresh:"Aktualisieren"
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

  function normalizeLanguage(value) {
    const code = String(value || "").toLowerCase();
    if (code.startsWith("nb") || code.startsWith("nn") || code.startsWith("no")) return "no";
    if (code.startsWith("en")) return "en";
    if (code.startsWith("de")) return "de";
    if (code.startsWith("pl")) return "pl";
    return "";
  }

  function savedLanguage() {
    try { const value = normalizeLanguage(localStorage.getItem(LANGUAGE_KEY)); return SUPPORTED.includes(value) ? value : ""; }
    catch (_) { return ""; }
  }

  function activeLanguage() {
    const html = normalizeLanguage(document.documentElement.lang);
    return SUPPORTED.includes(html) ? html : (savedLanguage() || "pl");
  }

  function persistLanguage(value) { try { localStorage.setItem(LANGUAGE_KEY, value); } catch (_) {} }
  function setText(id, value) { const el = document.getElementById(id); if (el && el.textContent !== value) el.textContent = value; }

  function renderGermanHumor() {
    if (activeLanguage() !== "de") return;
    const card = document.getElementById("dailyHumorCard");
    if (!card) return;
    const title = card.querySelector(".daily-humor-title");
    const text = card.querySelector(".daily-humor-text");
    const day = (new Date().getDay() + 6) % 7;
    const pool = germanHumor[day];
    const index = new Date().getDate() % pool.length;
    if (title) title.textContent = "☕ Humor des Tages";
    if (text) text.textContent = pool[index];
  }

  function applyGermanInterface() {
    if (activeLanguage() !== "de") return;
    document.documentElement.lang = "de";
    document.title = "Europris-Lieferbestätigung";
    Object.entries(germanText).forEach(([id, value]) => setText(id, value));
    const search = document.getElementById("search");
    if (search) { search.placeholder = "Filialnummer oder Filialname"; search.setAttribute("aria-label", search.placeholder); }
    const tour = document.getElementById("tourNumber"); if (tour) tour.setAttribute("aria-label", "Tournummer");
    const trailer = document.getElementById("trailerNumber"); if (trailer) trailer.setAttribute("aria-label", "Aufliegernummer");
    const empty = document.querySelector(".history-empty");
    if (empty && /no|brak|ingen|empty/i.test(empty.textContent || "")) empty.textContent = "Keine gespeicherten Lieferungen im ausgewählten Monat.";
    renderGermanHumor();
  }

  function selectOriginalLanguage(value) {
    const button = document.querySelector(`.languages [data-lang="${value}"]`);
    if (button) button.click();
  }

  function setLanguage(value) {
    if (!SUPPORTED.includes(value)) return;
    if (value === "de") {
      selectOriginalLanguage("en");
      document.documentElement.lang = "de";
      persistLanguage("de");
      applyGermanInterface();
      setTimeout(applyGermanInterface, 0);
      setTimeout(applyGermanInterface, 150);
      return;
    }
    document.documentElement.lang = value === "no" ? "nb" : value;
    persistLanguage(value);
    selectOriginalLanguage(value);
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function allDeliveries() {
    const db = await openDatabase();
    const rows = await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const request = tx.objectStore(DB_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return rows;
  }

  async function saveDelivery(item) {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(item);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  function cardStoreNumber(card) {
    const text = card.querySelector(".history-item-number")?.textContent || "";
    return (text.match(/^\s*(\d+)/) || [])[1] || "";
  }

  function cardTime(card) {
    return (card.querySelector(".history-item-date")?.textContent || "").replace(/\s/g, "");
  }

  function timeValue(value) {
    try { return new Intl.DateTimeFormat(activeLanguage() === "no" ? "nb-NO" : activeLanguage(), { hour:"2-digit", minute:"2-digit" }).format(new Date(value)).replace(/\s/g, ""); }
    catch (_) { return ""; }
  }

  async function editHistoryCard(card) {
    const text = labels[activeLanguage()] || labels.pl;
    const storeNumber = cardStoreNumber(card);
    const shownTime = cardTime(card);
    const rows = await allDeliveries();
    const candidates = rows.filter(row => String(row.storeNumber || "") === storeNumber && timeValue(row.createdAt) === shownTime);
    if (!candidates.length) return;
    const item = candidates.sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];

    const tour = prompt(text.tour, String(item.tourNumber || ""));
    if (tour === null) return;
    const trailer = prompt(text.trailer, String(item.trailerNumber || ""));
    if (trailer === null) return;
    const palletsRaw = prompt(text.pallets, String(Number(item.pallets) || 0));
    if (palletsRaw === null) return;
    const pallets = Number(String(palletsRaw).replace(",", "."));
    if (!Number.isFinite(pallets) || pallets < 0) { alert(text.invalid); return; }

    item.tourNumber = String(tour).replace(/\D/g, "").slice(0, 2);
    item.trailerNumber = String(trailer).replace(/\D/g, "").slice(0, 2);
    item.pallets = Math.round(pallets);
    await saveDelivery(item);
    location.reload();
  }

  function enhanceHistory() {
    const text = labels[activeLanguage()] || labels.pl;
    document.querySelectorAll(".history-item-actions").forEach(actions => {
      const card = actions.closest(".history-item");
      if (!card) return;
      let edit = actions.querySelector(".history-edit-button");
      if (!edit) {
        edit = document.createElement("button");
        edit.type = "button";
        edit.className = "history-edit-button";
        const remove = actions.querySelector(".delete");
        actions.insertBefore(edit, remove || null);
        edit.addEventListener("click", () => void editHistoryCard(card));
      }
      edit.textContent = text.edit;
      const remove = actions.querySelector(".delete");
      if (remove) actions.appendChild(remove);
    });
  }

  function start() {
    const controls = document.querySelector(".topbar-controls");
    if (!controls || controls.querySelector(".europris-header-actions")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "europris-header-actions";
    const infoButton = document.createElement("button");
    infoButton.type = "button"; infoButton.className = "europris-info-button";
    const select = document.createElement("select");
    select.className = "europris-language-select";
    languageOptions.forEach(([value, name]) => { const option = document.createElement("option"); option.value = value; option.textContent = name; select.appendChild(option); });

    const dialog = document.createElement("dialog");
    dialog.className = "europris-info-dialog";
    dialog.innerHTML = `<div class="europris-info-content"><h2 class="europris-info-title"></h2><p class="europris-info-text"></p><button type="button" class="europris-info-close"></button></div>`;
    document.body.appendChild(dialog);
    const dialogTitle = dialog.querySelector(".europris-info-title");
    const dialogText = dialog.querySelector(".europris-info-text");
    const closeButton = dialog.querySelector(".europris-info-close");

    function updateLabels() {
      const selected = activeLanguage();
      const text = labels[selected] || labels.pl;
      select.value = selected; select.setAttribute("aria-label", text.language);
      infoButton.textContent = text.information; dialogTitle.textContent = text.title; dialogText.textContent = text.text; closeButton.textContent = text.close;
      enhanceHistory();
    }

    select.addEventListener("change", () => { setLanguage(select.value); setTimeout(() => { updateLabels(); applyGermanInterface(); }, 0); });
    document.querySelectorAll(".languages [data-lang]").forEach(button => button.addEventListener("click", () => setTimeout(updateLabels, 0)));
    infoButton.addEventListener("click", () => { updateLabels(); if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", ""); });
    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });

    wrapper.append(infoButton, select);
    controls.insertBefore(wrapper, controls.firstChild);
    const initial = savedLanguage() || activeLanguage();
    if (initial === "de") { document.documentElement.lang = "de"; persistLanguage("de"); applyGermanInterface(); setTimeout(applyGermanInterface, 100); }
    updateLabels();

    const observer = new MutationObserver(() => {
      if (activeLanguage() === "de") setTimeout(applyGermanInterface, 0);
      enhanceHistory();
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
})();