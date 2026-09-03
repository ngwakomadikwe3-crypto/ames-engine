import type { JewelryAssetReadResult, JewelryMeshInfo } from '../loaders'

export type JewelryPartClassification =
  | 'CENTER_STONE'
  | 'ACCENT_STONE'
  | 'METAL'
  | 'SETTING'
  | 'UNKNOWN'

export interface JewelryMeshClassification {
  meshId: string
  meshName: string
  classification: JewelryPartClassification
  confidence: number
  reasons: string[]
}

export interface JewelryAssetClassificationResult {
  parts: JewelryMeshClassification[]
}

const STONE_WORDS = ['diamond', 'gem', 'gems', 'stone', 'brilliant', 'crystal']
const ACCENT_WORDS = ['pave', 'pavé', 'accent', 'side', 'melee']
const METAL_WORDS = ['gold', 'silver', 'platinum', 'metal', 'ring', 'band', 'shank']
const SETTING_WORDS = ['prong', 'claw', 'setting', 'head', 'basket']

function textForMesh(mesh: JewelryMeshInfo, asset: JewelryAssetReadResult): string {
  const materialNames = mesh.materialIndices.map((index) => asset.materials[index]?.name ?? '').join(' ')
  return `${mesh.name} ${mesh.parentName ?? ''} ${mesh.path} ${materialNames}`.toLowerCase()
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word))
}

function sortedDimensions(mesh: JewelryMeshInfo): [number, number, number] {
  const values = [...mesh.dimensions].map(Math.abs).sort((a, b) => b - a)
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0]
}

function compactness(mesh: JewelryMeshInfo): number {
  const [largest, middle, smallest] = sortedDimensions(mesh)
  if (largest <= 0 || middle <= 0) return 0
  return Math.max(0, Math.min(1, (middle / largest) * 0.7 + (smallest / middle) * 0.3))
}

function elongation(mesh: JewelryMeshInfo): number {
  const [largest, middle] = sortedDimensions(mesh)
  return middle <= 0 ? Number.POSITIVE_INFINITY : largest / middle
}

function normalizedVolume(mesh: JewelryMeshInfo, asset: JewelryAssetReadResult): number {
  const volume = mesh.dimensions.reduce((product, value) => product * Math.max(Math.abs(value), 1e-6), 1)
  const assetVolume = asset.summary.dimensions.reduce((product, value) => product * Math.max(Math.abs(value), 1e-6), 1)
  return Math.min(1, volume / assetVolume)
}

function radialDistance(mesh: JewelryMeshInfo): number {
  const [x, y, z] = mesh.worldPosition
  return Math.sqrt(x * x + y * y + z * z)
}

function centerStoneScore(mesh: JewelryMeshInfo, asset: JewelryAssetReadResult): number {
  const text = textForMesh(mesh, asset)
  let score = compactness(mesh) * 0.7
  if (mesh.name.trim().toLowerCase() === 'diamond') score += 0.18
  else if (text.includes('diamond')) score += 0.1
  if (includesAny(text, ACCENT_WORDS)) score -= 0.3
  if (elongation(mesh) > 2.2) score -= Math.min(0.4, (elongation(mesh) - 2.2) * 0.12)
  return score
}

function anonymousGeometryFallback(
  mesh: JewelryMeshInfo,
  asset: JewelryAssetReadResult,
): JewelryMeshClassification {
  const shape = compactness(mesh)
  const stretch = elongation(mesh)
  const volume = normalizedVolume(mesh, asset)
  const radial = radialDistance(mesh)
  const reasons: string[] = []

  // A compact, dense mesh is the strongest geometry-only center-stone signal.
  if (shape >= 0.72 && stretch <= 1.55) {
    reasons.push(`anonymous compact geometry (${Math.round(shape * 100)}% compactness) is consistent with a dominant gemstone`)
    reasons.push(`geometry-only fallback used because mesh/material names are generic`)
    return {
      meshId: mesh.id,
      meshName: mesh.name,
      classification: 'CENTER_STONE',
      confidence: Math.min(0.82, 0.58 + shape * 0.24),
      reasons,
    }
  }

  // Ring bodies and pavé carriers tend to span a large, elongated portion of the asset.
  if (stretch >= 1.65 || volume >= 0.28) {
    reasons.push(`anonymous geometry spans the asset (${stretch.toFixed(1)}× aspect, ${Math.round(volume * 100)}% bounding volume)`)
    reasons.push('geometry-only fallback treats the extended structural mesh as jewelry metal')
    return {
      meshId: mesh.id,
      meshName: mesh.name,
      classification: 'METAL',
      confidence: Math.min(0.78, 0.57 + Math.min(stretch / 5, 0.16) + Math.min(volume, 0.05)),
      reasons,
    }
  }

  reasons.push(`generic mesh remains ambiguous (compactness ${Math.round(shape * 100)}%, radial distance ${radial.toFixed(2)})`)
  return { meshId: mesh.id, meshName: mesh.name, classification: 'UNKNOWN', confidence: 0.4, reasons }
}

