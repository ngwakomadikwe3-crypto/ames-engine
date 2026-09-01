# AMES Engine Milestone 2 Diamond Rendering Design

**Date:** 2026-09-01

## Goal

Render one physically convincing, interactive round brilliant diamond in real time while preserving the existing AMES Engine architecture and temporary rollback geometry.

## Scope

Milestone 2 adds only a reusable round-brilliant geometry module, a reusable diamond optical material module, environment-driven presentation, adaptive quality selection, and focused verification. It does not add Boutique UI, Chatface, splash content, page redesign, CAD generation, or unrelated engine restructuring.

## Technical Research Decision

Use Drei's installed `MeshRefractionMaterial`, backed by `three-mesh-bvh`. Its shader traces rays through the actual mesh, performs repeated internal intersections, refracts at IOR boundaries, reflects on total internal reflection, samples an environment map, applies Fresnel response, and supports chromatic aberration. This matches the required optical behavior and is already compatible with Three.js 0.185.1, React Three Fiber 9.7.0, and Drei 10.7.8.

Three.js `MeshPhysicalMaterial` is not the primary material because its documented IOR range stops at 2.333, below diamond's approximately 2.417, and its general transmission model does not trace repeated internal facet bounces. A new bespoke shader is unnecessary because the installed Drei implementation already provides the required BVH ray tracing with lower maintenance risk.

## Architecture

Preserve `JewelryViewer`, `ViewerScene`, `ViewerControls`, `StudioLighting`, and the page shell. Add diamond geometry and presentation under `src/engine/jewelry`, and the optical material/profile under `src/engine/materials`. `TemporaryJewelry` remains unchanged and exported for immediate rollback.

`ViewerScene` continues to be the sole composition point. The scene will mount `RoundBrilliantDiamond` only after its geometry, material, tests, build, and browser behavior pass. No new application-level state or UI controls are introduced.

## Round-Brilliant Geometry

Generate a closed non-indexed `BufferGeometry` procedurally from concentric facet rings. The geometry includes:

- octagonal table,
- crown star facets,
- bezel/kite facets,
- upper girdle facets,
- a thin faceted girdle,
- lower girdle facets,
- pavilion main facets,
- culet point.

Use 16-fold radial segmentation around the girdle so alternating ring offsets produce the characteristic round-brilliant facet pattern. Emit triangles with duplicated vertices per triangle and compute flat normals so every facet remains optically distinct. Validate that all positions and normals are finite, triangle counts are stable, the geometry is closed, and its bounding dimensions match the intended shallow crown/deep pavilion silhouette.

## Diamond Material

`DiamondMaterial` wraps `MeshRefractionMaterial` and requires the scene environment texture. Optical defaults are:

- IOR: `2.417`,
- white body color,
- multi-bounce BVH tracing,
- nonzero Fresnel response,
- subtle chromatic aberration for spectral fire,
- full opacity.

The desktop quality profile uses four internal bounces and the fast chromatic approximation after browser profiling showed this preserves visible spectral fire while sustaining approximately 49 frames per second in the verification browser. The mobile/constrained profile uses three bounces and the same fast chromatic approximation at lower aberration strength, sustaining approximately 55 frames per second in the constrained viewport. Quality selection is deterministic from coarse pointer/mobile media capability so it does not introduce a frame-time feedback system in this milestone.

## Environment and Lighting

Use Drei's cached studio HDR environment preset to supply reflected and refracted radiance. The preset is shared by the scene environment and the diamond material and must load without browser network errors. Existing studio lights remain as presentation lights, with only intensity or placement adjustments if browser evidence shows clipping or a flat result. Configure renderer tone mapping/exposure only within the existing Canvas boundary, without changing page design.

## Interaction and Performance

Retain the existing `OrbitControls`, including mouse/touch rotation and scroll/pinch zoom. Keep panning disabled and existing distance constraints intact. Reuse one compact geometry and one BVH-backed material. Cap device pixel ratio adaptively and avoid post-processing, path tracing, video, image impostors, continuous geometry updates, and per-frame allocations.

## Failure Handling and Rollback

If HDR/environment setup fails during implementation, do not replace the temporary object. If the diamond introduces WebGL or shader compilation errors, restore `TemporaryJewelry` at the scene mount while retaining the isolated diamond modules for diagnosis. The rollback object itself must not be edited or deleted.

## Testing and Acceptance

Unit tests cover the geometry contract and adaptive material profile selection without using a synthetic diamond image. Integration tests verify the public viewer shell and that scene composition selects the diamond only after implementation.

Acceptance requires:

1. Vitest passes.
2. TypeScript and the Vite production build pass.
3. The real Vite application opens in a WebGL browser at desktop and mobile viewport sizes.
4. A real canvas and WebGL context exist without console, page, network, or shader errors.
5. Drag and wheel input alter rendered output, demonstrating active view controls.
6. The diamond is visibly faceted rather than sphere-derived.
7. Browser measurements show acceptable interactive frame production on the verification machine, with the adaptive profile used for constrained/mobile conditions.
8. The development server remains running for visual review.
