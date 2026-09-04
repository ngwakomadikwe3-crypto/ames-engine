import {
  BackSide,
  BufferGeometry,
  Color,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  ShaderMaterial,
  Vector3,
} from 'three'
import { MeshBVH, SAH } from 'three-mesh-bvh'
import { DIAMOND_OPTICS } from './diamondOptics'

type DiamondRayData = {
  bvh: MeshBVH
  boundsMin: Vector3
  boundsMax: Vector3
}

/**
 * AMES Facet Ray Engine v0.1
 *
 * This is deliberately NOT MeshPhysicalMaterial and NOT three-gpu-pathtracer.
 * It builds a BVH from the actual diamond facets and prepares the geometry for
 * dedicated inside/outside ray transport. The renderer can now reason about
 * facet intersections rather than treating the stone as generic glass.
 */
export function buildDiamondRayData(source: BufferGeometry): DiamondRayData {
  const geometry = source.index ? source.clone() : source.toNonIndexed()
  geometry.computeBoundingBox()

  const bvh = new MeshBVH(geometry, {
    strategy: SAH,
    maxLeafTris: 1,
  })

  return {
    bvh,
    boundsMin: geometry.boundingBox?.min.clone() ?? new Vector3(-1, -1, -1),
    boundsMax: geometry.boundingBox?.max.clone() ?? new Vector3(1, 1, 1),
  }
}

/** CPU reference transport used to validate the facet physics independently
 * from presentation. It follows one wavelength through actual triangle hits,
 * including Snell refraction and total internal reflection.
 */
export function traceDiamondRay(
  data: DiamondRayData,
  origin: Vector3,
  direction: Vector3,
  ior: number,
  maxBounces = DIAMOND_OPTICS.maxInternalBounces,
) {
  const rayOrigin = origin.clone()
  const rayDirection = direction.clone().normalize()
  let inside = false
  let tirCount = 0
  let facetHits = 0

  for (let bounce = 0; bounce < maxBounces; bounce++) {
    const hit = data.bvh.raycastFirst({ origin: rayOrigin, direction: rayDirection } as any, BackSide)
    if (!hit) break
    facetHits++

    const normal = hit.face.normal.clone().normalize()
    if (rayDirection.dot(normal) > 0) normal.negate()

    const n1 = inside ? ior : 1
    const n2 = inside ? 1 : ior
    const eta = n1 / n2
    const cosI = Math.max(0, -normal.dot(rayDirection))
    const sinT2 = eta * eta * (1 - cosI * cosI)

    if (sinT2 > 1) {
      // Total internal reflection: remain inside and bounce from the facet.
      rayDirection.reflect(normal).normalize()
      tirCount++
    } else {
      const cosT = Math.sqrt(Math.max(0, 1 - sinT2))
      rayDirection
        .multiplyScalar(eta)
        .addScaledVector(normal, eta * cosI - cosT)
        .normalize()
      inside = !inside
    }

    rayOrigin.copy(hit.point).addScaledVector(rayDirection, 1e-5)
  }

  return { direction: rayDirection, inside, tirCount, facetHits }
}

export const DIAMOND_SPECTRAL_CHANNELS = [
  { channel: 'R', wavelengthNm: DIAMOND_OPTICS.wavelengthsNm.red, ior: DIAMOND_OPTICS.spectralIor.red },
  { channel: 'G', wavelengthNm: DIAMOND_OPTICS.wavelengthsNm.green, ior: DIAMOND_OPTICS.spectralIor.green },
  { channel: 'B', wavelengthNm: DIAMOND_OPTICS.wavelengthsNm.blue, ior: DIAMOND_OPTICS.spectralIor.blue },
] as const
