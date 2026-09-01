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
    ? { bounces: 3, fastChroma: true, aberrationStrength: 0.0025, fresnel: 0.2 }
    : { bounces: 4, fastChroma: true, aberrationStrength: 0.0035, fresnel: 0.24 }
}
