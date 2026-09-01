import { BufferGeometry, Float32BufferAttribute } from 'three'
import { expect, test } from 'vitest'

import { computeShellMetrics } from '../src/engine/analyzer/computeShellMetrics'
import { extractConnectedShells } from '../src/engine/analyzer/extractConnectedShells'
import type { ShellSource } from '../src/engine/analyzer/types'

const source: ShellSource = {
  nodeIndex: 2,
  meshIndex: 4,
  primitiveIndex: 1,
  primitiveMode: 4,
}

test('extracts deterministic connected shells from indexed triangles', () => {
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        1, 1, 0,
        5, 0, 0,
        6, 0, 0,
        5, 1, 0,
      ],
      3,
    ),
  )
  geometry.setIndex([0, 1, 2, 2, 1, 3, 4, 5, 6])

  const shells = extractConnectedShells(geometry, source)

  expect(shells).toHaveLength(2)
  expect(shells.map((shell) => shell.id)).toEqual(['2:4:1:0', '2:4:1:1'])
  expect(shells[0].source).toEqual(source)
  expect(shells[0].triangleIndices).toEqual([0, 1])
  expect(shells[0].vertexIndices).toEqual([0, 1, 2, 3])
  expect(shells[0].triangleVertexIndices).toEqual([0, 1, 2, 2, 1, 3])
  expect(shells[1].triangleIndices).toEqual([2])
  expect(shells[1].vertexIndices).toEqual([4, 5, 6])
})

test('treats non-indexed triangles as exact source-index shells without welding', () => {
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        0, 1, 0,
        1, 0, 0,
        1, 1, 0,
      ],
      3,
    ),
  )

  const shells = extractConnectedShells(geometry, source)

  expect(shells).toHaveLength(2)
  expect(shells[0].triangleIndices).toEqual([0])
  expect(shells[0].vertexIndices).toEqual([0, 1, 2])
  expect(shells[1].triangleIndices).toEqual([1])
  expect(shells[1].vertexIndices).toEqual([3, 4, 5])
})

test('computes stable metrics for a closed tetrahedron', () => {
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ],
      3,
    ),
  )
  geometry.setIndex([0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3])

  const [shell] = extractConnectedShells(geometry, source)
  const metrics = computeShellMetrics(shell, [1, 1, 1])

  expect(metrics.vertexCount).toBe(4)
  expect(metrics.triangleCount).toBe(4)
  expect(metrics.bounds).toEqual({ min: [0, 0, 0], max: [1, 1, 1] })
  expect(metrics.centroid).toEqual([0.25, 0.25, 0.25])
  expect(metrics.dimensions).toEqual([1, 1, 1])
  expect(metrics.sortedDimensions).toEqual([1, 1, 1])
  expect(metrics.aspectRatios).toEqual([1, 1, 1])
  expect(metrics.surfaceArea).toBeCloseTo(1.5 + Math.sqrt(3) / 2, 10)
  expect(metrics.signedVolume).toBeCloseTo(1 / 6, 10)
  expect(metrics.volume).toBeCloseTo(1 / 6, 10)
  expect(metrics.boundaryEdgeCount).toBe(0)
  expect(metrics.volumeReliable).toBe(true)
  expect(metrics.distanceFromJewelryCenter).toBeCloseTo(Math.sqrt(27) / 4, 10)
  expect(metrics.signature).toBe('v4:t4:d1.000000,1.000000,1.000000:a1.000000,1.000000,1.000000:s2.366025:vol0.166667')
})

test('marks volume unreliable when a shell has boundary edges', () => {
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3),
  )

  const [shell] = extractConnectedShells(geometry, source)
  const metrics = computeShellMetrics(shell, [0, 0, 0])

  expect(metrics.boundaryEdgeCount).toBe(3)
  expect(metrics.volumeReliable).toBe(false)
  expect(metrics.volume).toBe(0)
  expect(metrics.signature).toBe('v3:t1:d1.000000,1.000000,0.000000:a1.000000,0.000000,0.000000:s0.500000:vol?')
})
