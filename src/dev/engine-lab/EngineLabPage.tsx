import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Box3, MeshBasicMaterial, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { readJewelryScene, type JewelryAssetReadResult } from '../../engine/loaders'
import { analyzeSceneConnectedComponents, type MeshComponentAnalysis } from '../../engine/analyzer/analyzeConnectedComponents'
import { classifyJewelryComponents, type JewelryComponentRole } from '../../engine/analyzer/classifyJewelryComponents'
import { disposeJewelryComponentSceneGraph, extractJewelryComponentSceneGraph, type JewelryComponentSceneGraph } from '../../engine/scene-graph/extractComponentNodes'

const LAB_BUILD = 'Scene Graph v0.1'
const MODELS = [
  { label: 'Ring Candidate', url: '/models/diamond_ring_candidate_blender.glb' },
  { label: 'Solitaire Ring', url: '/models/solitar_diamond_ring.glb' },
] as const
const ROLE_COLORS: Record<JewelryComponentRole, string> = { CENTER_STONE: '#ffffff', ACCENT_STONE: '#66b8ff', SETTING: '#ff7bbd', METAL_STRUCTURE: '#d6a84b' }

function ExtractedComponents({ graph, components, visibleRole }: { graph: JewelryComponentSceneGraph; components: MeshComponentAnalysis[]; visibleRole?: JewelryComponentRole }) {
  const intelligence = useMemo(() => classifyJewelryComponents(components), [components])
  const roleByNode = useMemo(() => new Map(intelligence.components.map((item) => [`${item.meshId}:${item.componentIndex}`, item.role])), [intelligence])
  const materials = useMemo(() => Object.fromEntries((Object.keys(ROLE_COLORS) as JewelryComponentRole[]).map((role) => [role, new MeshBasicMaterial({ color: ROLE_COLORS[role], wireframe: false })])) as Record<JewelryComponentRole, MeshBasicMaterial>, [])
  useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials])

  const shown = graph.nodes.filter((node) => {
    const role = roleByNode.get(node.id)
    return role && (!visibleRole || role === visibleRole)
  })

  return <group>{shown.map((node) => {
    const role = roleByNode.get(node.id)!
    return <mesh key={node.id} geometry={node.geometry} material={materials[role]} matrix={node.worldMatrix} matrixAutoUpdate={false} />
  })}</group>
}

function JewelryModel({ url, onRead, onComponents, onGraph }: { url: string; onRead: (report: JewelryAssetReadResult) => void; onComponents: (value: MeshComponentAnalysis[]) => void; onGraph: (value: JewelryComponentSceneGraph) => void }) {
  const camera = useThree((state) => state.camera)
  const [scene, setScene] = useState<THREE.Group | null>(null)
  useEffect(() => { let cancelled = false; setScene(null); new GLTFLoader().load(url, (gltf) => { if (!cancelled) setScene(gltf.scene) }, undefined, (error) => console.error(`AMES Engine Lab failed to load ${url}`, error)); return () => { cancelled = true } }, [url])
  const report = useMemo(() => (scene ? readJewelryScene(scene) : null), [scene])
  const componentAnalysis = useMemo(() => (scene ? analyzeSceneConnectedComponents(scene) : []), [scene])
  const graph = useMemo(() => (scene ? extractJewelryComponentSceneGraph(scene) : null), [scene])

  useEffect(() => { if (scene) onComponents(componentAnalysis) }, [componentAnalysis, onComponents, scene])
  useEffect(() => { if (!graph) return; onGraph(graph); return () => disposeJewelryComponentSceneGraph(graph) }, [graph, onGraph])
  useEffect(() => { if (!scene || !report) return; const bounds = new Box3().setFromObject(scene); const center = bounds.getCenter(new Vector3()); const size = bounds.getSize(new Vector3()); const radius = Math.max(size.x, size.y, size.z); const distance = Math.max(radius * 1.8, 1); camera.position.set(center.x + distance, center.y + distance * 0.65, center.z + distance); camera.lookAt(center); camera.near = Math.max(distance / 1000, 0.001); camera.far = Math.max(distance * 100, 100); camera.updateProjectionMatrix(); onRead(report) }, [camera, onRead, report, scene])
  return null
}

