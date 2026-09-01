import { describe, expect, test } from 'vitest'
import { REFERENCE_DIAMOND_MATERIAL, REFERENCE_RENDER_SETTINGS } from '../src/engine/reference'

describe('reference diamond renderer contract', () => {
  test('uses a high-fidelity transmissive physical material and bounce budget', () => {
    expect(REFERENCE_DIAMOND_MATERIAL).toMatchObject({ transmission: 1, ior: 2.417, roughness: 0 })
    expect(REFERENCE_RENDER_SETTINGS.bounces).toBeGreaterThanOrEqual(12)
    expect(REFERENCE_RENDER_SETTINGS.transmissiveBounces).toBeGreaterThanOrEqual(16)
    expect(REFERENCE_RENDER_SETTINGS.developmentOnly).toBe(true)
  })
})
