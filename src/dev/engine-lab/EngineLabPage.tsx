import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Box3, Vector3 } from 'three'
import { readJewelryScene } from '../../engine/loaders'

const DEFAULT_MODEL = '/models/diamond_ring_candidate_blender.glb'

function JewelryModel({ url, onRead }: { url: string; onRead: (summary: string) => void }) {
  const gltf = useGLTF(url)
  const camera = useThree((state) => state.camera)

  const report = useMemo(() => readJewelryScene(gltf.scene), [gltf.scene])

  useEffect(() => {
    const bounds = new Box3().setFromObject(gltf.scene)
    const center = bounds.getCenter(new Vector3())
    const size = bounds.getSize(new Vector3())
    const radius = Math.max(size.x, size.y, size.z)
    const distance = Math.max(radius * 1.8, 1)

    camera.position.set(center.x + distance, center.y + distance * 0.65, center.z + distance)
    camera.lookAt(center)
    camera.near = Math.max(distance / 1000, 0.001)
    camera.far = Math.max(distance * 100, 100)
    camera.updateProjectionMatrix()

    onRead(`${report.summary.meshCount} meshes · ${report.summary.materialCount} materials · ${report.summary.triangleCount.toLocaleString()} triangles`)
  }, [camera, gltf.scene, onRead, report])

  return <primitive object={gltf.scene} />
}

export function EngineLabPage() {
  const [summary, setSummary] = useState('Reading jewelry asset…')

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#090909', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', zIndex: 10, top: 18, left: 20, pointerEvents: 'none' }}>
        <div style={{ fontSize: 13, letterSpacing: '0.18em', fontWeight: 700 }}>AMES ENGINE LAB</div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>{summary}</div>
        <div style={{ marginTop: 4, fontSize: 11, opacity: 0.45 }}>Drag to rotate · scroll to zoom · right-drag to pan</div>
      </div>

      <Canvas camera={{ fov: 42, position: [4, 3, 4] }} dpr={[1, 1.5]}>
        <color attach="background" args={['#090909']} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[5, 7, 5]} intensity={3.5} />
        <directionalLight position={[-4, 3, -4]} intensity={2} />
        <Suspense fallback={null}>
          <JewelryModel url={DEFAULT_MODEL} onRead={setSummary} />
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.07} />
      </Canvas>
    </main>
  )
}
