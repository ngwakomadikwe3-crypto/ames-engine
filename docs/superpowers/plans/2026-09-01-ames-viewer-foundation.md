# AMES Viewer Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a modular standalone React Three Fiber jewelry viewer foundation.

**Architecture:** A thin Vite host mounts an exported `JewelryViewer`; focused renderer modules compose the canvas, controls, lights, and a temporary jewelry proof object. Future engine domains exist as explicit folder boundaries without speculative implementations.

**Tech Stack:** Vite, React, TypeScript, Three.js, React Three Fiber, drei, Vitest, React Testing Library

## Global Constraints

- Initialize in the current directory with npm.
- Do not implement a photorealistic diamond, Boutique, Chatface, splash, CAD workflows, or production automation.
- Preserve modular embedding boundaries.

---

### Task 1: Project scaffold and viewer contract

**Files:** Create `package.json`, Vite/TypeScript configuration, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `tests/setup.ts`, and `tests/App.test.tsx`.

**Interfaces:** `App(): JSX.Element` consumes `JewelryViewer`; the test expects an accessible region named `AMES Engine 3D jewelry viewer`.

- [ ] Write `tests/App.test.tsx` first, mocking `@react-three/fiber` Canvas as a DOM wrapper and asserting the named viewer region exists.
- [ ] Run `npm test -- --run` and verify failure because source modules do not exist.
- [ ] Add the minimal Vite/React/TypeScript scaffold and test configuration.
- [ ] Run the test again and keep the expected missing-viewer failure for Task 2.
- [ ] Commit scaffold and failing contract test.

### Task 2: Reusable renderer and temporary scene

**Files:** Create `src/engine/renderer/JewelryViewer.tsx`, `ViewerScene.tsx`, `StudioLighting.tsx`, `ViewerControls.tsx`, `index.ts`; create `src/engine/jewelry/TemporaryJewelry.tsx`, `index.ts`; modify `src/App.tsx`.

**Interfaces:** `JewelryViewer({ className? }: { className?: string }): JSX.Element`; `ViewerScene`, `StudioLighting`, `ViewerControls`, and `TemporaryJewelry` are internal zero-argument components.

- [ ] Implement the minimal accessible viewer shell and scene composition.
- [ ] Configure a perspective camera, dark background, shadows, orbit rotation, and bounded zoom.
- [ ] Add ambient/key/fill/rim studio lights and a centered metallic torus knot as the explicitly temporary proof object.
- [ ] Run `npm test -- --run` and verify the viewer contract passes.
- [ ] Commit the working renderer foundation.

### Task 3: Domain boundaries and agent guidance

**Files:** Create `src/engine/materials/README.md`, `src/engine/loaders/README.md`, `src/engine/cad/README.md`, `src/engine/pipeline/README.md`, `tests/README.md`, and root `AGENTS.md`.

**Interfaces:** Documentation defines ownership and non-goals. No runtime APIs are added.

- [ ] Document each future domain without implementing it.
- [ ] Write `AGENTS.md` with long-term architecture, current scope, module boundaries, and a prohibition on redesigning unrelated systems.
- [ ] Run tests and commit documentation.

### Task 4: Full verification

**Files:** Modify only files required by observed failures.

**Interfaces:** `npm test -- --run`, `npm run build`, and the browser-visible development server are acceptance interfaces.

- [ ] Run the complete test suite.
- [ ] Run the production build and resolve all TypeScript or Vite errors.
- [ ] Start `npm run dev -- --host 127.0.0.1` in the background.
- [ ] Open the viewer in a browser, verify the canvas and viewer label, exercise drag and wheel controls, and confirm no console errors.
- [ ] Commit any verification fixes and leave the development server running.
