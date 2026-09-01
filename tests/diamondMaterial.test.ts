import { describe, expect, test } from 'vitest'
import { getDiamondQualityProfile } from '../src/engine/materials/diamondQuality'

describe('diamond quality profile', () => {
  test('uses a higher-bounce fast chromatic profile on desktop', () => {
    expect(getDiamondQualityProfile(false)).toEqual({
      bounces: 4,
      fastChroma: true,
      aberrationStrength: 0.0035,
      fresnel: 0.24,
    })
  })

  test('reduces BVH work on constrained coarse-pointer devices', () => {
    expect(getDiamondQualityProfile(true)).toEqual({
      bounces: 3,
      fastChroma: true,
      aberrationStrength: 0.0025,
      fresnel: 0.2,
    })
  })
})
