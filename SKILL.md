---
name: ascii-diorama
description: Build short, shareable videos of a tilt-shift miniature world rendered entirely as coloured ASCII characters. The camera looks steeply down on a dense little diorama (a path through trees and meadows, a coast, a village, a harbour) and arcs slowly while the top and bottom of the frame blur away. Use when someone asks for an ASCII scene video, a glyph-rendered or text-mode miniature, a tilt-shift ASCII diorama, or a showcase clip for X/Instagram of a small living world made with Three.js and rendered to mp4.
---

# ASCII diorama

Make a 24-second square mp4 of a small, dense, animated 3D world, seen from high above through a long lens and drawn in coloured monospace glyphs. Each glyph cell takes its colour from the 3D render, and its character from what the surface is, how bright it is and which way its edges run. The middle band of the frame is sharp text. Above and below, it melts into a soft painted blur, like a tilt-shift photograph of a model.

## The look

- **Camera**: about 52 to 58 degrees down, FOV about 23, around 70 to 80 units from the subject. It arcs about 12 degrees of yaw across the whole clip with smooth easing and a slight push in. Nothing cuts.
- **Composition**: one leading line runs diagonally through the frame, such as a stair path, shoreline, river or street. A single saturated focal colour sits against calmer greens, golds and creams. A strong focal colour is one like vermilion gates, striped parasols or a yellow tram. Something different fills the top band (a canopy, rooftops) and the bottom band (water, a plaza) so the blur has colour to work with.
- **Density**: everything is many small things. That means tens of thousands of grass blades, thousands of leaf cards clustered into tree crowns with dark gaps, flower cards in noise-shaped patches, rows of repeated props (lanterns, steps, posts) and rocks along the edges. Sparse, smooth, low-poly scenes read as toys.
- **Life**: wind moves the grass and leaves. Water rolls in bands of foam and pulls back up the shore. Petals or motes drift across. One small creature or figure walks through the focal area.
- **Glyphs**:
  - grass in `/ | \` strokes that lean with the wind
  - foliage in `. : * + o`
  - stone and steps in `— = #`
  - water in `- ~ =`, with foam in `* % #`
  - creatures in `$ &`
  - strong edges switch to `| / — \` along their direction

  The cell background is a dim, blurred copy of the render, so gaps between glyphs still carry colour.
- **Format**: square 1440×1440, 30 fps, 24 s, with quiet real ambience (waves, insects, birds) at about -27 dB mean.

## Files

- `templates/scene/main.js`: the complete starter miniature, which is red gates running down a green cliff to a turquoise sea. It includes stone steps, lanterns, gold and red trees, white flower patches, rocks with foam, a walking fox and drifting petals. Every system you need is in it: terrain bake, sea shader, instanced grass, flowers and leaves, path props, the glyph pass and tilt-shift.
- `templates/scene/audio.json`: the ambience mix.
- `scripts/fetch-assets.sh <scene-dir>`: downloads the starter's textures, fox model and sounds.
- `scripts/record.mjs <scene-dir>`: renders stills, consecutive-frame sheets or the final mp4 with audio, frame-exact, in headless Chromium.

## Workflow

1. **Start from the template and change the subject.** Don't ship the template's subject unchanged. Keep the systems and swap what they build, so it becomes your own world. For example:
   - a fishing harbour with a breakwater path and boats
   - a hill village with a cobbled lane
   - a waterfall gorge with a footbridge
   - a lighthouse point
   - a desert oasis
   - a city rooftop garden

   ```bash
   mkdir -p <scene> && cp ~/.claude/skills/ascii-diorama/templates/scene/* <scene>/
   bash ~/.claude/skills/ascii-diorama/scripts/fetch-assets.sh <scene>
   ```
   It needs `three` and `esbuild` resolvable from the folder (a parent `node_modules` works), plus `playwright-core` with Chromium. Set `PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core` if it lives elsewhere.
2. **Know where things live in `main.js`**:

   | Section | What it controls |
   |---|---|
   | `coastZ`, `rawH`, `ROCKS` | the land shape and shoreline |
   | `PATH` | the leading line, as control points from top to bottom of frame |
   | `buildTerrain` | bakes ground colour and glyph class from real textures, zoned by height, path distance and noise |
   | `buildSea` | the water: depth colours, rolling foam, swash, caustics |
   | `buildGrass`, `buildFlowers`, `buildTrees` | the dense fill |
   | `buildTunnel`, `buildLanterns`, `buildShrine`, `buildRocks` | the props along and around the path; replace these with your subject's props |
   | `CLS` and the `cls<...` branches in `asciiFrag` | the glyph rules per surface |
   | `placeCamera`, `TARGET` | the arc |
   | `tiltFrag` | the focus band and blur strength |
3. **Gather assets with clear licences.** Prefer CC0:
   - Poly Haven textures and HDRIs: `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/<id>/<id>_diff_1k.jpg`, with the list at `https://api.polyhaven.com/assets?t=textures`.
   - Wikimedia Commons audio: check `extmetadata.LicenseShortName` through the API.
   - Khronos glTF sample models: read each README's Legal section.

   Put downloads in their own folder, never run anything from them, and keep a list of each asset's source and licence. Avoid copyrighted characters.
4. **Check stills early** (a few seconds each), and read the images:
   ```bash
   node ~/.claude/skills/ascii-diorama/scripts/record.mjs <scene> --stills 6,12,18
   ```
   Check that the focal element and the leading line sit in the sharp band, that the top and bottom bands hold colour, and that large areas sit in the middle brightness range so their glyphs vary.
5. **Check motion in consecutive frames**:
   ```bash
   node ~/.claude/skills/ascii-diorama/scripts/record.mjs <scene> --seq 12,6
   ```
   Glyphs flipping every frame read as strobing, so slow down the noise that drives them. The creature should step, not slide.
6. **Render**:
   ```bash
   node ~/.claude/skills/ascii-diorama/scripts/record.mjs <scene>
   ```
   Then build a contact sheet with ffmpeg and look at it. Measure the audio with `volumedetect` (about -27 dB mean, -14 dB peak). Measure the frame-to-frame difference too: a mean YAVG of 0.7 to 1.0 between frames is calm, and spikes mean flicker.
7. **Report**: give the mp4 path, the one-line re-render command, a table of assets with sources, licences and any credit needed, and any weak spots you saw in the frames.

## Tuning that works

- Grid 200×100 on a square frame (cells of about 7×14 px). Sample the scene at the cell's mip level so each glyph averages its footprint.
- Grade: tone curve, saturation 1.2 to 1.4, glyph colour × 1.3, cell background × 0.2 to 0.35. Raise the background for large bright surfaces such as sand or snow so they stay light.
- Tilt-shift: focus around 0.42 to 0.47 of the height, blur starting about 0.27 away from it, up to 26 to 30 px on a golden-angle disc.
- Light: a low-ish sun from the front-left with 4096 shadow maps, so canopies throw dappled shadow onto the grass and props cast readable shadows. Use a warm hemisphere fill.
- Props on a path: space them at about the prop width, never tighter. Use a long gentle S rather than tight switchbacks.

## Pitfalls seen before

- **Props lying along the path instead of across it**: with local x as the wide axis, use `rotation.y = Math.atan2(tangent.x, tangent.z)`.
- **Tight switchbacks under wide props**: they pile into a claw shape.
- **Black squares spreading through the image**: NaN in the half-float target, which mipmapping spreads. Lit skinned glTF meshes are the usual cause, so use `MeshBasicMaterial` for small animated creatures.
- **Hulls or roofs black from above**: flipped normals on extruded shapes. Use `side: THREE.DoubleSide` or unlit materials.
- **Dark tops on gates or roofs**: these hide the focal colour from a steep camera, so colour the top surfaces.
- **Water blowing out to white glyphs**: lower its base colours.
- **Orange or brown blob rocks**: tint them cool grey and flatten them.
- **A glyph used in a rule but missing from `GLYPHS`**: it produces `undefined` in the shader, so add it to the atlas string first.
- **The browser pane**: never drive the pane the user is watching to verify. The recorder runs its own headless Chromium (`--use-angle=metal` on macOS).
