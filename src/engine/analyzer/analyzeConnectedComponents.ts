import { Box3, BufferGeometry, Mesh, Vector3 } from 'three'

export interface GeometryComponentInfo {
  index: number
  vertexCount: number
  triangleCount: number
  dimensions: readonly [number, number, number]
  center: readonly [number, number, number]
  worldCenter: readonly [number, number, number]
  compactness: number
  elongation: number
}

export interface MeshComponentAnalysis {
  meshId: string
  meshName: string
  componentCount: number
  components: GeometryComponentInfo[]
}

function componentShape(geometry: BufferGeometry, vertices: number[]) {
  const position = geometry.getAttribute('position')
  const box = new Box3()
  const point = new Vector3()
  box.makeEmpty()
  for (const vertex of vertices) {
    point.fromBufferAttribute(position, vertex)
    box.expandByPoint(point)
  }
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const dims = [Math.abs(size.x), Math.abs(size.y), Math.abs(size.z)].sort((a, b) => b - a)
  const largest = dims[0] || 0
  const middle = dims[1] || 0
  const smallest = dims[2] || 0
  const compactness = largest > 0 && middle > 0 ? Math.min(1, (middle / largest) * 0.7 + (smallest / middle) * 0.3) : 0
  const elongation = middle > 0 ? largest / middle : Number.POSITIVE_INFINITY
  return { dimensions: [size.x, size.y, size.z] as const, center, compactness, elongation }
}

export function analyzeMeshConnectedComponents(mesh: Mesh): MeshComponentAnalysis {
  const geometry = mesh.geometry
  const position = geometry.getAttribute('position')
  const vertexCount = position?.count ?? 0
  if (!position || vertexCount === 0) return { meshId: mesh.uuid, meshName: mesh.name, componentCount: 0, components: [] }

  const adjacency: number[][] = Array.from({ length: vertexCount }, () => [])
  const index = geometry.getIndex()
  const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(vertexCount / 3)
  const triangleVertices: Array<readonly [number, number, number]> = []

  for (let triangle = 0; triangle < triangleCount; triangle++) {
    const a = index ? index.getX(triangle * 3) : triangle * 3
    const b = index ? index.getX(triangle * 3 + 1) : triangle * 3 + 1
    const c = index ? index.getX(triangle * 3 + 2) : triangle * 3 + 2
    triangleVertices.push([a, b, c])
    adjacency[a].push(b, c)
    adjacency[b].push(a, c)
    adjacency[c].push(a, b)
  }

  const visited = new Uint8Array(vertexCount)
  const componentByVertex = new Int32Array(vertexCount).fill(-1)
  const vertexComponents: number[][] = []

  for (let start = 0; start < vertexCount; start++) {
    if (visited[start]) continue
    const componentIndex = vertexComponents.length
    const vertices: number[] = []
    const stack = [start]
    visited[start] = 1
    while (stack.length) {
      const current = stack.pop()!
      vertices.push(current)
      componentByVertex[current] = componentIndex
      for (const neighbor of adjacency[current]) {
        if (!visited[neighbor]) { visited[neighbor] = 1; stack.push(neighbor) }
      }
    }
    vertexComponents.push(vertices)
  }

  const trianglesPerComponent = new Array(vertexComponents.length).fill(0)
  for (const [a] of triangleVertices) {
    const component = componentByVertex[a]
    if (component >= 0) trianglesPerComponent[component]++
  }

  mesh.updateWorldMatrix(true, false)
  const components = vertexComponents
    .map((vertices, componentIndex) => {
      const shape = componentShape(geometry, vertices)
      const worldCenter = mesh.localToWorld(shape.center.clone())
      return {
        index: componentIndex,
        vertexCount: vertices.length,
        triangleCount: trianglesPerComponent[componentIndex],
        dimensions: shape.dimensions,
        center: [shape.center.x, shape.center.y, shape.center.z] as const,
        worldCenter: [worldCenter.x, worldCenter.y, worldCenter.z] as const,
        compactness: shape.compactness,
        elongation: shape.elongation,
      }
    })
    .sort((a, b) => b.triangleCount - a.triangleCount)

  return { meshId: mesh.uuid, meshName: mesh.name, componentCount: components.length, components }
}

export function analyzeSceneConnectedComponents(scene: THREE.Object3D): MeshComponentAnalysis[] {
  const analyses: MeshComponentAnalysis[] = []
  scene.traverse((object) => { if (object instanceof Mesh) analyses.push(analyzeMeshConnectedComponents(object)) })
  return analyses
}
