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

const STONE_WORDS = ['diamond', 'gem', 'stone', 'brilliant', 'crystal']
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

function volume(mesh: JewelryMeshInfo): number {
  return mesh.dimensions[0] * mesh.dimensions[1] * mesh.dimensions[2]
}

export function classifyJewelryAsset(
  asset: JewelryAssetReadResult,
): JewelryAssetClassificationResult {
  const stoneCandidates = asset.meshes.filter((mesh) => includesAny(textForMesh(mesh, asset), STONE_WORDS))
  const largestStoneId = stoneCandidates
    .slice()
    .sort((a, b) => volume(b) - volume(a))[0]?.id

  const parts = asset.meshes.map<JewelryMeshClassification>((mesh) => {
    const text = textForMesh(mesh, asset)
    const reasons: string[] = []

    if (includesAny(text, SETTING_WORDS)) {
      reasons.push('name or material suggests a setting/prong component')
      return { meshId: mesh.id, meshName: mesh.name, classification: 'SETTING', confidence: 0.9, reasons }
    }

    if (includesAny(text, STONE_WORDS)) {
      if (includesAny(text, ACCENT_WORDS) || mesh.id !== largestStoneId) {
        reasons.push('gemstone-like name/material and smaller than the primary stone candidate')
        return { meshId: mesh.id, meshName: mesh.name, classification: 'ACCENT_STONE', confidence: 0.88, reasons }
      }

      reasons.push('gemstone-like name/material and largest gemstone candidate')
      return { meshId: mesh.id, meshName: mesh.name, classification: 'CENTER_STONE', confidence: 0.94, reasons }
    }

    if (includesAny(text, METAL_WORDS)) {
      reasons.push('name or material suggests jewelry metal')
      return { meshId: mesh.id, meshName: mesh.name, classification: 'METAL', confidence: 0.9, reasons }
    }

    reasons.push('insufficient naming/material evidence')
    return { meshId: mesh.id, meshName: mesh.name, classification: 'UNKNOWN', confidence: 0.35, reasons }
  })

  return { parts }
}
