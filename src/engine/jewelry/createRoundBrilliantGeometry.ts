import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'

const SEGMENTS = 32
const CROWN_ANGLE = 34.5
const PAVILION_ANGLE = 40.75
const TABLE_RATIO = 0.56
const GIRDLE_THICKNESS = 0.03
const INTERIOR_POINT = new Vector3(0, -0.12, 0)

export const ROUND_BRILLIANT_FACET_GROUPS = {
  table: 1,
  star: 8,
  bezel: 8,
  upperGirdle: 16,
  pavilionMain: 8,
  lowerGirdle: 16,
} as const

export const ROUND_BRILLIANT_PROPORTIONS = {
  table: TABLE_RATIO,
  crownAngle: CROWN_ANGLE,
  pavilionAngle: PAVILION_ANGLE,
  girdleThickness: GIRDLE_THICKNESS,
} as const

function ring(radius: number, height: number, offset = 0) {
  return Array.from({ length: SEGMENTS }, (_, index) => {
    const angle = offset + (index / SEGMENTS) * Math.PI * 2
    return new Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
  })
}

export function createRoundBrilliantGeometry(): BufferGeometry {
  const girdleTop = GIRDLE_THICKNESS / 2
  const girdleBottom = -GIRDLE_THICKNESS / 2
  const crownHeight = (1 - TABLE_RATIO) * Math.tan((CROWN_ANGLE * Math.PI) / 180)
  const pavilionDepth = Math.tan((PAVILION_ANGLE * Math.PI) / 180)

  const table = ring(TABLE_RATIO, girdleTop + crownHeight)
  const crownBreak = ring(0.78, girdleTop + crownHeight * 0.5, Math.PI / SEGMENTS)
  const upperGirdle = ring(1, girdleTop)
  const lowerGirdle = ring(1, girdleBottom)
  const pavilionBreak = ring(0.54, girdleBottom - pavilionDepth * 0.52, Math.PI / SEGMENTS)
  const culet = new Vector3(0, girdleBottom - pavilionDepth, 0)
  const positions: number[] = []

  const emit = (a: Vector3, b: Vector3, c: Vector3) => {
    const normal = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a))
    const centroid = new Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3)
    const outward = centroid.sub(INTERIOR_POINT)
    const vertices = normal.dot(outward) >= 0 ? [a, b, c] : [a, c, b]
    for (const vertex of vertices) positions.push(vertex.x, vertex.y, vertex.z)
  }

  const band = (upper: Vector3[], lower: Vector3[]) => {
    for (let index = 0; index < SEGMENTS; index += 1) {
      const next = (index + 1) % SEGMENTS
      emit(upper[index], lower[index], lower[next])
      emit(upper[index], lower[next], upper[next])
    }
  }

  const tableCenter = new Vector3(0, table[0].y, 0)
  for (let index = 0; index < SEGMENTS; index += 1) {
    emit(tableCenter, table[index], table[(index + 1) % SEGMENTS])
  }

  band(table, crownBreak)
  band(crownBreak, upperGirdle)
  band(upperGirdle, lowerGirdle)
  band(lowerGirdle, pavilionBreak)

  for (let index = 0; index < SEGMENTS; index += 1) {
    emit(pavilionBreak[index], culet, pavilionBreak[(index + 1) % SEGMENTS])
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

export const ROUND_BRILLIANT_TRIANGLE_COUNT = SEGMENTS * 10
