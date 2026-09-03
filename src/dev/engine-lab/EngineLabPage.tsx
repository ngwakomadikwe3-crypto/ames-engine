import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Box3, Color, Mesh, Vector3, type Material } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { readJewelryScene, type JewelryAssetReadResult } from '../../engine/loaders'
import { classifyJewelryAsset } from '../../engine/analyzer/classifyJewelryAsset'
import { createJewelryMaterialAssignmentPlan } from '../../engine/materials/assignJewelryMaterials'
import {
  createJewelryMetalMaterial,
  JEWELRY_METAL_PRESETS,
  type JewelryMetalPreset,
} from '../../engine/materials/createJewelryMetalMaterial'

const LAB_BUILD = 'v1.6'

const MODELS = [
  { label: 'Ring Candidate', url: '/models/diamond_ring_candidate_blender.glb' },
  { label: 'Solitaire Ring', url: '/models/solitar_diamond_ring.glb' },
] as const

function JewelryModel({
  url,
  onRead,
  selectedMeshId,
  metalPreset,
}: {
  url: string
  onRead: (report: JewelryAssetReadResult) => void
  selectedMeshId?: string
  metalPreset: JewelryMetalPreset
}) {
  const camera = useThree((state) => state.camera)
  const [scene, setScene] = useState<THREE.Group | null>(null)

  useEffect(() => {
    let cancelled = false
    setScene(null)
    new GLTFLoader().load(url, (gltf) => { if (!cancelled) setScene(gltf.scene) }, undefined, (error) => console.error(`AMES Engine Lab failed to load ${url}`, error))
    return () => { cancelled = true }
  }, [url])

  const report = useMemo(() => (scene ? readJewelryScene(scene) : null), [scene])
  const analysis = useMemo(() => (report ? classifyJewelryAsset(report) : null), [report])
  const materialPlan = useMemo(() => (report && analysis ? createJewelryMaterialAssignmentPlan(report, analysis) : null), [analysis, report])

  useEffect(() => {
    if (!scene || !materialPlan) return
    const metalMeshIds = new Set(materialPlan.assignments.filter((assignment) => assignment.role === 'JEWELRY_METAL').map((assignment) => assignment.meshId))
    const restores: Array<() => void> = []
    scene.traverse((object) => {
      if (!(object instanceof Mesh) || !metalMeshIds.has(object.uuid)) return
      const originalMaterial = object.material
      const amesMetal = createJewelryMetalMaterial(metalPreset)
      object.material = amesMetal
      restores.push(() => { object.material = originalMaterial; amesMetal.dispose() })
    })
    return () => restores.forEach((restore) => restore())
  }, [materialPlan, metalPreset, scene])

  useEffect(() => {
    if (!scene || !report) return
    const bounds = new Box3().setFromObject(scene)
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
  }, [camera, onRead, report, scene])

  useEffect(() => {
    if (!scene) return
    const restores: Array<() => void> = []
    scene.traverse((object) => {
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
  }, [scene, selectedMeshId, metalPreset])

  return scene ? <primitive object={scene} /> : null
}

export function EngineLabPage() {
  const [modelUrl, setModelUrl] = useState<string>(MODELS[0].url)
  const [report, setReport] = useState<JewelryAssetReadResult | null>(null)
  const [selectedMeshId, setSelectedMeshId] = useState<string>()
  const [metalPreset, setMetalPreset] = useState<JewelryMetalPreset>('18K_YELLOW_GOLD')
  const analysis = useMemo(() => (report ? classifyJewelryAsset(report) : null), [report])
  const materialPlan = useMemo(() => (report && analysis ? createJewelryMaterialAssignmentPlan(report, analysis) : null), [analysis, report])

  const changeModel = (url: string) => { setModelUrl(url); setReport(null); setSelectedMeshId(undefined) }

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#090909', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', zIndex: 10, top: 18, left: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><div style={{ fontSize: 13, letterSpacing: '0.18em', fontWeight: 700 }}>AMES ENGINE LAB</div><div style={{ fontSize: 9, opacity: 0.45 }}>{LAB_BUILD}</div></div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>{report ? `${report.summary.meshCount} meshes · ${report.summary.materialCount} materials · ${report.summary.triangleCount.toLocaleString()} triangles` : 'Reading jewelry asset…'}</div>
        <div style={{ marginTop: 4, fontSize: 11, opacity: 0.45 }}>Drag to rotate · scroll to zoom · right-drag to pan</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>{MODELS.map((model) => { const active = modelUrl === model.url; return <button key={model.url} onClick={() => changeModel(model.url)} style={{ border: active ? '1px solid #d6b76b' : '1px solid #333', borderRadius: 8, padding: '8px 11px', background: active ? '#201c12' : '#151515', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: active ? 700 : 500 }}>{model.label}</button> })}</div>
        <div style={{ marginTop: 14, fontSize: 9, letterSpacing: '0.14em', opacity: 0.55 }}>METAL PRESET</div>
        <div style={{ marginTop: 7, display: 'flex', flexWrap: 'wrap', gap: 7, maxWidth: 430 }}>{(Object.entries(JEWELRY_METAL_PRESETS) as Array<[JewelryMetalPreset, (typeof JEWELRY_METAL_PRESETS)[JewelryMetalPreset]]>).map(([key, preset]) => { const active = metalPreset === key; return <button key={key} onClick={() => setMetalPreset(key)} style={{ border: active ? '1px solid #d6b76b' : '1px solid #333', borderRadius: 7, padding: '7px 9px', background: active ? '#201c12' : '#151515', color: '#fff', cursor: 'pointer', fontSize: 10 }}>{preset.label}</button> })}</div>
      </div>

      {analysis && materialPlan && <aside style={{ position: 'absolute', zIndex: 20, top: 18, right: 20, width: 330, maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', padding: 16, border: '1px solid #2b2b2b', borderRadius: 12, background: 'rgba(14,14,14,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, opacity: 0.65 }}>AMES ANALYSIS + MATERIAL PLAN</div>
        <div style={{ marginTop: 6, fontSize: 9, color: '#d6b76b' }}>v1.6 · {JEWELRY_METAL_PRESETS[metalPreset].label}</div>
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>{analysis.parts.map((part) => { const assignment = materialPlan.assignments.find((item) => item.meshId === part.meshId); return <button key={part.meshId} onClick={() => setSelectedMeshId((current) => current === part.meshId ? undefined : part.meshId)} style={{ textAlign: 'left', border: selectedMeshId === part.meshId ? '1px solid #d6b76b' : '1px solid #2d2d2d', borderRadius: 9, padding: '10px 11px', background: selectedMeshId === part.meshId ? '#201c12' : '#151515', color: '#fff', cursor: 'pointer' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}><strong>{part.meshName}</strong><span style={{ opacity: 0.65 }}>{Math.round(part.confidence * 100)}%</span></div><div style={{ marginTop: 4, fontSize: 10, letterSpacing: '0.08em', color: '#d6b76b' }}>{part.classification.replace('_', ' ')}</div><div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid #292929', fontSize: 10 }}><span style={{ opacity: 0.45 }}>RENDER ROLE </span><strong style={{ color: '#eee' }}>{assignment?.role ?? 'PRESERVE_SOURCE'}</strong></div>{assignment?.sourceMaterialNames.length ? <div style={{ marginTop: 3, fontSize: 9, opacity: 0.45 }}>Source: {assignment.sourceMaterialNames.join(', ')}</div> : null}</button> })}</div>
      </aside>}

      <Canvas camera={{ fov: 42, position: [4, 3, 4] }} dpr={[1, 1.5]}><color attach="background" args={['#090909']} /><ambientLight intensity={1.4} /><directionalLight position={[5, 7, 5]} intensity={3.5} /><directionalLight position={[-4, 3, -4]} intensity={2} /><Suspense fallback={null}><JewelryModel key={modelUrl} url={modelUrl} onRead={setReport} selectedMeshId={selectedMeshId} metalPreset={metalPreset} /></Suspense><OrbitControls makeDefault enableDamping dampingFactor={0.07} /></Canvas>
    </main>
  )
}
