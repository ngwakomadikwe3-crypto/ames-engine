# Diamond Optical Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Replace the graphic diamond appearance with calibrated round-brilliant geometry and a professional jewelry-card environment.

**Architecture:** Preserve existing engine boundaries. Geometry stays in `jewelry`, optical parameters stay in `materials`, and environment generation stays in `renderer`.

**Tech Stack:** TypeScript, Three.js, React Three Fiber, Drei BVH refraction, Vitest

## Global Constraints

- No UI, text, CAD, other AMES features, page redesign, or architecture changes.
- Preserve `TemporaryJewelry` unchanged.
- Keep IOR 2.417 and real-time interaction.

### Task 1: Proportion and facet regression contract

**Files:** Modify `tests/diamondGeometry.test.ts`; modify `src/engine/jewelry/createRoundBrilliantGeometry.ts`.

- [ ] Add failing assertions for 56% table, 34.5-degree crown, 40.75-degree pavilion, thin girdle, named 57-facet group metadata, finite flat normals, and outward winding.
- [ ] Run the focused test and observe failure against the old geometry.
- [ ] Implement exact symmetric facet polygons and triangulate each polygon without changing its optical normal.
- [ ] Run focused and full tests.

### Task 2: Controlled jewelry environment and optical profile

**Files:** Create `src/engine/renderer/createDiamondStudioEnvironment.ts`; modify `DiamondEnvironment.tsx`, `RoundBrilliantDiamond.tsx`, `DiamondMaterial.tsx`, `diamondQuality.ts`, and material tests.

- [ ] Add failing profile assertions for restrained dispersion and Fresnel.
- [ ] Generate a local six-face cube environment with broad white/gray cards, narrow highlights, and limited charcoal contrast.
- [ ] Share the cube texture between scene environment and BVH material; remove the generic preset dependency.
- [ ] Keep four/three bounces, IOR 2.417, fast chroma, and reduce dispersion/Fresnel.
- [ ] Dispose local GPU resources cleanly and run tests/build.

### Task 3: Browser calibration and acceptance

**Files:** Modify exposure/lighting values only when supported by screenshot evidence; update the calibration spec and `AGENTS.md` if needed.

- [ ] Capture desktop/mobile screenshots and compare to baseline.
- [ ] Confirm WebGL, interaction, network/console cleanliness, and frame cadence.
- [ ] Iterate only on environment card values, exposure, Fresnel, and dispersion until dead-black regions are controlled and highlights remain photographic.
- [ ] Run final tests/build, commit, remove temporary screenshots, and leave the server running.
