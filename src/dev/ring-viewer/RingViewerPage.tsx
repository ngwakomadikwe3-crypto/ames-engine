import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import { Box3, Mesh, Quaternion, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { createDiamondStudioEnvironment } from '../../engine/renderer/createDiamondStudioEnvironment'
import { DiamondMaterial } from '../../engine/materials'
import { createCanonicalRoundBrilliantGeometry } from '../../engine/jewelry'
import { DiamondEnvironment } from '../../engine/renderer/DiamondEnvironment'

const RING_MODEL_URL = '/models/diamond_ring_candidate_blender.glb'

function getDiamondAnchor(mesh: Mesh, canonicalGeometry: ReturnType<typeof createCanonicalRoundBrilliantGeometry>) {
  mesh.updateWorldMatrix(true, false)
  const importedBounds = new Box3().setFromBufferAttribute(mesh.geometry.getAttribute('position'))
  const importedSize = importedBounds.getSize(new Vector3())
  const importedScale = mesh.getWorldScale(new Vector3())
  const sizes = [importedSize.x, importedSize.y, importedSize.z]
  let stoneAxis = 0
  let closestPairDifference = Number.POSITIVE_INFINITY
  for (let axis = 0; axis < 3; axis += 1) {
    const pairDifference = Math.abs(sizes[(axis + 1) % 3] - sizes[(axis + 2) % 3])
    if (pairDifference < closestPairDifference) {
      closestPairDifference = pairDifference
      stoneAxis = axis
    }
  }
  const importedGirdleDiameter = (
    sizes[(stoneAxis + 1) % 3] * importedScale[(stoneAxis + 1) % 3] +
    sizes[(stoneAxis + 2) % 3] * importedScale[(stoneAxis + 2) % 3]
  ) / 2
  const canonicalBounds = canonicalGeometry.boundingBox ?? new Box3().setFromBufferAttribute(canonicalGeometry.getAttribute('position'))
  const canonicalSize = canonicalBounds.getSize(new Vector3())
  const canonicalGirdleDiameter = Math.max(canonicalSize.x, canonicalSize.z)
  const worldCenter = importedBounds.getCenter(new Vector3()).applyMatrix4(mesh.matrixWorld)
  const worldQuaternion = mesh.getWorldQuaternion(new Quaternion())

  return {
    position: worldCenter,
    quaternion: worldQuaternion,
    scale: importedGirdleDiameter / canonicalGirdleDiameter,
  }
}

function RingScene({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { scene } = useGLTF(RING_MODEL_URL)
  const camera = useThree((state) => state.camera)
  const hasFramedScene = useRef(false)
  const environment = useMemo(() => createDiamondStudioEnvironment(), [])
  const canonicalGeometry = useMemo(() => createCanonicalRoundBrilliantGeometry(), [])
  const diamond = scene.getObjectByName('Diamond')
  const diamondMesh = diamond instanceof Mesh ? diamond : undefined
  const diamondAnchor = diamondMesh ? getDiamondAnchor(diamondMesh, canonicalGeometry) : undefined

  useEffect(() => () => {
    environment.dispose()
    canonicalGeometry.dispose()
  }, [canonicalGeometry, environment])

  useEffect(() => {
    if (!diamondMesh) return
    const originalVisible = diamondMesh.visible
    diamondMesh.visible = false
    return () => {
      diamondMesh.visible = originalVisible
    }
  }, [diamondMesh])

  useEffect(() => {
    if (hasFramedScene.current) {
      return
    }

    const bounds = new Box3().setFromObject(scene)
    const center = bounds.getCenter(new Vector3())
    const size = bounds.getSize(new Vector3())
    const distance = Math.max(size.x, size.y, size.z) * 1.8

    camera.position.set(center.x + distance, center.y + distance * 0.65, center.z + distance)
    camera.lookAt(center)
    camera.near = Math.max(distance / 100, 0.01)
    camera.far = Math.max(distance * 100, 100)
    camera.updateProjectionMatrix()
    controls.current?.target.copy(center)
    controls.current?.update()
    hasFramedScene.current = true
  }, [camera, scene])

  return (
    <>
      <DiamondEnvironment envMap={environment} />
      <primitive object={scene} />
      {diamondAnchor ? (
        <mesh
          geometry={canonicalGeometry}
          position={diamondAnchor.position}
          quaternion={diamondAnchor.quaternion}
          scale={diamondAnchor.scale}
        >
          <DiamondMaterial envMap={environment} constrained={false} />
        </mesh>
      ) : null}
    </>
  )
}

export function RingViewerPage() {
  const controls = useRef<OrbitControlsImpl>(null)

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ fov: 45, position: [4, 3, 4] }}>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 6, 5]} intensity={3} />
        <directionalLight position={[-4, 2, -3]} intensity={1.5} />
        <RingScene controls={controls} />
        <OrbitControls ref={controls} enableDamping dampingFactor={0.07} />
      </Canvas>
    </main>
  )
}