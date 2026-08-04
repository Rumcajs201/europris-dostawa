(() => {
  "use strict";

  const APP_VERSION = "58.13";

  function updateVersion() {
    const label = document.getElementById("appVersionLabel");
    if (label) label.textContent = `Wersja ${APP_VERSION}`;
  }

  function clearFeedbackStoreField(root = document) {
    const dialog = root.querySelector?.(".europris-info-dialog") ||
      (root.matches?.(".europris-info-dialog") ? root : null);
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
    clearFeedbackStoreField();

    document.addEventListener("click", event => {
      if (event.target.closest(".europris-info-button")) {
        window.setTimeout(() => clearFeedbackStoreField(), 0);
      }
      if (event.target.closest(".europris-feedback-reset")) {
        window.setTimeout(() => clearFeedbackStoreField(), 0);
      }
    }, true);

    const observer = new MutationObserver(() => {
      updateVersion();
      clearFeedbackStoreField();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
