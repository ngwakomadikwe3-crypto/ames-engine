import { BufferGeometry, Float32BufferAttribute, Matrix4, Mesh, type Object3D } from 'three'

export interface JewelryComponentNode {
  id: string
  meshId: string
  meshName: string
  componentIndex: number
  triangleCount: number
  geometry: BufferGeometry
  worldMatrix: Matrix4
}

export interface JewelryComponentSceneGraph {
  nodes: JewelryComponentNode[]
}

function extractMeshNodes(mesh: Mesh): JewelryComponentNode[] {
  const geometry = mesh.geometry
  const position = geometry.getAttribute('position')
  if (!position || position.itemSize < 3 || position.count === 0) return []

  const index = geometry.getIndex()
  const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3)
  const adjacency: number[][] = Array.from({ length: position.count }, () => [])
  const triangles: Array<readonly [number, number, number]> = []

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const a = index ? index.getX(triangleIndex * 3) : triangleIndex * 3
    const b = index ? index.getX(triangleIndex * 3 + 1) : triangleIndex * 3 + 1
    const c = index ? index.getX(triangleIndex * 3 + 2) : triangleIndex * 3 + 2
    triangles.push([a, b, c])
    adjacency[a].push(b, c)
    adjacency[b].push(a, c)
    adjacency[c].push(a, b)
  }

  const visited = new Uint8Array(position.count)
  const componentByVertex = new Int32Array(position.count).fill(-1)
  let componentCount = 0

  for (let start = 0; start < position.count; start += 1) {
    if (visited[start]) continue
    const stack = [start]
    visited[start] = 1
    while (stack.length) {
      const current = stack.pop()!
      componentByVertex[current] = componentCount
      for (const neighbor of adjacency[current]) {
        if (!visited[neighbor]) {
          visited[neighbor] = 1
          stack.push(neighbor)
        }
      }
    }
    componentCount += 1
  }

  const trianglesByComponent: number[][] = Array.from({ length: componentCount }, () => [])
  triangles.forEach(([a], triangleIndex) => {
    const componentIndex = componentByVertex[a]
    if (componentIndex >= 0) trianglesByComponent[componentIndex].push(triangleIndex)
  })

  mesh.updateWorldMatrix(true, false)

  return trianglesByComponent.map((componentTriangles, componentIndex) => {
    const positions = new Float32Array(componentTriangles.length * 9)
    let offset = 0

    for (const triangleIndex of componentTriangles) {
      const triangle = triangles[triangleIndex]
      for (const vertexIndex of triangle) {
        positions[offset++] = position.getX(vertexIndex)
        positions[offset++] = position.getY(vertexIndex)
        positions[offset++] = position.getZ(vertexIndex)
      }
    }

    const componentGeometry = new BufferGeometry()
    componentGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    componentGeometry.computeVertexNormals()
    componentGeometry.computeBoundingBox()
    componentGeometry.computeBoundingSphere()

    return {
      id: `${mesh.uuid}:${componentIndex}`,
      meshId: mesh.uuid,
      meshName: mesh.name || 'Mesh',
      componentIndex,
      triangleCount: componentTriangles.length,
      geometry: componentGeometry,
      worldMatrix: mesh.matrixWorld.clone(),
    }
  })
}

export function extractJewelryComponentSceneGraph(scene: Object3D): JewelryComponentSceneGraph {
  const nodes: JewelryComponentNode[] = []
  scene.updateWorldMatrix(true, true)
  scene.traverse((object) => {
    if (object instanceof Mesh) nodes.push(...extractMeshNodes(object))
  })
  return { nodes }
}

export function disposeJewelryComponentSceneGraph(graph: JewelryComponentSceneGraph): void {
  for (const node of graph.nodes) node.geometry.dispose()
}
