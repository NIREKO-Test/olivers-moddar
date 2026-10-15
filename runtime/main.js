import { world, system, ItemStack, EquipmentSlot, EntityDamageCause } from "@minecraft/server";
import { PAKET, SAKER } from "./saker.js";

// Körs inne i Minecraft. Appen skriver saker.js med Olivers saker och deras
// krafter; den här filen gör själva krafterna.

// ---------- Reglage ----------
const RACKVIDD = 64; // hur långt bort man kan sikta (block)
const HOPP_KRAFT = 1.3; // hur högt superhoppet går
const FRYS_TID = 100; // hur länge fienden är frusen (20 = en sekund)
const ELD_TID = 6; // hur många sekunder fienden brinner
// -----------------------------

const SAK_PER_ID = new Map(SAKER.map((sak) => [sak.id, sak]));

// Fel skrivs i chatten (en gång per sorts fel) så de syns utan att man
// behöver leta i Minecrafts logg.
const rapporterade = new Set();
function rapportera(spelare, text) {
  console.warn(`[olivers-moddar] ${text}`);
  if (rapporterade.has(text)) return;
  rapporterade.add(text);
  try {
    spelare?.sendMessage(`§c[Olivers moddar] ${text}`);
  } catch {
    // Spelaren kan ha hunnit lämna världen.
  }
}

function mitt(entitet) {
  const p = entitet.location;
  return { x: p.x, y: p.y + 1, z: p.z };
}

function partiklar(dimension, namn, plats, antal = 1, sprid = 0.5) {
  for (let i = 0; i < antal; i++) {
    try {
      dimension.spawnParticle(namn, {
        x: plats.x + (Math.random() - 0.5) * 2 * sprid,
        y: plats.y + (Math.random() - 0.5) * 2 * sprid,
        z: plats.z + (Math.random() - 0.5) * 2 * sprid,
      });
    } catch {
      // Partiklar är bara utsmyckning.
    }
  }
}

function ljud(dimension, namn, plats) {
  try {
    dimension.playSound(namn, plats);
  } catch {
    // Ljud är också bara utsmyckning.
  }
}

function strale(dimension, fran, till, partikel) {
  const dx = till.x - fran.x;
  const dy = till.y - fran.y;
  const dz = till.z - fran.z;
  const steg = Math.min(RACKVIDD, Math.ceil(Math.sqrt(dx * dx + dy * dy + dz * dz)));
  for (let i = 1; i <= steg; i++) {
    const t = i / steg;
    partiklar(dimension, partikel, { x: fran.x + dx * t, y: fran.y + dy * t, z: fran.z + dz * t }, 1, 0.05);
  }
}

