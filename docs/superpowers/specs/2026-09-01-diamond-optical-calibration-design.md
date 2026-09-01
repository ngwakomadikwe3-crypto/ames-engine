# Diamond Optical Calibration Design

**Date:** 2026-09-01

## Scope

Calibrate only the existing AMES round-brilliant renderer. Preserve all architecture, controls, page design, and rollback geometry. Add no UI, CAD, or unrelated features.

## Root Causes

The current 144-triangle ring mesh does not represent the standard 57/58-facet hierarchy or realistic crown/pavilion proportions. Its approximately 30-degree crown and compound pavilion create a graphic silhouette. The BVH shader receives nearly all visible radiance from a generic studio HDR, while direct Three.js lights do not affect that shader. Large black HDR regions therefore become dead-black facets. Strong fast chromatic aberration and full Fresnel further exaggerate colored edges and hard contrast.

## Geometry Calibration

Generate a closed, non-indexed mesh organized into named optical facet groups: one table, 8 stars, 8 bezels, 16 upper-girdle facets, 8 pavilion mains, and 16 lower-girdle facets, with a separate thin faceted girdle and effectively pointed culet. Use a 56% table, 34.5-degree crown, 40.75-degree pavilion, approximately 3% girdle, and exact rotational symmetry. Triangulation may subdivide polygonal facets internally, but triangles belonging to one optical facet must be coplanar and share the same normal.

## Studio Environment

Replace the generic remote HDR with a local procedural cube environment representing a jewelry light tent: broad neutral-white cards above and to both sides, softer gray fill, narrow white rim strips, and limited charcoal cards for controlled contrast. No face may be predominantly black. The environment is the diamond shader's real light source and must be shared by the scene environment and material.

## Optical Calibration

Keep IOR 2.417 and BVH total internal reflection. Use four desktop and three constrained bounces. Reduce fast chromatic aberration to restrained values near 0.003 and reduce Fresnel from 1.0 to a calibrated value near 0.35. Keep white body color and ACES tone mapping. Set explicit renderer exposure only after browser comparison confirms highlight retention and shadow detail.

## Acceptance

Automated tests validate proportions, angles, facet-group counts, coplanar normals, winding, closure, quality profiles, and rollback preservation. Real-browser verification covers desktop/mobile WebGL, interaction, console/network errors, frame cadence, and visual screenshots. The accepted result must show a recognizable round brilliant with bright neutral scintillation, controlled dark contrast, clean white highlights, restrained fire, and no giant dead-black regions.
