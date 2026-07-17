(() => {
  "use strict";

  const PLAN_KEY = "europris_admin_plan_v1";
  const PANEL_ID = "allDriversPanelV502";

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
      title: "Sjåfører og biler",
      choose: "Velg sjåfør / bil",
      placeholder: "Trykk for å velge sjåfør / bil",
      noPlan: "Ingen plan for valgt dag.",
      stores: n => `${n} butikker`,
      pallets: n => `${n} paller`,
      unknown: "Ukjent sjåfør / bil",
      phone: "Telefon",
      deadline: "Tid",
      palletsLabel: "Paller",
      details: "Detaljer"
    };
    if (lang === "en") return {
      title: "Drivers and vehicles",
      choose: "Select driver / vehicle",
      placeholder: "Tap to select a driver / vehicle",
      noPlan: "No plan for the selected day.",
      stores: n => `${n} stores`,
      pallets: n => `${n} pallets`,
      unknown: "Unknown driver / vehicle",
      phone: "Phone",
      deadline: "Time",
      palletsLabel: "Pallets",
      details: "Details"
    };
    return {
      title: "Kierowcy i auta",
      choose: "Wybierz kierowcę / auto",
      placeholder: "Kliknij, aby wybrać kierowcę / auto",
      noPlan: "Brak planu na wybrany dzień.",
      stores: n => `${n} sklepów`,
      pallets: n => `${n} palet`,
      unknown: "Nieznany kierowca / auto",
      phone: "Telefon",
      deadline: "Godzina",
      palletsLabel: "Palety",
      details: "Szczegóły"
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
        map.set(key, { key, name, phone, rows: [] });
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

  function compactStoreList(group) {
    return group.rows
      .map(row => {
        const number = String(row.storeNumber || "").trim();
        const name = String(row.storeName || "").trim();
        return number && name ? `${number} ${name}` : (number || name || "—");
      })
      .join(" • ");
  }

  function createPanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    const oldPanel = document.getElementById("allDriversPanelV501");
    if (oldPanel) oldPanel.remove();

    const adminPanel = document.getElementById("adminPanel");
    const planList = document.getElementById("adminPlanList");
    if (!adminPanel || !planList) return null;

    panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.className = "all-drivers-panel compact";
    planList.insertAdjacentElement("afterend", panel);
    return panel;
  }

  function renderSelected(group, text, target) {
    target.replaceChildren();

    if (!group) {
      target.hidden = true;
      return;
    }

    target.hidden = false;

    const card = document.createElement("section");
    card.className = "selected-driver-card";

    const head = document.createElement("div");
    head.className = "selected-driver-head";

    const left = document.createElement("div");

    const name = document.createElement("div");
    name.className = "selected-driver-name";
    name.textContent = group.name || text.unknown;
    left.append(name);

    if (group.phone) {
      const phone = document.createElement("a");
      phone.className = "selected-driver-phone";
      phone.href = telHref(group.phone);
      phone.textContent = `☎ ${group.phone}`;
      left.append(phone);
    }

    const pallets = group.rows.reduce((sum, row) => sum + (Number(row.pallets) || 0), 0);

    const summary = document.createElement("div");
    summary.className = "selected-driver-summary";
    summary.innerHTML = `<span>${text.stores(group.rows.length)}</span><span>${text.pallets(pallets)}</span>`;

    head.append(left, summary);
    card.append(head);

    const stops = document.createElement("div");
    stops.className = "selected-driver-stops";

    group.rows.forEach(row => {
      const stop = document.createElement("article");
      stop.className = "selected-driver-stop";

      const store = document.createElement("div");
      store.className = "selected-driver-store";
      store.textContent = `${row.storeNumber || "—"} — ${row.storeName || "—"}`;

      const meta = document.createElement("div");
      meta.className = "selected-driver-meta";
      meta.textContent = [
        row.deadline ? `${text.deadline}: ${row.deadline}` : "",
        `${text.palletsLabel}: ${Number(row.pallets) || 0}`
      ].filter(Boolean).join(" • ");

      stop.append(store, meta);
      stops.append(stop);
    });

    card.append(stops);
    target.append(card);
  }

  function render() {
    const panel = createPanel();
    if (!panel) return;

    const text = labels();
    const plan = readPlan();
    panel.replaceChildren();

    const title = document.createElement("h3");
    title.className = "all-drivers-title";
    title.textContent = text.title;
    panel.append(title);

    if (!plan?.rows?.length) {
      const empty = document.createElement("div");
      empty.className = "all-drivers-empty";
      empty.textContent = text.noPlan;
      panel.append(empty);
      return;
    }

    const groups = groupRows(plan.rows);

    const select = document.createElement("select");
    select.className = "all-drivers-select compact";
    select.setAttribute("aria-label", text.choose);

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = text.placeholder;
    placeholder.selected = true;
    select.append(placeholder);

    groups.forEach(group => {
      const option = document.createElement("option");
      option.value = group.key;
      const stores = compactStoreList(group);
      option.textContent = `${group.name || text.unknown} — ${stores}`;
      select.append(option);
    });

    panel.append(select);

    const selected = document.createElement("div");
    selected.className = "selected-driver-details";
    selected.hidden = true;
    panel.append(selected);

    select.addEventListener("change", () => {
      const group = groups.find(item => item.key === select.value) || null;
      renderSelected(group, text, selected);
    });
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

    window.setInterval(refreshWhenVisible, 2500);
  });

  window.EuroprisAllDrivers = Object.freeze({ render });
})();