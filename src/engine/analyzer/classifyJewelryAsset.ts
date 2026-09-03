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
  const materialNames = mesh.materialIndices
    .map((index) => asset.materials[index]?.name ?? '')
    .join(' ')

  return `${mesh.name} ${mesh.parentName ?? ''} ${mesh.path} ${materialNames}`.toLowerCase()
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word))
}

function sortedDimensions(mesh: JewelryMeshInfo): [number, number, number] {
  const values = [...mesh.dimensions].map((value) => Math.abs(value)).sort((a, b) => b - a)
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0]
}

function compactness(mesh: JewelryMeshInfo): number {
  const [largest, middle, smallest] = sortedDimensions(mesh)
  if (largest <= 0 || middle <= 0) return 0

  const widthBalance = middle / largest
  const depthBalance = smallest / middle
  return Math.max(0, Math.min(1, widthBalance * 0.7 + depthBalance * 0.3))
}

function elongation(mesh: JewelryMeshInfo): number {
  const [largest, middle] = sortedDimensions(mesh)
  if (middle <= 0) return Number.POSITIVE_INFINITY
  return largest / middle
}

function centerStoneScore(mesh: JewelryMeshInfo, asset: JewelryAssetReadResult): number {
  const text = textForMesh(mesh, asset)
  const geometryCompactness = compactness(mesh)
  const stretched = elongation(mesh)

  let score = geometryCompactness * 0.7

  if (mesh.name.trim().toLowerCase() === 'diamond') score += 0.18
  else if (text.includes('diamond')) score += 0.1

  if (includesAny(text, ACCENT_WORDS)) score -= 0.3
  if (stretched > 2.2) score -= Math.min(0.4, (stretched - 2.2) * 0.12)

  return score
}

export function classifyJewelryAsset(
  asset: JewelryAssetReadResult,
): JewelryAssetClassificationResult {
  const stoneCandidates = asset.meshes.filter((mesh) => includesAny(textForMesh(mesh, asset), STONE_WORDS))
  const rankedStones = stoneCandidates
    .map((mesh) => ({ mesh, score: centerStoneScore(mesh, asset) }))
    .sort((a, b) => b.score - a.score)
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
        return {
          meshId: mesh.id,
          meshName: mesh.name,
          classification: 'CENTER_STONE',
          confidence: Math.min(0.97, 0.72 + shapeCompactness * 0.22),
          reasons,
        }
      }

      if (stretched > 2.2) {
        reasons.push(`gemstone mesh is spatially distributed/elongated (${stretched.toFixed(1)}× aspect), consistent with pavé or accent stones`)
      } else {
        reasons.push('gemstone-like mesh ranks below the dominant compact center-stone candidate')
      }

      return {
        meshId: mesh.id,
        meshName: mesh.name,
        classification: 'ACCENT_STONE',
        confidence: stretched > 2.2 ? 0.93 : 0.82,
        reasons,
      }
    }

    if (includesAny(text, METAL_WORDS)) {
      reasons.push('name or material suggests jewelry metal')
      return { meshId: mesh.id, meshName: mesh.name, classification: 'METAL', confidence: 0.9, reasons }
    }

    reasons.push('insufficient naming/material/geometry evidence')
    return { meshId: mesh.id, meshName: mesh.name, classification: 'UNKNOWN', confidence: 0.35, reasons }
  })

  return { parts }
}
