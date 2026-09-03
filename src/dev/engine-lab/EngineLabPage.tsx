import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Box3, Color, Mesh, Vector3, type Material } from 'three'
import { readJewelryScene, type JewelryAssetReadResult } from '../../engine/loaders'
import { classifyJewelryAsset } from '../../engine/analyzer/classifyJewelryAsset'

const DEFAULT_MODEL = '/models/diamond_ring_candidate_blender.glb'

function JewelryModel({
  url,
  onRead,
  selectedMeshId,
}: {
  url: string
  onRead: (report: JewelryAssetReadResult) => void
  selectedMeshId?: string
}) {
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
    onRead(report)
  }, [camera, gltf.scene, onRead, report])

  useEffect(() => {
    const restores: Array<() => void> = []

    gltf.scene.traverse((object) => {
      if (!(object instanceof Mesh) || object.uuid !== selectedMeshId) return
      const materials = (Array.isArray(object.material) ? object.material : [object.material]) as Material[]
      materials.forEach((material) => {
        const candidate = material as Material & { color?: Color; emissive?: Color; emissiveIntensity?: number }
        if (!candidate.color) return
        const originalColor = candidate.color.clone()
        const originalEmissive = candidate.emissive?.clone()
        const originalIntensity = candidate.emissiveIntensity
        candidate.color.set('#f4d06f')
        candidate.emissive?.set('#6b4d00')
        if (candidate.emissive) candidate.emissiveIntensity = 0.65
        candidate.needsUpdate = true
        restores.push(() => {
          candidate.color?.copy(originalColor)
          if (originalEmissive && candidate.emissive) candidate.emissive.copy(originalEmissive)
          if (originalIntensity !== undefined) candidate.emissiveIntensity = originalIntensity
          candidate.needsUpdate = true
        })
      })
    })

    return () => restores.forEach((restore) => restore())
  }, [gltf.scene, selectedMeshId])

  return <primitive object={gltf.scene} />
}

export function EngineLabPage() {
  const [report, setReport] = useState<JewelryAssetReadResult | null>(null)
  const [selectedMeshId, setSelectedMeshId] = useState<string>()
  const analysis = useMemo(() => (report ? classifyJewelryAsset(report) : null), [report])

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#090909', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', zIndex: 10, top: 18, left: 20, pointerEvents: 'none' }}>
        <div style={{ fontSize: 13, letterSpacing: '0.18em', fontWeight: 700 }}>AMES ENGINE LAB</div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>
          {report ? `${report.summary.meshCount} meshes · ${report.summary.materialCount} materials · ${report.summary.triangleCount.toLocaleString()} triangles` : 'Reading jewelry asset…'}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, opacity: 0.45 }}>Drag to rotate · scroll to zoom · right-drag to pan</div>
      </div>

      {analysis && (
        <aside style={{ position: 'absolute', zIndex: 20, top: 18, right: 20, width: 300, padding: 16, border: '1px solid #2b2b2b', borderRadius: 12, background: 'rgba(14,14,14,0.92)', backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, opacity: 0.65 }}>AMES ANALYSIS</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {analysis.parts.map((part) => (
              <button
                key={part.meshId}
                onClick={() => setSelectedMeshId((current) => current === part.meshId ? undefined : part.meshId)}
                style={{ textAlign: 'left', border: selectedMeshId === part.meshId ? '1px solid #d6b76b' : '1px solid #2d2d2d', borderRadius: 9, padding: '10px 11px', background: selectedMeshId === part.meshId ? '#201c12' : '#151515', color: '#fff', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                  <strong>{part.meshName}</strong>
                  <span style={{ opacity: 0.65 }}>{Math.round(part.confidence * 100)}%</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 10, letterSpacing: '0.08em', color: '#d6b76b' }}>{part.classification.replace('_', ' ')}</div>
                <div style={{ marginTop: 4, fontSize: 10, lineHeight: 1.35, opacity: 0.5 }}>{part.reasons[0]}</div>
              </button>
            ))}
          </div>
        </aside>
      )}

      <Canvas camera={{ fov: 42, position: [4, 3, 4] }} dpr={[1, 1.5]}>
        <color attach="background" args={['#090909']} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[5, 7, 5]} intensity={3.5} />
        <directionalLight position={[-4, 3, -4]} intensity={2} />
        <Suspense fallback={null}>
          <JewelryModel url={DEFAULT_MODEL} onRead={setReport} selectedMeshId={selectedMeshId} />
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.07} />
      </Canvas>
    </main>
  )
}
