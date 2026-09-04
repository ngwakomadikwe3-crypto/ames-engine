# AMES Diamond Core

This module is the isolated optics proof-of-concept for AMES.

## Locked input

Benchmark 02 semantic classification remains untouched: 51 diamonds, 100 prongs, 20 structural metal meshes.

## First checkpoint

Render only the largest `Diamond_Round` mesh using a physically based GPU path-tracing pipeline. The checkpoint is visual and binary: the isolated stone must read convincingly as diamond before the full ring is reconnected.

## Rendering direction

- GPU path tracing for progressive beauty rendering.
- Diamond IOR: 2.417.
- Near-zero roughness.
- Full transmission.
- Multiple light bounces for internal reflection/refraction.
- No custom fake-facet shader and no changes to semantic classification.