export function classifyJewelryAsset(asset: JewelryAssetReadResult): JewelryAssetClassificationResult {
  const stoneCandidates = asset.meshes.filter((mesh) => includesAny(textForMesh(mesh, asset), STONE_WORDS))
  const rankedStones = stoneCandidates.map((mesh) => ({ mesh, score: centerStoneScore(mesh, asset) })).sort((a, b) => b.score - a.score)
  const centerStoneId = rankedStones[0]?.mesh.id

  const parts = asset.meshes.map<JewelryMeshClassification>((mesh) => {
    const text = textForMesh(mesh, asset)
    const reasons: string[] = []

    if (includesAny(text, SETTING_WORDS)) {
      reasons.push('name or material suggests a setting/prong component')
      return { meshId: mesh.id, meshName: mesh.name, classification: 'SETTING', confidence: 0.9, reasons }
    }

    if (includesAny(text, STONE_WORDS)) {
      const shapeCompactness = compactness(mesh)
      const stretched = elongation(mesh)
      if (mesh.id === centerStoneId) {
        reasons.push(`compact gemstone geometry (${Math.round(shapeCompactness * 100)}% compactness) ranks highest as the dominant stone`)
        if (mesh.name.trim().toLowerCase() === 'diamond') reasons.push('mesh name directly identifies a diamond')
        return { meshId: mesh.id, meshName: mesh.name, classification: 'CENTER_STONE', confidence: Math.min(0.97, 0.72 + shapeCompactness * 0.22), reasons }
      }
      reasons.push(stretched > 2.2 ? `gemstone mesh is spatially distributed/elongated (${stretched.toFixed(1)}× aspect), consistent with pavé or accent stones` : 'gemstone-like mesh ranks below the dominant compact center-stone candidate')
      return { meshId: mesh.id, meshName: mesh.name, classification: 'ACCENT_STONE', confidence: stretched > 2.2 ? 0.93 : 0.82, reasons }
    }

    if (includesAny(text, METAL_WORDS)) {
      reasons.push('name or material suggests jewelry metal')
      return { meshId: mesh.id, meshName: mesh.name, classification: 'METAL', confidence: 0.9, reasons }
    }

    return anonymousGeometryFallback(mesh, asset)
  })

  // With fully anonymous assets, avoid calling every compact mesh a center stone.
  const anonymousCenters = parts.filter((part) => part.classification === 'CENTER_STONE' && !includesAny(textForMesh(asset.meshes.find((mesh) => mesh.id === part.meshId)!, asset), STONE_WORDS))
  if (anonymousCenters.length > 1) {
    const ranked = anonymousCenters
      .map((part) => ({ part, mesh: asset.meshes.find((mesh) => mesh.id === part.meshId)! }))
      .sort((a, b) => compactness(b.mesh) - compactness(a.mesh) || b.mesh.triangleCount - a.mesh.triangleCount)
    const winner = ranked[0]?.part.meshId
    for (const item of ranked.slice(1)) {
      const index = parts.findIndex((part) => part.meshId === item.part.meshId)
      parts[index] = {
        ...parts[index],
        classification: 'METAL',
        confidence: 0.62,
        reasons: ['another anonymous compact mesh ranks higher as the center stone', 'fallback assigns this remaining structural mesh to jewelry metal'],
      }
    }
    if (winner) {
      const index = parts.findIndex((part) => part.meshId === winner)
      parts[index] = { ...parts[index], reasons: [...parts[index].reasons, 'highest-ranked anonymous compact mesh retained as center stone'] }
    }
  }

  return { parts }
}
