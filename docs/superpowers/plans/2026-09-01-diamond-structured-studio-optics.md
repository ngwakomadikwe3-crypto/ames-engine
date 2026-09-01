# Diamond Structured Studio Optics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved round-brilliant diamond read as transparent luxury macro photography through material, optics, environment, exposure, and camera calibration only.

**Architecture:** Preserve the geometry and engine boundaries. Export testable optical, studio, renderer, and camera configuration from their existing modules, consume those values in the existing React Three Fiber scene, and validate the real viewer at several rotations.

**Tech Stack:** React, TypeScript, Three.js, React Three Fiber, Drei MeshRefractionMaterial, Vitest, Vite

## Global Constraints

- Do not modify `src/engine/jewelry/createRoundBrilliantGeometry.ts`.
- Do not redesign or regenerate the approved geometry.
- Do not add UI, post-processing, scenery, gemstones, CAD, or architecture changes.
- Keep IOR at 2.417 and retain adaptive desktop/mobile quality.
- Keep the dark neutral background and existing controls.
- Leave the development server running at the visual approval gate.

---

### Task 1: Testable optical and studio configuration

**Files:**
- Modify: `tests/diamondMaterial.test.ts`
- Create: `tests/diamondStudio.test.ts`
- Modify: `src/engine/materials/diamondQuality.ts`
- Modify: `src/engine/renderer/createDiamondStudioEnvironment.ts`

**Interfaces:**
- Consumes: `getDiamondQualityProfile(constrained: boolean)`
- Produces: `DIAMOND_STUDIO_PALETTE`, `DIAMOND_STUDIO_CARDS`, and calibrated quality profiles

- [ ] **Step 1: Write failing tests**

Assert desktop/mobile profiles retain IOR-path compatibility while using restrained dispersion and distinct bounce budgets. Assert the studio exports include broad white cards, medium-gray fill, and charcoal flags with asymmetric positions and no pure-black fill.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/diamondMaterial.test.ts tests/diamondStudio.test.ts`
Expected: FAIL because the new studio configuration exports and calibrated values do not exist.

- [ ] **Step 3: Implement minimal configuration**

Export immutable palette/card definitions, render the cube faces from them, and calibrate quality profiles without touching geometry.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --run tests/diamondMaterial.test.ts tests/diamondStudio.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```cmd
git add tests\diamondMaterial.test.ts tests\diamondStudio.test.ts src\engine\materials\diamondQuality.ts src\engine\renderer\createDiamondStudioEnvironment.ts
git commit -m "fix: structure diamond studio reflections"
```

### Task 2: Material depth, exposure, and macro camera

**Files:**
- Modify: `tests/diamondMaterial.test.ts`
- Create: `tests/diamondViewerConfig.test.ts`
- Modify: `src/engine/materials/DiamondMaterial.tsx`
- Modify: `src/engine/renderer/JewelryViewer.tsx`

**Interfaces:**
- Produces: `DIAMOND_VIEWER_CAMERA`, `DIAMOND_TONE_MAPPING_EXPOSURE`
- Consumes: calibrated `DiamondQualityProfile`

- [ ] **Step 1: Write failing tests**

Assert material tint is a neutral transparent value rather than opaque white, IOR remains 2.417, exposure is explicitly below the washout-prone default, and the camera remains a moderate macro perspective.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/diamondMaterial.test.ts tests/diamondViewerConfig.test.ts`
Expected: FAIL on missing viewer exports and old white tint.

- [ ] **Step 3: Implement minimal configuration**

Consume exported constants in `MeshRefractionMaterial` and `Canvas`, set renderer exposure through `onCreated`, and adjust only camera position/FOV.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --run tests/diamondMaterial.test.ts tests/diamondViewerConfig.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```cmd
git add tests\diamondMaterial.test.ts tests\diamondViewerConfig.test.ts src\engine\materials\DiamondMaterial.tsx src\engine\renderer\JewelryViewer.tsx
git commit -m "fix: deepen diamond transparency and exposure"
```

### Task 3: Whole-result visual and technical verification

**Files:**
- Do not modify geometry files
- Temporary screenshots may be created under `tests/` and deleted before commit

- [ ] **Step 1: Run focused and full tests**

Run: `npm test -- --run`
Expected: all tests pass, including unchanged geometry tests.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: build succeeds. Existing bundle-size warning may remain.

- [ ] **Step 3: Exercise real viewer**

At `http://127.0.0.1:5173/`, capture desktop images before and after pointer rotation plus a mobile image. Confirm the approved silhouette is unchanged, reflections alternate bright/dark during rotation, highlights retain detail, the body reads transparent, and spectral fire is localized.

- [ ] **Step 4: Check browser health**

Verify drag and wheel change canvas output, WebGL reports error 0, desktop/mobile canvases fill their viewports, and console/page/network error collections are empty.

- [ ] **Step 5: Confirm boundaries and clean state**

Run: `git diff b5de0d0 -- src/engine/jewelry/createRoundBrilliantGeometry.ts src/engine/jewelry/TemporaryJewelry.tsx`
Expected: no output.

Run: `git status --short`
Expected: no output after deleting temporary screenshots.

- [ ] **Step 6: Stop at visual approval gate**

Leave the existing Vite server running and report the local URL without starting any other AMES work.
