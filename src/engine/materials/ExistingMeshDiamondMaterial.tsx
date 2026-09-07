import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshRefractionMaterial } from '@react-three/drei/materials/MeshRefractionMaterial'
import { MeshBVH, MeshBVHUniformStruct } from 'three-mesh-bvh'
import type { CubeTexture, Mesh } from 'three'
import { DIAMOND_MATERIAL, getDiamondQualityProfile } from './diamondQuality'

function useConstrainedDiamondProfile() {
  const query = '(pointer: coarse), (max-width: 700px)'
  const [constrained, setConstrained] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setConstrained(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return constrained
}

export function ExistingMeshDiamondMaterial({
  mesh,
  envMap,
}: {
  mesh: Mesh
  envMap: CubeTexture
}) {
  const constrained = useConstrainedDiamondProfile()
  const materialRef = useRef<any>(null)
  const { camera, size } = useThree()

  useFrame(() => {
    const material = materialRef.current as {
      viewMatrixInverse: typeof camera.matrixWorld
      projectionMatrixInverse: typeof camera.projectionMatrixInverse
      resolution: { set: (width: number, height: number) => void }
    } | null
    if (!material) return
    material.viewMatrixInverse = camera.matrixWorld
    material.projectionMatrixInverse = camera.projectionMatrixInverse
    material.resolution.set(size.width, size.height)
  })

  useEffect(() => {
    const geometry = mesh.geometry
    const originalMaterial = mesh.material
    const originalParent = mesh.parent
    const originalPosition = mesh.position.clone()
    const originalQuaternion = mesh.quaternion.clone()
    const originalScale = mesh.scale.clone()
    const originalMatrix = mesh.matrix.clone()
    const originalMatrixWorld = mesh.matrixWorld.clone()
    const geometryWithBvh = geometry as any
    const originalBoundsTree = geometryWithBvh.boundsTree
    const boundsTree = originalBoundsTree ?? new MeshBVH(geometry)
    geometryWithBvh.boundsTree = boundsTree

    const bvh = new MeshBVHUniformStruct()
    bvh.updateFrom(boundsTree)
    const quality = getDiamondQualityProfile(constrained)
    const material = new MeshRefractionMaterial() as any
    const cubeSize = Math.pow(2, Math.floor(Math.log2(((envMap.image as any[])[0]?.width ?? 1024) / 4)))
    const maxMip = Math.floor(Math.log2(cubeSize))
    material.defines = {
      ENVMAP_TYPE_CUBEM: '',
      CUBEUV_TEXEL_WIDTH: `${1 / (3 * Math.max(cubeSize, 16 * 7))}`,
      CUBEUV_TEXEL_HEIGHT: `${1 / (4 * cubeSize)}`,
      CUBEUV_MAX_MIP: `${maxMip}.0`,
      ...(quality.aberrationStrength > 0 ? { CHROMATIC_ABERRATIONS: '' } : {}),
      ...(quality.fastChroma ? { FAST_CHROMA: '' } : {}),
    }
    material.envMap = envMap
    material.ior = DIAMOND_MATERIAL.ior
    material.bounces = quality.bounces
    material.fresnel = quality.fresnel
    material.aberrationStrength = quality.aberrationStrength
    material.color.set(DIAMOND_MATERIAL.color)
    material.toneMapped = true
    material.bvh = bvh
    materialRef.current = material
    mesh.material = material

    if (import.meta.env.DEV) {
      if (
        mesh.parent !== originalParent ||
        !mesh.position.equals(originalPosition) ||
        !mesh.quaternion.equals(originalQuaternion) ||
        !mesh.scale.equals(originalScale) ||
        mesh.geometry !== geometry ||
        !mesh.matrix.equals(originalMatrix) ||
        !mesh.matrixWorld.equals(originalMatrixWorld)
      ) {
        throw new Error('Diamond transform or geometry changed while assigning refraction material')
      }
    }

    return () => {
      mesh.material = originalMaterial
      materialRef.current = null
      bvh.dispose()
      material.dispose()
      if (originalBoundsTree) geometryWithBvh.boundsTree = originalBoundsTree
      else delete geometryWithBvh.boundsTree
    }
  }, [constrained, envMap, mesh])

  return null
}