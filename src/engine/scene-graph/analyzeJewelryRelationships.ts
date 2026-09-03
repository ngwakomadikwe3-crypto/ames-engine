import { Box3, Vector3 } from 'three'
import type { JewelryComponentNode, JewelryComponentSceneGraph } from './extractComponentNodes'

export interface JewelrySpatialNode {
  id: string
  center: readonly [number, number, number]
  size: number
  radialDistance: number
  axialPosition: number
  crownScore: number
  centrality: number
  neighbors: number
}

export interface JewelryRelationshipAnalysis {
  center: readonly [number, number, number]
  ringAxis: readonly [number, number, number]
  crownDirection: readonly [number, number, number]
  nodes: JewelrySpatialNode[]
  centerStoneCandidates: JewelrySpatialNode[]
}

function nodeBounds(node: JewelryComponentNode): Box3 {
  const box = node.geometry.boundingBox?.clone() ?? new Box3().setFromBufferAttribute(node.geometry.getAttribute('position'))
  return box.applyMatrix4(node.worldMatrix)
}

export function analyzeJewelryRelationships(graph: JewelryComponentSceneGraph): JewelryRelationshipAnalysis {
  const records = graph.nodes.map((node) => {
    const box = nodeBounds(node)
    const center = box.getCenter(new Vector3())
    const dimensions = box.getSize(new Vector3())
    return { node, box, center, dimensions, size: Math.max(dimensions.x, dimensions.y, dimensions.z) }
  })
  if (!records.length) return { center: [0,0,0], ringAxis: [0,1,0], crownDirection: [0,1,0], nodes: [], centerStoneCandidates: [] }

  const globalBox = new Box3()
  globalBox.makeEmpty()
  records.forEach((record) => globalBox.union(record.box))
  const globalCenter = globalBox.getCenter(new Vector3())
  const globalSize = globalBox.getSize(new Vector3())

  // The smallest overall dimension is a useful first estimate of the ring-hole normal.
  const axes = [
    { axis: new Vector3(1,0,0), span: globalSize.x },
    { axis: new Vector3(0,1,0), span: globalSize.y },
    { axis: new Vector3(0,0,1), span: globalSize.z },
  ].sort((a,b) => a.span - b.span)
  const ringAxis = axes[0].axis

  // Crown direction lies in the ring plane. Use the direction of the most distant substantial component.
  const sortedTriangles = records.map((r) => r.node.triangleCount).sort((a,b) => a-b)
  const triangleMedian = sortedTriangles[Math.floor(sortedTriangles.length / 2)] || 1
  const substantial = records.filter((r) => r.node.triangleCount >= triangleMedian)
  const crownRecord = (substantial.length ? substantial : records).sort((a,b) => b.center.distanceTo(globalCenter) - a.center.distanceTo(globalCenter))[0]
  const crownDirection = crownRecord.center.clone().sub(globalCenter)
  crownDirection.addScaledVector(ringAxis, -crownDirection.dot(ringAxis)).normalize()
  if (crownDirection.lengthSq() < 0.01) crownDirection.set(0,1,0)

  const maxExtent = Math.max(globalSize.x, globalSize.y, globalSize.z, 1e-6)
  const nodes: JewelrySpatialNode[] = records.map((record) => {
    const relative = record.center.clone().sub(globalCenter)
    const axialPosition = relative.dot(ringAxis) / maxExtent
    const planar = relative.clone().addScaledVector(ringAxis, -relative.dot(ringAxis))
    const radialDistance = planar.length() / maxExtent
    const crownScore = planar.dot(crownDirection) / maxExtent
    const centrality = 1 - Math.min(1, record.center.distanceTo(globalCenter) / maxExtent)
    const neighborRadius = Math.max(record.size * 2.5, maxExtent * 0.025)
    const neighbors = records.reduce((count, other) => count + (other !== record && other.center.distanceTo(record.center) <= neighborRadius ? 1 : 0), 0)
    return { id: record.node.id, center: [record.center.x, record.center.y, record.center.z], size: record.size, radialDistance, axialPosition, crownScore, centrality, neighbors }
  })

  const sizes = nodes.map((n) => n.size).filter(Boolean).sort((a,b) => a-b)
  const medianSize = sizes[Math.floor(sizes.length / 2)] || 1
  const centerStoneCandidates = nodes
    .map((node) => {
      const source = graph.nodes.find((item) => item.id === node.id)!
      const relativeSize = node.size / medianSize
      const crown = Math.max(0, node.crownScore)
      const detail = Math.min(1, source.triangleCount / Math.max(triangleMedian * 8, 1))
      const neighborhood = Math.min(1, node.neighbors / 12)
      const score = crown * 0.46 + Math.min(1, relativeSize / 5) * 0.24 + detail * 0.18 + neighborhood * 0.12
      return { node, score }
    })
    .filter((item) => item.node.size >= medianSize * 1.35 && item.node.crownScore > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.node)

  return {
    center: [globalCenter.x, globalCenter.y, globalCenter.z],
    ringAxis: [ringAxis.x, ringAxis.y, ringAxis.z],
    crownDirection: [crownDirection.x, crownDirection.y, crownDirection.z],
    nodes,
    centerStoneCandidates,
  }
}
