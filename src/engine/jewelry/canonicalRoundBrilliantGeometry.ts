import type { BufferAttribute, BufferGeometry } from 'three'
import { createRoundBrilliantGeometry } from './createRoundBrilliantGeometry'

export interface RoundBrilliantGeometryDiagnostics {
  uuid: string
  fingerprint: string
  vertexCount: number
  positionCount: number
  indexCount: number
  triangleCount: number
}

function updateHash(hash: number, value: number) {
  hash ^= value
  return Math.imul(hash, 0x01000193) >>> 0
}

function hashAttribute(hash: number, attribute: BufferAttribute | null) {
  if (!attribute) return updateHash(hash, 0)
  const bytes = new Uint8Array(attribute.array.buffer, attribute.array.byteOffset, attribute.array.byteLength)
  let next = updateHash(hash, attribute.itemSize)
  next = updateHash(next, attribute.count)
  for (const byte of bytes) next = updateHash(next, byte)
  return next
}

export function fingerprintRoundBrilliantGeometry(geometry: BufferGeometry) {
  let hash = 0x811c9dc5
  hash = hashAttribute(hash, geometry.getAttribute('position') as BufferAttribute)
  hash = hashAttribute(hash, geometry.getAttribute('normal') as BufferAttribute)
  hash = hashAttribute(hash, geometry.index)
  return `fnv1a32-${hash.toString(16).padStart(8, '0')}`
}

export function getRoundBrilliantDiagnostics(
  geometry: BufferGeometry,
): RoundBrilliantGeometryDiagnostics {
  const positionCount = geometry.getAttribute('position').count
  const indexCount = geometry.index?.count ?? 0
  return Object.freeze({
    uuid: geometry.uuid,
    fingerprint: fingerprintRoundBrilliantGeometry(geometry),
    vertexCount: positionCount,
    positionCount,
    indexCount,
    triangleCount: (indexCount || positionCount) / 3,
  })
}

export function createCanonicalRoundBrilliantGeometry() {
  return createRoundBrilliantGeometry()
}
