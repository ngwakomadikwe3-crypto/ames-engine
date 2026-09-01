# Reference-Calibrated Diamond Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated development-only path-traced reference renderer and paired comparison harness driven by the same diamond, camera, transform, and studio specification as the unchanged production realtime viewer.

**Architecture:** Introduce renderer-independent calibration configuration and environment adapters. Keep the existing production viewer as the realtime adapter, add a development-only `WebGLPathTracer` adapter, and select the comparison harness only through a development query parameter. Produce deterministic paired captures without importing GPL code.

**Tech Stack:** React, TypeScript, Three.js 0.185.x, React Three Fiber, Drei, `three-gpu-pathtracer`, `three-mesh-bvh`, Vitest, Vite, Playwright capture script

## Global Constraints

- Keep `src/engine/jewelry/createRoundBrilliantGeometry.ts` completely unchanged.
- Keep `src/engine/jewelry/TemporaryJewelry.tsx` unchanged.
- Keep production UI, branding, controls, page behavior, and public embedding behavior unchanged.
- Reference and comparison code must be development-only and absent from production UI.
- Do not copy or adapt GPL-3.0 `diamond-webgl` source, shaders, constants, or assets.
- Integrate only commercially compatible dependencies and retain required notices.
- Do not begin CAD or unrelated AMES work.

---

### Task 1: Canonical calibration specification and research record

**Files:**
- Create: `src/engine/calibration/diamondCalibrationConfig.ts`
- Create: `src/engine/calibration/index.ts`
- Create: `docs/research/milestone-2.1-sources.md`
- Create: `tests/diamondCalibrationConfig.test.ts`
- Modify: `src/engine/renderer/JewelryViewer.tsx`
- Modify: `src/engine/jewelry/RoundBrilliantDiamond.tsx`

**Interfaces:**
- Produces: `DIAMOND_CALIBRATION` with camera, transform, optics, background, capture rotations, and dimensions.
- Consumers: realtime and reference adapters.

- [ ] Write a failing test asserting IOR 2.417, current camera values, current diamond transform, dark background, fixed rotations, immutable values, and stable serialization.
- [ ] Run `npm test -- --run tests/diamondCalibrationConfig.test.ts`; expect failure because the module does not exist.
- [ ] Implement the immutable specification and update existing realtime components to consume it without changing rendered values or controls.
- [ ] Document GIA sources, GPL clean-room restrictions, MIT path-tracer license, and the RGB/non-spectral limitation.
- [ ] Run the focused test and existing viewer/material tests; expect pass.
- [ ] Verify `git diff -- src/engine/jewelry/createRoundBrilliantGeometry.ts src/engine/jewelry/TemporaryJewelry.tsx` is empty.
- [ ] Commit as `feat: add canonical diamond calibration spec`.

### Task 2: Shared canonical environment adapters

**Files:**
- Create: `src/engine/calibration/createCalibrationEnvironment.ts`
- Create: `tests/diamondCalibrationEnvironment.test.ts`
- Modify: `src/engine/renderer/createDiamondStudioEnvironment.ts`
- Modify: `src/engine/renderer/ViewerScene.tsx`

**Interfaces:**
- Produces: `createRealtimeCalibrationEnvironment()` and `createReferenceCalibrationEnvironment()` from one studio-card specification.
- Consumes: `DIAMOND_CALIBRATION.environment`.

- [ ] Write failing tests asserting both adapters use the same card count, colors, angular positions, and stable environment hash.
- [ ] Run the focused test; expect missing exports.
- [ ] Move renderer-independent card data into calibration configuration and implement cube/equirectangular adapters.
- [ ] Keep realtime visual inputs equivalent to the current procedural cube environment.
- [ ] Run focused and existing studio tests; expect pass.
- [ ] Commit as `feat: share diamond calibration environment`.

### Task 3: MIT path-traced reference renderer

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/engine/reference/createReferenceDiamondMaterial.ts`
- Create: `src/engine/reference/ReferenceDiamondViewer.tsx`
- Create: `src/engine/reference/index.ts`
- Create: `tests/referenceDiamondMaterial.test.ts`

**Interfaces:**
- Produces: `REFERENCE_DIAMOND_MATERIAL`, `REFERENCE_RENDER_SETTINGS`, and `ReferenceDiamondViewer`.
- Consumes: approved geometry factory, canonical calibration spec, and reference environment.

- [ ] Verify npm licenses for `three-gpu-pathtracer`, `three-mesh-bvh`, and required peers before installation.
- [ ] Install exact compatible versions and record them in the research note.
- [ ] Write failing tests asserting transmission 1, IOR 2.417, zero roughness, explicit attenuation, at least 12 path bounces, at least 16 transmissive traversals, and development-only contract.
- [ ] Run the focused test; expect missing exports.
- [ ] Implement an isolated imperative Three.js path-tracer lifecycle with cleanup, resize handling, progressive sampling, and reset on camera/scene changes.
- [ ] Use the approved geometry factory without modifying its file.
- [ ] Run focused tests and `npm run build`; production build must not import or expose reference UI.
- [ ] Commit as `feat: add internal diamond reference renderer`.

### Task 4: Development-only comparison harness and deterministic capture

**Files:**
- Create: `src/dev/DiamondComparisonHarness.tsx`
- Create: `scripts/capture-diamond-comparison.mjs`
- Create: `tests/diamondComparison.test.ts`
- Modify: `src/main.tsx`
- Modify: `package.json`

**Interfaces:**
- Development URL: `/?ames-dev=diamond-comparison`
- Capture command: `npm run capture:diamond-comparison`

- [ ] Write failing tests asserting production mode always mounts `App`, development mode selects the harness only for the exact query, and both panels receive the same camera/environment/rotation specification.
- [ ] Run the focused test; expect missing harness and selector.
- [ ] Implement a development-only dynamic import guarded by `import.meta.env.DEV`.
- [ ] Implement side-by-side labeled development panels without modifying normal page styles or components.
- [ ] Implement capture script for fixed rotations, paired PNGs, and a JSON manifest containing settings and basic luminance/clipping/shadow/change metrics.
- [ ] Run focused tests, full tests, and production build.
- [ ] Confirm the production bundle does not contain the comparison labels or reference-renderer entry string.
- [ ] Commit as `feat: add diamond comparison harness`.

### Task 5: End-to-end verification and visual gate

**Files:**
- Temporary captures under `tests/artifacts/diamond-comparison/`; remove or gitignore before completion.

- [ ] Run `npm test -- --run`; all tests pass.
- [ ] Run `npm run build`; build succeeds.
- [ ] Verify byte-for-byte geometry preservation with `git diff b5de0d0 -- src/engine/jewelry/createRoundBrilliantGeometry.ts src/engine/jewelry/TemporaryJewelry.tsx`.
- [ ] Exercise the normal realtime URL on desktop/mobile: drag, wheel, full viewport, WebGL error 0, no console/page/network errors.
- [ ] Exercise `/?ames-dev=diamond-comparison`: both canvases render the same rotation and camera; reference samples increase; resets work.
- [ ] Run the deterministic capture command and inspect paired outputs and manifest.
- [ ] Remove temporary artifacts, confirm clean Git status, and leave the comparison development server running.
- [ ] Stop and report the exact comparison URL for Chrome visual approval.
