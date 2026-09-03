import { Color, MeshStandardMaterial } from 'three'

export interface JewelryMetalOptions {
  color?: string
  roughness?: number
  metalness?: number
}

export function createJewelryMetalMaterial(
  options: JewelryMetalOptions = {},
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    name: 'AMES Jewelry Metal',
    color: new Color(options.color ?? '#b77945'),
    metalness: options.metalness ?? 1,
    roughness: options.roughness ?? 0.2,
  })
}
