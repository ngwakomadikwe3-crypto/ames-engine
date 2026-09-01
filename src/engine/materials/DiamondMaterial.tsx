import { MeshRefractionMaterial } from '@react-three/drei'
import type { Texture } from 'three'
import { DIAMOND_MATERIAL, getDiamondQualityProfile } from './diamondQuality'

interface DiamondMaterialProps {
  envMap: Texture
  constrained: boolean
}

export function DiamondMaterial({ envMap, constrained }: DiamondMaterialProps) {
  const quality = getDiamondQualityProfile(constrained)

  return (
    <MeshRefractionMaterial
      envMap={envMap}
      ior={DIAMOND_MATERIAL.ior}
      bounces={quality.bounces}
      fresnel={quality.fresnel}
      aberrationStrength={quality.aberrationStrength}
      fastChroma={quality.fastChroma}
      color={DIAMOND_MATERIAL.color}
      toneMapped
    />
  )
}
