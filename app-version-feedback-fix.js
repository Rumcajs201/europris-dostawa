(() => {
  "use strict";

  const APP_VERSION = "58.14";

  function updateVersion() {
    const label = document.getElementById("appVersionLabel");
    const value = `Wersja ${APP_VERSION}`;
    if (label && label.textContent !== value) label.textContent = value;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateVersion, { once: true });
  } else {
    updateVersion();
  }
})();
