// Minimal PNG-kodare. Skriver RGBA-bilder med okomprimerad deflate, så den
// behöver varken canvas eller något bibliotek och fungerar likadant i
// webbläsaren och i Node.

const CRC_TABELL = (() => {
  const tabell = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabell[n] = c >>> 0;
  }
  return tabell;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABELL[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(bytes) {
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

// zlib-ström med "stored"-block (ingen komprimering).
function zlibOkomprimerad(data) {
  const blockStorlek = 65535;
  const antalBlock = Math.max(1, Math.ceil(data.length / blockStorlek));
  const ut = new Uint8Array(2 + antalBlock * 5 + data.length + 4);
  let p = 0;
  ut[p++] = 0x78;
  ut[p++] = 0x01;
  for (let i = 0; i < antalBlock; i++) {
    const start = i * blockStorlek;
    const langd = Math.min(blockStorlek, data.length - start);
    ut[p++] = i === antalBlock - 1 ? 1 : 0;
    ut[p++] = langd & 0xff;
    ut[p++] = langd >>> 8;
    ut[p++] = ~langd & 0xff;
    ut[p++] = (~langd >>> 8) & 0xff;
    ut.set(data.subarray(start, start + langd), p);
    p += langd;
  }
  const kontroll = adler32(data);
  ut[p++] = kontroll >>> 24;
  ut[p++] = (kontroll >>> 16) & 0xff;
  ut[p++] = (kontroll >>> 8) & 0xff;
  ut[p++] = kontroll & 0xff;
  return ut;
}

function chunk(typ, data) {
  const ut = new Uint8Array(12 + data.length);
  const vy = new DataView(ut.buffer);
  vy.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) ut[4 + i] = typ.charCodeAt(i);
  ut.set(data, 8);
  vy.setUint32(8 + data.length, crc32(ut.subarray(4, 8 + data.length)));
  return ut;
}

// rgba: Uint8Array med bredd*hojd*4 värden. zlib kan bytas mot en riktig
// komprimerare (t.ex. Nodes deflateSync) när storleken spelar roll.
export function kodaPng(bredd, hojd, rgba, { zlib = zlibOkomprimerad } = {}) {
  const rader = new Uint8Array(hojd * (1 + bredd * 4));
  for (let y = 0; y < hojd; y++) {
    rader[y * (1 + bredd * 4)] = 0;
    rader.set(rgba.subarray(y * bredd * 4, (y + 1) * bredd * 4), y * (1 + bredd * 4) + 1);
  }
  const huvud = new Uint8Array(13);
  const vy = new DataView(huvud.buffer);
  vy.setUint32(0, bredd);
  vy.setUint32(4, hojd);
  huvud.set([8, 6, 0, 0, 0], 8);

  const delar = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", huvud),
    chunk("IDAT", zlib(rader)),
    chunk("IEND", new Uint8Array(0)),
  ];
  const ut = new Uint8Array(delar.reduce((s, d) => s + d.length, 0));
  let p = 0;
  for (const d of delar) {
    ut.set(d, p);
    p += d.length;
  }
  return ut;
}
