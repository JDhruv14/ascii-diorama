#!/bin/bash
# Downloads the starter scene's textures and model into <scene-dir>/assets. All CC0,
# except the fox rig and animation (CC BY 4.0, credit tomkranis, @AsoboStudio and @scurest).
set -euo pipefail
D="${1:?usage: fetch-assets.sh <scene-dir>}/assets"
mkdir -p "$D/tex" "$D/models"
PH=https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k
for t in leafy_grass coast_sand_01 aerial_rocks_02 castle_wall_slates weathered_planks bark_brown_02; do
  [ -s "$D/tex/$t.jpg" ] || curl -sfL -o "$D/tex/$t.jpg" "$PH/$t/${t}_diff_1k.jpg"
done
[ -s "$D/models/Fox.glb" ] || curl -sfL -o "$D/models/Fox.glb" https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb
ls -R "$D"
