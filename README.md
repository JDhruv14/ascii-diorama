# ascii-diorama

A [Claude Code](https://claude.com/claude-code) skill for building **tilt-shift ASCII miniatures**: small, dense, living 3D worlds drawn entirely as coloured monospace characters.

The camera looks steeply down on a little Three.js diorama and sweeps slowly back and forth while the top and bottom of the view blur away like a scale model. Every pixel is drawn as a glyph:
- grass as `/ | \` strokes that lean with the wind
- water as `~ -` with `#` foam
- stone as `— = #`
- trees as clusters of `o * +`

Each glyph takes its colour from the 3D render. Up close it reads as text, and from a distance as a painting. It runs live in the browser and loops forever.

## What's inside

```
SKILL.md                   the skill: look, workflow, tuning, pitfalls
scripts/serve.mjs          live preview that rebuilds on every reload
scripts/fetch-assets.sh    downloads the starter scene's textures and model
templates/scene/main.js    a complete starter miniature (Three.js)
```

The starter scene is a line of red gates running down a green cliff to a turquoise sea. It has stone steps, lanterns, gold and red trees, white flower patches, rocks with rolling foam, a walking fox and drifting petals.

It contains every system a new scene needs:
- terrain baking from real textures
- a sea shader
- instanced grass, leaves and flowers
- path props
- the glyph pass and tilt-shift

Swap what those systems build to make your own world, such as a harbour, a hill village, a gorge, a lighthouse or a rooftop garden.

## Install

```bash
git clone https://github.com/JDhruv14/ascii-diorama ~/.claude/skills/ascii-diorama
```

Claude Code picks it up automatically. Ask for something like "an ASCII diorama of a fishing harbour", or run `/ascii-diorama`.

To update later:

```bash
git -C ~/.claude/skills/ascii-diorama pull
```

### Requirements

- Node.js 18+
- `three` and `esbuild` installed in or above the scene folder:
  ```bash
  npm i three esbuild
  ```
- A browser with WebGL 2

## Use it by hand

Set up a scene from the starter:

```bash
mkdir -p my-scene && cp ~/.claude/skills/ascii-diorama/templates/scene/* my-scene/
bash ~/.claude/skills/ascii-diorama/scripts/fetch-assets.sh my-scene
```

Run it:

```bash
node ~/.claude/skills/ascii-diorama/scripts/serve.mjs my-scene
```

Open `http://127.0.0.1:5173/`. Reload the page after editing `my-scene/main.js`, and press Space to pause.

For a static copy, `index.html`, `build/main.js` and `assets/` are everything the page needs.

## How it works

1. Each material writes a surface class (grass, water, stone and so on) into the alpha channel of a half-float render target.
2. A full-screen shader splits the view into a 200×100 grid. For each cell it samples the render at the matching mip level, reads the class and measures the brightness gradient. It then picks a glyph from a per-class rule, with wind noise for grass and water and edge direction for stone.
3. The glyph is drawn from a canvas-generated atlas, coloured with the graded render colour, over a dim blurred copy of the scene.
4. A tilt-shift pass blurs the top and bottom bands on a golden-angle disc.

## Asset licences

`fetch-assets.sh` downloads the following (none of these files are stored in this repo):

| Asset | Source | Licence |
|---|---|---|
| Textures: `leafy_grass`, `coast_sand_01`, `aerial_rocks_02`, `castle_wall_slates`, `weathered_planks`, `bark_brown_02` | [Poly Haven](https://polyhaven.com) | CC0 |
| Fox model | PixelMannen, via [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox) | CC0 |
| Fox rig and animation | tomkranis | CC BY 4.0, credit required |
| Fox glTF conversion | @AsoboStudio and @scurest | CC BY 4.0, credit required |

If what you publish shows the fox, credit tomkranis, @AsoboStudio and @scurest.

## Licence

The code and skill text in this repository are released under the [MIT License](LICENSE).
