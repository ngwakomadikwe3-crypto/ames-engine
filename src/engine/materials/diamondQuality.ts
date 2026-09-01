export interface DiamondQualityProfile {
  bounces: number
  fastChroma: boolean
  aberrationStrength: number
}

export function getDiamondQualityProfile(
  constrained: boolean,
): DiamondQualityProfile {
  return constrained
    ? { bounces: 3, fastChroma: true, aberrationStrength: 0.008 }
    : { bounces: 4, fastChroma: true, aberrationStrength: 0.012 }
}
