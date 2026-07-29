(() => {
  "use strict";

  const labels = {
    pl: {
      language: "Język",
      information: "Informacje",
      title: "Informacje",
      text: "Ta sekcja jest przygotowana. Jej zawartość ustalimy w następnym kroku.",
      close: "Zamknij"
    },
    no: {
      language: "Språk",
      information: "Informasjon",
      title: "Informasjon",
      text: "Denne delen er klargjort. Innholdet bestemmer vi i neste trinn.",
      close: "Lukk"
    },
    en: {
      language: "Language",
      information: "Information",
      title: "Information",
      text: "This section is ready. We will decide its content in the next step.",
      close: "Close"
    },
    de: {
      language: "Sprache",
      information: "Informationen",
      title: "Informationen",
      text: "Dieser Bereich ist vorbereitet. Den Inhalt legen wir im nächsten Schritt fest.",
      close: "Schließen"
    }
  };

  function addGermanTranslations() {
    if (typeof translations === "undefined" || !translations.en || translations.de) return;

    translations.de = {
      ...translations.en,
      title: "Europris-Lieferbestätigung",
      description: "Geben Sie die Filialnummer ein oder beginnen Sie mit der Eingabe des Filialnamens.",
      placeholder: "Filialnummer oder Filialname",
      trailerLabel: "Aktuelle Tour und Auflieger",
      trailerHint: "Interne Nummern eingeben",
      tourFieldLabel: "Tour",
      trailerFieldLabel: "Auflieger",
      trailerRequired: "Geben Sie vor dem Speichern die Aufliegernummer ein.",
      tourRequired: "Geben Sie vor dem Speichern die Tournummer ein.",
      tourTrailerRequired: "Ergänzen Sie Tour- und Aufliegernummer.",
      open: "Lieferseite öffnen",
      openSave: "Öffnen und Lieferung speichern",
      navigate: "In Google Maps navigieren",
      call: "Anrufen",
      callPrivate: "Privat anrufen",
      editPrivate: "Private Nummer hinzufügen / bearbeiten",
      history: "Lieferverlauf",
      historyTitle: "Lieferverlauf",
      historyPrint: "Detaillierten Bericht drucken",
      historyPrintSummary: "Monatsübersicht A4 drucken",
      historyCsv: "Nach Excel exportieren (.xlsx)",
      historyJson: "JSON-Sicherung",
      historyImport: "Sicherung importieren",
      historyClear: "Ausgewählten Monat löschen",
      historyEmpty: "Keine gespeicherten Lieferungen im ausgewählten Monat.",
      historyDelete: "Löschen",
      historyOpen: "Seite",
      historyMap: "Karte",
      historyCall: "Anrufen",
      locationHeading: "Standort",
      locationRetry: "Erneut versuchen",
      locationForce: "Standort verwenden",
      locationUse: "Nächste Filiale wählen",
      loading: "Filialdaten werden geladen…",
      footer: "Erstellt von Rumcajs mit Hilfe künstlicher Intelligenz."
    };
  }

  function currentLanguage() {
    try {
      const saved = localStorage.getItem(typeof LANGUAGE_KEY !== "undefined" ? LANGUAGE_KEY : "europris-language");
      if (["pl", "no", "en", "de"].includes(saved)) return saved;
    } catch (_) {}

    if (typeof language !== "undefined" && ["pl", "no", "en", "de"].includes(language)) {
      return language;
    }

    return "pl";
  }

  function setLanguage(nextLanguage) {
    if (!["pl", "no", "en", "de"].includes(nextLanguage)) return;

    if (nextLanguage !== "de") {
      const originalButton = document.querySelector(`.languages [data-lang="${nextLanguage}"]`);
      if (originalButton) {
        originalButton.click();
        return;
      }
    }

    addGermanTranslations();

    if (typeof language !== "undefined") {
      language = nextLanguage;
    }

    try {
      localStorage.setItem(
        typeof LANGUAGE_KEY !== "undefined" ? LANGUAGE_KEY : "europris-language",
        nextLanguage
      );
    } catch (_) {}

    if (typeof applyLanguage === "function") {
      applyLanguage();
    }
  }

  function start() {
    const controls = document.querySelector(".topbar-controls");
    if (!controls || controls.querySelector(".europris-header-actions")) return;

    addGermanTranslations();

    const wrapper = document.createElement("div");
    wrapper.className = "europris-header-actions";

    const select = document.createElement("select");
    select.className = "europris-language-select";
    select.setAttribute("aria-label", labels.pl.language);

    [
      ["pl", "PL"],
      ["no", "NO"],
      ["en", "EN"],
      ["de", "DE"]
    ].forEach(([value, name]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = name;
      select.appendChild(option);
    });

    const infoButton = document.createElement("button");
    infoButton.type = "button";
    infoButton.className = "europris-info-button";

    const dialog = document.createElement("dialog");
    dialog.className = "europris-info-dialog";
    dialog.innerHTML = `
      <div class="europris-info-content">
        <h2 class="europris-info-title"></h2>
        <p class="europris-info-text"></p>
        <button type="button" class="europris-info-close"></button>
      </div>
    `;
    document.body.appendChild(dialog);

    const dialogTitle = dialog.querySelector(".europris-info-title");
    const dialogText = dialog.querySelector(".europris-info-text");
    const closeButton = dialog.querySelector(".europris-info-close");

    function updateLabels() {
      const selected = currentLanguage();
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
      updateLabels();
    });

    infoButton.addEventListener("click", () => {
      updateLabels();
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    });

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });

    wrapper.append(select, infoButton);
    controls.insertBefore(wrapper, controls.firstChild);

    const savedLanguage = currentLanguage();
    if (savedLanguage === "de") {
      setLanguage("de");
    }

    updateLabels();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
