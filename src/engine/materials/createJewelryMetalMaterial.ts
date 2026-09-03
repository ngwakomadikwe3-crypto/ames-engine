import { Color, MeshStandardMaterial } from 'three'

export type JewelryMetalPreset =
  | '18K_YELLOW_GOLD'
  | 'ROSE_GOLD'
  | 'WHITE_GOLD'
  | 'PLATINUM'

export interface JewelryMetalOptions {
  color?: string
  roughness?: number
  metalness?: number
}

export const JEWELRY_METAL_PRESETS: Record<
  JewelryMetalPreset,
  Required<JewelryMetalOptions> & { label: string }
> = {
  '18K_YELLOW_GOLD': {
    label: '18K Yellow Gold',
    color: '#c9963b',
    roughness: 0.18,
    metalness: 1,
  },
  ROSE_GOLD: {
    label: 'Rose Gold',
    color: '#b76e79',
    roughness: 0.2,
    metalness: 1,
  },
  WHITE_GOLD: {
    label: 'White Gold',
    color: '#d9d7d2',
    roughness: 0.16,
    metalness: 1,
  },
  PLATINUM: {
    label: 'Platinum',
    color: '#c7c9cc',
    roughness: 0.14,
    metalness: 1,
  },
}

export function createJewelryMetalMaterial(
  preset: JewelryMetalPreset = '18K_YELLOW_GOLD',
  overrides: JewelryMetalOptions = {},
): MeshStandardMaterial {
  const base = JEWELRY_METAL_PRESETS[preset]

  return new MeshStandardMaterial({
    name: `AMES ${base.label}`,
    color: new Color(overrides.color ?? base.color),
    metalness: overrides.metalness ?? base.metalness,
    roughness: overrides.roughness ?? base.roughness,
  })
}
