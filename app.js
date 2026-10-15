import { FARGER, MALLAR, KRAFTER, MAX_KRAFTER, STYRKOR, NAMNFORSLAG, formTillPixlar } from "./mallar.js";
import { byggPaket, nyttPaket, stadaNamn } from "./paket.js";
import { skapaRityta, ritaMiniatyr } from "./rita.js";

const LAGRING = "olivers-moddar";
const APPVERSION = "1.0";
const STEG = ["form", "rita", "namn", "krafter"];

const $ = (valjare) => document.querySelector(valjare);

// Skapar ett element. Text sätts alltid som text, aldrig som HTML.
function el(tagg, egenskaper = {}, ...barn) {
  const element = document.createElement(tagg);
  for (const [nyckel, varde] of Object.entries(egenskaper)) {
    if (nyckel === "class") element.className = varde;
    else if (nyckel === "text") element.textContent = varde;
    else if (nyckel.startsWith("on")) element.addEventListener(nyckel.slice(2), varde);
    else element.setAttribute(nyckel, varde);
  }
  element.append(...barn);
  return element;
}

// ---------- Data ----------

function laddaData() {
  try {
    const sparat = JSON.parse(localStorage.getItem(LAGRING));
    if (Array.isArray(sparat?.saker) && sparat?.paket?.uuid) return sparat;
  } catch {
    // Tom eller trasig lagring: börja från början.
  }
  return { saker: [], paket: nyttPaket() };
}

let data = laddaData();

function spara() {
  try {
    localStorage.setItem(LAGRING, JSON.stringify(data));
    return true;
  } catch {
    visaToast("Kunde inte spara 😕");
    return false;
  }
}

function nyttId() {
  const tecken = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (;;) {
    let id = tecken[Math.floor(Math.random() * 26)];
    for (let i = 0; i < 5; i++) id += tecken[Math.floor(Math.random() * tecken.length)];
    if (!data.saker.some((sak) => sak.id === id)) return id;
  }
}

// ---------- Små hjälpare ----------

function visaSkarm(id) {
  for (const skarm of document.querySelectorAll(".skarm")) skarm.hidden = skarm.id !== id;
  window.scrollTo(0, 0);
}

let toastTimer;
function visaToast(text) {
  const toast = $("#toast");
  toast.textContent = text;
  toast.hidden = false;
  toast.style.animation = "none";
  void toast.offsetHeight;
  toast.style.animation = "";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2600);
}

function fraga(text, ja = "Ja", nej = "Nej") {
  const dialog = $("#fraga");
  $("#fraga-text").textContent = text;
  $("#fraga-ja").textContent = ja;
  $("#fraga-nej").textContent = nej;
  return new Promise((svara) => {
    const klar = (svar) => {
      dialog.close();
      svara(svar);
    };
    $("#fraga-ja").onclick = () => klar(true);
    $("#fraga-nej").onclick = () => klar(false);
    dialog.oncancel = (event) => {
      event.preventDefault();
      klar(false);
    };
    dialog.showModal();
  });
}

