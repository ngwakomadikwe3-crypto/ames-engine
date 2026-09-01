import { MeshPhysicalMaterial } from 'three'
import { DIAMOND_CALIBRATION } from '../calibration'

export const REFERENCE_DIAMOND_MATERIAL = Object.freeze({
  color: 0xffffff,
  transmission: 1,
  ior: DIAMOND_CALIBRATION.optics.ior,
  roughness: 0,
  metalness: 0,
  thickness: 2,
  attenuationColor: DIAMOND_CALIBRATION.optics.attenuationColor,
  attenuationDistance: DIAMOND_CALIBRATION.optics.attenuationDistance,
})

export const REFERENCE_RENDER_SETTINGS = Object.freeze({
  bounces: 12,
  transmissiveBounces: 16,
  renderScale: 0.5,
  minSamples: 1,
  maxSamples: 32,
  developmentOnly: true,
})

export function createReferenceDiamondMaterial() {
  return new MeshPhysicalMaterial(REFERENCE_DIAMOND_MATERIAL)
}
