(() => {
  "use strict";

  const EXCEL_COLUMNS_KEY = "europris_excel_columns_v1";
  const DB_NAME = "europris_delivery_history";
  const DB_VERSION = 2;
  const DB_STORE = "deliveries";

  const textByLanguage = {
    pl: {
      working: "Już pracuję, poczekaj chwilę…",
      excel: "Przygotowuję plik Excel",
      summary: "Przygotowuję podsumowanie miesiąca",
      back: "Wróć do aplikacji",
      chooseTitle: "Wybierz dane do Excela",
      chooseInfo: "Data jest obowiązkowa. Pozostałe kolumny możesz dowolnie zaznaczyć.",
      cancel: "Anuluj",
      create: "Utwórz Excel",
      columns: {
        date: "Data (obowiązkowa)", time: "Godzina", tour: "Kurs",
        trailer: "Numer naczepy", storeNumber: "Numer sklepu",
        storeName: "Nazwa sklepu", pallets: "Liczba palet",
        trailerCount: "Liczba naczep", emptyPallets: "Puste palety",
        address: "Adres sklepu"
      },
      headers: {
        date: "Data", time: "Godzina", tour: "Kurs", trailer: "Naczepa",
        storeNumber: "Nr sklepu", storeName: "Nazwa sklepu",
        pallets: "Liczba palet", trailerCount: "Liczba naczep",
        emptyPallets: "Puste palety", address: "Adres sklepu"
      }
    },
    no: {
      working: "Jeg jobber med det, vent litt…",
      excel: "Forbereder Excel-filen",
      summary: "Forbereder månedsoversikten",
      back: "Tilbake til appen",
      chooseTitle: "Velg data til Excel",
      chooseInfo: "Dato er obligatorisk. De andre kolonnene kan velges fritt.",
      cancel: "Avbryt",
      create: "Opprett Excel",
      columns: {
        date: "Dato (obligatorisk)", time: "Klokkeslett", tour: "Tur",
        trailer: "Tilhengernummer", storeNumber: "Butikknummer",
        storeName: "Butikknavn", pallets: "Antall paller",
        trailerCount: "Antall tilhengere", emptyPallets: "Tomme paller",
        address: "Butikkadresse"
      },
      headers: {
        date: "Dato", time: "Klokkeslett", tour: "Tur", trailer: "Tilhenger",
        storeNumber: "Butikknr.", storeName: "Butikknavn",
        pallets: "Antall paller", trailerCount: "Antall tilhengere",
        emptyPallets: "Tomme paller", address: "Butikkadresse"
      }
    },
    en: {
      working: "I’m working on it, please wait…",
      excel: "Preparing the Excel file",
      summary: "Preparing the monthly summary",
      back: "Back to the app",
      chooseTitle: "Choose Excel data",
      chooseInfo: "Date is required. You can freely select the other columns.",
      cancel: "Cancel",
      create: "Create Excel",
      columns: {
        date: "Date (required)", time: "Time", tour: "Trip",
        trailer: "Trailer number", storeNumber: "Store number",
        storeName: "Store name", pallets: "Number of pallets",
        trailerCount: "Number of trailers", emptyPallets: "Empty pallets",
        address: "Store address"
      },
      headers: {
        date: "Date", time: "Time", tour: "Trip", trailer: "Trailer",
        storeNumber: "Store no.", storeName: "Store name",
        pallets: "Number of pallets", trailerCount: "Number of trailers",
        emptyPallets: "Empty pallets", address: "Store address"
      }
    },
    de: {
      working: "Ich arbeite daran, bitte kurz warten…",
      excel: "Excel-Datei wird vorbereitet",
      summary: "Monatsübersicht wird vorbereitet",
      back: "Zurück zur App",
      chooseTitle: "Excel-Daten auswählen",
      chooseInfo: "Das Datum ist erforderlich. Die übrigen Spalten sind frei wählbar.",
      cancel: "Abbrechen",
      create: "Excel erstellen",
      columns: {
        date: "Datum (erforderlich)", time: "Uhrzeit", tour: "Tour",
        trailer: "Aufliegernummer", storeNumber: "Filialnummer",
        storeName: "Filialname", pallets: "Anzahl Paletten",
        trailerCount: "Anzahl Auflieger", emptyPallets: "Leere Paletten",
        address: "Filialadresse"
      },
      headers: {
        date: "Datum", time: "Uhrzeit", tour: "Tour", trailer: "Auflieger",
        storeNumber: "Filialnr.", storeName: "Filialname",
        pallets: "Anzahl Paletten", trailerCount: "Anzahl Auflieger",
        emptyPallets: "Leere Paletten", address: "Filialadresse"
      }
    }
  };

  const columnOrder = [
    "date", "time", "tour", "trailer", "storeNumber", "storeName",
    "pallets", "trailerCount", "emptyPallets", "address"
  ];
  const defaultColumns = [
    "date", "time", "tour", "trailer", "storeNumber", "storeName",
    "pallets", "trailerCount", "emptyPallets"
  ];
  const sourceColumnIndex = Object.freeze({
    date: 0, time: 1, tour: 2, trailer: 3, storeNumber: 4,
    storeName: 5, pallets: 6, trailerCount: 7
  });

  let excelBusy = false;
  let excelSelectionBypass = false;
  let activeExcelColumns = defaultColumns.slice();
  let activeExcelEntries = [];

  function language() {
    const value = String(document.documentElement.lang || "pl").toLowerCase();
    if (value.startsWith("no") || value.startsWith("nb") || value.startsWith("nn")) return "no";
    if (value.startsWith("en")) return "en";
    if (value.startsWith("de")) return "de";
    return "pl";
  }

  function localDateKey(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function loadSavedColumns() {
    try {
      const saved = JSON.parse(localStorage.getItem(EXCEL_COLUMNS_KEY) || "null");
      if (!Array.isArray(saved)) return defaultColumns.slice();
      const valid = columnOrder.filter(key => key === "date" || saved.includes(key));
      return valid.length ? valid : defaultColumns.slice();
    } catch (_) {
      return defaultColumns.slice();
    }
  }

  function saveColumns(columns) {
    try { localStorage.setItem(EXCEL_COLUMNS_KEY, JSON.stringify(columns)); } catch (_) {}
  }

  function ensureOverlay() {
    let overlay = document.getElementById("rumcajsWorkingOverlay");
    if (overlay) return overlay;

    const style = document.createElement("style");
    style.id = "rumcajsWorkingOverlayStyles";
    style.textContent = `
      #rumcajsWorkingOverlay{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:22px;background:rgba(4,18,11,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
      #rumcajsWorkingOverlay[hidden]{display:none}
      .rumcajs-working-card{width:min(100%,360px);padding:25px 22px 23px;border:1px solid rgba(255,255,255,.22);border-radius:22px;background:var(--card,#fff);color:var(--text,#111827);text-align:center;box-shadow:0 22px 70px rgba(0,0,0,.38)}
      .rumcajs-working-logo{width:92px;height:112px;object-fit:contain;filter:drop-shadow(0 4px 5px rgba(0,0,0,.22))}
      .rumcajs-working-title{margin:8px 0 7px;color:var(--green,#08783e);font-size:1.22rem;font-weight:950;line-height:1.25}
      .rumcajs-working-detail{margin:0;color:var(--muted,#6b7280);font-size:.92rem;font-weight:750;line-height:1.35}
      .rumcajs-working-spinner{width:42px;height:42px;margin:19px auto 0;border:5px solid color-mix(in srgb,var(--green,#08783e) 22%,transparent);border-top-color:var(--green,#08783e);border-radius:50%;animation:rumcajsSpin .8s linear infinite}
      @keyframes rumcajsSpin{to{transform:rotate(360deg)}}
      @media(prefers-reduced-motion:reduce){.rumcajs-working-spinner{animation-duration:1.8s}}
    `;
    document.head.appendChild(style);

    overlay = document.createElement("div");
    overlay.id = "rumcajsWorkingOverlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.innerHTML = `
      <div class="rumcajs-working-card">
        <img class="rumcajs-working-logo" src="rumcajs-logo.png?v=25" alt="Rumcajs">
        <div class="rumcajs-working-title"></div>
        <p class="rumcajs-working-detail"></p>
        <div class="rumcajs-working-spinner" aria-hidden="true"></div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function show(detail) {
    const overlay = ensureOverlay();
    const text = textByLanguage[language()] || textByLanguage.pl;
    overlay.querySelector(".rumcajs-working-title").textContent = text.working;
    overlay.querySelector(".rumcajs-working-detail").textContent = detail;
    overlay.hidden = false;
    document.documentElement.style.overflow = "hidden";
  }

  function hide() {
    const overlay = document.getElementById("rumcajsWorkingOverlay");
    if (overlay) overlay.hidden = true;
    document.documentElement.style.overflow = "";
  }

  function ensureColumnDialogStyles() {
    if (document.getElementById("excelColumnDialogStyles")) return;
    const style = document.createElement("style");
    style.id = "excelColumnDialogStyles";
    style.textContent = `
      .excel-column-dialog{width:min(calc(100% - 28px),430px);max-height:min(88vh,720px);padding:0;border:1px solid var(--border,#d1d5db);border-radius:20px;background:var(--card,#fff);color:var(--text,#111827);box-shadow:0 24px 75px rgba(0,0,0,.38)}
      .excel-column-dialog::backdrop{background:rgba(4,18,11,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
      .excel-column-form{display:grid;gap:14px;padding:20px}
      .excel-column-header{display:flex;align-items:center;gap:12px}
      .excel-column-logo{width:52px;height:64px;object-fit:contain}
      .excel-column-title{margin:0;color:var(--green,#08783e);font-size:1.18rem;line-height:1.2}
      .excel-column-info{margin:4px 0 0;color:var(--muted,#6b7280);font-size:.84rem;line-height:1.35}
      .excel-column-list{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:48vh;overflow:auto;padding:2px}
      .excel-column-option{display:flex;align-items:center;gap:9px;min-height:46px;padding:8px 10px;border:1px solid var(--border,#d1d5db);border-radius:11px;font-size:.88rem;font-weight:750}
      .excel-column-option input{width:20px;height:20px;accent-color:var(--green,#08783e);flex:0 0 auto}
      .excel-column-option.required{background:color-mix(in srgb,var(--green,#08783e) 9%,transparent)}
      .excel-column-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .excel-column-actions button{min-height:46px;border:1px solid var(--green,#08783e);border-radius:12px;background:transparent;color:var(--green,#08783e);font:inherit;font-weight:850}
      .excel-column-actions .primary{background:var(--green,#08783e);color:#fff}
      @media(max-width:380px){.excel-column-list{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function chooseExcelColumns() {
    ensureColumnDialogStyles();
    const text = textByLanguage[language()] || textByLanguage.pl;
    const saved = loadSavedColumns();
    const dialog = document.createElement("dialog");
    dialog.className = "excel-column-dialog";

    const form = document.createElement("form");
    form.className = "excel-column-form";
    form.method = "dialog";
    form.innerHTML = `
      <div class="excel-column-header">
        <img class="excel-column-logo" src="rumcajs-logo.png?v=25" alt="Rumcajs">
        <div><h2 class="excel-column-title"></h2><p class="excel-column-info"></p></div>
      </div>
      <div class="excel-column-list"></div>
      <div class="excel-column-actions">
        <button type="button" class="cancel"></button>
        <button type="submit" class="primary"></button>
      </div>`;

    form.querySelector(".excel-column-title").textContent = text.chooseTitle;
    form.querySelector(".excel-column-info").textContent = text.chooseInfo;
    form.querySelector(".cancel").textContent = text.cancel;
    form.querySelector(".primary").textContent = text.create;

    const list = form.querySelector(".excel-column-list");
    for (const key of columnOrder) {
      const label = document.createElement("label");
      label.className = `excel-column-option${key === "date" ? " required" : ""}`;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = key;
      input.checked = key === "date" || saved.includes(key);
      input.disabled = key === "date";
      const caption = document.createElement("span");
      caption.textContent = text.columns[key];
      label.append(input, caption);
      list.appendChild(label);
    }

    dialog.appendChild(form);
    document.body.appendChild(dialog);

    return new Promise(resolve => {
      let finished = false;
      const finish = value => {
        if (finished) return;
        finished = true;
        if (dialog.open) dialog.close();
        dialog.remove();
        resolve(value);
      };

      form.querySelector(".cancel").addEventListener("click", () => finish(null));
      dialog.addEventListener("cancel", event => {
        event.preventDefault();
        finish(null);
      });
      dialog.addEventListener("click", event => {
        if (event.target === dialog) finish(null);
      });
      form.addEventListener("submit", event => {
        event.preventDefault();
        const selected = ["date"];
        form.querySelectorAll('input[type="checkbox"]:not(:disabled):checked').forEach(input => {
          if (!selected.includes(input.value)) selected.push(input.value);
        });
        const ordered = columnOrder.filter(key => selected.includes(key));
        saveColumns(ordered);
        finish(ordered);
      });

      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
  }

  function getAllDeliveriesForMonth(month) {
    return new Promise(resolve => {
      let request;
      try { request = indexedDB.open(DB_NAME, DB_VERSION); } catch (_) { resolve([]); return; }
      request.onerror = () => resolve([]);
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(DB_STORE, "readonly");
          const all = tx.objectStore(DB_STORE).getAll();
          all.onerror = () => { db.close(); resolve([]); };
          all.onsuccess = () => {
            const rows = (all.result || [])
              .filter(item => localDateKey(item.createdAt).slice(0, 7) === month)
              .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
            db.close();
            resolve(rows);
          };
        } catch (_) {
          db.close();
          resolve([]);
        }
      };
    });
  }

  function customizeWorkbook(workbook) {
    if (!workbook || !window.XLSX || !activeExcelColumns.length) return workbook;
    const sheetName = workbook.SheetNames?.[0];
    const sheet = sheetName ? workbook.Sheets?.[sheetName] : null;
    if (!sheet) return workbook;

    const text = textByLanguage[language()] || textByLanguage.pl;
    const source = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
    if (!source.length) return workbook;

    const output = [activeExcelColumns.map(key => text.headers[key])];
    let entryIndex = 0;

    for (let rowIndex = 1; rowIndex < source.length; rowIndex++) {
      const row = source[rowIndex] || [];
      const separator = String(row[0] || "").includes("────");
      if (separator) {
        output.push(activeExcelColumns.map(() => "────────"));
        continue;
      }

      const entry = activeExcelEntries[entryIndex++] || {};
      output.push(activeExcelColumns.map(key => {
        if (key === "emptyPallets") return Number(entry.emptyPallets) || 0;
        if (key === "address") return String(entry.address || "");
        return row[sourceColumnIndex[key]] ?? "";
      }));
    }

    const newSheet = XLSX.utils.aoa_to_sheet(output);
    newSheet["!cols"] = activeExcelColumns.map(key => ({
      wch: key === "storeName" || key === "address" ? 28 : key === "date" ? 13 : 15
    }));
    workbook.Sheets[sheetName] = newSheet;
    return workbook;
  }

  function summaryLoadingHtml(text) {
    return `<!doctype html><html lang="${language()}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text.summary}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:22px;background:#f3f4f6;color:#111827;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.card{width:min(100%,360px);padding:25px 22px 23px;border:1px solid #d1d5db;border-radius:22px;background:#fff;text-align:center;box-shadow:0 22px 70px rgba(0,0,0,.18)}img{width:92px;height:112px;object-fit:contain;filter:drop-shadow(0 4px 5px rgba(0,0,0,.22))}h1{margin:8px 0 7px;color:#08783e;font-size:1.22rem;line-height:1.25}p{margin:0;color:#6b7280;font-size:.92rem;font-weight:750;line-height:1.35}.spinner{width:42px;height:42px;margin:19px auto 0;border:5px solid #d7eadf;border-top-color:#08783e;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><main class="card"><img src="rumcajs-logo.png?v=25" alt="Rumcajs"><h1>${text.working}</h1><p>${text.summary}</p><div class="spinner" aria-hidden="true"></div></main></body></html>`;
  }

  function addReturnButton(reportHtml, text) {
    if (!/<\/body>/i.test(reportHtml) || reportHtml.includes("rumcajs-report-back")) return reportHtml;

    const controls = `
<style>
.rumcajs-report-back{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));z-index:99999;transform:translateX(-50%);min-width:210px;min-height:48px;padding:0 20px;border:0;border-radius:14px;background:#08783e;color:#fff;font:800 16px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28)}
@media print{.rumcajs-report-back{display:none!important}}
</style>
<button type="button" class="rumcajs-report-back" onclick="try{if(window.opener&&!window.opener.closed)window.opener.focus()}catch(e){};window.close()">${text.back}</button>`;

    return reportHtml.replace(/<\/body>/i, `${controls}</body>`);
  }

  document.addEventListener("click", async event => {
    const button = event.target.closest?.("#historyCsv, #historyPrintSummary");
    if (!button) return;

    const text = textByLanguage[language()] || textByLanguage.pl;

    if (button.id === "historyCsv" && !excelSelectionBypass) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (excelBusy) return;

      const selected = await chooseExcelColumns();
      if (!selected) return;

      activeExcelColumns = selected;
      activeExcelEntries = await getAllDeliveriesForMonth(
        document.getElementById("historyMonth")?.value || ""
      );
      excelSelectionBypass = true;
      button.click();
      return;
    }

    if (button.id === "historyCsv") {
      excelSelectionBypass = false;
      if (excelBusy) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      excelBusy = true;
      button.disabled = true;
      show(text.excel);

      const originalOpen = window.open;
      window.open = function(...args) {
        if (args[0] === "" && args[1] === "_blank") return null;
        return originalOpen.apply(this, args);
      };
      window.setTimeout(() => { window.open = originalOpen; }, 0);

      const originalWriteFile = window.XLSX?.writeFile;
      if (window.XLSX && typeof originalWriteFile === "function") {
        window.XLSX.writeFile = function(workbook, ...args) {
          try {
            customizeWorkbook(workbook);
            return originalWriteFile.call(this, workbook, ...args);
          } finally {
            window.XLSX.writeFile = originalWriteFile;
            window.setTimeout(() => {
              hide();
              excelBusy = false;
              button.disabled = false;
              activeExcelEntries = [];
            }, 350);
          }
        };
      }

      window.setTimeout(() => {
        if (!excelBusy) return;
        if (window.XLSX && originalWriteFile && window.XLSX.writeFile !== originalWriteFile) {
          window.XLSX.writeFile = originalWriteFile;
        }
        hide();
        excelBusy = false;
        button.disabled = false;
        activeExcelEntries = [];
      }, 90000);
      return;
    }

    show(text.summary);

    const originalOpen = window.open;
    window.open = function(...args) {
      const reportWindow = originalOpen.apply(this, args);
      if (!reportWindow) return reportWindow;

      try {
        const originalWrite = reportWindow.document.write.bind(reportWindow.document);
        let writeCount = 0;

        reportWindow.document.write = function(html) {
          writeCount++;
          const source = String(html || "");
          if (writeCount === 1 || source.includes("Przygotowywanie podsumowania")) {
            return originalWrite(summaryLoadingHtml(text));
          }

          hide();
          return originalWrite(addReturnButton(source, text));
        };

        reportWindow.addEventListener("beforeunload", hide, { once: true });
      } catch (_) {
        hide();
      }

      return reportWindow;
    };

    window.setTimeout(() => { window.open = originalOpen; }, 0);
    window.setTimeout(hide, 90000);
  }, true);
})();
