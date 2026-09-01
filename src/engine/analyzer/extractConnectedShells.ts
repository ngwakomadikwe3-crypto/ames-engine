import type { BufferGeometry } from 'three'

import type { ExtractedShell, ShellSource, Vector3Tuple } from './types'

const TRIANGLES_MODE = 4

export function extractConnectedShells(
  geometry: BufferGeometry,
  source: ShellSource,
): ExtractedShell[] {
  if (source.primitiveMode !== TRIANGLES_MODE) {
    throw new Error(`Unsupported primitive mode: ${source.primitiveMode}`)
  }

  const position = geometry.getAttribute('position')
  if (!position || position.itemSize < 3) {
    throw new Error('Geometry requires a position attribute with three components')
  }

  const index = geometry.getIndex()
  const triangleVertexIndices = index
    ? Array.from({ length: index.count }, (_, offset) => index.getX(offset))
    : Array.from({ length: position.count }, (_, vertexIndex) => vertexIndex)

  if (triangleVertexIndices.length === 0 || triangleVertexIndices.length % 3 !== 0) {
    throw new Error('Geometry must contain complete triangles')
  }

  for (const vertexIndex of triangleVertexIndices) {
    if (!Number.isInteger(vertexIndex) || vertexIndex < 0 || vertexIndex >= position.count) {
      throw new Error(`Geometry contains an out-of-range vertex index: ${vertexIndex}`)
    }
  }

  const triangleCount = triangleVertexIndices.length / 3
  const vertexTriangles = new Map<number, number[]>()

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    for (let corner = 0; corner < 3; corner += 1) {
      const vertexIndex = triangleVertexIndices[triangleIndex * 3 + corner]
      const adjacentTriangles = vertexTriangles.get(vertexIndex)
      if (adjacentTriangles) adjacentTriangles.push(triangleIndex)
      else vertexTriangles.set(vertexIndex, [triangleIndex])
    }
  }

  const visited = new Uint8Array(triangleCount)
  const shells: ExtractedShell[] = []

  for (let seed = 0; seed < triangleCount; seed += 1) {
    if (visited[seed]) continue

    const pending = [seed]
    const componentTriangles: number[] = []
    visited[seed] = 1

    for (let cursor = 0; cursor < pending.length; cursor += 1) {
      const triangleIndex = pending[cursor]
      componentTriangles.push(triangleIndex)

      for (let corner = 0; corner < 3; corner += 1) {
        const vertexIndex = triangleVertexIndices[triangleIndex * 3 + corner]
        for (const adjacentTriangle of vertexTriangles.get(vertexIndex) ?? []) {
          if (!visited[adjacentTriangle]) {
            visited[adjacentTriangle] = 1
            pending.push(adjacentTriangle)
          }
        }
      }
    }

    componentTriangles.sort((left, right) => left - right)
    const componentTriangleVertices = componentTriangles.flatMap((triangleIndex) =>
      triangleVertexIndices.slice(triangleIndex * 3, triangleIndex * 3 + 3),
    )
    const vertexIndices = [...new Set(componentTriangleVertices)].sort((left, right) => left - right)
    const vertices = vertexIndices.map<Vector3Tuple>((vertexIndex) => [
      position.getX(vertexIndex),
      position.getY(vertexIndex),
      position.getZ(vertexIndex),
    ])

    shells.push({
      id: `${source.nodeIndex}:${source.meshIndex}:${source.primitiveIndex}:${shells.length}`,
      source: { ...source },
      vertexIndices,
      triangleIndices: componentTriangles,
      triangleVertexIndices: componentTriangleVertices,
      vertices,
    })
  }

  return shells
}