// Delar filen via iPadens delningsmeny, eller laddar ner den om det inte går.
async function delaEllerLaddaNer(fil) {
  if (navigator.canShare?.({ files: [fil] })) {
    try {
      await navigator.share({ files: [fil] });
      return;
    } catch (fel) {
      if (fel?.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(fil);
  const lank = el("a", { href: url, download: fil.name });
  document.body.append(lank);
  lank.click();
  lank.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  visaToast("Filen är nedladdad 📥");
}

// ---------- Startsidan ----------

function visaHem() {
  const lista = $("#saker");
  lista.replaceChildren(
    ...data.saker.map((sak) => {
      const bild = el("canvas", { width: 128, height: 128 });
      ritaMiniatyr(bild, sak.pixlar);
      const emojis = [...new Set([...sak.slag, ...sak.tryck])]
        .map((id) => KRAFTER.find((kraft) => kraft.id === id)?.emoji)
        .filter(Boolean)
        .join(" ");
      return el(
        "div",
        { class: "sakplats" },
        el(
          "button",
          { class: "sakkort", type: "button", "aria-label": `Ändra ${sak.namn}`, onclick: () => oppnaGuide(sak) },
          bild,
          el("span", { class: "saknamn", text: sak.namn }),
          el("span", { class: "sakkrafter", text: emojis }),
        ),
        el("button", {
          class: "slang",
          type: "button",
          "aria-label": `Släng ${sak.namn}`,
          text: "🗑️",
          onclick: async () => {
            if (!(await fraga(`Vill du slänga ${sak.namn}?`, "Ja, släng", "Nej"))) return;
            data.saker = data.saker.filter((annan) => annan.id !== sak.id);
            spara();
            visaHem();
            visaToast(`${sak.namn} är slängd`);
          },
        }),
      );
    }),
  );
  $("#tomt").hidden = data.saker.length > 0;
  $("#skicka").disabled = data.saker.length === 0;
}

// ---------- Guiden ----------

let utkast = null;
let stegIndex = 0;
let andrat = false;
let valdFarg = FARGER.find((farg) => farg.namn === "Röd").hex;
let valtVerktyg = "penna";

const rityta = skapaRityta($("#rityta"), {
  onAndring() {
    utkast.pixlar = rityta.hamtaPixlar();
    andrat = true;
    uppdateraAngra();
  },
});
rityta.sattFarg(valdFarg);

function oppnaGuide(sak) {
  utkast = sak
    ? structuredClone(sak)
    : { id: null, namn: "", mall: null, pixlar: Array(256).fill(null), styrka: 2, slag: [], tryck: [] };
  andrat = false;
  visaSkarm("guide");
  visaSteg(sak ? 1 : 0);
}

async function lamnaGuide() {
  if (andrat && !(await fraga("Vill du sluta utan att spara?", "Ja, sluta", "Nej"))) return;
  utkast = null;
  visaHem();
  visaSkarm("hem");
}

function visaSteg(index) {
  stegIndex = index;
  STEG.forEach((namn, i) => ($(`#steg-${namn}`).hidden = i !== index));
  [...$("#prickar").children].forEach((prick, i) => {
    prick.className = i === index ? "nu" : i < index ? "klar" : "";
  });
  const steg = STEG[index];
  if (steg === "form") visaMallar();
  if (steg === "rita") {
    rityta.laddaPixlar(utkast.pixlar);
    visaPalett();
    uppdateraAngra();
  }
  if (steg === "namn") {
    $("#namn").value = utkast.namn;
    visaStyrkor();
  }
  if (steg === "krafter") visaKrafter();
  ritaForhand();
  window.scrollTo(0, 0);
}

function ritaForhand() {
  for (const bild of document.querySelectorAll(".forhandsbild")) ritaMiniatyr(bild, utkast.pixlar);
  $("#forhandsnamn").textContent = utkast.namn;
}

function visaMallar() {
  $("#mallar").replaceChildren(
    ...MALLAR.map((mall) => {
      const bild = el("canvas", { width: 128, height: 128 });
      ritaMiniatyr(bild, formTillPixlar(mall.form));
      return el("button", { class: "mallkort", type: "button", onclick: () => valjMall(mall) }, bild, el("span", { text: mall.namn }));
    }),
  );
}

async function valjMall(mall) {
  const harRitat = utkast.pixlar.some(Boolean);
  if (mall.id !== utkast.mall || !harRitat) {
    if (harRitat && !(await fraga("Byta form? Det du har ritat försvinner.", "Ja, byt", "Nej"))) return;
    utkast.pixlar = formTillPixlar(mall.form);
    utkast.mall = mall.id;
    andrat = true;
  }
  visaSteg(1);
}

function visaPalett() {
  $("#palett").replaceChildren(
    ...FARGER.map((farg) =>
      el("button", {
        class: "fargknapp" + (farg.hex === valdFarg && valtVerktyg !== "sudd" ? " vald" : ""),
        type: "button",
        style: `background:${farg.hex}`,
        "aria-label": farg.namn,
        onclick: () => {
          valdFarg = farg.hex;
          rityta.sattFarg(farg.hex);
          if (valtVerktyg === "sudd") valjVerktyg("penna");
          visaPalett();
        },
      }),
    ),
  );
}

function valjVerktyg(verktyg) {
  valtVerktyg = verktyg;
  rityta.sattVerktyg(verktyg);
  for (const knapp of document.querySelectorAll("[data-verktyg]")) {
    knapp.classList.toggle("vald", knapp.dataset.verktyg === verktyg);
  }
  visaPalett();
}

function uppdateraAngra() {
  $("#angra").disabled = !rityta.kanAngra();
}

function visaStyrkor() {
  $("#styrkor").replaceChildren(
    ...STYRKOR.map((styrka) =>
      el(
        "button",
        {
          class: "valknapp" + (utkast.styrka === styrka.niva ? " vald" : ""),
          type: "button",
          "aria-pressed": String(utkast.styrka === styrka.niva),
          onclick: () => {
            utkast.styrka = styrka.niva;
            andrat = true;
            visaStyrkor();
          },
        },
        styrka.emoji,
        el("span", { text: styrka.namn }),
      ),
    ),
  );
}

// Valda krafter i den ordning de visas i rutorna: slag först, sedan tryck.
function valdaKrafter() {
  return [
    ...utkast.slag.map((id) => ({ id, typ: "slag" })),
    ...utkast.tryck.map((id) => ({ id, typ: "tryck" })),
  ];
}

function taBortKraft(id, typ) {
  utkast[typ] = utkast[typ].filter((annan) => annan !== id);
  andrat = true;
  visaKrafter();
}

function visaKrafter() {
  const valda = valdaKrafter();
  const forManga = valda.length > MAX_KRAFTER;
  const fullt = valda.length >= MAX_KRAFTER;

  // Rutorna: valda krafter med förklaring, och tomma rutor för resten.
  const rutor = valda.map(({ id, typ }) => {
    const kraft = KRAFTER.find((k) => k.id === id);
    return el(
      "button",
      {
        class: "plats fylld" + (forManga ? " for-manga" : ""),
        type: "button",
        "aria-label": `Ta bort ${kraft.namn}`,
        onclick: () => taBortKraft(id, typ),
      },
      el("span", { class: "platsemoji", text: kraft.emoji }),
      el("span", {}, el("b", { text: `${typ === "slag" ? "👊" : "👆"} ${kraft.namn}` }), el("small", { text: kraft[typ] })),
    );
  });
  for (let i = valda.length; i < MAX_KRAFTER; i++) {
    rutor.push(el("div", { class: "plats" }, el("span", { class: "tom", text: "Tom ruta" })));
  }
  $("#platser").replaceChildren(...rutor);

  const info = $("#kraftinfo");
  info.classList.toggle("varning", forManga);
  if (forManga) {
    const tabort = valda.length - MAX_KRAFTER;
    info.textContent = `Nu får ett vapen ha ${MAX_KRAFTER} krafter. Tryck på ${tabort === 1 ? "en ruta" : `${tabort} rutor`} för att ta bort.`;
  } else if (fullt) {
    info.textContent = "Alla rutor är fulla! Tryck på en ruta för att byta.";
  } else {
    info.textContent = valda.length ? "Tryck på en ruta för att ta bort den." : "Tryck på en kraft så hamnar den i en ruta.";
  }

  // Korten.
  for (const typ of ["slag", "tryck"]) {
    $(`#krafter-${typ}`).replaceChildren(
      ...KRAFTER.filter((kraft) => kraft[typ]).map((kraft) => {
        const vald = utkast[typ].includes(kraft.id);
        return el(
          "button",
          {
            class: "kraftkort" + (vald ? " vald" : !vald && fullt ? " blek" : ""),
            type: "button",
            "aria-pressed": String(vald),
            onclick: () => {
              if (vald) return taBortKraft(kraft.id, typ);
              if (fullt) {
                visaToast("Alla rutor är fulla! Ta bort en först.");
                return;
              }
              utkast[typ] = [...utkast[typ], kraft.id];
              andrat = true;
              visaKrafter();
            },
          },
          el("span", { class: "kraftemoji", text: kraft.emoji }),
          el("b", { text: kraft.namn }),
        );
      }),
    );
  }

  const spara = $("#spara");
  spara.disabled = forManga;
  spara.textContent = forManga ? `Ta bort ${valda.length - MAX_KRAFTER} först` : "✅ Klar! Spara";
}

function slumpaNamn() {
  const andra = NAMNFORSLAG.filter((namn) => namn !== utkast.namn);
  return andra[Math.floor(Math.random() * andra.length)];
}

function nastaSteg() {
  if (STEG[stegIndex] === "rita" && rityta.arTom()) {
    visaToast("Rita något först! ✏️");
    return;
  }
  if (STEG[stegIndex] === "namn" && !utkast.namn.trim()) {
    utkast.namn = slumpaNamn();
    visaToast(`Den fick heta ${utkast.namn}!`);
  }
  visaSteg(stegIndex + 1);
}

function sparaSak() {
  utkast.namn = stadaNamn(utkast.namn);
  if (!utkast.id) {
    utkast.id = nyttId();
    data.saker.push(utkast);
  } else {
    const index = data.saker.findIndex((sak) => sak.id === utkast.id);
    if (index >= 0) data.saker[index] = utkast;
    else data.saker.push(utkast);
  }
  if (!spara()) return;
  visaToast(`${utkast.namn} är sparad! 🎉`);
  utkast = null;
  visaHem();
  visaSkarm("hem");
}

// ---------- Skicka till Minecraft ----------

let paketFil = null;

async function skicka() {
  visaSkarm("skicka-skarm");
  $("#skicka-packar").hidden = false;
  $("#skicka-klar").hidden = true;
  $("#skicka-fel").hidden = true;
  paketFil = null;
  try {
    const svar = await fetch("runtime/main.js", { cache: "no-cache" });
    if (!svar.ok) throw new Error(`Kunde inte läsa skriptet (${svar.status})`);
    const runtimeKod = await svar.text();
    const { filnamn, bytes, version } = byggPaket({ paket: data.paket, saker: data.saker, runtimeKod });
    data.paket.byggnummer += 1;
    spara();
    paketFil = new File([bytes], filnamn, { type: "application/octet-stream" });
    $("#skicka-version").textContent = version;
    await new Promise((klar) => setTimeout(klar, 500));
    $("#skicka-packar").hidden = true;
    $("#skicka-klar").hidden = false;
  } catch (fel) {
    $("#skicka-packar").hidden = true;
    $("#skicka-fel").hidden = false;
    $("#skicka-feltext").textContent = String(fel?.message ?? fel);
  }
}

// ---------- För vuxna ----------

function visaVuxen() {
  $("#vuxen-info").textContent =
    `Appversion ${APPVERSION} · ${data.saker.length} saker · ` +
    (data.paket.byggnummer ? `senast skickade paket: version 1.0.${data.paket.byggnummer}` : "inget paket skickat än");
  visaSkarm("vuxen");
}

async function sparaBackup() {
  const datum = new Date().toISOString().slice(0, 10);
  const innehall = JSON.stringify({ typ: "olivers-moddar", version: 1, data });
  await delaEllerLaddaNer(new File([innehall], `olivers-moddar-${datum}.json`, { type: "application/json" }));
}

async function lasBackup(fil) {
  try {
    const innehall = JSON.parse(await fil.text());
    if (innehall?.typ !== "olivers-moddar" || !Array.isArray(innehall.data?.saker) || !innehall.data?.paket?.uuid) {
      throw new Error("fel sorts fil");
    }
    const antal = innehall.data.saker.length;
    if (!(await fraga(`Byta ut allt mot säkerhetskopian (${antal} saker)?`, "Ja, byt", "Nej"))) return;
    // Versionsnumret får aldrig gå bakåt, annars ersätter Minecraft inte det gamla paketet.
    innehall.data.paket.byggnummer = Math.max(innehall.data.paket.byggnummer ?? 0, data.paket.byggnummer);
    data = innehall.data;
    spara();
    visaHem();
    visaVuxen();
    visaToast("Säkerhetskopian är inläst ✅");
  } catch (fel) {
    visaToast(`Kunde inte läsa filen: ${fel.message}`);
  }
}

// ---------- Koppla ihop ----------

$("#ny").addEventListener("click", () => oppnaGuide(null));
$("#skicka").addEventListener("click", skicka);
$("#till-vuxna").addEventListener("click", visaVuxen);
$("#bakat").addEventListener("click", () => (stegIndex === 0 ? lamnaGuide() : visaSteg(stegIndex - 1)));
for (const knapp of document.querySelectorAll(".nasta")) knapp.addEventListener("click", nastaSteg);
for (const knapp of document.querySelectorAll("[data-verktyg]")) {
  knapp.addEventListener("click", () => valjVerktyg(knapp.dataset.verktyg));
}
$("#angra").addEventListener("click", () => rityta.angra());
$("#namn").addEventListener("input", (event) => {
  utkast.namn = event.target.value;
  andrat = true;
});
$("#slumpnamn").addEventListener("click", () => {
  utkast.namn = slumpaNamn();
  $("#namn").value = utkast.namn;
  andrat = true;
});
$("#spara").addEventListener("click", sparaSak);
$("#oppna").addEventListener("click", () => paketFil && delaEllerLaddaNer(paketFil));
$("#skicka-bakat").addEventListener("click", () => visaSkarm("hem"));
$("#vuxen-bakat").addEventListener("click", () => visaSkarm("hem"));
$("#backup-spara").addEventListener("click", sparaBackup);
$("#backup-las").addEventListener("change", (event) => {
  const fil = event.target.files?.[0];
  event.target.value = "";
  if (fil) lasBackup(fil);
});

visaHem();
navigator.storage?.persist?.();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
