# AMES Engine Viewer Foundation Design

**Date:** 2026-09-01

## Goal

Create only the standalone, browser-based AMES Engine foundation: a modular React Three Fiber jewelry viewer that can later be embedded into the AMES application.

## Scope

The foundation includes a full-screen dark luxury viewport, orbit and zoom controls, basic studio lighting, and one temporary centered object proving the renderer works. It does not include a photorealistic diamond, Boutique, Chatface, splash experience, CAD conversion, parametric customization, image-to-CAD, or production automation.

## Architecture

Use a thin Vite React application shell that mounts a reusable `JewelryViewer` component. The reusable viewer owns the React Three Fiber `Canvas` and composes focused scene modules for camera controls, lighting, and temporary content. The application shell must contain no engine-specific scene implementation so a future host can import the viewer without reproducing setup.

Create domain boundaries under `src/engine`: `renderer`, `materials`, `loaders`, `jewelry`, `cad`, and `pipeline`. Only `renderer` and `jewelry` receive runtime implementations in this foundation. Other domain folders contain concise boundary documentation or exports without speculative functionality. Tests live in `tests`.

## Components

- `App`: full-screen host only.
- `JewelryViewer`: public reusable viewer entry point with optional class name.
- `ViewerScene`: scene composition boundary.
- `StudioLighting`: ambient, key, fill, and rim lights.
- `ViewerControls`: constrained orbit and zoom controls.
- `TemporaryJewelry`: neutral metallic torus-knot proof object, explicitly temporary and not presented as a diamond.

## Visual Design

The page uses a near-black background, subtle radial illumination, and restrained typography limited to a small AMES Engine label. The viewport occupies the full browser window. The proof object uses a neutral polished metal material solely to make lighting and controls visible.

## Data Flow and Embedding

The host renders `JewelryViewer`. The viewer creates the WebGL canvas and scene. Scene modules are declarative children without application state or networking. Future asset loaders, jewelry models, and material systems can replace the temporary object through these boundaries without changing the host application.

## Error Handling

Keep this first foundation dependency-light. Browser/WebGL failures remain visible through normal React and console behavior. No custom fallback UI or telemetry is introduced because neither was requested and both belong to later integration work.

## Testing and Verification

Use Vitest and React Testing Library for the host/viewer contract while mocking the WebGL-facing Canvas boundary in unit tests. Verify the reusable viewer renders its accessible shell and that the app mounts it. Run the complete test suite, TypeScript/Vite production build, and a browser smoke test against the development server. Confirm the canvas renders and the page has no browser console errors.

## Project Guidance

`AGENTS.md` documents the long-term engine domains and states that future agents must preserve scope and avoid redesigning unrelated systems. It specifically records that the current milestone is foundation-only.
