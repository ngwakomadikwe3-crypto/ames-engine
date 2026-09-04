import { Color, MeshPhysicalMaterial } from 'three'
import { DIAMOND_OPTICS, criticalAngleDegrees, schlickF0 } from './diamondOptics'

/**
 * AMES Diamond Core v0.2
 *
 * The path tracer still consumes MeshPhysicalMaterial, but the material is
 * now driven from the diamond-specific optics profile rather than duplicated
 * magic numbers. Spectral IOR values are exposed in userData for the next
 * transport pass, where RGB rays will be traced separately.
 */
export function createDiamondCoreMaterial() {
  const material = new MeshPhysicalMaterial({
    name: 'AMES Diamond Core v0.2',
    color: new Color(0xffffff),
    metalness: 0,
    roughness: 0,
    transmission: 1,
    ior: DIAMOND_OPTICS.ior,
    thickness: 0,
    attenuationColor: new Color(0xffffff),
    attenuationDistance: Infinity,
    specularIntensity: 1,
  })

  material.userData.amesDiamondOptics = {
    spectralIor: DIAMOND_OPTICS.spectralIor,
    wavelengthsNm: DIAMOND_OPTICS.wavelengthsNm,
    criticalAngleDegrees: criticalAngleDegrees(),
    normalIncidenceReflectance: schlickF0(),
    maxInternalBounces: DIAMOND_OPTICS.maxInternalBounces,
  }

  return material
}
