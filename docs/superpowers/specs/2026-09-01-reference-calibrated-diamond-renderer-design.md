# AMES Milestone 2.1 Reference-Calibrated Diamond Renderer Design

## Scope

Milestone 2.1 creates a disciplined development-only calibration workflow with two rendering modes for the same preserved round-brilliant diamond:

1. AMES realtime mode, which remains the interactive production renderer.
2. AMES reference mode, which uses a slower path tracer for internal comparison.

This milestone does not add end-user UI, redesign the page, replace realtime rendering, expose reference mode in production, change unrelated architecture, or begin CAD, Boutique, Chatface, Splash, or application integration.

## Authorities and clean-room boundary

### GIA

GIA is the authority for round-brilliant anatomy and appearance terminology. The workflow will use:

- 57 or 58 facet anatomy: table; 8 star, 8 bezel, and 16 upper-half crown facets; 8 pavilion mains, 16 lower halves, and optional culet.
- Table, crown, pavilion, girdle, star-length, and lower-half relationships.
- Brightness as white-light return.
- Fire as dispersed spectral-color appearance.
- Scintillation as both moving flashes and the size, arrangement, and contrast of bright and dark patterns.
- Human observation as the final validation layer for computational appearance models.

AMES will cite GIA sources but will not redistribute GIA text or imagery.

### piellardj/diamond-webgl

The GPL-3.0 project is a public technical and visual benchmark only. AMES may study publicly documented concepts including:

- Cut controls and light-return sensitivity.
- Snell refraction, Fresnel splitting, total internal reflection, and Beer absorption.
- ASET interpretation and the role of structured contrast.
- Public visual output and interaction behavior.

AMES will not copy, translate, adapt, import, or derive source code, shaders, constants, assets, or implementation structure from diamond-webgl. Research notes will retain source links and explicitly state the clean-room boundary.

### gkjohnson/three-gpu-pathtracer

The MIT-licensed package is appropriate for an internal reference renderer because it supports Three.js scenes, WebGL2 GPU path tracing, BVH acceleration, environment maps, area and spot lights, physical transmission, IOR, attenuation, multiple bounces, and independent transmissive bounce limits.

The package is RGB rather than spectral. Reference mode is authoritative for white-light return, transparent depth, Fresnel/TIR behavior, facet contrast, and static lighting patterns. It is not an authoritative spectral-fire renderer. A future clean-room spectral-pass experiment may be assessed separately and is outside this milestone.

The project will retain required MIT notices. Current Three.js 0.185.1 satisfies the package's Three.js peer floor of 0.180.0. Direct dependencies will include compatible `three-mesh-bvh` and any required path-tracer peer dependency.

## Current implementation baseline

- Geometry is generated procedurally with 32-fold rings, 320 render triangles, outward winding, and computed flat triangle normals.
- Exported metadata represents 57 standard facet groups, while the render topology contains additional triangulation.
- Geometry is structurally approved and remains unchanged unless a later isolated, proven geometry defect receives explicit approval.
- Realtime material uses Drei `MeshRefractionMaterial` with IOR 2.417.
- Realtime refraction uses BVH traversal, total internal reflection, Fresnel weighting, 5 desktop or 3 constrained-device bounces, and restrained RGB chromatic offsets.
- The realtime environment is a procedural cubemap with soft white cards, neutral fill, and dark flags.
- Output uses ACES filmic tone mapping, sRGB, exposure 0.9, a 32-degree perspective camera, and a dark neutral background.
- Existing direct scene lights remain part of the scene boundary, although the refraction material is primarily driven by environment sampling.

## Recommended architecture

A shared canonical calibration specification is the source of truth. It contains only renderer-independent values:

- Geometry factory and approved object transform.
- Camera position, target, field of view, near/far range, and exposure target.
- Background color.
- Diamond optical values: IOR, attenuation assumptions, and quality-independent physical constants.
- Studio card directions, angular extents, colors, and intensities.
- Fixed comparison rotations and capture dimensions.

Two adapters consume this specification:

### Realtime adapter

The existing `JewelryViewer` and `ViewerScene` remain the production path. They consume shared camera, transform, environment, and optical constants while retaining `MeshRefractionMaterial`, OrbitControls, mobile quality fallback, and current public embedding API.

### Reference adapter

