(() => {
  "use strict";

  const DISMISS_KEY = "europris_startup_info_v58_31_dismissed";

  const copy = {
    pl: {
      badge: "MAŁA AKTUALIZACJA",
      title: "Europris Dostawy — wersja 58.31",
      text: "Wprowadziliśmy małą aktualizację informacji o kolejności dostaw.",
      points: [
        "przy dostawie sklepu wyświetlany jest teraz numer PRI (kolejność dostawy)",
        "numer PRI jest również widoczny na liście i w szczegółach dostaw kierowcy",
        "PRI jest pokazane kompaktowo, bez niepotrzebnego powiększania kafelków"
      ],
      dontShow: "Nie pokazuj więcej tego komunikatu",
      close: "Rozumiem"
    },
    no: {
      badge: "LITEN OPPDATERING",
      title: "Europris Levering — versjon 58.31",
      text: "Vi har gjort en liten oppdatering av informasjonen om leveringsrekkefølgen.",
      points: [
        "butikkleveringen viser nå PRI-nummeret (leveringsrekkefølge)",
        "PRI-nummeret vises også i sjåførlisten og i leveringsdetaljene",
        "PRI vises kompakt uten å gjøre kortene unødvendig større"
      ],
      dontShow: "Ikke vis denne meldingen igjen",
      close: "Forstått"
    },
    en: {
      badge: "SMALL UPDATE",
      title: "Europris Deliveries — version 58.31",
      text: "A small update has been made to the delivery-order information.",
      points: [
        "store deliveries now show the PRI number (delivery order)",
        "the PRI number is also visible in the driver list and delivery details",
        "PRI is displayed compactly without unnecessarily enlarging the cards"
      ],
      dontShow: "Do not show this message again",
      close: "Got it"
    },
    de: {
      badge: "KLEINES UPDATE",
      title: "Europris Lieferungen — Version 58.31",
      text: "Die Informationen zur Lieferreihenfolge wurden leicht aktualisiert.",
      points: [
        "bei Filiallieferungen wird jetzt die PRI-Nummer (Lieferreihenfolge) angezeigt",
        "die PRI-Nummer ist auch in der Fahrerliste und in den Lieferdetails sichtbar",
        "PRI wird kompakt angezeigt, ohne die Karten unnötig zu vergrößern"
      ],
      dontShow: "Diese Meldung nicht mehr anzeigen",
      close: "Verstanden"
    }
  };

  function language(){const value=String(document.documentElement.lang||localStorage.getItem("europris_language_v6")||"pl").toLowerCase();if(value.startsWith("no")||value.startsWith("nb")||value.startsWith("nn"))return"no";if(value.startsWith("en"))return"en";if(value.startsWith("de"))return"de";return"pl";}
  function dismissed(){try{return localStorage.getItem(DISMISS_KEY)==="1";}catch(_){return false;}}
  function rememberDismissal(){try{localStorage.setItem(DISMISS_KEY,"1");}catch(_){}}
  function show(){
    if(dismissed()||document.querySelector(".europris-startup-info"))return;
    const t=copy[language()]||copy.pl;
    const dialog=document.createElement("dialog");dialog.className="europris-startup-info";
    const card=document.createElement("div");card.className="europris-startup-card";
    const badge=document.createElement("div");badge.className="europris-startup-badge";badge.textContent=t.badge;
    const title=document.createElement("h2");title.textContent=t.title;
    const text=document.createElement("p");text.textContent=t.text;
    const list=document.createElement("ul");t.points.forEach(value=>{const item=document.createElement("li");item.textContent=value;list.appendChild(item);});
    const choice=document.createElement("label");choice.className="europris-startup-choice";
    const checkbox=document.createElement("input");checkbox.type="checkbox";
    const choiceText=document.createElement("span");choiceText.textContent=t.dontShow;choice.append(checkbox,choiceText);
    const close=document.createElement("button");close.type="button";close.className="europris-startup-close";close.textContent=t.close;
    close.addEventListener("click",()=>{if(checkbox.checked)rememberDismissal();dialog.close();dialog.remove();});
    card.append(badge,title,text,list,choice,close);dialog.appendChild(card);document.body.appendChild(dialog);
    if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");
  }
  function start(){if(dismissed())return;window.setTimeout(show,350);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();