function avstand(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

// Var spelaren siktar: ovanpå blocket den tittar på, eller en bit framåt i luften.
function siktpunkt(spelare) {
  const traff = spelare.getBlockFromViewDirection({ maxDistance: RACKVIDD });
  if (traff) {
    const b = traff.block.location;
    return { punkt: { x: b.x + 0.5, y: b.y + 1, z: b.z + 0.5 }, traffadeBlock: true };
  }
  const huvud = spelare.getHeadLocation();
  const riktning = spelare.getViewDirection();
  return {
    punkt: { x: huvud.x + riktning.x * 20, y: huvud.y + riktning.y * 20, z: huvud.z + riktning.z * 20 },
    traffadeBlock: false,
  };
}

// Första varelsen spelaren tittar på, om någon.
function varelseISikte(spelare) {
  return spelare.getEntitiesFromViewDirection({ maxDistance: RACKVIDD })[0]?.entity;
}

// Block som aldrig får göras om till regnbåge.
const SKYDDADE_BLOCK = new Set([
  "minecraft:bedrock",
  "minecraft:barrier",
  "minecraft:command_block",
  "minecraft:chain_command_block",
  "minecraft:repeating_command_block",
  "minecraft:structure_block",
  "minecraft:end_portal",
  "minecraft:end_portal_frame",
  "minecraft:portal",
  "minecraft:end_gateway",
]);
const REGNBAGE = ["red", "orange", "yellow", "lime", "light_blue", "blue", "purple"].map((f) => `minecraft:${f}_wool`);
const BOSSAR = new Set(["minecraft:ender_dragon", "minecraft:wither"]);
/** @type {[string, number, number][]} */
const SKATTER = [
  ["minecraft:diamond", 1, 3],
  ["minecraft:emerald", 1, 3],
  ["minecraft:gold_ingot", 2, 5],
  ["minecraft:iron_ingot", 3, 6],
  ["minecraft:golden_apple", 1, 1],
];

// En kort stunds skydd så Oliver inte skadas av sina egna blixtar och smällar.
function skydda(spelare) {
  spelare.addEffect("resistance", 40, { amplifier: 4, showParticles: false });
  spelare.addEffect("fire_resistance", 160, { amplifier: 0, showParticles: false });
}

// När man slår en fiende.
const SLAG = {
  eld(spelare, mal) {
    mal.setOnFire(ELD_TID, true);
    partiklar(mal.dimension, "minecraft:basic_flame_particle", mitt(mal), 12, 0.6);
    ljud(mal.dimension, "fire.ignite", mal.location);
  },
  blixt(spelare, mal) {
    skydda(spelare);
    mal.dimension.spawnEntity("minecraft:lightning_bolt", mal.location);
  },
  frys(spelare, mal) {
    mal.addEffect("slowness", FRYS_TID, { amplifier: 6, showParticles: false });
    mal.addEffect("weakness", FRYS_TID, { amplifier: 1, showParticles: false });
    partiklar(mal.dimension, "minecraft:snowflake_particle", mitt(mal), 24, 0.7);
    ljud(mal.dimension, "random.glass", mal.location);
  },
  explosion(spelare, mal) {
    skydda(spelare);
    mal.dimension.createExplosion(mal.location, 3, { breaksBlocks: false, causesFire: false, source: spelare });
  },
  skatt(spelare, mal) {
    const [id, minst, mest] = SKATTER[Math.floor(Math.random() * SKATTER.length)];
    const antal = minst + Math.floor(Math.random() * (mest - minst + 1));
    mal.dimension.spawnItem(new ItemStack(id, antal), mitt(mal));
    partiklar(mal.dimension, "minecraft:villager_happy", mitt(mal), 10, 0.6);
    ljud(mal.dimension, "random.orb", mal.location);
  },
  kyckling(spelare, mal) {
    if (mal.typeId === "minecraft:player" || BOSSAR.has(mal.typeId)) {
      spelare.onScreenDisplay.setActionBar("Den är för stark för att bli kyckling!");
      return;
    }
    const { dimension, location } = mal;
    mal.remove();
    dimension.spawnEntity("minecraft:chicken", location);
    partiklar(dimension, "minecraft:villager_happy", { x: location.x, y: location.y + 0.5, z: location.z }, 16, 0.6);
    ljud(dimension, "mob.chicken.plop", location);
  },
  lakning(spelare) {
    spelare.addEffect("instant_health", 1, { amplifier: 0, showParticles: false });
    partiklar(spelare.dimension, "minecraft:heart_particle", mitt(spelare), 6, 0.5);
  },
};

// När man trycker med saken i handen.
const TRYCK = {
  blixt(spelare) {
    const { punkt } = siktpunkt(spelare);
    strale(spelare.dimension, spelare.getHeadLocation(), punkt, "minecraft:electric_spark_particle");
    if (avstand(punkt, spelare.location) < 8) skydda(spelare);
    spelare.dimension.spawnEntity("minecraft:lightning_bolt", punkt);
  },
  explosion(spelare) {
    const { punkt } = siktpunkt(spelare);
    strale(spelare.dimension, spelare.getHeadLocation(), punkt, "minecraft:basic_flame_particle");
    skydda(spelare);
    spelare.dimension.createExplosion(punkt, 4, { breaksBlocks: false, causesFire: false, source: spelare });
  },
  teleport(spelare) {
    const { punkt, traffadeBlock } = siktpunkt(spelare);
    if (!traffadeBlock) {
      spelare.onScreenDisplay.setActionBar("Titta på marken så hoppar du dit!");
      return;
    }
    const dimension = spelare.dimension;
    const fran = mitt(spelare);
    try {
      spelare.teleport(punkt, { checkForBlocks: true });
    } catch {
      spelare.onScreenDisplay.setActionBar("Där får du inte plats!");
      return;
    }
    partiklar(dimension, "minecraft:basic_portal_particle", fran, 30, 0.8);
    ljud(dimension, "mob.endermen.portal", fran);
    partiklar(dimension, "minecraft:basic_portal_particle", punkt, 30, 0.8);
    ljud(dimension, "mob.endermen.portal", punkt);
  },
  hopp(spelare) {
    const riktning = spelare.getViewDirection();
    spelare.applyKnockback({ x: riktning.x * 0.6, z: riktning.z * 0.6 }, HOPP_KRAFT);
    partiklar(spelare.dimension, "minecraft:villager_happy", spelare.location, 12, 0.6);
    ljud(spelare.dimension, "random.pop", spelare.location);
    // Långsamt fall först när hoppet nästan nått toppen, annars flyger man iväg.
    system.runTimeout(() => {
      try {
        spelare.addEffect("slow_falling", 200, { amplifier: 0, showParticles: false });
      } catch {
        // Spelaren kan ha lämnat världen.
      }
    }, 14);
  },
  regnbage(spelare) {
    const traff = spelare.getBlockFromViewDirection({ maxDistance: RACKVIDD });
    if (!traff) {
      spelare.onScreenDisplay.setActionBar("Titta på något så blir det regnbåge!");
      return;
    }
    const dimension = spelare.dimension;
    const c = traff.block.location;
    strale(dimension, spelare.getHeadLocation(), { x: c.x + 0.5, y: c.y + 0.5, z: c.z + 0.5 }, "minecraft:villager_happy");
    for (let dy = 2; dy >= -2; dy--) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (dx * dx + dy * dy + dz * dz > 5) continue;
          const block = dimension.getBlock({ x: c.x + dx, y: c.y + dy, z: c.z + dz });
          if (!block || block.isAir || block.isLiquid || SKYDDADE_BLOCK.has(block.typeId)) continue;
          if (block.getComponent("minecraft:inventory")) continue; // kistor och liknande
          block.setType(REGNBAGE[2 - dy]);
        }
      }
    }
    ljud(dimension, "random.orb", c);
  },
  magnet(spelare) {
    const mal = varelseISikte(spelare);
    if (!mal) {
      spelare.onScreenDisplay.setActionBar("Sikta på ett monster!");
      return;
    }
    const p = spelare.location;
    const riktning = spelare.getViewDirection();
    const hit = { x: p.x + riktning.x * 2, y: p.y, z: p.z + riktning.z * 2 };
    partiklar(mal.dimension, "minecraft:basic_portal_particle", mitt(mal), 20, 0.6);
    mal.teleport(hit);
    ljud(spelare.dimension, "mob.endermen.portal", hit);
  },
  eldklot(spelare) {
    const mal = varelseISikte(spelare);
    const huvud = spelare.getHeadLocation();
    const riktning = spelare.getViewDirection();
    const till = mal ? mitt(mal) : { x: huvud.x + riktning.x * 20, y: huvud.y + riktning.y * 20, z: huvud.z + riktning.z * 20 };
    strale(spelare.dimension, huvud, till, "minecraft:basic_flame_particle");
    ljud(spelare.dimension, "mob.blaze.shoot", spelare.location);
    if (!mal) return;
    mal.setOnFire(ELD_TID, true);
    mal.applyDamage(6, { cause: EntityDamageCause.fire, damagingEntity: spelare });
  },
};

