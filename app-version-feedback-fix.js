(() => {
  "use strict";

  const APP_VERSION = "58.15";

  function updateVersion() {
    const label = document.getElementById("appVersionLabel");
    const value = `Wersja ${APP_VERSION}`;
    if (label && label.textContent !== value) label.textContent = value;
  }

  function clearFeedbackStoreField() {
    const dialog = document.querySelector(".europris-info-dialog");
    if (!dialog) return;

    dialog.querySelectorAll(".europris-feedback-label").forEach(label => {
      const caption = String(label.querySelector("span")?.textContent || "").toLowerCase();
      if (
        caption.includes("numer sklepu") ||
        caption.includes("butikknummer") ||
        caption.includes("store number") ||
        caption.includes("filialnummer")
      ) {
        const input = label.querySelector("input");
        if (input) input.value = "";
      }
    });
  }

  function install() {
    updateVersion();

    document.addEventListener("click", event => {
      if (event.target.closest(".europris-info-button") || event.target.closest(".europris-feedback-reset")) {
        window.setTimeout(clearFeedbackStoreField, 120);
      }
    }, true);

    window.setTimeout(clearFeedbackStoreField, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
