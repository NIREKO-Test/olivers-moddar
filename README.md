# Olivers moddar

En webbapp där Oliver (8 år) gör egna vapen med krafter till Minecraft
Bedrock på iPaden. Han väljer en form, ritar den pixel för pixel, ger den ett
namn och en styrka, väljer krafter och skickar allt till Minecraft som ett
`.mcaddon`-paket. Appen fungerar utan internet när den väl är installerad.

## Installera på iPaden

1. Öppna <https://nireko-test.github.io/olivers-moddar/> i **Safari**
   på iPaden som har Minecraft.
2. Tryck på dela-knappen och välj **Lägg till på hemskärmen**.
3. Använd appen från hemskärmen. Det som görs i Safari-fliken sparas separat.

## Få in sakerna i Minecraft

1. **Skicka till Minecraft** → **Öppna i Minecraft** → välj Minecraft i
   delningsmenyn (eller Spara i Filer och öppna därifrån).
2. Första gången: aktivera **Olivers moddar** i världens inställningar, under
   både Beteendepaket och Resurspaket.
3. I världen står det "Olivers moddar är igång!" i chatten, och nya saker
   hamnar i ryggsäcken. Röd text i chatten betyder att något gick fel.

## Krafter

Ett vapen kan ha högst tre krafter (`MAX_KRAFTER` i `mallar.js`). Alla valda
krafter händer samtidigt.

| Kraft     | När du slår                  | När du trycker                      |
|-----------|------------------------------|-------------------------------------|
| Eld       | fienden brinner              |                                     |
| Blixt     | blixt i fienden              | blixt där du tittar                 |
| Frys      | fienden står still           |                                     |
| Pang!     | smäll vid fienden            | smäll där du tittar                 |
| Skatt     | fienden tappar en skatt      |                                     |
| Kyckling  | fienden blir en kyckling     |                                     |
| Läkning   | du får hälsa                 |                                     |
| Teleport  |                              | hoppar dit du tittar                |
| Superhopp |                              | flyger upp i luften                 |
| Regnbåge  |                              | blocken du tittar på blir regnbåge  |
| Magnet    |                              | fienden du tittar på dras till dig  |
| Eldklot   |                              | eld på fienden du tittar på         |

Smällarna förstör inga block, och Oliver skyddas en kort stund från sina
egna blixtar och smällar. Regnbågen rör aldrig kistor, bedrock eller
portaler, och spelare och bossar kan inte bli kycklingar.

## Filer

- `index.html`, `app.css`, `app.js` – appen.
- `rita.js` – ritytan.
- `mallar.js` – färger, startformer, krafter och styrkor.
- `paket.js` – bygger `.mcaddon`-paketet (utan webbläsar-API:er, går att köra i Node).
- `png.js`, `zip.js` – egna små PNG- och ZIP-skrivare, inga bibliotek.
- `runtime/main.js` – skriptet som körs inne i Minecraft och gör krafterna.
  Appen lägger till `saker.js` med Olivers saker bredvid det.
- `sw.js`, `manifest.webmanifest`, `ikoner/` – det som gör det till en
  installerbar app. Ikonerna ritas av `node verktyg/ikoner.mjs`.

Paketen riktar sig mot Minecraft Bedrock 26.40 och senare: item-format
1.26.40 och `@minecraft/server` 2.9.0.

## Lucky-spaden

Olivers första mod, en spade som gräver upp lucky blocks, ligger i
[`olivers-lucky-spade/`](olivers-lucky-spade/). Den byggs med `./build.sh` i den mappen.

## Köra lokalt

```bash
python3 -m http.server 8000   # i repots rot
```

Öppna <http://localhost:8000/>.