function heldSak(spelare) {
  const foremal = spelare.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand);
  return foremal ? SAK_PER_ID.get(foremal.typeId) : undefined;
}

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity: spelare, hitEntity: mal }) => {
  if (spelare.typeId !== "minecraft:player") return;
  try {
    const sak = heldSak(spelare);
    if (!sak) return;
    system.run(() => {
      if (!mal.isValid) return;
      for (const kraft of sak.slag) {
        if (!mal.isValid) break;
        try {
          SLAG[kraft]?.(spelare, mal);
        } catch (fel) {
          rapportera(spelare, `${kraft} fungerade inte: ${fel}`);
        }
      }
    });
  } catch (fel) {
    rapportera(spelare, `fel när du slog: ${fel}`);
  }
});

// Trycket kan komma som "använd föremål", "börja använda" eller "tryck på
// block", ibland flera samtidigt. Spärren ser till att en tryckning bara blir
// en kraft.
const senastTryck = new Map();
function anvand(spelare, foremal) {
  const sak = foremal ? SAK_PER_ID.get(foremal.typeId) : undefined;
  if (!sak || sak.tryck.length === 0) return;
  const nu = system.currentTick;
  if (nu - (senastTryck.get(spelare.id) ?? -100) < 10) return;
  senastTryck.set(spelare.id, nu);
  system.run(() => {
    for (const kraft of sak.tryck) {
      try {
        TRYCK[kraft]?.(spelare);
      } catch (fel) {
        rapportera(spelare, `${kraft} fungerade inte: ${fel}`);
      }
    }
  });
}

world.afterEvents.itemUse.subscribe(({ source: spelare, itemStack }) => {
  try {
    anvand(spelare, itemStack);
  } catch (fel) {
    rapportera(spelare, `fel när du tryckte: ${fel}`);
  }
});

world.afterEvents.itemStartUse.subscribe(({ source: spelare, itemStack }) => {
  try {
    anvand(spelare, itemStack);
  } catch (fel) {
    rapportera(spelare, `fel när du tryckte: ${fel}`);
  }
});

world.afterEvents.playerInteractWithBlock.subscribe(({ player: spelare, itemStack, isFirstEvent }) => {
  if (!isFirstEvent) return;
  try {
    anvand(spelare, itemStack);
  } catch (fel) {
    rapportera(spelare, `fel när du tryckte: ${fel}`);
  }
});

// Första gången i världen: säg hej och ge alla saker han inte redan fått.
world.afterEvents.playerSpawn.subscribe(({ player: spelare, initialSpawn }) => {
  if (!initialSpawn) return;
  system.runTimeout(() => {
    try {
      spelare.sendMessage(`§bOlivers moddar är igång! §7(version ${PAKET.version})`);
      const inventory = spelare.getComponent("minecraft:inventory");
      for (const sak of SAKER) {
        const tagg = `fick_${sak.id.replace(":", "_")}`;
        if (spelare.hasTag(tagg)) continue;
        try {
          const overblivet = inventory?.container.addItem(new ItemStack(sak.id, 1));
          if (overblivet) spelare.dimension.spawnItem(overblivet, spelare.location);
          spelare.addTag(tagg);
          spelare.sendMessage(`§eDu fick ${sak.namn}!`);
        } catch (fel) {
          rapportera(spelare, `${sak.namn} kunde inte skapas: ${fel}`);
        }
      }
    } catch (fel) {
      rapportera(spelare, `fel vid start: ${fel}`);
    }
  }, 40);
});

console.warn(`[olivers-moddar] igång, version ${PAKET.version}, ${SAKER.length} saker`);
