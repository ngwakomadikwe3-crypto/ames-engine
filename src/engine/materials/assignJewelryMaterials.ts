import type { JewelryAssetReadResult } from '../loaders'
import type {
  JewelryAssetClassificationResult,
  JewelryPartClassification,
} from '../analyzer/classifyJewelryAsset'

export type AmesMaterialRole =
  | 'DIAMOND_CENTER'
  | 'DIAMOND_ACCENT'
  | 'JEWELRY_METAL'
  | 'SETTING_METAL'
  | 'PRESERVE_SOURCE'

export interface JewelryMaterialAssignment {
  meshId: string
  meshName: string
  classification: JewelryPartClassification
  confidence: number
  role: AmesMaterialRole
  sourceMaterialNames: string[]
  reason: string
}

export interface JewelryMaterialAssignmentPlan {
  assignments: JewelryMaterialAssignment[]
}

function roleForClassification(
  classification: JewelryPartClassification,
): AmesMaterialRole {
  switch (classification) {
    case 'CENTER_STONE':
      return 'DIAMOND_CENTER'
    case 'ACCENT_STONE':
      return 'DIAMOND_ACCENT'
    case 'METAL':
      return 'JEWELRY_METAL'
    case 'SETTING':
      return 'SETTING_METAL'
    default:
      return 'PRESERVE_SOURCE'
  }
}

export function createJewelryMaterialAssignmentPlan(
  asset: JewelryAssetReadResult,
  analysis: JewelryAssetClassificationResult,
): JewelryMaterialAssignmentPlan {
  const meshById = new Map(asset.meshes.map((mesh) => [mesh.id, mesh]))

  return {
    assignments: analysis.parts.map((part) => {
      const mesh = meshById.get(part.meshId)
      const sourceMaterialNames = mesh
        ? mesh.materialIndices.map((index) => asset.materials[index]?.name ?? `Material ${index}`)
        : []
      const role = roleForClassification(part.classification)

      return {
        meshId: part.meshId,
        meshName: part.meshName,
        classification: part.classification,
        confidence: part.confidence,
        role,
        sourceMaterialNames,
        reason:
          role === 'PRESERVE_SOURCE'
            ? 'AMES does not have enough confidence to replace this material automatically.'
            : `AMES maps ${part.classification} to the ${role} renderer role.`,
      }
    }),
  }
}
