(() => {
  "use strict";

  const STORE_URL = "stores.json?v=53";
  const WEATHER_CACHE_MS = 15 * 60 * 1000;
  const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

  const humor = {
    pl: [
      [
        "Poniedziałek. Najpierw kawa, potem reszta świata.",
        "Silnik odpalił. Teraz kolej na kierowcę.",
        "Poniedziałek ma jeden plus: do następnego jeszcze siedem dni.",
        "Nowy tydzień, nowe sklepy, ta sama kawa.",
        "Spokojnie. Piątek już jest w drodze."
      ],
      [
        "Wtorek — już bliżej weekendu niż wczoraj.",
        "Silnik rozgrzany, tydzień też zaczyna łapać obroty.",
        "Wtorek: poniedziałek zaliczony, można jechać dalej.",
        "Dzisiaj kawa pracuje już na pełnych obrotach.",
        "Jeszcze tylko kilka sklepów i będzie środa."
      ],
      [
        "Środa — pół tygodnia w lusterku.",
        "Górka zaliczona. Teraz już z tygodnia jest z górki.",
        "Środa: weekend pojawił się na horyzoncie.",
        "Połowa tygodnia. Kierowca nadal w trasie, kawa nadal na służbie.",
        "Dzisiaj jedziemy środkiem tygodnia."
      ],
      [
        "Czwartek — piątek już mruga długimi.",
        "Jeszcze chwila i weekend sam podjedzie pod rampę.",
        "Czwartek to prawie piątek, tylko z dodatkową trasą.",
        "Weekend coraz bliżej. Widać go już w lusterku.",
        "Dzisiaj motywacja ma zapach piątku."
      ],
      [
        "Piątek! Ostatni sklep i weekend sam się rozładuje.",
        "W powietrzu czuć już weekend i świeżą kawę.",
        "Piątek — nawet tachograf wygląda dziś weselej.",
        "Jeszcze kilka kilometrów i można zaparkować tydzień.",
        "Weekend jest już na awizacji."
      ],
      [
        "Sobota — dzisiaj ładuje się kierowca, nie naczepa.",
        "Tachograf odpoczywa. Ty też możesz.",
        "Sobota: jedyny kurs prowadzi dziś do lodówki.",
        "Dzisiaj bez awizacji. Odpoczynek przyjęty od ręki.",
        "Weekend trwa. Nie przyspieszaj go."
      ],
      [
        "Niedziela — odpoczywaj, jutro silnik znowu zapyta o kawę.",
        "Dzisiaj regeneracja. Trasa poczeka do jutra.",
        "Niedziela: ostatni spokojny parking przed poniedziałkiem.",
        "Naładuj baterie. Telefon też.",
        "Jutro ruszamy. Dzisiaj jeszcze cisza w kabinie."
      ]
    ],
    no: [
      ["Mandag. Først kaffe, så resten av verden.","Motoren er startet. Nå er det sjåførens tur.","Ny uke, nye butikker, samme kaffe.","Rolig — fredag er allerede på vei."],
      ["Tirsdag — nærmere helgen enn i går.","Mandagen er levert. Vi kjører videre.","Motoren er varm, og uka begynner å rulle.","Bare noen butikker til, så er det onsdag."],
      ["Onsdag — halve uka i speilet.","Toppen er nådd. Resten av uka går nedover.","Helgen kan skimtes i horisonten.","Midt i uka, fortsatt på veien."],
      ["Torsdag — fredag blinker med fjernlysene.","Snart kjører helgen inn på rampen.","Torsdag er nesten fredag, bare med en ekstra tur.","Helgen synes allerede i speilet."],
      ["Fredag! Siste butikk, så losses helgen av seg selv.","Det lukter helg og fersk kaffe.","Selv fartsskriveren virker gladere i dag.","Helgen er allerede varslet."],
      ["Lørdag — i dag lades sjåføren, ikke hengeren.","Fartsskriveren hviler. Det kan du også.","Dagens eneste tur går til kjøleskapet.","Hvile er godkjent uten varsling."],
      ["Søndag — hvil, i morgen spør motoren etter kaffe igjen.","I dag er det opplading. Ruten venter.","Siste rolige parkering før mandag.","Lad batteriene. Telefonen også."]
    ],
    en: [
      ["Monday. Coffee first, then the rest of the world.","The engine has started. Now it is the driver's turn.","New week, new stores, same coffee.","Stay calm — Friday is already on its way."],
      ["Tuesday — closer to the weekend than yesterday.","Monday delivered. Keep moving.","The engine is warm and the week is rolling.","A few more stores and it will be Wednesday."],
      ["Wednesday — half the week in the mirror.","The hill is behind us. The rest is downhill.","The weekend is now on the horizon.","Midweek, still on the road."],
      ["Thursday — Friday is flashing its headlights.","The weekend will soon arrive at the ramp.","Thursday is almost Friday, with one extra trip.","The weekend is visible in the mirror."],
      ["Friday! One last store and the weekend unloads itself.","The air smells of weekend and fresh coffee.","Even the tachograph looks happier today.","The weekend is already booked in."],
      ["Saturday — today the driver recharges, not the trailer.","The tachograph is resting. You can too.","Today's only route goes to the fridge.","Rest accepted without booking."],
      ["Sunday — rest now; tomorrow the engine asks for coffee again.","Recharge today. The route can wait.","The last quiet parking spot before Monday.","Charge your batteries. Your phone too."]
    ]
  };

  const ui = {
    pl: {
      humorTitle: "Humor dnia",
      weatherTitle: name => `Pogoda — ${name}`,
      loading: "Pobieranie pogody…",
      unavailable: "Nie udało się pobrać pogody.",
      choose: "Wybierz sklep, aby zobaczyć pogodę.",
      now: "Teraz",
      feels: "odczuwalna",
      wind: "wiatr",
      gusts: "porywy",
      nextHours: "Najbliższe godziny",
      refresh: "Odśwież",
      practical: "Praktyczna informacja na podstawie prognozy, nie oficjalny komunikat.",
      alerts: {
        ice: "Możliwe oblodzenie",
        snow: "Opady śniegu",
        wind: "Silne porywy wiatru",
        rain: "Intensywne opady",
        visibility: "Możliwa gorsza widoczność",
        good: "Bez istotnych utrudnień w najbliższych godzinach"
      }
    },
    no: {
      humorTitle: "Dagens humor",
      weatherTitle: name => `Vær — ${name}`,
      loading: "Henter vær…",
      unavailable: "Kunne ikke hente været.",
      choose: "Velg en butikk for å se været.",
      now: "Nå",
      feels: "føles som",
      wind: "vind",
      gusts: "kast",
      nextHours: "De neste timene",
      refresh: "Oppdater",
      practical: "Praktisk informasjon basert på prognosen, ikke et offisielt varsel.",
      alerts: {
        ice: "Mulig is på veien",
        snow: "Snøfall",
        wind: "Kraftige vindkast",
        rain: "Kraftig nedbør",
        visibility: "Mulig redusert sikt",
        good: "Ingen vesentlige problemer de neste timene"
      }
    },
    en: {
      humorTitle: "Daily humor",
      weatherTitle: name => `Weather — ${name}`,
      loading: "Loading weather…",
      unavailable: "Unable to load weather.",
      choose: "Select a store to see the weather.",
      now: "Now",
      feels: "feels like",
      wind: "wind",
      gusts: "gusts",
      nextHours: "Next hours",
      refresh: "Refresh",
      practical: "Practical information based on the forecast, not an official warning.",
      alerts: {
        ice: "Possible icy roads",
        snow: "Snowfall",
        wind: "Strong wind gusts",
        rain: "Heavy precipitation",
        visibility: "Possible reduced visibility",
        good: "No significant issues in the next few hours"
      }
    }
  };

  let stores = [];
  let selectedStoreNumber = "";
  let requestSerial = 0;

  function lang() {
    const value = document.documentElement.lang || "pl";
    if (value.startsWith("nb") || value.startsWith("no")) return "no";
    if (value.startsWith("en")) return "en";
    return "pl";
  }

  function dateKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function dailyHumor() {
    const d = new Date();
    const language = lang();
    const day = (d.getDay() + 6) % 7; // Monday = 0
    const pool = humor[language][day];
    return pool[hash(`${dateKey()}|${language}`) % pool.length];
  }

  function renderHumor() {
    const card = document.getElementById("dailyHumorCard");
    if (!card) return;
    const text = ui[lang()];
    card.querySelector(".daily-humor-title").textContent = `☕ ${text.humorTitle}`;
    card.querySelector(".daily-humor-text").textContent = dailyHumor();
  }

  function weatherDescription(code, language) {
    const descriptions = {
      pl: {
        0:"bezchmurnie",1:"przeważnie pogodnie",2:"częściowe zachmurzenie",3:"pochmurno",
        45:"mgła",48:"mgła osadzająca szadź",51:"lekka mżawka",53:"mżawka",55:"silna mżawka",
        56:"marznąca mżawka",57:"silna marznąca mżawka",61:"lekki deszcz",63:"deszcz",65:"silny deszcz",
        66:"marznący deszcz",67:"silny marznący deszcz",71:"lekki śnieg",73:"śnieg",75:"silny śnieg",
        77:"ziarna śnieżne",80:"lekkie przelotne opady",81:"przelotne opady",82:"silne przelotne opady",
        85:"przelotny śnieg",86:"silny przelotny śnieg",95:"burza",96:"burza z gradem",99:"silna burza z gradem"
      },
      no: {
        0:"klart",1:"for det meste klart",2:"delvis skyet",3:"overskyet",45:"tåke",48:"rimfrosttåke",
        51:"lett yr",53:"yr",55:"kraftig yr",56:"underkjølt yr",57:"kraftig underkjølt yr",
        61:"lett regn",63:"regn",65:"kraftig regn",66:"underkjølt regn",67:"kraftig underkjølt regn",
        71:"lett snø",73:"snø",75:"kraftig snø",77:"snøkorn",80:"lette regnbyger",81:"regnbyger",
        82:"kraftige regnbyger",85:"snøbyger",86:"kraftige snøbyger",95:"tordenvær",96:"tordenvær med hagl",99:"kraftig tordenvær med hagl"
      },
      en: {
        0:"clear",1:"mainly clear",2:"partly cloudy",3:"overcast",45:"fog",48:"rime fog",
        51:"light drizzle",53:"drizzle",55:"heavy drizzle",56:"freezing drizzle",57:"heavy freezing drizzle",
        61:"light rain",63:"rain",65:"heavy rain",66:"freezing rain",67:"heavy freezing rain",
        71:"light snow",73:"snow",75:"heavy snow",77:"snow grains",80:"light showers",81:"showers",
        82:"heavy showers",85:"snow showers",86:"heavy snow showers",95:"thunderstorm",96:"thunderstorm with hail",99:"severe thunderstorm with hail"
      }
    };
    return descriptions[language][Number(code)] || "—";
  }

  function weatherIcon(code) {
    const c = Number(code);
    if (c === 0) return "☀️";
    if (c <= 2) return "🌤️";
    if (c === 3) return "☁️";
    if (c === 45 || c === 48) return "🌫️";
    if ([71,73,75,77,85,86].includes(c)) return "🌨️";
    if ([95,96,99].includes(c)) return "⛈️";
    if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(c)) return "🌧️";
    return "🌦️";
  }

  function findStore(number) {
    return stores.find(store => String(store.number) === String(number)) || null;
  }

  function validStore(store) {
    return store && Number.isFinite(Number(store.latitude)) && Number.isFinite(Number(store.longitude));
  }

  function cacheKey(store) {
    return `europris_weather_v1_${store.number}`;
  }

  function readCache(store) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey(store)) || "null");
      if (!cached || Date.now() - cached.savedAt > WEATHER_CACHE_MS) return null;
      return cached.data;
    } catch {
      return null;
    }
  }

  function saveCache(store, data) {
    try {
      sessionStorage.setItem(cacheKey(store), JSON.stringify({ savedAt: Date.now(), data }));
    } catch {}
  }

  function alertInfo(data, language) {
    const t = ui[language].alerts;
    const current = data.current || {};
    const hourly = data.hourly || {};
    const nowIndex = Math.max(0, (hourly.time || []).findIndex(value => value >= current.time));
    const end = Math.min((hourly.time || []).length, nowIndex + 7);

    const temperatures = (hourly.temperature_2m || []).slice(nowIndex, end);
    const precipitation = (hourly.precipitation || []).slice(nowIndex, end);
    const snowfall = (hourly.snowfall || []).slice(nowIndex, end);
    const gusts = (hourly.wind_gusts_10m || []).slice(nowIndex, end);
    const codes = (hourly.weather_code || []).slice(nowIndex, end);

    const maxPrecip = Math.max(0, ...precipitation.map(Number));
    const maxSnow = Math.max(0, ...snowfall.map(Number));
    const maxGust = Math.max(0, ...gusts.map(Number));
    const minTemp = Math.min(...temperatures.map(Number).filter(Number.isFinite));

    const alerts = [];
    if ((minTemp <= 1 && maxPrecip > 0.1) || [56,57,66,67].includes(Number(current.weather_code))) alerts.push(t.ice);
    if (maxSnow >= 0.2 || [71,73,75,77,85,86].some(code => codes.includes(code))) alerts.push(t.snow);
    if (maxGust >= 15) alerts.push(t.wind);
    if (maxPrecip >= 4) alerts.push(t.rain);
    if ([45,48].some(code => codes.includes(code))) alerts.push(t.visibility);

    return alerts.length
      ? { level: "warning", text: alerts.join(" • ") }
      : { level: "good", text: t.good };
  }

  function hourlyItems(data) {
    const currentTime = data.current?.time || "";
    const times = data.hourly?.time || [];
    let start = times.findIndex(value => value >= currentTime);
    if (start < 0) start = 0;

    return times.slice(start + 1, start + 5).map((time, offset) => {
      const index = start + 1 + offset;
      return {
        time: time.slice(11,16),
        temp: Math.round(Number(data.hourly.temperature_2m?.[index])),
        code: data.hourly.weather_code?.[index],
        precip: Number(data.hourly.precipitation_probability?.[index]) || 0,
        gust: Number(data.hourly.wind_gusts_10m?.[index]) || 0
      };
    });
  }

  function renderWeather(store, data) {
    const card = document.getElementById("storeWeatherCard");
    if (!card) return;
    const language = lang();
    const text = ui[language];
    const current = data.current;
    const alert = alertInfo(data, language);

    card.hidden = false;
    card.innerHTML = `
      <div class="store-weather-head">
        <div>
          <div class="store-weather-title">${text.weatherTitle(store.name || store.number)}</div>
          <div class="store-weather-condition">${weatherIcon(current.weather_code)} ${weatherDescription(current.weather_code, language)}</div>
        </div>
        <button type="button" class="store-weather-refresh">${text.refresh}</button>
      </div>
      <div class="store-weather-current">
        <strong>${Math.round(Number(current.temperature_2m))}°C</strong>
        <span>${text.feels}: ${Math.round(Number(current.apparent_temperature))}°C</span>
        <span>${text.wind}: ${Math.round(Number(current.wind_speed_10m))} m/s</span>
        <span>${text.gusts}: ${Math.round(Number(current.wind_gusts_10m))} m/s</span>
      </div>
      <div class="store-weather-alert ${alert.level}">${alert.level === "warning" ? "⚠️" : "✓"} ${alert.text}</div>
      <div class="store-weather-subtitle">${text.nextHours}</div>
      <div class="store-weather-hours">
        ${hourlyItems(data).map(item => `
          <div class="store-weather-hour">
            <strong>${item.time}</strong>
            <span>${weatherIcon(item.code)} ${item.temp}°C</span>
            <small>💧 ${item.precip}% • 💨 ${Math.round(item.gust)} m/s</small>
          </div>
        `).join("")}
      </div>
      <div class="store-weather-note">${text.practical}</div>
    `;

    card.querySelector(".store-weather-refresh")?.addEventListener("click", () => loadWeather(store, true));
  }

  function renderWeatherMessage(message) {
    const card = document.getElementById("storeWeatherCard");
    if (!card) return;
    card.hidden = false;
    card.innerHTML = `<div class="store-weather-message">${message}</div>`;
  }

  async function loadWeather(store, force = false) {
    const serial = ++requestSerial;
    const text = ui[lang()];

    if (!validStore(store)) {
      renderWeatherMessage(text.unavailable);
      return;
    }

    if (!force) {
      const cached = readCache(store);
      if (cached) {
        renderWeather(store, cached);
        return;
      }
    }

    renderWeatherMessage(text.loading);

    const params = new URLSearchParams({
      latitude: String(store.latitude),
      longitude: String(store.longitude),
      current: [
        "temperature_2m",
        "apparent_temperature",
        "precipitation",
        "rain",
        "snowfall",
        "weather_code",
        "wind_speed_10m",
        "wind_gusts_10m"
      ].join(","),
      hourly: [
        "temperature_2m",
        "precipitation_probability",
        "precipitation",
        "snowfall",
        "weather_code",
        "wind_speed_10m",
        "wind_gusts_10m"
      ].join(","),
      forecast_days: "2",
      timezone: "auto",
      wind_speed_unit: "ms"
    });

    try {
      const response = await fetch(`${WEATHER_API}?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (serial !== requestSerial || String(store.number) !== selectedStoreNumber) return;
      saveCache(store, data);
      renderWeather(store, data);
    } catch {
      if (serial !== requestSerial) return;
      renderWeatherMessage(text.unavailable);
    }
  }

  function updateSelectedStore() {
    const number = String(document.getElementById("selectedNumber")?.textContent || "")
      .replace(/\D/g, "");

    if (!number) {
      selectedStoreNumber = "";
      const card = document.getElementById("storeWeatherCard");
      if (card) card.hidden = true;
      return;
    }

    if (number === selectedStoreNumber) return;
    selectedStoreNumber = number;
    const store = findStore(number);
    if (store) loadWeather(store);
  }

  function createUi() {
    const topbar = document.querySelector(".topbar");
    if (topbar && !document.getElementById("dailyHumorCard")) {
      const humorCard = document.createElement("section");
      humorCard.id = "dailyHumorCard";
      humorCard.className = "daily-humor-card";
      humorCard.innerHTML = `
        <div class="daily-humor-title"></div>
        <div class="daily-humor-text"></div>
      `;
      topbar.insertAdjacentElement("afterend", humorCard);
    }

    const selected = document.getElementById("selected");
    if (selected && !document.getElementById("storeWeatherCard")) {
      const weatherCard = document.createElement("section");
      weatherCard.id = "storeWeatherCard";
      weatherCard.className = "store-weather-card";
      weatherCard.hidden = true;
      selected.insertAdjacentElement("afterend", weatherCard);
    }
  }

  async function loadStores() {
    try {
      const response = await fetch(STORE_URL, { cache: "no-store" });
      if (!response.ok) throw new Error();
      stores = await response.json();
      updateSelectedStore();
    } catch {
      stores = [];
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    createUi();
    renderHumor();
    loadStores();

    const selectedNumber = document.getElementById("selectedNumber");
    if (selectedNumber) {
      new MutationObserver(updateSelectedStore)
        .observe(selectedNumber, { childList: true, characterData: true, subtree: true });
    }

    document.querySelectorAll("[data-lang]").forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(() => {
          renderHumor();
          const store = findStore(selectedStoreNumber);
          if (store) loadWeather(store, false);
        }, 0);
      });
    });
  });
})();