import { CubeTexture, SRGBColorSpace } from 'three'

function createFace(index: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')!
  const gradient = context.createLinearGradient(0, 0, 512, 512)
  gradient.addColorStop(0, index === 2 ? '#f8f8f6' : '#c9cdd1')
  gradient.addColorStop(0.52, '#8f959c')
  gradient.addColorStop(1, '#3f464e')
  context.fillStyle = gradient
  context.fillRect(0, 0, 512, 512)

  context.fillStyle = '#ffffff'
  context.fillRect(42, 54, 116, 404)
  context.fillRect(354, 28, 104, 456)
  context.fillStyle = '#f4f1e9'
  context.fillRect(174, 34, 164, 94)
  context.fillStyle = '#d8dce0'
  context.fillRect(176, 374, 170, 96)
  context.fillStyle = index % 2 === 0 ? '#858b92' : '#92989f'
  context.fillRect(240, 164, 32, 168)

  return canvas
}

export function createDiamondStudioEnvironment() {
  const texture = new CubeTexture(Array.from({ length: 6 }, (_, index) => createFace(index)))
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}
