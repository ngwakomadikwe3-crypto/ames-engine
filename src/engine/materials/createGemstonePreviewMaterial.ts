import { Color, MeshPhysicalMaterial } from 'three'

export type GemstonePreviewRole = 'DIAMOND_CENTER' | 'DIAMOND_ACCENT'

export function createGemstonePreviewMaterial(
  role: GemstonePreviewRole,
): MeshPhysicalMaterial {
  const center = role === 'DIAMOND_CENTER'

  return new MeshPhysicalMaterial({
    name: center ? 'AMES Center Gem Preview' : 'AMES Accent Gem Preview',
    color: new Color(center ? '#f7fbff' : '#eef5ff'),
    transmission: center ? 0.82 : 0.68,
    thickness: center ? 1.1 : 0.55,
    ior: 2.417,
    roughness: center ? 0.045 : 0.075,
    metalness: 0,
    transparent: true,
    opacity: center ? 0.96 : 0.9,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
  })
}
