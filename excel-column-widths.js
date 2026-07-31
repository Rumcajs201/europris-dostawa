(() => {
  "use strict";

  if (!window.XLSX?.utils?.aoa_to_sheet) return;

  const originalAoaToSheet = window.XLSX.utils.aoa_to_sheet;

  const headerTypes = new Map([
    ["data", "date"], ["dato", "date"], ["date", "date"], ["datum", "date"],
    ["godzina", "time"], ["klokkeslett", "time"], ["time", "time"], ["uhrzeit", "time"],
    ["kurs", "tour"], ["tur", "tour"], ["trip", "tour"], ["tour", "tour"],
    ["naczepa", "trailer"], ["tilhenger", "trailer"], ["trailer", "trailer"], ["auflieger", "trailer"],
    ["nr sklepu", "storeNumber"], ["butikknr.", "storeNumber"], ["store no.", "storeNumber"], ["filialnr.", "storeNumber"],
    ["nazwa sklepu", "storeName"], ["butikknavn", "storeName"], ["store name", "storeName"], ["filialname", "storeName"],
    ["liczba palet", "pallets"], ["antall paller", "pallets"], ["number of pallets", "pallets"], ["anzahl paletten", "pallets"],
    ["liczba naczep", "trailerCount"], ["antall tilhengere", "trailerCount"], ["number of trailers", "trailerCount"], ["anzahl auflieger", "trailerCount"],
    ["puste palety", "emptyPallets"], ["tomme paller", "emptyPallets"], ["empty pallets", "emptyPallets"], ["leere paletten", "emptyPallets"],
    ["adres sklepu", "address"], ["butikkadresse", "address"], ["store address", "address"], ["filialadresse", "address"]
  ]);

  const fixedWidths = Object.freeze({
    date: 11,
    time: 9,
    tour: 6,
    trailer: 10,
    storeNumber: 11,
    pallets: 14,
    trailerCount: 16,
    emptyPallets: 15
  });

  function textLength(value) {
    return String(value ?? "").replace(/\n/g, " ").length;
  }

  window.XLSX.utils.aoa_to_sheet = function(data, ...args) {
    const sheet = originalAoaToSheet.call(this, data, ...args);
    if (!Array.isArray(data) || !Array.isArray(data[0])) return sheet;

    const types = data[0].map(value => headerTypes.get(String(value || "").trim().toLowerCase()) || "");
    if (!types.includes("date") || !types.some(Boolean)) return sheet;

    sheet["!cols"] = types.map((type, columnIndex) => {
      if (fixedWidths[type]) return { wch: fixedWidths[type] };

      const longest = data.reduce((max, row) => {
        if (!Array.isArray(row)) return max;
        return Math.max(max, textLength(row[columnIndex]));
      }, 0);

      if (type === "storeName") {
        return { wch: Math.min(50, Math.max(18, longest + 5)) };
      }

      if (type === "address") {
        return { wch: Math.min(50, Math.max(18, longest + 3)) };
      }

      return { wch: Math.max(8, longest + 2) };
    });

    return sheet;
  };
})();