`ReferenceDiamondViewer` creates an isolated Three.js renderer and `WebGLPathTracer`. It uses the same geometry factory and object transform, the same camera values, and an environment generated from the same canonical studio-card specification. The diamond uses a dedicated `MeshPhysicalMaterial` with transmission 1, IOR 2.417, zero or near-zero roughness, explicit attenuation, and sufficient path/transmissive bounces.

Because realtime uses a cubemap and the path tracer consumes an equirectangular environment or physical lights, both textures are generated from one canonical directional card specification. They represent the same authored environment even though renderer-specific texture projections differ.

## Development-only comparison harness

Reference mode is available only when `import.meta.env.DEV` is true. A development-only query or entry selects the internal comparison harness. Production builds retain the existing application and no visible renderer switch.

The harness displays or captures realtime and reference canvases side by side using synchronized, non-interactive canonical camera and diamond rotation values. The existing normal page remains unchanged.

An automated capture script produces paired images and a JSON manifest for fixed rotations. It records:

- Camera and transform values.
- Environment specification hash.
- Realtime optical profile.
- Reference material and bounce settings.
- Renderer dimensions, sample count, and exposure.
- Luminance histogram summary.
- Clipped-highlight ratio.
- Deep-shadow ratio.
- Changed-pixel ratio between rotations as a scintillation proxy.

Metrics assist calibration but never replace visual evaluation.

## Calibration process

1. Lock geometry, camera, transform, environment, background, and capture dimensions.
2. Render fixed rotations in realtime and reference modes.
3. Compare transparency, white-light return, dark-facet structure, highlight clipping, and rotation-to-rotation pattern changes.
4. Change one realtime parameter group at a time.
5. Re-run paired captures and metrics.
6. Evaluate restrained fire separately because the reference renderer is not spectral.
7. Stop at a human visual approval gate.

## Acceptance criteria

- The same approved geometry, transform, camera, background, and canonical environment specification feed both modes.
- Realtime mode and its public controls remain unchanged for end users.
- Reference mode is absent from production UI.
- Geometry and rollback files remain byte-for-byte unchanged.
- Reference mode converges progressively and can reset when camera, scene, or material values change.
- Paired captures are reproducible and include complete settings metadata.
- Realtime calibration trends toward transparent depth, healthy light return, controlled dark facets, natural brightness, restrained fire, and moving scintillation.
- Tests, production build, desktop/mobile realtime interaction, reference rendering, WebGL diagnostics, console/page/network checks, and license documentation pass.
- The development server remains running at the visual approval gate.

## Exact file plan

### Create

- `src/engine/calibration/diamondCalibrationConfig.ts`
- `src/engine/calibration/createCalibrationEnvironment.ts`
- `src/engine/calibration/index.ts`
- `src/engine/reference/ReferenceDiamondViewer.tsx`
- `src/engine/reference/createReferenceDiamondMaterial.ts`
- `src/engine/reference/index.ts`
- `src/dev/DiamondComparisonHarness.tsx`
- `scripts/capture-diamond-comparison.mjs`
- `tests/diamondCalibrationConfig.test.ts`
- `tests/referenceDiamondMaterial.test.ts`
- `tests/diamondComparison.test.ts`
- `docs/research/milestone-2.1-sources.md`

### Modify

- `package.json`
- `package-lock.json`
- `src/main.tsx`
- `src/engine/renderer/JewelryViewer.tsx`
- `src/engine/renderer/ViewerScene.tsx`
- `src/engine/renderer/createDiamondStudioEnvironment.ts`
- `src/engine/jewelry/RoundBrilliantDiamond.tsx`

### Must remain unchanged

- `src/engine/jewelry/createRoundBrilliantGeometry.ts`
- `src/engine/jewelry/TemporaryJewelry.tsx`
- Existing page structure, controls, branding, and production UI

## Sources

- GIA, “Diamond Cut: Anatomy of a Round Brilliant.”
- GIA, “Modeling the Appearance of the Round Brilliant Cut Diamond: An Analysis of Fire, and More about Brilliance.”
- GIA, “A Foundation for Grading the Overall Cut Quality of Round Brilliant Cut Diamonds.”
- `piellardj/diamond-webgl` public documentation and GPL-3.0 license.
- `gkjohnson/three-gpu-pathtracer` README, source interfaces, package metadata, and MIT license.
