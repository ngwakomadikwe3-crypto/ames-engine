# Milestone 3A Geometry Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular, conservative, development-only connected-shell analyzer and color-coded classification viewer for `solitar_diamond_ring.glb`.

**Architecture:** A renderer-independent analyzer extracts exact index-connected shells, computes metrics, clusters repeated shapes, and assigns evidence-backed candidate classes. An isolated Vite page loads the GLB and visualizes four diagnostic groups without entering the production dependency graph.

**Tech Stack:** TypeScript, Three.js, GLTFLoader, React, React Three Fiber, Drei, Vitest, Playwright.

## Global Constraints

- Do not modify approved round-brilliant geometry, realtime diamond renderer, reference comparison laboratory, existing production viewer, or production UI.
- Do not implement CAD conversion, material replacement, gemstone shaders, optimization, Boutique, Chatface, Splash, or app integration.
- Classification is conservative and evidence-based. Weak or conflicting evidence must resolve to `UNKNOWN`.
- Do not proceed beyond Milestone 3A.
- The analyzer page is development-only and excluded from the production build.

---

### Task 1: Connected-shell extraction and metrics

**Files:**
- Create: `src/engine/analyzer/types.ts`
- Create: `src/engine/analyzer/extractConnectedShells.ts`
- Create: `src/engine/analyzer/computeShellMetrics.ts`
- Test: `tests/geometryAnalyzerShells.test.ts`

**Interfaces:**
- Produces `extractConnectedShells(geometry, source): ExtractedShell[]`.
- Produces `computeShellMetrics(shell, jewelryCenter): ShellMetrics`.

- [ ] Write failing indexed and non-indexed shell extraction tests.
- [ ] Run focused tests and verify missing-module failure.
- [ ] Implement deterministic triangle adjacency and source-provenance records.
- [ ] Add failing tetrahedron metrics and open-shell reliability tests.
- [ ] Implement bounds, centroid, dimensions, aspects, area, volume, boundary edges, distance, and signature.
- [ ] Run focused tests and commit.

### Task 2: Similarity and conservative classification

**Files:**
- Create: `src/engine/analyzer/buildSimilarityClusters.ts`
- Create: `src/engine/analyzer/classifyJewelryShells.ts`
- Test: `tests/geometryAnalyzerClassification.test.ts`

**Interfaces:**
- Produces `buildSimilarityClusters(shells): SimilarityCluster[]`.
- Produces `classifyJewelryShells(shells, clusters, overallBounds): AnalyzedShell[]`.

- [ ] Write failing tests for repeated compact shells, structural metal, center prominence, and `UNKNOWN` fallback.
- [ ] Run focused tests and verify failures.
- [ ] Implement deterministic signatures and cluster confidence.
- [ ] Implement multi-signal evidence scoring with confidence caps and conflicts.
- [ ] Run focused tests and commit.

### Task 3: Scene analyzer and real-asset integration

**Files:**
- Create: `src/engine/analyzer/analyzeJewelryGeometry.ts`
- Create: `src/engine/analyzer/index.ts`
- Test: `tests/geometryAnalyzerAsset.test.ts`

**Interfaces:**
- Produces `analyzeJewelryScene(root: Object3D): GeometryAnalysisResult`.

- [ ] Write a failing real-asset integration test using `GLTFLoader.parse`.
- [ ] Assert two mesh inputs, 130,836 source vertices, 237,920 triangles, more than 400 shells, complete totals, and repeated clusters.
- [ ] Implement scene traversal, world-space geometry analysis, summary generation, and explicit errors.
- [ ] Run integration and full analyzer tests, then commit.

### Task 4: Development-only classification viewer

**Files:**
- Create: `geometry-analyzer.html`
- Create: `src/dev/geometry-analyzer/main.tsx`
- Create: `src/dev/geometry-analyzer/GeometryAnalyzerPage.tsx`
- Create: `src/dev/geometry-analyzer/AnalyzerScene.tsx`
- Create: `src/dev/geometry-analyzer/buildClassificationGeometry.ts`
- Test: `tests/geometryAnalyzerViewer.test.ts`

**Interfaces:**
- Loads `/models/solitar_diamond_ring.glb`.
- Renders one geometry buffer per class and exposes diagnostics through stable data attributes.

- [ ] Write failing classification-buffer and diagnostics-summary tests.
- [ ] Implement four-class geometry aggregation while preserving world-space positions.
- [ ] Implement plain R3F scene with gray, cyan, violet, and orange materials plus OrbitControls.
- [ ] Implement compact counts and confidence panel.
- [ ] Add a development-only HTML entry that is not imported by production.
- [ ] Run focused tests and commit.

### Task 5: Acceptance verification

**Files:**
- Create: `scripts/validate-geometry-analyzer.mjs`
- Modify: `package.json`

- [ ] Run all Vitest tests.
- [ ] Run the production build and assert `dist/geometry-analyzer.html` is absent.
- [ ] Verify protected diamond, comparison, and production files have no diff.
- [ ] Start or reuse the Vite development server.
- [ ] Load the analyzer page in Chrome and assert canvas, nonzero totals, all diagnostic fields, and no application/WebGL errors.
- [ ] Run dependency audit.
- [ ] Commit verification tooling and report the exact URL.
