import { world, system, ItemStack } from "@minecraft/server";

// ============================================================
//  OLIVERS LUCKY-SPADE
//  Gräv med spaden -> du får en lucky block.
//  Slå sönder lucky blocken -> du får något bra.
// ============================================================

// ---------- REGLAGE: ändra här ----------

// Hur ofta spaden ger en lucky block.
// 1 = varje gång du gräver, 0.5 = ungefär varannan gång, 0.1 = var tionde.
const CHANS_PER_GRAV = 1.0;

// Ska du få en NY lucky block när du gräver sönder en lucky block?
// true  = oändligt med lucky blocks (blir lätt för lätt)
// false = du får bara belöningen
const LUCKY_BLOCK_GER_NY = false;

// ----------------------------------------

const SPADE = "oliver:lucky_spade";
const LUCKY_BLOCK = "oliver:lucky_block";

// Belöningar. "vikt" = hur vanlig den är. Högre vikt = oftare.
// saker: [item-id, minsta antal, största antal]
/** @type {{vikt: number, text: string, saker?: [string, number, number][], djur?: string[], antalDjur?: number, fint?: boolean}[]} */
const BELONINGAR = [
  { vikt: 12, text: "Diamanter!", saker: [["minecraft:diamond", 3, 8]] },
  { vikt: 12, text: "Guld!", saker: [["minecraft:gold_ingot", 5, 12]] },
  { vikt: 12, text: "Järn!", saker: [["minecraft:iron_ingot", 8, 16]] },
  { vikt: 10, text: "Smaragder!", saker: [["minecraft:emerald", 3, 9]] },
  {
    vikt: 10,
    text: "Matpaket!",
    saker: [["minecraft:cooked_beef", 12, 24], ["minecraft:golden_apple", 1, 2], ["minecraft:cake", 1, 1]],
  },
  {
    vikt: 10,
    text: "Byggpaket!",
    saker: [["minecraft:oak_planks", 64, 64], ["minecraft:torch", 32, 32]],
  },
  { vikt: 8, text: "Erfarenhet!", saker: [["minecraft:experience_bottle", 8, 20]] },
  { vikt: 6, text: "Diamantsvärd!", saker: [["minecraft:diamond_sword", 1, 1]] },
  { vikt: 6, text: "Diamanthacka!", saker: [["minecraft:diamond_pickaxe", 1, 1]] },
  { vikt: 6, text: "Ender pearls!", saker: [["minecraft:ender_pearl", 4, 8]] },
  { vikt: 5, text: "Fyrverkerier!", saker: [["minecraft:firework_rocket", 16, 32]] },
  {
    vikt: 4,
    text: "HEL DIAMANTRUSTNING!",
    saker: [
      ["minecraft:diamond_helmet", 1, 1],
      ["minecraft:diamond_chestplate", 1, 1],
      ["minecraft:diamond_leggings", 1, 1],
      ["minecraft:diamond_boots", 1, 1],
    ],
  },
  { vikt: 4, text: "Förtrollade gyllene äpplen!", saker: [["minecraft:enchanted_golden_apple", 1, 2]] },
  { vikt: 3, text: "Totem of Undying!", saker: [["minecraft:totem_of_undying", 1, 1]], fint: true },
  { vikt: 2, text: "NETHERIT!", saker: [["minecraft:netherite_ingot", 1, 2]], fint: true },
  { vikt: 2, text: "ELYTRA!", saker: [["minecraft:elytra", 1, 1]], fint: true },
  { vikt: 1, text: "BEACON!!", saker: [["minecraft:beacon", 1, 1]], fint: true },
  { vikt: 6, text: "Djur!", djur: ["minecraft:cow", "minecraft:chicken", "minecraft:pig", "minecraft:sheep"], antalDjur: 3 },
  { vikt: 3, text: "En häst!", djur: ["minecraft:horse"], antalDjur: 1 },
  { vikt: 3, text: "En varg!", djur: ["minecraft:wolf"], antalDjur: 2 },
];

const TOTAL_VIKT = BELONINGAR.reduce((summa, b) => summa + b.vikt, 0);

