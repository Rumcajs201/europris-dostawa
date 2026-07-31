(() => {
  "use strict";

  const SUPPORTED = ["pl", "no", "en", "de"];
  const LANGUAGE_KEY = "europris_language_v6";

  const labels = {
    pl: { language:"Język", information:"Informacje", title:"Informacje", text:"Ta sekcja jest przygotowana. Jej zawartość ustalimy w następnym kroku.", close:"Zamknij" },
    no: { language:"Språk", information:"Informasjon", title:"Informasjon", text:"Denne delen er klargjort. Innholdet bestemmer vi i neste trinn.", close:"Lukk" },
    en: { language:"Language", information:"Information", title:"Information", text:"This section is ready. We will decide its content in the next step.", close:"Close" },
    de: { language:"Sprache", information:"Informationen", title:"Informationen", text:"Dieser Bereich ist vorbereitet. Den Inhalt legen wir im nächsten Schritt fest.", close:"Schließen" }
  };

  const historyCopyLabels = {
    pl: { exportCopy:"Eksport kopii", importCopy:"Import kopii" },
    no: { exportCopy:"Eksporter kopi", importCopy:"Importer kopi" },
    en: { exportCopy:"Export copy", importCopy:"Import copy" },
    de: { exportCopy:"Kopie exportieren", importCopy:"Kopie importieren" }
  };

  const languageOptions = [
    ["pl", "🇵🇱 PL"],
    ["no", "🇳🇴 NO"],
    ["en", "🇬🇧 EN"],
    ["de", "🇩🇪 DE"]
  ];

  const germanText = {
    title: "Europris-Lieferbestätigung",
    description: "Geben Sie die Filialnummer ein oder beginnen Sie mit der Eingabe des Filialnamens.",
    locationHeading: "Standort",
    retryLocation: "Erneut versuchen",
    forceLocation: "Standort verwenden",
    useNearest: "Nächste Filiale wählen",
    trailerLabel: "Aktuelle Tour und Auflieger",
    trailerHint: "Interne Nummern eingeben",
    tourFieldLabel: "Tour",
    trailerFieldLabel: "Auflieger",
    open: "Lieferseite öffnen",
    openSave: "Öffnen und Lieferung speichern",
    navigate: "In Google Maps navigieren",
    call: "Anrufen",
    callPrivate: "Privat anrufen",
    editPrivate: "Private Nummer hinzufügen / bearbeiten",
    historyToggle: "Lieferverlauf",
    historyTitle: "Lieferverlauf",
    historyPrint: "Detaillierten Bericht drucken",
    historyPrintSummary: "Monatsübersicht A4 drucken",
    historyCsv: "Nach Excel exportieren (.xlsx)",
    historyJson: "Kopie exportieren",
    historyImport: "Kopie importieren",
    historyClear: "Ausgewählten Monat löschen",
    footer: "Erstellt von Rumcajs mit Hilfe künstlicher Intelligenz.",
    adminTitle: "Lieferpläne",
    adminDriverNameLabel: "Fahrer",
    adminDriverPhoneLabel: "Telefon",
    adminDriverAliasesLabel: "Zusätzliche Namen",
    adminDeliveryDateLabel: "Lieferdatum",
    adminImportLabel: "Excel-Datei importieren",
    adminDeletePlan: "Plan löschen",
    adminStatsTitle: "App-Statistiken",
    adminStatsDescription: "Anonyme technische Daten und App-Nutzung.",
    adminStatsRefresh: "Aktualisieren"
  };

  function normalizeLanguage(value) {
    const code = String(value || "").toLowerCase();
    if (code.startsWith("nb") || code.startsWith("nn") || code.startsWith("no")) return "no";
    if (code.startsWith("en")) return "en";
    if (code.startsWith("de")) return "de";
    if (code.startsWith("pl")) return "pl";
    return "";
  }

  function savedLanguage() {
    try {
      const saved = normalizeLanguage(localStorage.getItem(LANGUAGE_KEY));
      return SUPPORTED.includes(saved) ? saved : "";
    } catch (_) {
      return "";
    }
  }

  function activeLanguage() {
    const html = normalizeLanguage(document.documentElement.lang);
    if (SUPPORTED.includes(html)) return html;
    return savedLanguage() || "pl";
  }

  function persistLanguage(value) {
    try { localStorage.setItem(LANGUAGE_KEY, value); } catch (_) {}
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element && element.textContent !== value) element.textContent = value;
  }

  function updateHistoryCopyControls() {
    document.getElementById("historyCloudBackup")?.remove();
    document.getElementById("historyCloudRestore")?.remove();
    document.getElementById("historyCloudStatus")?.remove();

    const text = historyCopyLabels[activeLanguage()] || historyCopyLabels.pl;
    setText("historyJson", text.exportCopy);
    setText("historyImport", text.importCopy);
  }

  function applyGermanInterface() {
    if (activeLanguage() !== "de") return;

    document.documentElement.lang = "de";
    document.title = "Europris-Lieferbestätigung";

    Object.entries(germanText).forEach(([id, value]) => setText(id, value));
    updateHistoryCopyControls();

    const search = document.getElementById("search");
    if (search) {
      search.placeholder = "Filialnummer oder Filialname";
      search.setAttribute("aria-label", "Filialnummer oder Filialname");
    }

    const tour = document.getElementById("tourNumber");
    if (tour) tour.setAttribute("aria-label", "Tournummer");

    const trailer = document.getElementById("trailerNumber");
    if (trailer) trailer.setAttribute("aria-label", "Aufliegernummer");

    const emptyHistory = document.querySelector(".history-empty");
    if (emptyHistory && /no|brak|ingen|empty/i.test(emptyHistory.textContent || "")) {
      emptyHistory.textContent = "Keine gespeicherten Lieferungen im ausgewählten Monat.";
    }
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
      window.setTimeout(applyGermanInterface, 0);
      window.setTimeout(applyGermanInterface, 150);
      return;
    }

    document.documentElement.lang = value === "no" ? "nb" : value;
    persistLanguage(value);
    selectOriginalLanguage(value);
  }

  function start() {
    const controls = document.querySelector(".topbar-controls");
    if (!controls || controls.querySelector(".europris-header-actions")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "europris-header-actions";

    const infoButton = document.createElement("button");
    infoButton.type = "button";
    infoButton.className = "europris-info-button";

    const select = document.createElement("select");
    select.className = "europris-language-select";

    languageOptions.forEach(([value, name]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = name;
      select.appendChild(option);
    });

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
      select.value = selected;
      select.setAttribute("aria-label", text.language);
      infoButton.textContent = text.information;
      dialogTitle.textContent = text.title;
      dialogText.textContent = text.text;
      closeButton.textContent = text.close;
      updateHistoryCopyControls();
    }

    select.addEventListener("change", () => {
      setLanguage(select.value);
      window.setTimeout(() => {
        updateLabels();
        applyGermanInterface();
      }, 0);
    });

    document.querySelectorAll(".languages [data-lang]").forEach(button => {
      button.addEventListener("click", () => window.setTimeout(updateLabels, 0));
    });

    infoButton.addEventListener("click", () => {
      updateLabels();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });

    wrapper.append(infoButton, select);
    controls.insertBefore(wrapper, controls.firstChild);

    const initial = savedLanguage() || activeLanguage();
    if (initial === "de") {
      document.documentElement.lang = "de";
      persistLanguage("de");
      applyGermanInterface();
      window.setTimeout(applyGermanInterface, 100);
    }

    updateLabels();
    updateHistoryCopyControls();

    const observer = new MutationObserver(() => {
      updateHistoryCopyControls();
      if (activeLanguage() === "de") window.setTimeout(applyGermanInterface, 0);
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
})();

(() => {
  if (document.querySelector('script[data-history-edit]')) return;
  const script = document.createElement("script");
  script.src = "history-edit.js?v=2";
  script.defer = true;
  script.dataset.historyEdit = "1";
  document.head.appendChild(script);
})();

(() => {
  "use strict";

  const messages = {
    pl: { title:"Eksport do Excela", preparing:"Przygotowywanie pliku Excel…", detail:"Proszę nie zamykać tego okna. Pobieranie rozpocznie się automatycznie.", ready:"Plik jest gotowy. Rozpoczynanie pobierania…", error:"Nie udało się przygotować pliku Excel." },
    no: { title:"Eksport til Excel", preparing:"Forbereder Excel-filen…", detail:"Ikke lukk dette vinduet. Nedlastingen starter automatisk.", ready:"Filen er klar. Nedlastingen starter…", error:"Excel-filen kunne ikke klargjøres." },
    en: { title:"Export to Excel", preparing:"Preparing the Excel file…", detail:"Do not close this window. The download will start automatically.", ready:"The file is ready. Starting download…", error:"The Excel file could not be prepared." },
    de: { title:"Excel-Export", preparing:"Excel-Datei wird vorbereitet…", detail:"Bitte dieses Fenster nicht schließen. Der Download startet automatisch.", ready:"Die Datei ist fertig. Download wird gestartet…", error:"Die Excel-Datei konnte nicht erstellt werden." }
  };

  function currentLanguage() {
    const value = String(document.documentElement.lang || "pl").toLowerCase();
    if (value.startsWith("no") || value.startsWith("nb") || value.startsWith("nn")) return "no";
    if (value.startsWith("en")) return "en";
    if (value.startsWith("de")) return "de";
    return "pl";
  }

  function writeStatus(target, heading, detail, done = false) {
    if (!target || target.closed) return;
    const mark = done ? "✓" : "⏳";
    target.document.open();
    target.document.write(`<!doctype html><html lang="${currentLanguage()}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#fff;color:#17211b;font-family:Arial,Helvetica,sans-serif}.box{width:min(100%,440px);padding:30px 24px;border:1px solid #d8e2dc;border-radius:18px;text-align:center;box-shadow:0 12px 35px rgba(0,0,0,.08)}.mark{font-size:42px;margin-bottom:14px}h1{margin:0 0 12px;color:#08783e;font-size:22px}p{margin:0;color:#526159;line-height:1.5;font-size:15px}</style></head><body><main class="box"><div class="mark">${mark}</div><h1>${heading}</h1><p>${detail}</p></main></body></html>`);
    target.document.close();
  }

  function install() {
    const button = document.getElementById("historyCsv");
    if (!button || button.dataset.exportFeedback === "1") return;
    button.dataset.exportFeedback = "1";

    let busy = false;
    button.addEventListener("click", event => {
      if (busy) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      const text = messages[currentLanguage()] || messages.pl;
      const statusWindow = window.open("", "_blank");
      if (!statusWindow) return;

      busy = true;
      button.disabled = true;
      writeStatus(statusWindow, text.preparing, text.detail, false);

      const originalWriteFile = window.XLSX?.writeFile;
      let restored = false;
      const restore = () => {
        if (restored) return;
        restored = true;
        if (window.XLSX && originalWriteFile) window.XLSX.writeFile = originalWriteFile;
        busy = false;
        button.disabled = false;
      };

      if (window.XLSX && typeof originalWriteFile === "function") {
        window.XLSX.writeFile = function(...args) {
          try {
            const result = originalWriteFile.apply(this, args);
            writeStatus(statusWindow, text.ready, text.detail, true);
            window.setTimeout(() => {
              if (!statusWindow.closed) statusWindow.close();
            }, 1800);
            return result;
          } catch (exportError) {
            writeStatus(statusWindow, text.error, "", false);
            throw exportError;
          } finally {
            restore();
          }
        };
      }

      window.setTimeout(() => {
        if (!restored) {
          writeStatus(statusWindow, text.error, "", false);
          restore();
        }
      }, 90000);
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once:true });
  else install();
})();
