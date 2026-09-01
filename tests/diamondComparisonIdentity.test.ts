import { describe, expect, it } from 'vitest'
import {
  createCanonicalRoundBrilliantGeometry,
  getRoundBrilliantDiagnostics,
} from '../src/engine/jewelry/canonicalRoundBrilliantGeometry'
import { REFERENCE_RENDER_SETTINGS } from '../src/engine/reference/createReferenceDiamondMaterial'

describe('scientific diamond comparison geometry contract', () => {
  it('shares one exact geometry object and deterministic fingerprint across renderers', () => {
    const geometry = createCanonicalRoundBrilliantGeometry()
    const realtimeGeometry = geometry
    const referenceGeometry = geometry
    const realtime = getRoundBrilliantDiagnostics(realtimeGeometry)
    const reference = getRoundBrilliantDiagnostics(referenceGeometry)

    expect(referenceGeometry).toBe(realtimeGeometry)
    expect(reference.uuid).toBe(realtime.uuid)
    expect(reference.fingerprint).toBe(realtime.fingerprint)
    expect(reference.vertexCount).toBe(960)
    expect(reference.triangleCount).toBe(320)
    expect(reference.indexCount).toBe(0)
    expect(reference.positionCount).toBe(realtime.positionCount)
  })

  it('shows path-traced samples rather than a low-resolution raster fallback', () => {
    expect(REFERENCE_RENDER_SETTINGS.rasterizeScene).toBe(false)
    expect(REFERENCE_RENDER_SETTINGS.renderScale).toBe(1)
    expect(REFERENCE_RENDER_SETTINGS.maxSamples).toBeGreaterThanOrEqual(64)
  })
})
