import type { Material, Object3D } from 'three'

export type Vector3Tuple = readonly [number, number, number]
export type QuaternionTuple = readonly [number, number, number, number]

export interface JewelryMaterialInfo {
  index: number
  name: string
  type: string
  transparent: boolean
  opacity: number
}

export interface JewelryMeshInfo {
  id: string
  name: string
  parentName?: string
  path: string
  vertexCount: number
  triangleCount: number
  dimensions: Vector3Tuple
  worldPosition: Vector3Tuple
  worldQuaternion: QuaternionTuple
  worldScale: Vector3Tuple
  materialIndices: number[]
}

export interface JewelryAssetSummary {
  meshCount: number
  materialCount: number
  vertexCount: number
  triangleCount: number
  dimensions: Vector3Tuple
}

export interface JewelryAssetReadResult {
  scene: Object3D
  meshes: JewelryMeshInfo[]
  materials: JewelryMaterialInfo[]
  summary: JewelryAssetSummary
}

export interface JewelryAssetReaderOptions {
  preserveScene?: boolean
}

export type JewelryMaterial = Material | Material[]
