import { MeshRefractionMaterial } from '@react-three/drei'
import type { Texture } from 'three'
import { getDiamondQualityProfile } from './diamondQuality'

interface DiamondMaterialProps {
  envMap: Texture
  constrained: boolean
}

export function DiamondMaterial({ envMap, constrained }: DiamondMaterialProps) {
  const quality = getDiamondQualityProfile(constrained)

  return (
    <MeshRefractionMaterial
      envMap={envMap}
      ior={2.417}
      bounces={quality.bounces}
      fresnel={quality.fresnel}
      aberrationStrength={quality.aberrationStrength}
      fastChroma={quality.fastChroma}
      color="white"
      toneMapped
    />
  )
}