function slumpTal(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function valjBeloning() {
  let traff = Math.random() * TOTAL_VIKT;
  for (const beloning of BELONINGAR) {
    traff -= beloning.vikt;
    if (traff <= 0) return beloning;
  }
  return BELONINGAR[0];
}

// Fel skrivs i chatten (en gång per sorts fel), så de syns utan att man
// behöver leta i Minecrafts logg.
const rapporterade = new Set();
function rapportera(spelare, text) {
  console.warn(`[lucky-spade] ${text}`);
  if (rapporterade.has(text)) return;
  rapporterade.add(text);
  try {
    spelare?.sendMessage(`§c[Lucky-spade] ${text}`);
  } catch {
    // Spelaren kan ha hunnit lämna världen.
  }
}

function mitten(plats) {
  return { x: plats.x + 0.5, y: plats.y + 0.5, z: plats.z + 0.5 };
}

function oppnaLuckyBlock(dimension, spelare, plats) {
  const beloning = valjBeloning();
  const punkt = mitten(plats);

  for (const [id, min, max] of beloning.saker ?? []) {
    const antal = slumpTal(min, max);
    try {
      dimension.spawnItem(new ItemStack(id, antal), punkt);
    } catch (fel) {
      rapportera(spelare, `kunde inte skapa ${antal}x ${id}: ${fel}`);
    }
  }

  for (let i = 0; i < (beloning.antalDjur ?? 0); i++) {
    const arter = beloning.djur;
    const art = arter[Math.floor(Math.random() * arter.length)];
    try {
      dimension.spawnEntity(art, punkt);
    } catch (fel) {
      rapportera(spelare, `kunde inte skapa ${art}: ${fel}`);
    }
  }

  try {
    dimension.playSound(beloning.fint ? "random.levelup" : "random.orb", punkt);
    dimension.spawnParticle("minecraft:villager_happy", punkt);
  } catch {
    // Ljud och partiklar är grädde på moset - strunt i om de missar.
  }

  spelare.onScreenDisplay.setActionBar(beloning.text);
}

world.afterEvents.playerBreakBlock.subscribe((handelse) => {
  const { player: spelare, block, dimension, brokenBlockPermutation } = handelse;
  try {
    const plats = block.location;
    const varLuckyBlock = brokenBlockPermutation.type.id === LUCKY_BLOCK;
    const gravdeMedSpaden = handelse.itemStackBeforeBreak?.typeId === SPADE;

    // Systemet vill att vi ändrar världen i nästa tick, inte mitt i händelsen.
    system.run(() => {
      try {
        if (varLuckyBlock) {
          oppnaLuckyBlock(dimension, spelare, plats);
          if (!LUCKY_BLOCK_GER_NY) return;
        }

        if (!gravdeMedSpaden) return;
        if (Math.random() > CHANS_PER_GRAV) return;

        dimension.spawnItem(new ItemStack(LUCKY_BLOCK, 1), mitten(plats));
        spelare.onScreenDisplay.setActionBar("§eLucky block!");
      } catch (fel) {
        rapportera(spelare, `kunde inte ge lucky block: ${fel}`);
      }
    });
  } catch (fel) {
    rapportera(spelare, `fel när blocket grävdes: ${fel}`);
  }
});

// Första gången någon går in i världen: säg att paketet är igång och ge
// spaden direkt, så det inte behövs fusk, kreativt läge eller crafting.
const FICK_SPADEN = "fick_lucky_spade";

world.afterEvents.playerSpawn.subscribe(({ player: spelare, initialSpawn }) => {
  if (!initialSpawn) return;

  // Vänta två sekunder så laddningsskärmen hunnit försvinna.
  system.runTimeout(() => {
    try {
      spelare.sendMessage("§eOlivers Lucky-spade är igång!");

      // Säg till direkt om lucky blocket inte laddades.
      try {
        new ItemStack(LUCKY_BLOCK, 1);
      } catch (fel) {
        rapportera(spelare, `lucky blocket laddades inte: ${fel}`);
      }

      if (spelare.hasTag(FICK_SPADEN)) return;

      const inventory = spelare.getComponent("minecraft:inventory");
      const overblivet = inventory?.container.addItem(new ItemStack(SPADE, 1));
      if (overblivet) spelare.dimension.spawnItem(overblivet, spelare.location);

      spelare.addTag(FICK_SPADEN);
      spelare.sendMessage("§eDu har fått Olivers Lucky-spade!");
    } catch (fel) {
      rapportera(spelare, `spaden kunde inte skapas: ${fel}`);
    }
  }, 40);
});

console.warn("[lucky-spade] igång");
