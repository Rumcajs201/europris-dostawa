(() => {
  "use strict";

  const textByLanguage = {
    pl: {
      working: "Już pracuję, poczekaj chwilę…",
      excel: "Przygotowuję plik Excel",
      summary: "Przygotowuję podsumowanie miesiąca",
      back: "Wróć do aplikacji"
    },
    no: {
      working: "Jeg jobber med det, vent litt…",
      excel: "Forbereder Excel-filen",
      summary: "Forbereder månedsoversikten",
      back: "Tilbake til appen"
    },
    en: {
      working: "I’m working on it, please wait…",
      excel: "Preparing the Excel file",
      summary: "Preparing the monthly summary",
      back: "Back to the app"
    },
    de: {
      working: "Ich arbeite daran, bitte kurz warten…",
      excel: "Excel-Datei wird vorbereitet",
      summary: "Monatsübersicht wird vorbereitet",
      back: "Zurück zur App"
    }
  };

  function language() {
    const value = String(document.documentElement.lang || "pl").toLowerCase();
    if (value.startsWith("no") || value.startsWith("nb") || value.startsWith("nn")) return "no";
    if (value.startsWith("en")) return "en";
    if (value.startsWith("de")) return "de";
    return "pl";
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

  let excelBusy = false;

  document.addEventListener("click", event => {
    const button = event.target.closest?.("#historyCsv, #historyPrintSummary");
    if (!button) return;

    const text = textByLanguage[language()] || textByLanguage.pl;

    if (button.id === "historyCsv") {
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
        window.XLSX.writeFile = function(...args) {
          try {
            return originalWriteFile.apply(this, args);
          } finally {
            window.XLSX.writeFile = originalWriteFile;
            window.setTimeout(() => {
              hide();
              excelBusy = false;
              button.disabled = false;
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
