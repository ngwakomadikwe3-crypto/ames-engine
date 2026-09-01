import {
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from 'three'

const RADIAL_SEGMENTS = 16
const INTERIOR_POINT = new Vector3(0, -0.15, 0)

export const ROUND_BRILLIANT_TRIANGLE_COUNT = 144

type Ring = Vector3[]

function createRing(
  count: number,
  radius: number,
  height: number,
  angularOffset = 0,
): Ring {
  return Array.from({ length: count }, (_, index) => {
    const angle = angularOffset + (index / count) * Math.PI * 2
    return new Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
  })
}

export function createRoundBrilliantGeometry(): BufferGeometry {
  const table = createRing(8, 0.48, 0.32)
  const crown = createRing(RADIAL_SEGMENTS, 0.7, 0.23, Math.PI / RADIAL_SEGMENTS)
  const upperGirdle = createRing(RADIAL_SEGMENTS, 1, 0.02)
  const lowerGirdle = createRing(
    RADIAL_SEGMENTS,
    1,
    -0.02,
    Math.PI / RADIAL_SEGMENTS,
  )
  const pavilion = createRing(RADIAL_SEGMENTS, 0.62, -0.46)
  const culet = new Vector3(0, -0.78, 0)
  const positions: number[] = []

  const emitTriangle = (a: Vector3, b: Vector3, c: Vector3) => {
    const normal = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a))
    const centroid = new Vector3().addVectors(a, b).add(c).multiplyScalar(1 / 3)
    const outward = centroid.sub(INTERIOR_POINT)
    const vertices = normal.dot(outward) >= 0 ? [a, b, c] : [a, c, b]

    for (const vertex of vertices) {
      positions.push(vertex.x, vertex.y, vertex.z)
    }
  }

  const emitEqualRingBand = (upper: Ring, lower: Ring) => {
    for (let index = 0; index < upper.length; index += 1) {
      const next = (index + 1) % upper.length
      emitTriangle(upper[index], lower[index], lower[next])
      emitTriangle(upper[index], lower[next], upper[next])
    }
  }

  const tableCenter = new Vector3(0, table[0].y, 0)
  for (let index = 0; index < table.length; index += 1) {
    emitTriangle(tableCenter, table[index], table[(index + 1) % table.length])
  }

  for (let index = 0; index < table.length; index += 1) {
    const nextTable = (index + 1) % table.length
    const crownStart = index * 2
    const crownMiddle = crownStart + 1
    const crownEnd = (crownStart + 2) % crown.length

    emitTriangle(table[index], crown[crownStart], crown[crownMiddle])
    emitTriangle(table[index], crown[crownMiddle], table[nextTable])
    emitTriangle(table[nextTable], crown[crownMiddle], crown[crownEnd])
  }

  emitEqualRingBand(crown, upperGirdle)
  emitEqualRingBand(upperGirdle, lowerGirdle)
  emitEqualRingBand(lowerGirdle, pavilion)

  for (let index = 0; index < pavilion.length; index += 1) {
    emitTriangle(pavilion[index], culet, pavilion[(index + 1) % pavilion.length])
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  return geometry
}
