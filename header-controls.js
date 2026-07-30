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
    historyJson: "JSON-Sicherung",
    historyImport: "Sicherung importieren",
    historyCloudBackup: "Cloud-Sicherung",
    historyCloudRestore: "Cloud-Sicherung wiederherstellen",
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

  function applyGermanInterface() {
    if (activeLanguage() !== "de") return;

    document.documentElement.lang = "de";
    document.title = "Europris-Lieferbestätigung";

    Object.entries(germanText).forEach(([id, value]) => setText(id, value));

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

    const observer = new MutationObserver(() => {
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
