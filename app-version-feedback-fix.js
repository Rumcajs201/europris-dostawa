(() => {
  "use strict";

  const APP_VERSION = "58.26";
  const questions = {
    pl: "Pytania ?",
    no: "Spørsmål ?",
    en: "Questions ?",
    de: "Fragen ?"
  };

  function currentLanguage() {
    const value = String(document.documentElement.lang || "pl").toLowerCase();
    if (value.startsWith("no") || value.startsWith("nb") || value.startsWith("nn")) return "no";
    if (value.startsWith("en")) return "en";
    if (value.startsWith("de")) return "de";
    return "pl";
  }

  function updateVersion() {
    const label = document.getElementById("appVersionLabel");
    const value = `Wersja ${APP_VERSION}`;
    if (label && label.textContent !== value) label.textContent = value;
  }

  function updateInfoButton() {
    const button = document.querySelector(".europris-info-button");
    if (!button) return;
    const lang = currentLanguage();
    const main = lang === "no" ? "Informasjon" : lang === "en" ? "Information" : lang === "de" ? "Informationen" : "Informacje";
    button.innerHTML = `<span class="europris-info-main">${main}</span><span class="europris-info-sub">${questions[lang] || questions.pl}</span>`;
  }

  function install() {
    updateVersion();
    updateInfoButton();

    document.addEventListener("click", event => {
      if (event.target.closest(".europris-info-button") || event.target.closest(".language")) {
        window.setTimeout(updateInfoButton, 80);
      }
    }, true);

    document.querySelector(".europris-language-select")?.addEventListener("change", () => {
      window.setTimeout(updateInfoButton, 80);
    });

    window.setTimeout(updateInfoButton, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();