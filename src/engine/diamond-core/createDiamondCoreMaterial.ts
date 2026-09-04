import { Color, MeshPhysicalMaterial } from 'three'

/**
 * AMES Diamond Core v0.1
 *
 * Intentionally uses a standard Three.js physical material because
 * three-gpu-pathtracer reads MeshPhysicalMaterial directly. The realism
 * comes from traced geometry + multiple transport bounces rather than a
 * screen-space/fake-facet shader.
 */
export function createDiamondCoreMaterial() {
  const material = new MeshPhysicalMaterial({
    name: 'AMES Diamond Core v0.1',
    color: new Color(0xffffff),
    metalness: 0,
    roughness: 0,
    transmission: 1,
    ior: 2.417,
    thickness: 1,
    attenuationColor: new Color(0xffffff),
    attenuationDistance: Infinity,
    specularIntensity: 1,
  })

  return material
}
