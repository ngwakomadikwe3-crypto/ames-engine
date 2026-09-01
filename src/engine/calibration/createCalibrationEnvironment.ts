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

export function createRealtimeCalibrationEnvironment() {
  const texture = new CubeTexture(Array.from({ length: 6 }, (_, index) => createFace(index)))
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
