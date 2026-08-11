(() => {
  "use strict";

  const DB_NAME = "europris_delivery_history";
  const DB_VERSION = 2;
  const DB_STORE = "deliveries";
  const ADMIN_PLAN_KEY = "europris_admin_plan_v1";
  const PROFILE_KEY = "europris_history_backup_profile_v1";
  const PROFILE_PREFIX = "europris_admin_profile_v2_";
  const API_URL = "https://script.google.com/macros/s/AKfycbzalC81iNvpLXuymmbMVI4pYB1FzuTXHgnvG4kegKspl7Mfd5j11BGW9W5Gv9xXsM1lMg/exec";
  const API_TOKEN = "hBsuU2uyQQ6WO3MbA30DtVLb2SJhuiblRqH77g1Ns9M";
  const REPAIR_FROM = "2026-08-07";
  const planCache = new Map();

  const labels = {
    pl: { title:"Puste palety?", hint:"Wpisz liczbę zabranych pustych palet.", save:"Dalej", cancel:"Anuluj", invalid:"Wpisz prawidłową liczbę." },
    no: { title:"Tomme paller?", hint:"Skriv inn antall tomme paller som er tatt med.", save:"Fortsett", cancel:"Avbryt", invalid:"Skriv inn et gyldig tall." },
    en: { title:"Empty pallets?", hint:"Enter the number of empty pallets collected.", save:"Continue", cancel:"Cancel", invalid:"Enter a valid number." },
    de: { title:"Leere Paletten?", hint:"Anzahl der mitgenommenen leeren Paletten eingeben.", save:"Weiter", cancel:"Abbrechen", invalid:"Geben Sie eine gültige Zahl ein." }
  };

  function language() {
    const value = String(document.documentElement.lang || "pl").toLowerCase();
    if (value.startsWith("no") || value.startsWith("nb") || value.startsWith("nn")) return "no";
    if (value.startsWith("en")) return "en";
    if (value.startsWith("de")) return "de";
    return "pl";
  }

  function localDateKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function currentProfile() {
    let id = "";
    try { id = String(localStorage.getItem(PROFILE_KEY) || "").trim(); } catch (_) {}

    let saved = null;
    if (id) {
      try { saved = JSON.parse(localStorage.getItem(`${PROFILE_PREFIX}${id}`) || "null"); } catch (_) {}
    }

    const defaults = {
      andrzej: { name:"Andrzej", aliases:["Andrzej","Osowski","A. Osowski"] },
      kamil: { name:"Kamil", aliases:["Kamil"] },
      lukasz: { name:"Łukasz", aliases:["Łukasz","Bartek"] }
    };
    const fallback = defaults[id] || null;
    const name = String(saved?.name || fallback?.name || "").trim();
    const aliases = Array.isArray(saved?.aliases) ? saved.aliases : (fallback?.aliases || []);
    return [name, ...aliases].map(normalize).filter(Boolean);
  }

  function driverMatches(row, aliases) {
    if (!aliases.length) return false;
    const driver = normalize(row?.driver);
    if (!driver) return false;
    return aliases.some(alias => driver === alias || driver.includes(alias) || alias.includes(driver));
  }

  function rowForEntry(plan, entry) {
    if (!plan?.rows?.length || !entry) return null;
    const storeNumber = String(entry.storeNumber || "");
    const tour = String(entry.tourNumber || "1");
    const candidates = plan.rows.filter(row =>
      String(row.storeNumber || "") === storeNumber &&
      String(row.tour12 || "1") === tour
    );
    if (!candidates.length) return null;

    const aliases = currentProfile();
    const own = candidates.filter(row => driverMatches(row, aliases));
    if (own.length) return own[0];
    if (candidates.length === 1) return candidates[0];
    return null;
  }

  function cachedLocalPlan(dateKey) {
    try {
      const plan = JSON.parse(localStorage.getItem(ADMIN_PLAN_KEY) || "null");
      if (plan?.rows?.some(row => String(row.deliveryDate || "") === dateKey)) return plan;
    } catch (_) {}
    return null;
  }

  function jsonpPlan(dateKey) {
    return new Promise((resolve, reject) => {
      const callback = `__europrisPalletFix_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => { cleanup(); reject(new Error("timeout")); }, 20000);
      function cleanup() {
        window.clearTimeout(timeout);
        try { delete window[callback]; } catch (_) { window[callback] = undefined; }
        script.remove();
      }
      window[callback] = data => {
        cleanup();
        if (data?.ok && Array.isArray(data.rows)) resolve(data);
        else reject(new Error("no_plan"));
      };
      const query = new URLSearchParams({
        action:"plan",
        token:API_TOKEN,
        callback,
        date:dateKey,
        _:String(Date.now())
      });
      script.src = `${API_URL}?${query.toString()}`;
      script.onerror = () => { cleanup(); reject(new Error("network")); };
      document.head.appendChild(script);
    });
  }

  async function fetchPlan(dateKey) {
    if (!dateKey) return null;
    if (planCache.has(dateKey)) return planCache.get(dateKey);
    const local = cachedLocalPlan(dateKey);
    if (local) {
      planCache.set(dateKey, local);
      return local;
    }
    try {
      const remote = await jsonpPlan(dateKey);
      planCache.set(dateKey, remote);
      return remote;
    } catch (_) {
      return null;
    }
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getAllDeliveries() {
    const db = await openDatabase();
    const rows = await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const request = tx.objectStore(DB_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return rows;
  }

  async function putDeliveries(items) {
    if (!items.length) return;
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      const store = tx.objectStore(DB_STORE);
      items.forEach(item => store.put(item));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async function repairHistory() {
    let rows;
    try { rows = await getAllDeliveries(); } catch (_) { return 0; }

    const targets = rows.filter(item =>
      localDateKey(item.createdAt) >= REPAIR_FROM &&
      (Number(item.pallets) || 0) === 0
    );
    if (!targets.length) return 0;

    const byDate = new Map();
    targets.forEach(item => {
      const day = localDateKey(item.createdAt);
      if (!byDate.has(day)) byDate.set(day, []);
      byDate.get(day).push(item);
    });

    const changed = [];
    for (const [day, items] of byDate) {
      const plan = await fetchPlan(day);
      if (!plan?.rows?.length) continue;
      for (const item of items) {
        const row = rowForEntry(plan, item);
        const pallets = Number(row?.pallets) || 0;
        if (pallets > 0) {
          item.pallets = pallets;
          item.trailerCount = String(item.tourNumber || row?.tour12 || "").trim() ? 1 : 0;
          changed.push(item);
        }
      }
    }

    if (changed.length) {
      try {
        await putDeliveries(changed);
        const month = document.getElementById("historyMonth");
        if (month && !document.getElementById("historyPanel")?.hidden) {
          month.dispatchEvent(new Event("change", { bubbles:true }));
        }
      } catch (_) {}
    }
    return changed.length;
  }

  // Przy nowym zapisie wykorzystuj już pobrany plan, aby liczba palet
  // trafiła do historii od razu, a nie dopiero przy eksporcie.
  const originalAdd = IDBObjectStore.prototype.add;
  IDBObjectStore.prototype.add = function(value, key) {
    if (this.name === DB_STORE && value && typeof value === "object" && (Number(value.pallets) || 0) === 0) {
      const day = localDateKey(value.createdAt || new Date());
      const plan = planCache.get(day) || cachedLocalPlan(day);
      const row = rowForEntry(plan, value);
      const pallets = Number(row?.pallets) || 0;
      if (pallets > 0) {
        value = { ...value, pallets, trailerCount: String(value.tourNumber || row?.tour12 || "").trim() ? 1 : 0 };
      }
    }
    const request = arguments.length > 1 ? originalAdd.call(this, value, key) : originalAdd.call(this, value);
    if (this.name === DB_STORE) window.setTimeout(() => void repairHistory(), 700);
    return request;
  };

  function ensureDialogStyle() {
    if (document.getElementById("emptyPalletNumericStyle")) return;
    const style = document.createElement("style");
    style.id = "emptyPalletNumericStyle";
    style.textContent = `
      .empty-pallet-dialog{width:min(calc(100% - 30px),360px);padding:0;border:1px solid var(--border);border-radius:18px;background:var(--card);color:var(--text);box-shadow:0 20px 60px rgba(0,0,0,.35)}
      .empty-pallet-dialog::backdrop{background:rgba(0,0,0,.58)}
      .empty-pallet-form{display:grid;gap:12px;padding:18px}
      .empty-pallet-title{margin:0;color:var(--green);font-size:1.15rem}
      .empty-pallet-hint{margin:0;color:var(--muted);font-size:.84rem;line-height:1.4}
      .empty-pallet-input{width:100%;min-height:54px;border:2px solid var(--green);border-radius:12px;background:transparent;color:var(--text);font:inherit;font-size:1.35rem;font-weight:900;text-align:center}
      .empty-pallet-error{min-height:18px;color:#d71920;font-size:.8rem;font-weight:800;text-align:center}
      .empty-pallet-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .empty-pallet-actions button{min-height:44px;border:1px solid var(--green);border-radius:11px;background:transparent;color:var(--green);font:inherit;font-weight:850}
      .empty-pallet-actions .primary{background:var(--green);color:#fff}
    `;
    document.head.appendChild(style);
  }

  function askEmptyPalletsNumeric() {
    ensureDialogStyle();
    const text = labels[language()] || labels.pl;
    const dialog = document.createElement("dialog");
    dialog.className = "empty-pallet-dialog";
    const form = document.createElement("form");
    form.className = "empty-pallet-form";
    form.innerHTML = `
      <h2 class="empty-pallet-title"></h2>
      <p class="empty-pallet-hint"></p>
      <input class="empty-pallet-input" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" autocomplete="off" value="0" aria-label="${text.title}">
      <div class="empty-pallet-error"></div>
      <div class="empty-pallet-actions"><button type="button"></button><button type="submit" class="primary"></button></div>
    `;
    form.querySelector(".empty-pallet-title").textContent = text.title;
    form.querySelector(".empty-pallet-hint").textContent = text.hint;
    const input = form.querySelector(".empty-pallet-input");
    const error = form.querySelector(".empty-pallet-error");
    const cancel = form.querySelector('.empty-pallet-actions button[type="button"]');
    const submit = form.querySelector('.empty-pallet-actions .primary');
    cancel.textContent = text.cancel;
    submit.textContent = text.save;
    dialog.appendChild(form);
    document.body.appendChild(dialog);

    return new Promise(resolve => {
      let done = false;
      const finish = value => {
        if (done) return;
        done = true;
        if (dialog.open) dialog.close();
        dialog.remove();
        resolve(value);
      };
      cancel.addEventListener("click", () => finish(null));
      dialog.addEventListener("cancel", event => { event.preventDefault(); finish(null); });
      form.addEventListener("submit", event => {
        event.preventDefault();
        const raw = String(input.value || "").replace(/\D/g, "");
        if (raw === "") {
          error.textContent = text.invalid;
          input.focus();
          return;
        }
        finish(String(Math.max(0, Number(raw) || 0)));
      });
      input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, "").slice(0, 4); });
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      window.setTimeout(() => { input.focus(); input.select(); }, 40);
    });
  }

  let bypass = false;
  function installNumericEmptyPalletInput() {
    const button = document.getElementById("openSave");
    if (!button || button.dataset.numericEmptyPallets === "1") return false;
    button.dataset.numericEmptyPallets = "1";

    button.addEventListener("click", async event => {
      if (bypass) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      const today = localDateKey(new Date());
      const planPromise = fetchPlan(today);
      const value = await askEmptyPalletsNumeric();
      if (value === null) return;
      await Promise.race([planPromise, new Promise(resolve => setTimeout(resolve, 2500))]);

      const originalPrompt = window.prompt;
      let used = false;
      window.prompt = function(...args) {
        if (!used) {
          used = true;
          return value;
        }
        return originalPrompt.apply(this, args);
      };

      bypass = true;
      try { button.click(); }
      finally {
        bypass = false;
        window.prompt = originalPrompt;
      }
    }, true);
    return true;
  }

  function start() {
    installNumericEmptyPalletInput();
    void fetchPlan(localDateKey(new Date()));
    window.setTimeout(() => void repairHistory(), 500);
    window.addEventListener("pageshow", () => window.setTimeout(() => void repairHistory(), 300));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
})();
