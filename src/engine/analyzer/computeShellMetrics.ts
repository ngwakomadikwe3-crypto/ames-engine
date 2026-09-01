import type { ExtractedShell, ShellMetrics, Vector3Tuple } from './types'

function subtract(left: Vector3Tuple, right: Vector3Tuple): Vector3Tuple {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]]
}

function cross(left: Vector3Tuple, right: Vector3Tuple): Vector3Tuple {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ]
}

function dot(left: Vector3Tuple, right: Vector3Tuple): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2]
}

function magnitude(vector: Vector3Tuple): number {
  return Math.hypot(vector[0], vector[1], vector[2])
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

function fixed(value: number): string {
  return value.toFixed(6)
}

export function computeShellMetrics(
  shell: ExtractedShell,
  jewelryCenter: Vector3Tuple,
): ShellMetrics {
  if (shell.vertices.length === 0) {
    throw new Error('Cannot compute metrics for an empty shell')
  }

  const vertexBySourceIndex = new Map(
    shell.vertexIndices.map((vertexIndex, offset) => [vertexIndex, shell.vertices[offset]]),
  )
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  const centroid: [number, number, number] = [0, 0, 0]

  for (const vertex of shell.vertices) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], vertex[axis])
      max[axis] = Math.max(max[axis], vertex[axis])
      centroid[axis] += vertex[axis]
    }
  }
  for (let axis = 0; axis < 3; axis += 1) centroid[axis] /= shell.vertices.length

  const dimensions: Vector3Tuple = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
  const sortedDimensions = [...dimensions].sort((left, right) => right - left) as [
    number,
    number,
    number,
  ]
  const aspectRatios: Vector3Tuple = [
    ratio(sortedDimensions[1], sortedDimensions[0]),
    ratio(sortedDimensions[2], sortedDimensions[0]),
    ratio(sortedDimensions[2], sortedDimensions[1]),
  ]

  let surfaceArea = 0
  let signedVolume = 0
  const edgeCounts = new Map<string, number>()

  for (let offset = 0; offset < shell.triangleVertexIndices.length; offset += 3) {
    const indices = shell.triangleVertexIndices.slice(offset, offset + 3)
    const a = vertexBySourceIndex.get(indices[0])
    const b = vertexBySourceIndex.get(indices[1])
    const c = vertexBySourceIndex.get(indices[2])
    if (!a || !b || !c) throw new Error('Shell triangle references a missing vertex')

    surfaceArea += magnitude(cross(subtract(b, a), subtract(c, a))) / 2
    signedVolume += dot(a, cross(b, c)) / 6

    for (const [left, right] of [[indices[0], indices[1]], [indices[1], indices[2]], [indices[2], indices[0]]]) {
      const edge = left < right ? `${left}:${right}` : `${right}:${left}`
      edgeCounts.set(edge, (edgeCounts.get(edge) ?? 0) + 1)
    }
  }

  const boundaryEdgeCount = [...edgeCounts.values()].filter((count) => count === 1).length
  const volumeReliable = edgeCounts.size > 0 && [...edgeCounts.values()].every((count) => count === 2)
  const volume = Math.abs(signedVolume)
  const distanceFromJewelryCenter = Math.hypot(
    centroid[0] - jewelryCenter[0],
    centroid[1] - jewelryCenter[1],
    centroid[2] - jewelryCenter[2],
  )
  const scale = sortedDimensions[0]
  const normalizedDimensions = sortedDimensions.map((dimension) => ratio(dimension, scale))
  const normalizedArea = ratio(surfaceArea, scale ** 2)
  const normalizedVolume = ratio(volume, scale ** 3)
  const signature = [
    `v${shell.vertexIndices.length}`,
    `t${shell.triangleIndices.length}`,
    `d${normalizedDimensions.map(fixed).join(',')}`,
    `a${aspectRatios.map(fixed).join(',')}`,
    `s${fixed(normalizedArea)}`,
    volumeReliable ? `vol${fixed(normalizedVolume)}` : 'vol?',
  ].join(':')

  return {
    vertexCount: shell.vertexIndices.length,
    triangleCount: shell.triangleIndices.length,
    bounds: { min, max },
    centroid,
    dimensions,
    sortedDimensions,
    aspectRatios,
    surfaceArea,
    signedVolume,
    volume,
    volumeReliable,
    distanceFromJewelryCenter,
    boundaryEdgeCount,
    signature,
  }
}
