# AMES Diamond Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one reusable, physically convincing, interactive round brilliant diamond to the existing AMES Engine viewer.

**Architecture:** Procedural flat-faceted geometry remains in `jewelry`; an adaptive Drei BVH refraction wrapper remains in `materials`; the existing scene composition swaps from the preserved rollback object only after isolated modules pass. Procedural environment lightformers supply reflected and refracted radiance without remote assets.

**Tech Stack:** React, TypeScript, Three.js 0.185.1, React Three Fiber 9.7.0, Drei 10.7.8, three-mesh-bvh, Vitest

## Global Constraints

- Do not change the existing engine architecture or page design.
- Keep `TemporaryJewelry` unchanged and available for rollback.
- Do not add Boutique UI, Chatface, splash content, CAD generation, image/video impostors, or unrelated systems.
- Use diamond IOR `2.417` and real faceted geometry.
- Preserve existing orbit, touch, scroll, and pinch controls.

---

### Task 1: Round-brilliant geometry contract

**Files:** Create `tests/diamondGeometry.test.ts` and `src/engine/jewelry/createRoundBrilliantGeometry.ts`; modify `src/engine/jewelry/index.ts`.

**Interfaces:** Produce `createRoundBrilliantGeometry(): THREE.BufferGeometry` and `ROUND_BRILLIANT_TRIANGLE_COUNT: number`.

- [ ] Write a failing test that imports the factory and asserts non-indexed triangle positions/normals, finite attributes, stable triangle count, at least 100 facets, flat per-triangle normals, radius near `1`, crown above `0`, and pavilion below `-0.6`.
- [ ] Run `npm test -- --run tests/diamondGeometry.test.ts`; expect import resolution failure.
- [ ] Implement ring generation with 16 radial segments, alternating angular offsets, explicit table/crown/girdle/pavilion/culet rings, triangle emission with outward winding, and `computeVertexNormals()` on duplicated triangle vertices.
- [ ] Run the focused test and adjust only geometry defects until it passes.
- [ ] Commit with `feat: add round brilliant geometry`.

### Task 2: Adaptive diamond optical profile

**Files:** Create `tests/diamondMaterial.test.ts`, `src/engine/materials/diamondQuality.ts`, `src/engine/materials/DiamondMaterial.tsx`, and `src/engine/materials/index.ts`.

**Interfaces:** Produce `getDiamondQualityProfile(coarsePointer: boolean): { bounces: number; fastChroma: boolean; aberrationStrength: number }`; produce `DiamondMaterial({ envMap, constrained? })`.

- [ ] Write failing profile tests asserting desktop `{ bounces: 5, fastChroma: false, aberrationStrength: 0.012 }` and constrained `{ bounces: 3, fastChroma: true, aberrationStrength: 0.008 }`.
- [ ] Run the focused test and observe missing-module failure.
- [ ] Implement the pure profile function and a `DiamondMaterial` wrapper passing `ior={2.417}`, `fresnel={1}`, white color, selected bounces/chroma, and the required environment texture to `MeshRefractionMaterial`.
- [ ] Run the profile tests and full tests.
- [ ] Commit with `feat: add adaptive diamond material`.

### Task 3: Diamond component and procedural environment

**Files:** Create `src/engine/jewelry/RoundBrilliantDiamond.tsx` and `src/engine/renderer/DiamondEnvironment.tsx`; modify `src/engine/jewelry/index.ts`.

**Interfaces:** `RoundBrilliantDiamond(): JSX.Element` consumes the current scene environment through `useEnvironment`/scene texture and owns one memoized geometry; `DiamondEnvironment(): JSX.Element` supplies procedural Environment/Lightformer capture.

- [ ] Add an integration test assertion that the viewer scene module references `RoundBrilliantDiamond` only after the component exists, while `TemporaryJewelry` remains exported and its source unchanged.
- [ ] Implement procedural studio lightformers using `Environment` and multiple rectangular/ring emitters arranged around the object.
- [ ] Implement the diamond mesh with memoized round-brilliant geometry, adaptive coarse-pointer profile, stable presentation rotation, and `DiamondMaterial` bound to the captured environment.
- [ ] Run full tests and production build.
- [ ] Commit with `feat: compose round brilliant diamond`.

### Task 4: Verified scene replacement

**Files:** Modify `src/engine/renderer/ViewerScene.tsx`, `src/engine/renderer/JewelryViewer.tsx`, and only lighting values proven necessary by browser evidence.

**Interfaces:** `ViewerScene` mounts `DiamondEnvironment`, `RoundBrilliantDiamond`, existing `StudioLighting`, and existing `ViewerControls`. `TemporaryJewelry` remains available but unmounted.

- [ ] Replace only the object mount in `ViewerScene`; do not alter the page shell or control module.
- [ ] Set ACES filmic tone mapping, SRGB output, and restrained exposure in the existing Canvas `gl` callback/config if required by Three.js 0.185.1.
- [ ] Run `npm test -- --run` and `npm run build`; both must pass.
- [ ] Commit with `feat: display diamond in viewer`.

### Task 5: Real-browser optical, interaction, and performance verification

**Files:** Modify only code required by observed failures; update `AGENTS.md` current milestone after acceptance.

**Interfaces:** The real URL `http://127.0.0.1:5173/` is the acceptance interface.

- [ ] Use headless Edge at 1280x800 and 390x844 to confirm WebGL, full-screen canvas, clean console/page/network output, and successful shader compilation.
- [ ] Capture rendered canvas output before and after drag plus wheel interaction; hashes must differ.
- [ ] Sample animation frames for at least two seconds after warmup and report observed frame cadence for desktop and constrained viewport.
- [ ] Inspect a screenshot to confirm a transparent faceted round brilliant silhouette with visible internal reflections/fire rather than sphere or opaque geometry.
- [ ] If any acceptance check fails, keep or restore `TemporaryJewelry` in the view and diagnose before retrying.
- [ ] Run final tests/build, update `AGENTS.md` to record Milestone 2 without changing architecture guidance, commit verification fixes, and leave the dev server running.
