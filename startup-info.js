(() => {
  "use strict";

  const DISMISS_KEY = "europris_startup_info_feedback_v2_dismissed";

  const copy = {
    pl: {
      badge: "NOWA FUNKCJA",
      title: "Informacje i kontakt z twórcą aplikacji",
      text: "W aplikacji uruchomiona została nowa sekcja „Informacje”. Znajdziesz tam opis najważniejszych funkcji Europris Dostawy oraz formularz kontaktowy.",
      points: ["zgłoś błąd lub coś, co nie działa prawidłowo","wyślij propozycję nowej funkcji lub usprawnienia","zadaj pytanie dotyczące działania aplikacji","prześlij inną uwagę lub sugestię"],
      note: "Aby wysłać wiadomość, podaj swój adres e-mail. Zgłoszenie zostanie przekazane do Rumcajsa (Andrzej). Sekcję możesz później otworzyć przyciskiem „Informacje / Pytania?” u góry aplikacji.",
      ending: "Mile widziane są wszystkie komentarze, uwagi i propozycje dotyczące aplikacji — pomagają ją dalej rozwijać i ulepszać.\n\nPozdrawiam,\nRumcajs (Andrzej)",
      dontShow: "Nie pokazuj więcej tego komunikatu", close: "Rozumiem"
    },
    no: {
      badge: "NY FUNKSJON", title: "Informasjon og kontakt med appens utvikler",
      text: "En ny seksjon, «Informasjon», er nå tilgjengelig i appen. Der finner du en oversikt over de viktigste funksjonene i Europris Levering og et kontaktskjema.",
      points: ["rapporter en feil eller noe som ikke fungerer som det skal","send forslag til en ny funksjon eller forbedring","still spørsmål om hvordan appen fungerer","send en annen kommentar eller idé"],
      note: "For å sende en melding må du oppgi e-postadressen din. Meldingen sendes til Rumcajs (Andrzej). Du kan senere åpne seksjonen med knappen «Informasjon / Spørsmål?» øverst i appen.",
      ending: "Alle kommentarer, tilbakemeldinger og forslag om appen er hjertelig velkomne — de hjelper meg med å videreutvikle og forbedre den.\n\nHilsen,\nRumcajs (Andrzej)",
      dontShow: "Ikke vis denne meldingen igjen", close: "Forstått"
    },
    en: {
      badge: "NEW FEATURE", title: "Information and contact with the app creator",
      text: "A new “Information” section is now available in the app. It contains an overview of the main Europris Deliveries features and a contact form.",
      points: ["report a bug or something that is not working correctly","suggest a new feature or improvement","ask a question about how the app works","send another comment or suggestion"],
      note: "To send a message, enter your email address. Your report will be sent to Rumcajs (Andrzej). You can open this section later using the “Information / Questions?” button at the top of the app.",
      ending: "All comments, feedback and suggestions about the app are very welcome — they help me continue developing and improving it.\n\nBest regards,\nRumcajs (Andrzej)",
      dontShow: "Do not show this message again", close: "Got it"
    },
    de: {
      badge: "NEUE FUNKTION", title: "Informationen und Kontakt zum App-Ersteller",
      text: "In der App gibt es jetzt den neuen Bereich „Informationen“. Dort finden Sie eine Übersicht der wichtigsten Funktionen von Europris Lieferungen sowie ein Kontaktformular.",
      points: ["einen Fehler oder eine nicht funktionierende Funktion melden","eine neue Funktion oder Verbesserung vorschlagen","eine Frage zur Bedienung der App stellen","einen anderen Hinweis oder Vorschlag senden"],
      note: "Zum Senden einer Nachricht ist Ihre E-Mail-Adresse erforderlich. Die Meldung wird an Rumcajs (Andrzej) weitergeleitet. Später können Sie den Bereich über „Informationen / Fragen?” oben in der App öffnen.",
      ending: "Kommentare, Rückmeldungen und Vorschläge zur App sind jederzeit willkommen — sie helfen mir, die App weiterzuentwickeln und zu verbessern.\n\nViele Grüße,\nRumcajs (Andrzej)",
      dontShow: "Diese Meldung nicht mehr anzeigen", close: "Verstanden"
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
    const note=document.createElement("p");note.className="europris-startup-note";note.textContent=t.note;
    const ending=document.createElement("p");ending.className="europris-startup-ending";ending.style.whiteSpace="pre-line";ending.textContent=t.ending;
    const choice=document.createElement("label");choice.className="europris-startup-choice";
    const checkbox=document.createElement("input");checkbox.type="checkbox";
    const choiceText=document.createElement("span");choiceText.textContent=t.dontShow;choice.append(checkbox,choiceText);
    const close=document.createElement("button");close.type="button";close.className="europris-startup-close";close.textContent=t.close;
    close.addEventListener("click",()=>{if(checkbox.checked)rememberDismissal();dialog.close();dialog.remove();});
    card.append(badge,title,text,list,note,ending,choice,close);dialog.appendChild(card);document.body.appendChild(dialog);
    if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");
  }
  function start(){if(dismissed())return;window.setTimeout(show,350);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
