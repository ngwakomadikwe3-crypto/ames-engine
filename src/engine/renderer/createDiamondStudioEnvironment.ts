import { CubeTexture, SRGBColorSpace } from 'three'

export const DIAMOND_STUDIO_PALETTE = {
  highlight: '#ffffff',
  warmHighlight: '#f7f2e8',
  fill: '#969ca3',
  shadowFill: '#59616a',
  flag: '#20262d',
} as const

type StudioCardRole = 'highlight' | 'flag'

interface StudioCard {
  face: number
  role: StudioCardRole
  x: number
  y: number
  width: number
  height: number
  color: string
}

export const DIAMOND_STUDIO_CARDS: readonly StudioCard[] = [
  { face: 0, role: 'highlight', x: 26, y: 58, width: 142, height: 396, color: DIAMOND_STUDIO_PALETTE.highlight },
  { face: 2, role: 'highlight', x: 156, y: 26, width: 228, height: 116, color: DIAMOND_STUDIO_PALETTE.warmHighlight },
  { face: 4, role: 'highlight', x: 334, y: 72, width: 126, height: 366, color: DIAMOND_STUDIO_PALETTE.highlight },
  { face: 1, role: 'flag', x: 218, y: 44, width: 54, height: 352, color: DIAMOND_STUDIO_PALETTE.flag },
  { face: 3, role: 'flag', x: 78, y: 214, width: 286, height: 46, color: DIAMOND_STUDIO_PALETTE.flag },
  { face: 5, role: 'flag', x: 382, y: 106, width: 42, height: 292, color: DIAMOND_STUDIO_PALETTE.flag },
]

function createFace(index: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')!
  const gradient = context.createLinearGradient(
    index % 2 === 0 ? 0 : 512,
    0,
    index % 2 === 0 ? 512 : 0,
    512,
  )
  gradient.addColorStop(0, index === 2 ? '#d9dce0' : DIAMOND_STUDIO_PALETTE.fill)
  gradient.addColorStop(0.5, index === 4 ? '#b1b6bc' : '#7f868e')
  gradient.addColorStop(1, DIAMOND_STUDIO_PALETTE.shadowFill)
  context.fillStyle = gradient
  context.fillRect(0, 0, 512, 512)

  for (const card of DIAMOND_STUDIO_CARDS) {
    if (card.face !== index) continue
    context.fillStyle = card.color
    context.fillRect(card.x, card.y, card.width, card.height)
  }

  return canvas
}

export function createDiamondStudioEnvironment() {
  const texture = new CubeTexture(Array.from({ length: 6 }, (_, index) => createFace(index)))
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}
