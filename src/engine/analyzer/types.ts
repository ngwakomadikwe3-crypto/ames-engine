export type Vector3Tuple = readonly [number, number, number]

export type ShellClassification = 'METAL' | 'CENTER_STONE' | 'ACCENT_STONE' | 'UNKNOWN'

export interface ShellSource {
  nodeIndex: number
  meshIndex: number
  primitiveIndex: number
  primitiveMode: number
  nodeName?: string
  meshName?: string
}

export interface ExtractedShell {
  id: string
  source: ShellSource
  vertexIndices: number[]
  triangleIndices: number[]
  triangleVertexIndices: number[]
  vertices: Vector3Tuple[]
}

export interface ShellBounds {
  min: Vector3Tuple
  max: Vector3Tuple
}

export interface ShellMetrics {
  vertexCount: number
  triangleCount: number
  bounds: ShellBounds
  centroid: Vector3Tuple
  dimensions: Vector3Tuple
  sortedDimensions: Vector3Tuple
  aspectRatios: Vector3Tuple
  surfaceArea: number
  signedVolume: number
  volume: number
  volumeReliable: boolean
  distanceFromJewelryCenter: number
  boundaryEdgeCount: number
  signature: string
}

export interface ShellEvidence {
  confidence: number
  positive: string[]
  conflicts: string[]
  manualReviewRecommended: boolean
}

export interface AnalyzedShell extends ExtractedShell {
  metrics: ShellMetrics
  classification: ShellClassification
  evidence: ShellEvidence
}

export interface GeometryAnalysisSummary {
  totalShells: number
  classificationCounts: Record<ShellClassification, number>
  confidenceCounts: {
    high: number
    medium: number
    low: number
  }
}

export interface GeometryAnalysisResult {
  shells: AnalyzedShell[]
  summary: GeometryAnalysisSummary
}
