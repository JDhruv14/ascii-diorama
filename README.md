# ascii-diorama

A [Claude Code](https://claude.com/claude-code) skill for making short videos of a tilt-shift miniature world rendered entirely as coloured ASCII characters.

The camera looks steeply down on a dense little 3D diorama and arcs slowly while the top and bottom of the frame blur away. Every pixel is drawn as a monospace glyph. Grass becomes `/ | \` strokes that lean with the wind, water becomes `~ -` with `#` foam, stone becomes `— = #`, and trees become clusters of `o * +`. Each glyph takes its colour from the 3D render. Up close it reads as text, and from a distance as a painting.

The output is a square 1440×1440, 24-second mp4 at 30 fps with quiet ambient sound, ready to post.

## What's inside

```
SKILL.md                     the skill: look, workflow, tuning, pitfalls
scripts/record.mjs           frame-exact renderer: stills, frame sheets, mp4 with audio
scripts/fetch-assets.sh      downloads the starter scene's textures, model and sounds
templates/scene/main.js      a complete starter miniature (Three.js)
templates/scene/audio.json   ambience mix
```

The starter scene is a line of red gates running down a green cliff to a turquoise sea. It has stone steps, lanterns, gold and red trees, white flower patches, rocks with rolling foam, a walking fox and drifting petals. It contains every system a new scene needs: terrain baking from real textures, a sea shader, instanced grass, leaves and flowers, path props, the glyph pass and tilt-shift. Swap what those systems build to make your own world, such as a harbour, a hill village, a gorge, a lighthouse or a rooftop garden.

## Install

```bash
git clone https://github.com/JDhruv14/ascii-diorama ~/.claude/skills/ascii-diorama
```

Claude Code picks it up automatically. Ask for "an ASCII diorama video of a fishing harbour" or run `/ascii-diorama`.

### Requirements

- Node.js 18+
- `three`, `esbuild` and `playwright-core` installed in or above the scene folder:
  ```bash
  npm i three esbuild playwright-core
  npx playwright-core install chromium
  ```
  Alternatively, point `PLAYWRIGHT_CORE` at an existing `playwright-core`.
- `ffmpeg` on the PATH (or set `FFMPEG`)

## Use it by hand

```bash
mkdir -p my-scene && cp ~/.claude/skills/ascii-diorama/templates/scene/* my-scene/
bash ~/.claude/skills/ascii-diorama/scripts/fetch-assets.sh my-scene
```

Check stills first, then motion in consecutive frames, then render the full video:

```bash
node ~/.claude/skills/ascii-diorama/scripts/record.mjs my-scene --stills 6,12,18
```
```bash
node ~/.claude/skills/ascii-diorama/scripts/record.mjs my-scene --seq 12,6
```
```bash
node ~/.claude/skills/ascii-diorama/scripts/record.mjs my-scene
```

The video lands at `my-scene/my-scene.mp4`. Stills and frame sheets go to `my-scene/out/`.

## How it works

1. Each material writes a surface class (grass, water, stone and so on) into the alpha channel of a half-float render target.
2. A full-screen shader splits the frame into a 200×100 grid. For each cell it samples the render at the matching mip level, reads the class and measures the brightness gradient. It then picks a glyph from a per-class rule, with wind noise for grass and water and edge direction for stone.
3. The glyph is drawn from a canvas-generated atlas, coloured with the graded render colour, over a dim blurred copy of the scene.
4. A tilt-shift pass blurs the top and bottom bands on a golden-angle disc.
5. `record.mjs` bundles the scene with esbuild, serves it locally and drives headless Chromium frame by frame through `window.__frame(t)`. It pipes the frames to ffmpeg, then mixes in the audio from `audio.json`.

## Asset licences

`fetch-assets.sh` downloads the following (none of these files are stored in this repo):

| Asset | Source | Licence |
|---|---|---|
| Textures: `leafy_grass`, `coast_sand_01`, `aerial_rocks_02`, `castle_wall_slates`, `weathered_planks`, `bark_brown_02` | [Poly Haven](https://polyhaven.com) | CC0 |
| Fox model | PixelMannen, via [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox) | CC0 |
| Fox rig and animation | tomkranis | CC BY 4.0, credit required |
| Fox glTF conversion | @AsoboStudio and @scurest | CC BY 4.0, credit required |
| Ocean Waves on a Tropical Beach | Jarrod Stanley, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ocean_Waves_on_a_Tropical_Beach.ogg) | CC0 |
| Cicadas in Greece | Channel R, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Cicadas_in_Greece.ogg) | Public domain |

If your video uses the fox, credit tomkranis, @AsoboStudio and @scurest.

## Licence

The code and skill text in this repository are released under the [MIT License](LICENSE).
