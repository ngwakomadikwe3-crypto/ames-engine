import {
  Box3,
  Mesh,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three'
import type {
  JewelryAssetReadResult,
  JewelryMaterialInfo,
  JewelryMeshInfo,
  JewelryMaterial,
} from './types'

function tuple3(vector: Vector3): readonly [number, number, number] {
  return [vector.x, vector.y, vector.z]
}

function objectPath(object: Object3D): string {
  const names: string[] = []
  let current: Object3D | null = object
  while (current) {
    names.push(current.name || current.type)
    current = current.parent
  }
  return names.reverse().join('/')
}

function triangleCount(geometry: BufferGeometry): number {
  return geometry.index
    ? Math.floor(geometry.index.count / 3)
    : Math.floor((geometry.getAttribute('position')?.count ?? 0) / 3)
}

export function readJewelryScene(scene: Object3D): JewelryAssetReadResult {
  scene.updateWorldMatrix(true, true)

  const materialMap = new Map<Material, number>()
  const materials: JewelryMaterialInfo[] = []
  const meshes: JewelryMeshInfo[] = []
  let totalVertices = 0
  let totalTriangles = 0

  const registerMaterial = (material: Material): number => {
    const existing = materialMap.get(material)
    if (existing !== undefined) return existing

    const index = materials.length
    materialMap.set(material, index)
    materials.push({
      index,
      name: material.name || `${material.type}-${index}`,
      type: material.type,
      transparent: material.transparent,
      opacity: material.opacity,
    })
    return index
  }

  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return

    const geometry = object.geometry as BufferGeometry
    const position = geometry.getAttribute('position')
    const vertexCount = position?.count ?? 0
    const triangles = triangleCount(geometry)
    const bounds = new Box3().setFromObject(object)
    const dimensions = bounds.getSize(new Vector3())
    const worldPosition = object.getWorldPosition(new Vector3())
    const worldQuaternion = object.getWorldQuaternion(object.quaternion.clone())
    const worldScale = object.getWorldScale(new Vector3())
    const meshMaterials: JewelryMaterial = object.material
    const materialIndices = (Array.isArray(meshMaterials) ? meshMaterials : [meshMaterials]).map(registerMaterial)

    totalVertices += vertexCount
    totalTriangles += triangles

    meshes.push({
      id: object.uuid,
      name: object.name || `Mesh-${meshes.length}`,
      parentName: object.parent?.name || undefined,
      path: objectPath(object),
      vertexCount,
      triangleCount: triangles,
      dimensions: tuple3(dimensions),
      worldPosition: tuple3(worldPosition),
      worldQuaternion: [worldQuaternion.x, worldQuaternion.y, worldQuaternion.z, worldQuaternion.w],
      worldScale: tuple3(worldScale),
      materialIndices,
    })
  })

  const assetDimensions = new Box3().setFromObject(scene).getSize(new Vector3())

  return {
    scene,
    meshes,
    materials,
    summary: {
      meshCount: meshes.length,
      materialCount: materials.length,
      vertexCount: totalVertices,
      triangleCount: totalTriangles,
      dimensions: tuple3(assetDimensions),
    },
  }
}
