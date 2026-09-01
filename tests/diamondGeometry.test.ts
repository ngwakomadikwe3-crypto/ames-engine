import { expect, test } from 'vitest'

import {
  createRoundBrilliantGeometry,
  ROUND_BRILLIANT_FACET_GROUPS,
  ROUND_BRILLIANT_PROPORTIONS,
  ROUND_BRILLIANT_TRIANGLE_COUNT,
} from '../src/engine/jewelry'

test('creates a stable flat-faceted round-brilliant geometry', () => {
  const geometry = createRoundBrilliantGeometry()
  const positions = geometry.getAttribute('position')
  const normals = geometry.getAttribute('normal')

  expect(geometry.index).toBeNull()
  expect(ROUND_BRILLIANT_FACET_GROUPS).toEqual({
    table: 1,
    star: 8,
    bezel: 8,
    upperGirdle: 16,
    pavilionMain: 8,
    lowerGirdle: 16,
  })
  expect(Object.values(ROUND_BRILLIANT_FACET_GROUPS).reduce((a, b) => a + b, 0)).toBe(57)
  expect(ROUND_BRILLIANT_PROPORTIONS.table).toBeCloseTo(0.56, 3)
  expect(ROUND_BRILLIANT_PROPORTIONS.crownAngle).toBeCloseTo(34.5, 2)
  expect(ROUND_BRILLIANT_PROPORTIONS.pavilionAngle).toBeCloseTo(40.75, 2)
  expect(ROUND_BRILLIANT_PROPORTIONS.girdleThickness).toBeCloseTo(0.03, 3)
  expect(ROUND_BRILLIANT_TRIANGLE_COUNT).toBeGreaterThanOrEqual(100)
  expect(positions.count / 3).toBe(ROUND_BRILLIANT_TRIANGLE_COUNT)
  expect(positions.count / 3).toBeGreaterThanOrEqual(100)
  expect(normals.count).toBe(positions.count)

  let maximumRadius = 0
  let maximumHeight = Number.NEGATIVE_INFINITY
  let minimumHeight = Number.POSITIVE_INFINITY

  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    const x = positions.getX(vertex)
    const y = positions.getY(vertex)
    const z = positions.getZ(vertex)
    const normalX = normals.getX(vertex)
    const normalY = normals.getY(vertex)
    const normalZ = normals.getZ(vertex)

    expect([x, y, z, normalX, normalY, normalZ].every(Number.isFinite)).toBe(true)

    maximumRadius = Math.max(maximumRadius, Math.hypot(x, z))
    maximumHeight = Math.max(maximumHeight, y)
    minimumHeight = Math.min(minimumHeight, y)
  }

  for (let triangle = 0; triangle < positions.count; triangle += 3) {
    const normal = [
      normals.getX(triangle),
      normals.getY(triangle),
      normals.getZ(triangle),
    ]

    for (let corner = 1; corner < 3; corner += 1) {
      expect(normals.getX(triangle + corner)).toBeCloseTo(normal[0], 6)
      expect(normals.getY(triangle + corner)).toBeCloseTo(normal[1], 6)
      expect(normals.getZ(triangle + corner)).toBeCloseTo(normal[2], 6)
    }
  }

  expect(maximumRadius).toBeCloseTo(1, 6)
  expect(maximumHeight).toBeGreaterThan(0)
  expect(minimumHeight).toBeLessThan(-0.6)
})
