#!/usr/bin/env bash
# Bygger OliversLuckySpade-<version>.mcaddon som går att importera i Minecraft.
set -euo pipefail
cd "$(dirname "$0")"

NAMN="OliversLuckySpade"
UT="dist"

VERSION=$(python3 -c "import json; print('.'.join(map(str, json.load(open('behavior_pack/manifest.json'))['header']['version'])))")
RP_VERSION=$(python3 -c "import json; print('.'.join(map(str, json.load(open('resource_pack/manifest.json'))['header']['version'])))")
if [ "$VERSION" != "$RP_VERSION" ]; then
  echo "Versionerna skiljer sig: beteendepaket $VERSION, resurspaket $RP_VERSION" >&2
  exit 1
fi

python3 tools/make_textures.py

rm -rf "$UT"
mkdir -p "$UT/stage/${NAMN}_BP" "$UT/stage/${NAMN}_RP"
cp -R behavior_pack/. "$UT/stage/${NAMN}_BP/"
cp -R resource_pack/. "$UT/stage/${NAMN}_RP/"

# Skriv versionen först i beskrivningen, så den syns i Minecrafts paketlista.
for manifest in "$UT/stage/${NAMN}_BP/manifest.json" "$UT/stage/${NAMN}_RP/manifest.json"; do
  python3 - "$manifest" "$VERSION" <<'PY'
import json, sys
sokvag, version = sys.argv[1], sys.argv[2]
m = json.load(open(sokvag))
m["header"]["description"] = f"Version {version} · {m['header']['description']}"
json.dump(m, open(sokvag, "w"), indent=2, ensure_ascii=False)
PY
done

(cd "$UT/stage" && zip -r -X "../${NAMN}-${VERSION}.mcaddon" . >/dev/null)
rm -rf "$UT/stage"

echo
echo "Klart: $(pwd)/$UT/${NAMN}-${VERSION}.mcaddon"
