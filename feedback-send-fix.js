(() => {
  "use strict";

  const FEEDBACK_API_URL = "https://script.google.com/macros/s/AKfycbzalC81iNvpLXuymmbMVI4pYB1FzuTXHgnvG4kegKspl7Mfd5j11BGW9W5Gv9xXsM1lMg/exec";

  const messages = {
    pl: { required:"Wpisz opis zgłoszenia.", emailRequired:"Podaj adres e-mail, na który możemy odpowiedzieć.", emailInvalid:"Wpisz prawidłowy adres e-mail.", sending:"Wysyłanie…", sent:"Zgłoszenie zostało wysłane. Dziękuję.", failed:"Nie udało się wysłać zgłoszenia. Spróbuj ponownie później." },
    no: { required:"Skriv inn en beskrivelse.", emailRequired:"Oppgi en e-postadresse vi kan svare til.", emailInvalid:"Skriv inn en gyldig e-postadresse.", sending:"Sender…", sent:"Meldingen er sendt. Takk.", failed:"Meldingen kunne ikke sendes. Prøv igjen senere." },
    en: { required:"Enter a description.", emailRequired:"Enter an email address where we can reply.", emailInvalid:"Enter a valid email address.", sending:"Sending…", sent:"Your message has been sent. Thank you.", failed:"The message could not be sent. Please try again later." },
    de: { required:"Bitte eine Beschreibung eingeben.", emailRequired:"Geben Sie eine E-Mail-Adresse für unsere Antwort ein.", emailInvalid:"Geben Sie eine gültige E-Mail-Adresse ein.", sending:"Wird gesendet…", sent:"Die Meldung wurde gesendet. Vielen Dank.", failed:"Die Meldung konnte nicht gesendet werden. Bitte später erneut versuchen." }
  };

  function language() {
    const value = String(document.documentElement.lang || "pl").toLowerCase();
    if (value.startsWith("no") || value.startsWith("nb") || value.startsWith("nn")) return "no";
    if (value.startsWith("en")) return "en";
    if (value.startsWith("de")) return "de";
    return "pl";
  }

  function appVersion() {
    const text = document.getElementById("appVersionLabel")?.textContent || "";
    return text.replace(/^\D+/, "").trim() || "unknown";
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  document.addEventListener("submit", async event => {
    const form = event.target.closest?.(".europris-feedback-form");
    if (!form) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const lang = language();
    const text = messages[lang] || messages.pl;
    const type = form.querySelector("select");
    const contact = form.querySelector('input[type="email"]') || form.querySelector("input");
    const description = form.querySelector("textarea");
    const send = form.querySelector(".europris-feedback-submit");
    const status = form.querySelector(".europris-feedback-status");
    const email = String(contact?.value || "").trim();
    const message = String(description?.value || "").trim();

    if (!email) {
      if (status) {
        status.textContent = text.emailRequired;
        status.className = "europris-feedback-status is-error";
      }
      contact?.focus();
      return;
    }

    if (!validEmail(email)) {
      if (status) {
        status.textContent = text.emailInvalid;
        status.className = "europris-feedback-status is-error";
      }
      contact?.focus();
      return;
    }

    if (!message) {
      if (status) {
        status.textContent = text.required;
        status.className = "europris-feedback-status is-error";
      }
      description?.focus();
      return;
    }

    if (send) send.disabled = true;
    if (status) {
      status.textContent = text.sending;
      status.className = "europris-feedback-status";
    }

    const payload = {
      action: "feedback",
      source: "europris-dostawa",
      type: type?.value || "other",
      storeNumber: "",
      contact: email,
      message,
      language: lang,
      appVersion: appVersion(),
      page: location.href,
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString()
    };

    try {
      await fetch(FEEDBACK_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(payload),
        cache: "no-store",
        redirect: "follow"
      });

      if (status) {
        status.textContent = text.sent;
        status.className = "europris-feedback-status is-ok";
      }
      if (description) description.value = "";
    } catch (error) {
      console.error("Feedback send:", error);
      if (status) {
        status.textContent = text.failed;
        status.className = "europris-feedback-status is-error";
      }
    } finally {
      if (send) send.disabled = false;
    }
  }, true);
})();