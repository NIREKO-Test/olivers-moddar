// Minimal ZIP-skrivare (lagrade filer, ingen komprimering). Räcker för
// .mcaddon-paket och fungerar utan bibliotek.
import { crc32 } from "./png.js";

const kodare = new TextEncoder();

// filer: [{ namn: "mapp/fil.json", data: Uint8Array | string }]
export function skapaZip(filer) {
  const poster = [];
  const mappar = new Set();
  for (const fil of filer) {
    const delar = fil.namn.split("/");
    for (let i = 1; i < delar.length; i++) mappar.add(delar.slice(0, i).join("/") + "/");
  }
  for (const mapp of [...mappar].sort()) poster.push({ namn: mapp, data: new Uint8Array(0) });
  for (const fil of filer) {
    poster.push({ namn: fil.namn, data: typeof fil.data === "string" ? kodare.encode(fil.data) : fil.data });
  }

  const lokala = [];
  const centrala = [];
  let offset = 0;
  // Fast tidsstämpel (2026-01-01) så samma innehåll ger samma fil.
  const dosTid = 0;
  const dosDatum = ((2026 - 1980) << 9) | (1 << 5) | 1;

  for (const post of poster) {
    const namn = kodare.encode(post.namn);
    const crc = crc32(post.data);
    const lokal = new Uint8Array(30 + namn.length);
    const lv = new DataView(lokal.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, dosTid, true);
    lv.setUint16(12, dosDatum, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, post.data.length, true);
    lv.setUint32(22, post.data.length, true);
    lv.setUint16(26, namn.length, true);
    lokal.set(namn, 30);
    lokala.push(lokal, post.data);

    const central = new Uint8Array(46 + namn.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTid, true);
    cv.setUint16(14, dosDatum, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, post.data.length, true);
    cv.setUint32(24, post.data.length, true);
    cv.setUint16(28, namn.length, true);
    cv.setUint32(38, post.namn.endsWith("/") ? 0x10 : 0, true);
    cv.setUint32(42, offset, true);
    central.set(namn, 46);
    centrala.push(central);

    offset += lokal.length + post.data.length;
  }

  const centralStorlek = centrala.reduce((s, c) => s + c.length, 0);
  const slut = new Uint8Array(22);
  const sv = new DataView(slut.buffer);
  sv.setUint32(0, 0x06054b50, true);
  sv.setUint16(8, poster.length, true);
  sv.setUint16(10, poster.length, true);
  sv.setUint32(12, centralStorlek, true);
  sv.setUint32(16, offset, true);

  const delar = [...lokala, ...centrala, slut];
  const ut = new Uint8Array(delar.reduce((s, d) => s + d.length, 0));
  let p = 0;
  for (const d of delar) {
    ut.set(d, p);
    p += d.length;
  }
  return ut;
}
