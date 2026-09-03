import type { GeometryComponentInfo, MeshComponentAnalysis } from './analyzeConnectedComponents'

export type JewelryComponentRole = 'CENTER_STONE' | 'ACCENT_STONE' | 'SETTING' | 'METAL_STRUCTURE'

export interface JewelryComponentClassification {
  meshId: string
  meshName: string
  componentIndex: number
  role: JewelryComponentRole
  confidence: number
  center: readonly [number, number, number]
  triangleCount: number
  compactness: number
  elongation: number
}

export interface JewelryComponentIntelligence {
  components: JewelryComponentClassification[]
  counts: Record<JewelryComponentRole, number>
}

function size(component: GeometryComponentInfo): number {
  return Math.max(...component.dimensions.map(Math.abs))
}

export function classifyJewelryComponents(analyses: MeshComponentAnalysis[]): JewelryComponentIntelligence {
  const all = analyses.flatMap((mesh) => mesh.components.map((component) => ({ mesh, component })))
  if (!all.length) return { components: [], counts: { CENTER_STONE: 0, ACCENT_STONE: 0, SETTING: 0, METAL_STRUCTURE: 0 } }

  const sizes = all.map(({ component }) => size(component)).filter((value) => value > 0).sort((a, b) => a - b)
  const medianSize = sizes[Math.floor(sizes.length / 2)] || 1
  const maxTriangles = Math.max(...all.map(({ component }) => component.triangleCount), 1)

  // Center stone candidate: compact, materially larger than repeated small components,
  // and sufficiently detailed. This is deliberately conservative.
  const centerRanked = all
    .map(({ mesh, component }) => {
      const relativeSize = size(component) / medianSize
      const detail = component.triangleCount / maxTriangles
      const score = component.compactness * 0.5 + Math.min(relativeSize / 8, 1) * 0.32 + Math.min(detail * 4, 1) * 0.18
      return { mesh, component, relativeSize, score }
    })
    .filter((item) => item.component.compactness >= 0.62 && item.relativeSize >= 2.2 && item.component.elongation <= 1.8)
    .sort((a, b) => b.score - a.score)
  const center = centerRanked[0]

  const components: JewelryComponentClassification[] = all.map(({ mesh, component }) => {
    if (center && mesh.meshId === center.mesh.meshId && component.index === center.component.index) {
      return { meshId: mesh.meshId, meshName: mesh.meshName, componentIndex: component.index, role: 'CENTER_STONE', confidence: Math.min(0.92, 0.68 + center.score * 0.24), center: component.worldCenter, triangleCount: component.triangleCount, compactness: component.compactness, elongation: component.elongation }
    }

    const relativeSize = size(component) / medianSize
    const smallCompact = component.compactness >= 0.58 && component.elongation <= 1.9 && relativeSize <= 2.4
    const verySmall = component.triangleCount <= Math.max(600, maxTriangles * 0.035)
    if (smallCompact && verySmall) {
      return { meshId: mesh.meshId, meshName: mesh.meshName, componentIndex: component.index, role: 'ACCENT_STONE', confidence: 0.68, center: component.worldCenter, triangleCount: component.triangleCount, compactness: component.compactness, elongation: component.elongation }
    }

    const compactStructural = component.compactness >= 0.48 && relativeSize <= 3.5 && component.triangleCount < maxTriangles * 0.3
    if (compactStructural) {
      return { meshId: mesh.meshId, meshName: mesh.meshName, componentIndex: component.index, role: 'SETTING', confidence: 0.58, center: component.worldCenter, triangleCount: component.triangleCount, compactness: component.compactness, elongation: component.elongation }
    }

    return { meshId: mesh.meshId, meshName: mesh.meshName, componentIndex: component.index, role: 'METAL_STRUCTURE', confidence: 0.66, center: component.worldCenter, triangleCount: component.triangleCount, compactness: component.compactness, elongation: component.elongation }
  })

  const counts: Record<JewelryComponentRole, number> = { CENTER_STONE: 0, ACCENT_STONE: 0, SETTING: 0, METAL_STRUCTURE: 0 }
  for (const component of components) counts[component.role]++
  return { components, counts }
}
