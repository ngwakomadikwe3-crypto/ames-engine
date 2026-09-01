# AMES Diamond Structured Studio Optics Design

## Scope

Calibrate only the existing diamond material, optical quality profiles, procedural studio environment, exposure, tone mapping, and camera framing. Preserve the currently approved round-brilliant geometry byte-for-byte. Do not add UI, post-processing, scenery, gemstones, CAD features, or architectural changes.

## Objective

The interactive loose diamond should initially resemble luxury macro jewelry photography rather than an opaque white CG crystal. Rotation must reveal transparent crystalline depth, controlled alternating bright and dark facet reflections, and occasional restrained spectral fire.

## Approach

Use the existing `MeshRefractionMaterial` and IOR of 2.417. Replace the overly uniform cube-map illumination with an asymmetric, controlled jewelry studio assembled from large soft white cards, neutral gray fill, and strategically positioned narrow charcoal flags. The environment remains local and procedural, avoiding an external HDR asset while making scintillation repeatable and testable.

## Material and optics

- Preserve diamond IOR at 2.417.
- Keep multi-bounce BVH refraction and adaptive desktop/mobile quality profiles.
- Tune bounce count, Fresnel contribution, and aberration strength conservatively.
- Keep dispersion localized to small flashes. Avoid continuous rainbow edges or coating-like color.
- Avoid white material tinting that suppresses perceived transparent depth.

## Studio environment

- Use asymmetric card placement so neighboring facets do not receive identical luminance.
- Provide broad white cards for clean highlights and brilliance.
- Provide medium-gray fill for transparent body depth.
- Provide narrow charcoal flags for structured dark facet reflections without large dead-black sectors.
- Keep the visible scene background neutral and dark.

## Exposure and camera

- Continue ACES filmic tone mapping and sRGB output.
- Set explicit renderer exposure so white cards remain brilliant without clipping most facets to white.
- Adjust only camera position and field of view for a macro product-photography perspective and balanced framing.
- Preserve existing OrbitControls behavior and interaction boundaries.

## Boundaries

The following must not change:

- `createRoundBrilliantGeometry.ts`
- Approved geometry exports and tests
- Engine folder architecture
- Page structure and existing brand treatment
- Temporary rollback geometry
- Viewer controls and public embedding contract

## Testing and acceptance

Automated tests will cover the material quality profiles and exported studio/exposure configuration. Existing geometry tests must pass unchanged. The production build must pass.

Browser verification will exercise desktop and mobile rendering, pointer rotation, wheel zoom, WebGL status, console/page/network errors, and full-viewport sizing. Visual captures at multiple rotations will be checked for changing bright/dark facet patterns, transparent depth, unclipped highlights, a dark neutral background, and restrained spectral fire.

The development server will remain running at the visual approval gate. No subsequent AMES feature work begins without explicit approval.
