# Milestone 3A Geometry Analyzer Design

**Date:** 2026-09-01
**Status:** Approved design, pending written-spec review

## Objective

Build a reusable, development-only geometry analyzer that loads `public/models/solitar_diamond_ring.glb`, extracts connected shells from its aggregate meshes, computes geometric evidence, conservatively classifies semantic candidates, and renders a diagnostic color-coded inspection page.

Milestone 3A ends at candidate analysis and visualization. It does not assign production materials, replace diamonds, optimize assets, convert CAD, or integrate with the AMES application.

## Non-negotiable boundaries

- Do not modify `createRoundBrilliantGeometry.ts`.
- Do not modify the realtime diamond renderer.
- Do not modify the reference comparison laboratory.
- Do not modify the existing production viewer or production page.
- Do not build CAD conversion, material replacement, gemstone shaders, optimization, Boutique, Chatface, Splash, or app integration.
- Do not proceed beyond Milestone 3A without explicit approval.
- Classification must remain conservative and evidence-based. Weak or conflicting evidence produces `UNKNOWN`, not a forced result.

## Selected approach

Use a hybrid client-side analyzer:

1. Load the GLB with Three.js `GLTFLoader` only on an isolated development page.
2. Traverse mesh primitives and preserve source node, mesh, primitive, transform, index, and attribute provenance.
3. Extract exact index-connected components as the primary shell representation.
4. Compute geometric metrics for every shell.
5. Build non-destructive similarity clusters from normalized metrics and topology counts.
6. Classify candidates using multiple independent evidence signals.
7. Visualize the original shell geometry grouped by diagnostic classification color.

No vertex welding will alter source geometry. Optional proximity information may contribute evidence, but it must not merge shells or erase provenance.

## Module boundaries

### `src/engine/analyzer/types.ts`

Defines renderer-independent records:

- `ShellClassification`: `METAL | CENTER_STONE | ACCENT_STONE | UNKNOWN`
- `ShellBounds`
- `ShellMetrics`
- `ShellEvidence`
- `AnalyzedShell`
- `GeometryAnalysisSummary`
- `GeometryAnalysisResult`

Every analyzed shell retains stable source references and its original triangle membership.

### `src/engine/analyzer/extractConnectedShells.ts`

Consumes a Three.js `BufferGeometry` plus source metadata. It:

- Supports indexed and non-indexed triangle geometry.
- Builds vertex adjacency from triangle indices.
- Produces deterministic connected shell records.
- Preserves original vertex and triangle references.
- Rejects unsupported primitive modes instead of silently misreading them.

### `src/engine/analyzer/computeShellMetrics.ts`

Computes:

- Vertex count
- Triangle count
- Axis-aligned bounding box
- Centroid
- Dimensions
- Sorted dimensions and aspect ratios
- Surface area
- Signed-volume estimate
- Volume reliability flag based on closed-edge evidence
- Distance from the overall jewelry center
- Boundary-edge count
- Deterministic normalized geometric signature

Open shells receive a volume estimate marked unreliable. Classification must not treat unreliable volume as authoritative.

### `src/engine/analyzer/buildSimilarityClusters.ts`

Groups geometrically similar shells without changing them. Similarity uses:

- Vertex and triangle counts
- Quantized normalized dimensions
- Aspect ratios
- Normalized area
- Reliable normalized volume when available

A cluster records its member count and similarity confidence. Repetition alone is not sufficient to declare a gemstone.

### `src/engine/analyzer/classifyJewelryShells.ts`

Uses independent evidence signals:

- Relative size and spatial extent
- Distance from overall center
- Position relative to the jewelry bounds
- Repetition-cluster strength
- Compactness and aspect ratios
- Topological complexity
- Surface-area and reliable-volume relationships
- Structural dominance

Rules are conservative:

- `METAL`: large structural extent or strong band/setting evidence.
- `CENTER_STONE`: a prominent compact shell near the upper jewelry center with stronger evidence than all competing candidates.
- `ACCENT_STONE`: a member of a strong repeated compact cluster with stone-scale relative dimensions and plausible jewelry placement.
- `UNKNOWN`: insufficient, weak, or conflicting evidence.

Each classification includes:

- Confidence from `0` to `1`
- Positive evidence strings
- Conflicting evidence strings
- Whether manual review is recommended

No classification is labeled high confidence from a single signal.

### `src/engine/analyzer/analyzeJewelryGeometry.ts`

Orchestrates scene traversal, shell extraction, overall bounds, metrics, clustering, classification, and summary generation. It contains no React or rendering code.

## Development-only visualization

Files:

- `geometry-analyzer.html`
- `src/dev/geometry-analyzer/main.tsx`
- `src/dev/geometry-analyzer/GeometryAnalyzerPage.tsx`
- `src/dev/geometry-analyzer/AnalyzerScene.tsx`

The page is an isolated Vite development entry and throws outside `import.meta.env.DEV`. It is not imported by `src/main.tsx` and is excluded from the production entry graph.

### Diagnostic colors

- `METAL`: neutral gray
- `CENTER_STONE`: cyan
- `ACCENT_STONE`: blue or violet
- `UNKNOWN`: orange warning color

The visualization is intentionally plain. It provides orbit and zoom controls for inspection but no production UI, branding redesign, luxury treatment, gemstone shader, or post-processing.

To avoid one draw call per shell, visualization geometry is combined into up to four classification-colored buffers while source shell identities remain in the analysis result.

## Diagnostics panel

The compact panel displays:

- Total connected shells
- Metal candidates
- Center-stone candidates
- Accent-stone candidates
- Unknown shells
- High-, medium-, and low-confidence counts
- Asset loading or analysis errors

The panel must identify the analysis as heuristic and development-only.

## Error handling

The analyzer reports explicit failures for:

- Missing GLB
- Unsupported primitive modes
- Missing position data
- Malformed or out-of-range indices
- Empty analyzable geometry

A failed primitive does not produce invented results. The page displays the error and does not classify incomplete data as valid.

## Testing strategy

### Unit tests

- Indexed connected-shell extraction
- Non-indexed extraction
- Stable metrics, bounds, centroid, area, and closed-shell volume
- Unreliable volume for open shells
- Deterministic similarity signatures
- Repeated-shell clustering
- Conservative `UNKNOWN` fallback
- Confidence and evidence behavior
- Center-stone prominence behavior
- Structural metal behavior

### Real-asset integration test

Analyze `solitar_diamond_ring.glb` and verify stable source facts without overfitting semantic totals:

- Two aggregate mesh definitions
- 130,836 source vertices
- 237,920 source triangles
- More than 400 exact connected shells
- At least one repeated similarity cluster
- Every shell receives metrics, classification, confidence, and evidence
- Classification totals equal shell total

### Build and browser validation

- Run the complete Vitest suite.
- Run the production build and verify the analyzer page is absent from `dist`.
- Load the development analyzer page in Chrome.
- Verify a WebGL canvas, diagnostics panel, nonzero shell totals, and no application or WebGL errors.

## Acceptance criteria

Milestone 3A is complete when:

1. The supplied GLB loads on an isolated development page.
2. Aggregate meshes are split into deterministic exact connected shells.
3. Every required metric is present with reliability metadata where appropriate.
4. Similarity clustering detects repeated candidate shells.
5. Every shell receives one conservative candidate class, confidence score, and evidence.
6. The diagnostic page color-codes all four classes and reports summary counts.
7. Existing diamond, comparison, and production systems remain unchanged.
8. Tests, real-asset integration checks, production build, and Chrome validation pass.
9. The development server remains running at the visual approval gate.
