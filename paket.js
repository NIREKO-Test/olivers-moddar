// Bygger ett .mcaddon-paket av Olivers saker. Ren funktion utan webbläsar-API:er,
// så den går att köra och kontrollera i Node.
import { kodaPng } from "./png.js";
import { skapaZip } from "./zip.js";
import { KRAFTER, STYRKOR } from "./mallar.js";

export const NAMNRYMD = "olivers";
export const PAKETNAMN = "Olivers moddar";
const SKRIPT_API = "2.9.0"; // stabil sedan Minecraft 26.40
const MIN_MOTOR = [1, 26, 0];
const ITEM_FORMAT = "1.26.40";

export function nyttPaket() {
  return {
    uuid: {
      bp: crypto.randomUUID(),
      bpData: crypto.randomUUID(),
      bpSkript: crypto.randomUUID(),
      rp: crypto.randomUUID(),
      rpRes: crypto.randomUUID(),
    },
    byggnummer: 0,
  };
}

export function fulltId(sak) {
  return `${NAMNRYMD}:${sak.id}`;
}

function texturNamn(sak) {
  return `${NAMNRYMD}_${sak.id}`;
}

// Namn i .lang-filer får inte innehålla radbrytningar eller "##" (kommentar).
export function stadaNamn(namn) {
  const stadat = String(namn ?? "").replace(/[\r\n\t]+/g, " ").replace(/#+/g, "").trim().slice(0, 30);
  return stadat || "Min sak";
}

function hexTillRgba(hex) {
  if (!hex) return [0, 0, 0, 0];
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
}

export function pixlarTillPng(pixlar, skala = 1) {
  const sida = 16 * skala;
  const rgba = new Uint8Array(sida * sida * 4);
  for (let y = 0; y < sida; y++) {
    for (let x = 0; x < sida; x++) {
      const farg = hexTillRgba(pixlar[Math.floor(y / skala) * 16 + Math.floor(x / skala)]);
      rgba.set(farg, (y * sida + x) * 4);
    }
  }
  return kodaPng(sida, sida, rgba);
}

function giltigaKrafter(lista, typ) {
  const tillatna = new Set(KRAFTER.filter((k) => k[typ]).map((k) => k.id));
  return [...new Set(lista ?? [])].filter((k) => tillatna.has(k));
}

function itemJson(sak) {
  const id = fulltId(sak);
  const skada = (STYRKOR.find((s) => s.niva === sak.styrka) ?? STYRKOR[1]).skada;
  const komponenter = {
    "minecraft:icon": { textures: { default: texturNamn(sak) } },
    "minecraft:display_name": { value: `item.${id}.name` },
    "minecraft:max_stack_size": 1,
    "minecraft:hand_equipped": { value: true },
    "minecraft:damage": skada,
    "minecraft:enchantable": { value: 15, slot: "sword" },
  };
  if (giltigaKrafter(sak.tryck, "tryck").length > 0) {
    // Gör saken "användbar", så ett tryck räknas som att använda den.
    komponenter["minecraft:use_modifiers"] = { use_duration: 0.25, movement_modifier: 1.0 };
  }
  return {
    format_version: ITEM_FORMAT,
    "minecraft:item": {
      description: { identifier: id, menu_category: { category: "equipment" } },
      components: komponenter,
    },
  };
}

function json(data) {
  return JSON.stringify(data, null, 2) + "\n";
}

// paket: från nyttPaket(), saker: Olivers saker, runtimeKod: innehållet i runtime/main.js.
export function byggPaket({ paket, saker, runtimeKod }) {
  if (!saker.length) throw new Error("Det finns inga saker att skicka.");
  const version = [1, 0, paket.byggnummer + 1];
  const versionText = version.join(".");
  const beskrivning = `Version ${versionText} · Saker som Oliver har gjort`;

  const bpManifest = {
    format_version: 2,
    header: { name: PAKETNAMN, description: beskrivning, uuid: paket.uuid.bp, version, min_engine_version: MIN_MOTOR },
    modules: [
      { type: "data", uuid: paket.uuid.bpData, version },
      { type: "script", language: "javascript", uuid: paket.uuid.bpSkript, version, entry: "scripts/main.js" },
    ],
    dependencies: [
      { uuid: paket.uuid.rp, version },
      { module_name: "@minecraft/server", version: SKRIPT_API },
    ],
  };
  const rpManifest = {
    format_version: 2,
    header: { name: PAKETNAMN, description: beskrivning, uuid: paket.uuid.rp, version, min_engine_version: MIN_MOTOR },
    modules: [{ type: "resources", uuid: paket.uuid.rpRes, version }],
  };

  const sakerKod =
    `export const PAKET = ${JSON.stringify({ version: versionText })};\n` +
    `export const SAKER = ${JSON.stringify(
      saker.map((sak) => ({
        id: fulltId(sak),
        namn: stadaNamn(sak.namn),
        slag: giltigaKrafter(sak.slag, "slag"),
        tryck: giltigaKrafter(sak.tryck, "tryck"),
      })),
      null,
      2,
    )};\n`;

  const lang = saker.map((sak) => `item.${fulltId(sak)}.name=${stadaNamn(sak.namn)}`).join("\n") + "\n";
  const itemTexturer = {
    resource_pack_name: "olivers_moddar",
    texture_name: "atlas.items",
    texture_data: Object.fromEntries(
      saker.map((sak) => [texturNamn(sak), { textures: `textures/items/${texturNamn(sak)}` }]),
    ),
  };
  const ikon = pixlarTillPng(saker[0].pixlar, 8);

  const BP = "OliversModdar_BP";
  const RP = "OliversModdar_RP";
  const filer = [
    { namn: `${BP}/manifest.json`, data: json(bpManifest) },
    { namn: `${BP}/pack_icon.png`, data: ikon },
    { namn: `${BP}/scripts/main.js`, data: runtimeKod },
    { namn: `${BP}/scripts/saker.js`, data: sakerKod },
    ...saker.map((sak) => ({ namn: `${BP}/items/${sak.id}.json`, data: json(itemJson(sak)) })),
    { namn: `${RP}/manifest.json`, data: json(rpManifest) },
    { namn: `${RP}/pack_icon.png`, data: ikon },
    { namn: `${RP}/textures/item_texture.json`, data: json(itemTexturer) },
    ...saker.map((sak) => ({ namn: `${RP}/textures/items/${texturNamn(sak)}.png`, data: pixlarTillPng(sak.pixlar) })),
    { namn: `${RP}/texts/en_US.lang`, data: lang },
    { namn: `${RP}/texts/sv_SE.lang`, data: lang },
    { namn: `${RP}/texts/languages.json`, data: json(["en_US", "sv_SE"]) },
  ];

  return { filnamn: `OliversModdar-${versionText}.mcaddon`, bytes: skapaZip(filer), version: versionText };
}
