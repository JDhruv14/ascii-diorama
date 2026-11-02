#!/bin/bash
# Downloads the starter scene's assets into <scene-dir>/assets. All CC0 or public domain,
# except the fox rig and animation (CC BY 4.0, credit tomkranis, @AsoboStudio and @scurest).
set -euo pipefail
D="${1:?usage: fetch-assets.sh <scene-dir>}/assets"
mkdir -p "$D/tex" "$D/models" "$D/audio"
PH=https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k
for t in leafy_grass coast_sand_01 aerial_rocks_02 castle_wall_slates weathered_planks bark_brown_02; do
  [ -s "$D/tex/$t.jpg" ] || curl -sfL -o "$D/tex/$t.jpg" "$PH/$t/${t}_diff_1k.jpg"
done
[ -s "$D/models/Fox.glb" ] || curl -sfL -o "$D/models/Fox.glb" https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb
commons() { # $1 file title, $2 output
  [ -s "$2" ] && return
  local u
  u=$(curl -s -G -A "ascii-diorama/1.0" https://commons.wikimedia.org/w/api.php --data-urlencode action=query --data-urlencode format=json \
      --data-urlencode "titles=$1" --data-urlencode prop=imageinfo --data-urlencode iiprop=url | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
  curl -sfL -A "ascii-diorama/1.0" -o "$2" "$u"
}
commons "File:Ocean Waves on a Tropical Beach.ogg" "$D/audio/waves.ogg"
commons "File:Cicadas in Greece.ogg" "$D/audio/cicadas.ogg"
ls -R "$D"
