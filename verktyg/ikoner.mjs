// Ritar appikonerna: svärdsmallen på gräsgrön bakgrund.
// Kör från mod-skaparen/: node verktyg/ikoner.mjs
import fs from "fs";
import { deflateSync } from "zlib";
import { kodaPng } from "../png.js";
import { MALLAR, formTillPixlar } from "../mallar.js";

const RUTOR = 20; // ikonen är 20x20 "minecraft-pixlar"
const GRON = [58, 157, 74];
const GRON_MORK = [50, 140, 64];
const GRON_LJUS = [70, 175, 88];

// Samma "slumpmönster" varje gång så ikonen inte ändras mellan körningar.
let fro = 7;
const slump = () => ((fro = (fro * 16807) % 2147483647) / 2147483647);

const rutnat = [];
for (let i = 0; i < RUTOR * RUTOR; i++) {
  const r = slump();
  rutnat.push(r < 0.12 ? GRON_MORK : r > 0.9 ? GRON_LJUS : GRON);
}
const svard = formTillPixlar(MALLAR.find((mall) => mall.id === "svard").form);
svard.forEach((hex, i) => {
  if (!hex) return;
  const x = (i % 16) + 2;
  const y = Math.floor(i / 16) + 2;
  rutnat[y * RUTOR + x] = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
});

for (const storlek of [180, 192, 512]) {
  const rgba = new Uint8Array(storlek * storlek * 4);
  for (let y = 0; y < storlek; y++) {
    for (let x = 0; x < storlek; x++) {
      const farg = rutnat[Math.floor((y * RUTOR) / storlek) * RUTOR + Math.floor((x * RUTOR) / storlek)];
      rgba.set([...farg, 255], (y * storlek + x) * 4);
    }
  }
  fs.writeFileSync(`ikoner/ikon-${storlek}.png`, kodaPng(storlek, storlek, rgba, { zlib: (d) => deflateSync(d, { level: 9 }) }));
  console.log(`ikoner/ikon-${storlek}.png`);
}
