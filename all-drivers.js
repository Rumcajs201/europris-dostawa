(() => {
  "use strict";

  const PLAN_KEY = "europris_admin_plan_v1";
  const PANEL_ID = "allDriversPanelV501";

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function norm(value) {
    return String(value || "")
      .toLocaleLowerCase("nb-NO")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function languageCode() {
    const value = document.documentElement.lang || "pl";
    if (value.startsWith("nb") || value.startsWith("no")) return "no";
    if (value.startsWith("en")) return "en";
    return "pl";
  }

  function labels() {
    const lang = languageCode();
    if (lang === "no") return {
      title: "Alle sjåfører og biler",
      choose: "Velg sjåfør / bil",
      all: "Vis alle",
      noPlan: "Ingen plan for valgt dag.",
      stores: n => `${n} butikker`,
      pallets: n => `${n} paller`,
      unknown: "Ukjent sjåfør / bil",
      phone: "Telefon",
      deadline: "Tid",
      store: "Butikk",
      palletsLabel: "Paller"
    };
    if (lang === "en") return {
      title: "All drivers and vehicles",
      choose: "Select driver / vehicle",
      all: "Show all",
      noPlan: "No plan for the selected day.",
      stores: n => `${n} stores`,
      pallets: n => `${n} pallets`,
      unknown: "Unknown driver / vehicle",
      phone: "Phone",
      deadline: "Time",
      store: "Store",
      palletsLabel: "Pallets"
    };
    return {
      title: "Wszyscy kierowcy i auta",
      choose: "Wybierz kierowcę / auto",
      all: "Pokaż wszystkich",
      noPlan: "Brak planu na wybrany dzień.",
      stores: n => `${n} sklepów`,
      pallets: n => `${n} palet`,
      unknown: "Nieznany kierowca / auto",
      phone: "Telefon",
      deadline: "Godzina",
      store: "Sklep",
      palletsLabel: "Palety"
    };
  }

  function readPlan() {
    try {
      const plan = JSON.parse(localStorage.getItem(PLAN_KEY) || "null");
      return plan && Array.isArray(plan.rows) ? plan : null;
    } catch {
      return null;
    }
  }

  function groupRows(rows) {
    const map = new Map();

    rows.forEach((row, index) => {
      const name = String(row.driver || row.carrier || "").trim();
      const phone = digits(row.phone);
      const key = `${norm(name || "unknown")}|${phone}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          phone,
          rows: []
        });
      }

      const group = map.get(key);
      if (!group.phone && phone) group.phone = phone;
      group.rows.push({ ...row, __index: index });
    });

    return [...map.values()]
      .map(group => ({
        ...group,
        rows: group.rows.sort((a, b) =>
          String(a.deadline || "").localeCompare(String(b.deadline || "")) ||
          Number(a.deliverySequence || 0) - Number(b.deliverySequence || 0)
        )
      }))
      .sort((a, b) => norm(a.name).localeCompare(norm(b.name), "nb"));
  }

  function telHref(phone) {
    const value = digits(phone);
    if (!value) return "";
    return value.length === 8 ? `tel:+47${value}` : `tel:+${value}`;
  }

  function createPanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    const adminPanel = document.getElementById("adminPanel");
    const planList = document.getElementById("adminPlanList");
    if (!adminPanel || !planList) return null;

    panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.className = "all-drivers-panel";
    planList.insertAdjacentElement("afterend", panel);
    return panel;
  }

  function renderStop(row, text) {
    const article = document.createElement("article");
    article.className = "all-drivers-stop";

    const store = document.createElement("div");
    store.className = "all-drivers-stop-store";
    store.textContent = `${row.storeNumber || "—"} — ${row.storeName || "—"}`;

    const meta = document.createElement("div");
    meta.className = "all-drivers-stop-meta";
    meta.textContent = [
      row.deadline ? `${text.deadline}: ${row.deadline}` : "",
      `${text.palletsLabel}: ${Number(row.pallets) || 0}`
    ].filter(Boolean).join(" • ");

    article.append(store, meta);
    return article;
  }

  function render() {
    const panel = createPanel();
    if (!panel) return;

    const text = labels();
    const plan = readPlan();
    panel.replaceChildren();

    const header = document.createElement("div");
    header.className = "all-drivers-header";

    const title = document.createElement("h3");
    title.textContent = text.title;
    header.append(title);
    panel.append(header);

    if (!plan?.rows?.length) {
      const empty = document.createElement("div");
      empty.className = "all-drivers-empty";
      empty.textContent = text.noPlan;
      panel.append(empty);
      return;
    }

    const groups = groupRows(plan.rows);

    const controls = document.createElement("div");
    controls.className = "all-drivers-controls";

    const select = document.createElement("select");
    select.className = "all-drivers-select";
    select.setAttribute("aria-label", text.choose);

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = text.all;
    select.append(allOption);

    groups.forEach(group => {
      const option = document.createElement("option");
      option.value = group.key;
      option.textContent = group.name || text.unknown;
      select.append(option);
    });

    controls.append(select);
    panel.append(controls);

    const summary = document.createElement("div");
    summary.className = "all-drivers-day-summary";
    const allPallets = plan.rows.reduce((sum, row) => sum + (Number(row.pallets) || 0), 0);
    summary.textContent = `${groups.length} • ${text.stores(plan.rows.length)} • ${text.pallets(allPallets)}`;
    panel.append(summary);

    const list = document.createElement("div");
    list.className = "all-drivers-list";
    panel.append(list);

    function draw(filterKey = "") {
      list.replaceChildren();

      const visible = filterKey
        ? groups.filter(group => group.key === filterKey)
        : groups;

      visible.forEach(group => {
        const details = document.createElement("details");
        details.className = "all-drivers-card";
        details.open = Boolean(filterKey) || groups.length === 1;

        const cardSummary = document.createElement("summary");
        cardSummary.className = "all-drivers-card-summary";

        const left = document.createElement("div");
        const name = document.createElement("div");
        name.className = "all-drivers-name";
        name.textContent = group.name || text.unknown;
        left.append(name);

        if (group.phone) {
          const phone = document.createElement("a");
          phone.className = "all-drivers-phone";
          phone.href = telHref(group.phone);
          phone.textContent = `☎ ${group.phone}`;
          phone.addEventListener("click", event => event.stopPropagation());
          left.append(phone);
        }

        const count = document.createElement("div");
        count.className = "all-drivers-count";
        const pallets = group.rows.reduce((sum, row) => sum + (Number(row.pallets) || 0), 0);
        count.innerHTML = `<span>${text.stores(group.rows.length)}</span><span>${text.pallets(pallets)}</span>`;

        cardSummary.append(left, count);
        details.append(cardSummary);

        const body = document.createElement("div");
        body.className = "all-drivers-card-body";
        group.rows.forEach(row => body.append(renderStop(row, text)));

        details.append(body);
        list.append(details);
      });
    }

    select.addEventListener("change", () => draw(select.value));
    draw();
  }

  function panelVisible() {
    const adminPanel = document.getElementById("adminPanel");
    return adminPanel && !adminPanel.hidden;
  }

  function refreshWhenVisible() {
    if (panelVisible()) render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    createPanel();
    refreshWhenVisible();

    const adminPanel = document.getElementById("adminPanel");
    if (adminPanel) {
      new MutationObserver(refreshWhenVisible)
        .observe(adminPanel, { attributes: true, attributeFilter: ["hidden"] });
    }

    document.getElementById("adminDeliveryDate")
      ?.addEventListener("change", () => {
        window.setTimeout(refreshWhenVisible, 500);
        window.setTimeout(refreshWhenVisible, 1600);
      });

    document.querySelectorAll("[data-lang]").forEach(button => {
      button.addEventListener("click", () => window.setTimeout(refreshWhenVisible, 0));
    });

    window.setInterval(refreshWhenVisible, 2000);
  });

  window.EuroprisAllDrivers = Object.freeze({ render });
})();