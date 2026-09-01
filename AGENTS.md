# AMES Engine Agent Guide

## Mission

AMES Engine is a standalone 3D jewelry engine that will be embedded by the AMES application. It will eventually render photorealistic interactive diamonds and jewelry, ingest CAD/3D assets, optimize models for browsers, support parametric customization, enable image/sketch-to-CAD workflows, and connect to automated production systems.

## Current Milestone

The repository currently contains foundation only: a modular web viewer, camera controls, studio lighting, and temporary proof geometry. Do not implement or imply a photorealistic diamond. Do not build the Boutique, Chatface, splash experience, CAD conversion, parametric tools, or production pipeline unless a future task explicitly requests them.

## Architecture Boundaries

- `src/engine/renderer`: reusable canvas, scene composition, camera, controls, and lighting.
- `src/engine/materials`: future jewelry and gemstone material systems.
- `src/engine/loaders`: future browser-ready asset loading.
- `src/engine/jewelry`: jewelry scene entities and temporary proof content.
- `src/engine/cad`: future CAD ingestion and parametric contracts.
- `src/engine/pipeline`: future offline optimization and production integration.
- `tests`: public contracts and integration coverage.

Keep `App` as a thin host. Engine functionality must remain importable and must not depend on AMES application screens or product-specific state.

## Change Discipline

Make the smallest coherent change that satisfies the active task. Preserve existing module ownership and public contracts. Do not redesign, rename, or refactor unrelated systems. If a required change crosses a boundary, document why and keep the dependency direction explicit. Avoid speculative infrastructure and placeholder implementations for future milestones.