export function EngineLabPage() {
  const [modelUrl, setModelUrl] = useState<string>(MODELS[1].url)
  const [report, setReport] = useState<JewelryAssetReadResult | null>(null)
  const [components, setComponents] = useState<MeshComponentAnalysis[]>([])
  const [graph, setGraph] = useState<JewelryComponentSceneGraph | null>(null)
  const [visibleRole, setVisibleRole] = useState<JewelryComponentRole>()
  const intelligence = useMemo(() => classifyJewelryComponents(components), [components])
  const totalComponents = components.reduce((sum, item) => sum + item.componentCount, 0)
  const changeModel = (url: string) => { setModelUrl(url); setReport(null); setComponents([]); setGraph(null); setVisibleRole(undefined) }

  return <main style={{ width: '100vw', height: '100vh', background: '#090909', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
    <div style={{ position: 'absolute', zIndex: 10, top: 18, left: 20, maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><div style={{ fontSize: 13, letterSpacing: '0.18em', fontWeight: 700 }}>AMES ENGINE LAB</div><div style={{ fontSize: 9, opacity: 0.45 }}>{LAB_BUILD}</div></div>
      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>{report ? `${report.summary.meshCount} source meshes · ${report.summary.triangleCount.toLocaleString()} triangles` : 'Reading jewelry asset…'}</div>
      <div style={{ marginTop: 4, fontSize: 11, color: '#9db7d5' }}>{graph ? `${graph.nodes.length} individually addressable scene nodes extracted` : 'Extracting connected geometry into scene nodes…'}</div>
      <div style={{ marginTop: 4, fontSize: 11, opacity: 0.45 }}>Drag to rotate · scroll to zoom · selected groups truly isolate geometry</div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>{MODELS.map((model) => <button key={model.url} onClick={() => changeModel(model.url)} style={{ border: modelUrl === model.url ? '1px solid #d6b76b' : '1px solid #333', borderRadius: 8, padding: '8px 11px', background: modelUrl === model.url ? '#201c12' : '#151515', color: '#fff', cursor: 'pointer', fontSize: 11 }}>{model.label}</button>)}</div>
      <div style={{ marginTop: 14, fontSize: 9, letterSpacing: '0.14em', opacity: 0.55 }}>ISOLATE EXTRACTED GROUP</div>
      <div style={{ marginTop: 7, display: 'flex', flexWrap: 'wrap', gap: 7 }}><button onClick={() => setVisibleRole(undefined)} style={{ padding: '7px 9px', borderRadius: 7, border: !visibleRole ? '1px solid #fff' : '1px solid #333', background: '#151515', color: '#fff', cursor: 'pointer', fontSize: 10 }}>ALL NODES</button>{(Object.keys(ROLE_COLORS) as JewelryComponentRole[]).map((role) => <button key={role} onClick={() => setVisibleRole(role)} style={{ padding: '7px 9px', borderRadius: 7, border: visibleRole === role ? `1px solid ${ROLE_COLORS[role]}` : '1px solid #333', background: '#151515', color: ROLE_COLORS[role], cursor: 'pointer', fontSize: 10 }}>{role.replace('_', ' ')}</button>)}</div>
      <div style={{ marginTop: 10, fontSize: 9, color: '#9db7d5' }}>Scene Graph v0.1 · source meshes hidden · extracted component geometry only</div>
    </div>

    <aside style={{ position: 'absolute', zIndex: 20, top: 18, right: 20, width: 340, padding: 16, border: '1px solid #2b2b2b', borderRadius: 12, background: 'rgba(14,14,14,0.92)' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, opacity: 0.65 }}>AMES JEWELRY SCENE GRAPH</div><div style={{ marginTop: 6, fontSize: 9, color: '#d6b76b' }}>v0.1 · physical component extraction</div>
      <div style={{ marginTop: 12, padding: 10, border: '1px solid #2d2d2d', borderRadius: 9, background: '#151515', fontSize: 11 }}><strong>{graph?.nodes.length ?? 0}</strong> extracted nodes from <strong>{report?.summary.meshCount ?? 0}</strong> source meshes</div>
      <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>{(Object.keys(ROLE_COLORS) as JewelryComponentRole[]).map((role) => <div key={role} style={{ border: '1px solid #2d2d2d', borderRadius: 9, padding: 11, background: '#151515' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><strong style={{ color: ROLE_COLORS[role] }}>{role.replace('_', ' ')}</strong><strong>{intelligence.counts[role]}</strong></div></div>)}</div>
      <div style={{ marginTop: 12, fontSize: 9, lineHeight: 1.5, opacity: 0.55 }}>Diagnostic colors are applied to extracted nodes only. Clicking a role removes every other component from the scene. Classification is still provisional.</div>
    </aside>

    <Canvas camera={{ fov: 42, position: [4, 3, 4] }} dpr={[1, 1.5]}><color attach="background" args={['#090909']} /><Suspense fallback={null}><JewelryModel key={modelUrl} url={modelUrl} onRead={setReport} onComponents={setComponents} onGraph={setGraph} />{graph && <ExtractedComponents graph={graph} components={components} visibleRole={visibleRole} />}</Suspense><OrbitControls makeDefault enableDamping dampingFactor={0.07} /></Canvas>
  </main>
}
