import { describe, expect, test } from 'vitest'
import {
  DIAMOND_MATERIAL,
  getDiamondQualityProfile,
} from '../src/engine/materials/diamondQuality'

describe('diamond quality profile', () => {
  test('uses a higher-bounce fast chromatic profile on desktop', () => {
    expect(getDiamondQualityProfile(false)).toEqual({
      bounces: 5,
      fastChroma: true,
      aberrationStrength: 0.004,
      fresnel: 0.18,
    })
  })

  test('reduces BVH work on constrained coarse-pointer devices', () => {
    expect(getDiamondQualityProfile(true)).toEqual({
      bounces: 3,
      fastChroma: true,
      aberrationStrength: 0.0025,
      fresnel: 0.16,
    })
  })

  test('keeps a neutral crystalline material contract', () => {
    expect(DIAMOND_MATERIAL).toEqual({
      ior: 2.417,
      color: '#ffffff',
    })
  })
})
