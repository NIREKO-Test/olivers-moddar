# Olivers Lucky-spade

Ett add-on till Minecraft Bedrock (version 26.x). Gräv med spaden så får du
lucky blocks. Slå sönder en lucky block så får du något bra.

## Bygga

```bash
./build.sh
```

Ger `dist/OliversLuckySpade-<version>.mcaddon`. Versionen står också först i
paketets beskrivning i Minecraft, så det syns vilken som är installerad.

## Installera på iPad

1. AirDropa `OliversLuckySpade-<version>.mcaddon` från Macen till iPaden.
2. Tryck på notisen — Minecraft öppnas och importerar paketet.
3. **Import räcker inte.** Paketet måste aktiveras på en värld:
   gå till **Spela → pennikonen bredvid världen → Beteendepaket →
   Mina paket → Olivers Lucky-spade → Aktivera**.
4. Gör samma sak under **Resurspaket**, om det inte skedde automatiskt.
5. Spela.

Paketet använder en stabil version av skript-API:et, så **Beta-API:er
behöver normalt inte slås på**. Skulle spaden bara bete sig som en vanlig
spade utan att ge lucky blocks — slå på Beta-API:er under världens
experimentinställningar och testa igen.

## Få tag i spaden

Första gången du går in i en värld med paketet aktivt står det
**"Olivers Lucky-spade är igång!"** i chatten, och spaden läggs i
inventoryt automatiskt. Syns inte meddelandet har beteendepaketet inte
laddats — kolla att det ligger under **Aktiva** i världens inställningar.

Behöver du fler spadar:

- Kreativt läge: sök efter "Olivers Lucky-spade" bland verktygen.
- Överlevnad: tillverka den — ett guldblock överst, två pinnar under.
- Eller skriv `/give @s oliver:lucky_spade` i chatten.

## Ändra saker

Allt som är roligt att pilla på ligger överst i
`behavior_pack/scripts/main.js`:

- `CHANS_PER_GRAV` — hur ofta du får en lucky block. `1` = varje gång,
  `0.5` = varannan gång.
- `LUCKY_BLOCK_GER_NY` — sätt till `true` om du vill att lucky blocks ska
  ge nya lucky blocks (oändligt).
- `BELONINGAR` — listan över vad som kan komma ur en lucky block. `vikt`
  styr hur vanlig varje sak är. Högre vikt = oftare.

Texturerna ritas av `tools/make_textures.py`. Färgerna ligger överst i den
filen, och formen på spaden är en bokstavskarta (`SPADFORM`) som går att
rita om.

Efter en ändring: kör `./build.sh` igen och AirDropa den nya filen.
