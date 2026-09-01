export const DIAMOND_MATERIAL = {
  ior: 2.417,
  color: '#dfe7ef',
} as const

export interface DiamondQualityProfile {
  bounces: number
  fastChroma: boolean
  aberrationStrength: number
  fresnel: number
}

export function getDiamondQualityProfile(
  constrained: boolean,
): DiamondQualityProfile {
  return constrained
    ? { bounces: 3, fastChroma: true, aberrationStrength: 0.0025, fresnel: 0.16 }
    : { bounces: 5, fastChroma: true, aberrationStrength: 0.004, fresnel: 0.18 }
}
