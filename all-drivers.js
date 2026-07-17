(() => {
"use strict";
const PLAN_KEY="europris_admin_plan_v1", PANEL_ID="allDriversPanelV503";
const digits=v=>String(v||"").replace(/\D/g,"");
const norm=v=>String(v||"").toLocaleLowerCase("nb-NO").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
function lang(){const v=document.documentElement.lang||"pl";return v.startsWith("nb")||v.startsWith("no")?"no":v.startsWith("en")?"en":"pl";}
function text(){
 if(lang()==="no")return{title:"Sjåfører og biler",open:"Åpne sjåførliste",none:"Ingen plan for valgt dag.",unknown:"Ukjent sjåfør / bil",stores:n=>`${n} butikker`,pallets:n=>`${n} paller`,trailers:n=>n===1?"1 tilhenger":`${n} tilhengere`,noTrailer:"Ingen tilhengerdata",time:"Tid",pal:"Paller",tra:"Tilhengere",tour:n=>`Tur ${n}`};
 if(lang()==="en")return{title:"Drivers and vehicles",open:"Open driver list",none:"No plan for the selected day.",unknown:"Unknown driver / vehicle",stores:n=>`${n} stores`,pallets:n=>`${n} pallets`,trailers:n=>n===1?"1 trailer":`${n} trailers`,noTrailer:"No trailer data",time:"Time",pal:"Pallets",tra:"Trailers",tour:n=>`Trip ${n}`};
 return{title:"Kierowcy i auta",open:"Rozwiń listę kierowców",none:"Brak planu na wybrany dzień.",unknown:"Nieznany kierowca / auto",stores:n=>`${n} sklepów`,pallets:n=>`${n} palet`,trailers:n=>n===1?"1 naczepa":`${n} naczepy`,noTrailer:"Brak danych o naczepach",time:"Godzina",pal:"Palety",tra:"Naczepy",tour:n=>`Tur ${n}`};
}
function plan(){try{const p=JSON.parse(localStorage.getItem(PLAN_KEY)||"null");return p&&Array.isArray(p.rows)?p:null;}catch{return null;}}
function trailerCount(rows){
 const explicit=rows.reduce((m,r)=>Math.max(m,Number(r.trailers)||0),0);
 if(explicit)return explicit;
 return new Set(rows.map(r=>String(r.transportNumber||"").trim()).filter(Boolean)).size;
}
function groups(rows){
 const map=new Map();
 rows.forEach((r,i)=>{const name=String(r.driver||r.carrier||"").trim(),phone=digits(r.phone),key=`${norm(name||"unknown")}|${phone}`;if(!map.has(key))map.set(key,{key,name,phone,rows:[]});const g=map.get(key);if(!g.phone&&phone)g.phone=phone;g.rows.push({...r,__index:i});});
 return [...map.values()].map(g=>({...g,trailerCount:trailerCount(g.rows),rows:g.rows.sort((a,b)=>String(a.deadline||"").localeCompare(String(b.deadline||""))||Number(a.deliverySequence||0)-Number(b.deliverySequence||0))})).sort((a,b)=>norm(a.name).localeCompare(norm(b.name),"nb"));
}
function tel(phone){const d=digits(phone);return d?(d.length===8?`tel:+47${d}`:`tel:+${d}`):"";}
function toursForGroup(g){return [...new Set(g.rows.map(r=>String(r.tour12||"").trim()).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));}
function storesLine(g,limit=4){const a=g.rows.map(r=>{const n=String(r.storeNumber||"").trim(),s=String(r.storeName||"").trim();return n&&s?`${n} ${s}`:(n||s||"—");}),v=a.slice(0,limit),left=a.length-v.length;return left?`${v.join(" • ")} • +${left}`:v.join(" • ");}
function trailerVisual(count,t){
 const w=document.createElement("div");w.className="driver-trailer-visual";
 if(!count){const e=document.createElement("span");e.className="driver-trailer-empty";e.textContent=t.noTrailer;w.append(e);return w;}
 const icons=document.createElement("div");icons.className="driver-trailer-icons";
 const shown=Math.min(count,4);for(let i=0;i<shown;i++){const s=document.createElement("span");s.className="driver-trailer-icon";icons.append(s);}
 if(count>shown){const m=document.createElement("span");m.className="driver-trailer-more";m.textContent=`+${count-shown}`;icons.append(m);}
 const l=document.createElement("span");l.className="driver-trailer-label";l.textContent=t.trailers(count);w.append(icons,l);return w;
}
function createPanel(){
 let p=document.getElementById(PANEL_ID);if(p)return p;
 document.getElementById("allDriversPanelV501")?.remove();document.getElementById("allDriversPanelV502")?.remove();
 const list=document.getElementById("adminPlanList");if(!list)return null;
 p=document.createElement("section");p.id=PANEL_ID;p.className="all-drivers-panel";list.insertAdjacentElement("afterend",p);return p;
}
function details(g,t,target){
 target.replaceChildren();if(!g){target.hidden=true;return;}target.hidden=false;
 const card=document.createElement("section");card.className="selected-driver-card";
 const head=document.createElement("div");head.className="selected-driver-head";
 const ident=document.createElement("div"),name=document.createElement("div");name.className="selected-driver-name";name.textContent=g.name||t.unknown;ident.append(name);
 if(g.phone){const a=document.createElement("a");a.className="selected-driver-phone";a.href=tel(g.phone);a.textContent=`☎ ${g.phone}`;ident.append(a);}
 const totals=document.createElement("div");totals.className="selected-driver-totals";
 const pal=g.rows.reduce((s,r)=>s+(Number(r.pallets)||0),0);
 [t.stores(g.rows.length),t.pallets(pal)].forEach(v=>{const s=document.createElement("span");s.textContent=v;totals.append(s);});
 totals.append(trailerVisual(g.trailerCount,t));head.append(ident,totals);card.append(head);
 const stops=document.createElement("div");stops.className="selected-driver-stops";
 g.rows.forEach((r,i)=>{const stop=document.createElement("article");stop.className="selected-driver-stop";
 const seq=document.createElement("div");seq.className="selected-driver-sequence";seq.textContent=String(r.deliverySequence||i+1);
 const c=document.createElement("div"),store=document.createElement("div"),meta=document.createElement("div");c.className="selected-driver-stop-content";store.className="selected-driver-store";meta.className="selected-driver-meta";
 store.textContent=`${r.storeNumber||"—"} — ${r.storeName||"—"}`;
 meta.textContent=[r.deadline?`${t.time}: ${r.deadline}`:"",`${t.pal}: ${Number(r.pallets)||0}`,Number(r.trailers)>0?`${t.tra}: ${Number(r.trailers)}`:""].filter(Boolean).join(" • ");
 c.append(store,meta);stop.append(seq,c);stops.append(stop);});card.append(stops);target.append(card);
}
function render(){
 const panel=createPanel();if(!panel)return;
 const selectedKey=panel.dataset.selectedKey||"", wasOpen=panel.dataset.dropdownOpen==="1", t=text(),p=plan();panel.replaceChildren();
 const h=document.createElement("h3");h.className="all-drivers-title";h.textContent=t.title;panel.append(h);
 if(!p?.rows?.length){const e=document.createElement("div");e.className="all-drivers-empty";e.textContent=t.none;panel.append(e);return;}
 const gs=groups(p.rows), dropdown=document.createElement("div");dropdown.className="drivers-dropdown";
 const trigger=document.createElement("button");trigger.type="button";trigger.className="drivers-dropdown-trigger";trigger.setAttribute("aria-expanded",wasOpen?"true":"false");
 const tt=document.createElement("span");tt.className="drivers-dropdown-trigger-text";const prev=gs.find(g=>g.key===selectedKey);tt.textContent=prev?(prev.name||t.unknown):t.open;
 const ar=document.createElement("span");ar.className="drivers-dropdown-arrow";ar.textContent="⌄";trigger.append(tt,ar);
 const menu=document.createElement("div");menu.className="drivers-dropdown-menu";menu.hidden=!wasOpen;
 const selected=document.createElement("div");selected.className="selected-driver-details";selected.hidden=true;
 gs.forEach(g=>{const item=document.createElement("button");item.type="button";item.className="drivers-dropdown-item";
 const top=document.createElement("div");top.className="drivers-dropdown-item-top";const nm=document.createElement("strong");nm.textContent=g.name||t.unknown;
 const badges=document.createElement("div");badges.className="drivers-dropdown-item-badges";const pal=g.rows.reduce((s,r)=>s+(Number(r.pallets)||0),0);
 [t.stores(g.rows.length),t.pallets(pal)].forEach(v=>{const s=document.createElement("span");s.textContent=v;badges.append(s);});toursForGroup(g).forEach(v=>{const s=document.createElement("span");s.className="driver-tour-badge";s.textContent=t.tour(v);badges.append(s);});top.append(nm,badges);
 const st=document.createElement("div");st.className="drivers-dropdown-item-stores";st.textContent=storesLine(g);item.append(top,st,trailerVisual(g.trailerCount,t));
 item.addEventListener("click",()=>{panel.dataset.selectedKey=g.key;panel.dataset.dropdownOpen="0";tt.textContent=g.name||t.unknown;menu.hidden=true;trigger.setAttribute("aria-expanded","false");details(g,t,selected);});menu.append(item);});
 trigger.addEventListener("click",e=>{e.stopPropagation();const open=menu.hidden;menu.hidden=!open;panel.dataset.dropdownOpen=open?"1":"0";trigger.setAttribute("aria-expanded",open?"true":"false");});
 menu.addEventListener("click",e=>e.stopPropagation());dropdown.append(trigger,menu);panel.append(dropdown,selected);if(prev)details(prev,t,selected);
}
function visible(){const p=document.getElementById("adminPanel");return p&&!p.hidden;}
function refresh(){if(visible())render();}
document.addEventListener("click",e=>{const p=document.getElementById(PANEL_ID);if(!p||p.contains(e.target))return;const m=p.querySelector(".drivers-dropdown-menu"),tr=p.querySelector(".drivers-dropdown-trigger");if(m&&!m.hidden){m.hidden=true;p.dataset.dropdownOpen="0";tr?.setAttribute("aria-expanded","false");}});
document.addEventListener("DOMContentLoaded",()=>{createPanel();refresh();
 const admin=document.getElementById("adminPanel");if(admin)new MutationObserver(refresh).observe(admin,{attributes:true,attributeFilter:["hidden"]});
 const list=document.getElementById("adminPlanList");if(list){let timer=0;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(refresh,100);}).observe(list,{childList:true,subtree:true});}
 document.getElementById("adminDeliveryDate")?.addEventListener("change",()=>{setTimeout(refresh,300);setTimeout(refresh,1200);});
 document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>setTimeout(refresh,0)));
});
window.EuroprisAllDrivers=Object.freeze({render});
})();