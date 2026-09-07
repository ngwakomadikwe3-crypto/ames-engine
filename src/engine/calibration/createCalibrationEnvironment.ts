import {
  CubeTexture,
  DataTexture,
  EquirectangularReflectionMapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three'
import { DIAMOND_CALIBRATION } from './diamondCalibrationConfig'

export const DIAMOND_ENVIRONMENT_HASH = serializeEnvironment()

function serializeEnvironment() {
  return JSON.stringify(DIAMOND_CALIBRATION.environment)
}

function paintFace(context: CanvasRenderingContext2D, index: number, offsetX = 0) {
  const { size, palette, cards } = DIAMOND_CALIBRATION.environment
  const gradient = context.createLinearGradient(
    offsetX + (index % 2 === 0 ? 0 : size),
    0,
    offsetX + (index % 2 === 0 ? size : 0),
    size,
  )
  gradient.addColorStop(0, index === 2 ? '#d9dce0' : palette.fill)
  gradient.addColorStop(0.5, index === 4 ? '#b1b6bc' : '#7f868e')
  gradient.addColorStop(1, palette.shadowFill)
  context.fillStyle = gradient
  context.fillRect(offsetX, 0, size, size)

  for (const card of cards) {
    if (card.face !== index) continue
    context.fillStyle = card.color
    context.fillRect(offsetX + card.x, card.y, card.width, card.height)
  }
}

function createFace(index: number) {
  const { size } = DIAMOND_CALIBRATION.environment
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  paintFace(canvas.getContext('2d')!, index)
  return canvas
}

function createJewelryStudioFace(index: number) {
  const { size } = DIAMOND_CALIBRATION.environment
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')!
  const background = context.createLinearGradient(0, 0, size, size)
  background.addColorStop(0, '#181a19')
  background.addColorStop(0.45, '#303231')
  background.addColorStop(1, '#555654')
  context.fillStyle = background
  context.fillRect(0, 0, size, size)

  const panelLayouts = [
    [[20, 22, 170, 250], [334, 42, 62, 412], [78, 366, 214, 46]],
    [[48, 32, 82, 432], [246, 12, 176, 186], [300, 326, 116, 58]],
    [[10, 74, 256, 74], [318, 26, 74, 432], [118, 310, 176, 74]],
    [[42, 18, 122, 204], [224, 66, 52, 418], [376, 24, 92, 112]],
    [[24, 286, 210, 68], [272, 18, 164, 206], [404, 270, 52, 202]],
    [[66, 24, 64, 424], [198, 44, 238, 62], [286, 316, 132, 82]],
  ] as const
  const panels = panelLayouts[index]
  for (const [x, y, width, height] of panels) {
    const panel = context.createLinearGradient(x, y, x + width, y + height)
    panel.addColorStop(0, 'rgba(255, 255, 255, 0)')
    panel.addColorStop(0.16, index % 2 === 0 ? 'rgba(255, 255, 255, 0.72)' : 'rgba(244, 241, 233, 0.68)')
    panel.addColorStop(0.5, index % 2 === 0 ? 'rgba(255, 255, 255, 0.98)' : 'rgba(244, 241, 233, 0.92)')
    panel.addColorStop(0.84, index % 2 === 0 ? 'rgba(255, 255, 255, 0.72)' : 'rgba(244, 241, 233, 0.68)')
    panel.addColorStop(1, 'rgba(255, 255, 255, 0)')
    context.fillStyle = panel
    context.fillRect(x, y, width, height)
  }

  const bounce = context.createLinearGradient(0, 248, size, 352)
  bounce.addColorStop(0, 'rgba(150, 152, 149, 0)')
  bounce.addColorStop(0.5, 'rgba(150, 152, 149, 0.36)')
  bounce.addColorStop(1, 'rgba(150, 152, 149, 0)')
  context.fillStyle = bounce
  context.fillRect(0, 248, size, 104)

  context.fillStyle = 'rgba(8, 9, 9, 0.72)'
  context.fillRect((index * 83) % 360 + 52, 0, 28, size)
  context.fillRect((index * 137) % 300 + 96, 224, 152, 44)
  return canvas
}

export function createRealtimeCalibrationEnvironment() {
  const texture = new CubeTexture(Array.from({ length: 6 }, (_, index) => createFace(index)))
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export function createJewelryStudioEnvironment() {
  const texture = new CubeTexture(
    Array.from({ length: 6 }, (_, index) => createJewelryStudioFace(index)),
  )
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export function createReferenceCalibrationEnvironment() {
  const { size } = DIAMOND_CALIBRATION.environment
  const canvas = document.createElement('canvas')
  canvas.width = size * 2
  canvas.height = size
  const context = canvas.getContext('2d')!
  const faceWidth = canvas.width / 6
  for (let index = 0; index < 6; index += 1) {
    context.save()
    context.translate(index * faceWidth, 0)
    context.scale(faceWidth / size, 1)
    paintFace(context, index)
    context.restore()
  }

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
  const texture = new DataTexture(
    pixels.data,
    canvas.width,
    canvas.height,
    RGBAFormat,
    UnsignedByteType,
  )
  texture.mapping = EquirectangularReflectionMapping
  texture.colorSpace = SRGBColorSpace
  texture.flipY = true
  texture.needsUpdate = true
  return texture
}
