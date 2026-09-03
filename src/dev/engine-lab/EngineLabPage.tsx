import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Box3, MeshBasicMaterial, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { readJewelryScene, type JewelryAssetReadResult } from '../../engine/loaders'
import { analyzeSceneConnectedComponents, type MeshComponentAnalysis } from '../../engine/analyzer/analyzeConnectedComponents'
import { classifyJewelryComponents, type JewelryComponentRole } from '../../engine/analyzer/classifyJewelryComponents'
import { analyzeJewelryRelationships } from '../../engine/scene-graph/analyzeJewelryRelationships'
import { disposeJewelryComponentSceneGraph, extractJewelryComponentSceneGraph, type JewelryComponentSceneGraph } from '../../engine/scene-graph/extractComponentNodes'

const LAB_BUILD = 'Scene Graph v0.2'
const MODELS = [
  { label: 'Ring Candidate', url: '/models/diamond_ring_candidate_blender.glb' },
  { label: 'Solitaire Ring', url: '/models/solitar_diamond_ring.glb' },
] as const
const ROLE_COLORS: Record<JewelryComponentRole, string> = { CENTER_STONE: '#ffffff', ACCENT_STONE: '#66b8ff', SETTING: '#ff7bbd', METAL_STRUCTURE: '#d6a84b' }

function ExtractedComponents({ graph, components, visibleRole, candidateId }: { graph: JewelryComponentSceneGraph; components: MeshComponentAnalysis[]; visibleRole?: JewelryComponentRole; candidateId?: string }) {
  const intelligence = useMemo(() => classifyJewelryComponents(components), [components])
  const roleByNode = useMemo(() => new Map(intelligence.components.map((item) => [`${item.meshId}:${item.componentIndex}`, item.role])), [intelligence])
  const materials = useMemo(() => Object.fromEntries((Object.keys(ROLE_COLORS) as JewelryComponentRole[]).map((role) => [role, new MeshBasicMaterial({ color: ROLE_COLORS[role] })])) as Record<JewelryComponentRole, MeshBasicMaterial>, [])
  const candidateMaterial = useMemo(() => new MeshBasicMaterial({ color: '#ffffff' }), [])
  useEffect(() => () => { Object.values(materials).forEach((material) => material.dispose()); candidateMaterial.dispose() }, [materials, candidateMaterial])
  const shown = graph.nodes.filter((node) => candidateId ? node.id === candidateId : (() => { const role = roleByNode.get(node.id); return role && (!visibleRole || role === visibleRole) })())
  return <group>{shown.map((node) => { const role = roleByNode.get(node.id) ?? 'METAL_STRUCTURE'; return <mesh key={node.id} geometry={node.geometry} material={candidateId ? candidateMaterial : materials[role]} matrix={node.worldMatrix} matrixAutoUpdate={false} /> })}</group>
}

function JewelryModel({ url, onRead, onComponents, onGraph }: { url: string; onRead: (report: JewelryAssetReadResult) => void; onComponents: (value: MeshComponentAnalysis[]) => void; onGraph: (value: JewelryComponentSceneGraph) => void }) {
  const camera = useThree((state) => state.camera); const [scene, setScene] = useState<THREE.Group | null>(null)
  useEffect(() => { let cancelled = false; setScene(null); new GLTFLoader().load(url, (gltf) => { if (!cancelled) setScene(gltf.scene) }, undefined, console.error); return () => { cancelled = true } }, [url])
  const report = useMemo(() => scene ? readJewelryScene(scene) : null, [scene]); const componentAnalysis = useMemo(() => scene ? analyzeSceneConnectedComponents(scene) : [], [scene]); const graph = useMemo(() => scene ? extractJewelryComponentSceneGraph(scene) : null, [scene])
  useEffect(() => { if (scene) onComponents(componentAnalysis) }, [componentAnalysis, onComponents, scene]); useEffect(() => { if (!graph) return; onGraph(graph); return () => disposeJewelryComponentSceneGraph(graph) }, [graph, onGraph])
  useEffect(() => { if (!scene || !report) return; const bounds = new Box3().setFromObject(scene); const center = bounds.getCenter(new Vector3()); const size = bounds.getSize(new Vector3()); const radius = Math.max(size.x,size.y,size.z); const distance = Math.max(radius*1.8,1); camera.position.set(center.x+distance,center.y+distance*.65,center.z+distance); camera.lookAt(center); camera.near=Math.max(distance/1000,.001); camera.far=Math.max(distance*100,100); camera.updateProjectionMatrix(); onRead(report) }, [camera,onRead,report,scene]); return null
}

export function EngineLabPage() {
  const [modelUrl,setModelUrl]=useState<string>(MODELS[1].url); const [report,setReport]=useState<JewelryAssetReadResult|null>(null); const [components,setComponents]=useState<MeshComponentAnalysis[]>([]); const [graph,setGraph]=useState<JewelryComponentSceneGraph|null>(null); const [visibleRole,setVisibleRole]=useState<JewelryComponentRole>(); const [candidateIndex,setCandidateIndex]=useState<number|null>(null)
  const intelligence=useMemo(()=>classifyJewelryComponents(components),[components]); const relationships=useMemo(()=>graph?analyzeJewelryRelationships(graph):null,[graph]); const candidates=relationships?.centerStoneCandidates??[]; const candidateId=candidateIndex===null?undefined:candidates[candidateIndex]?.id
  const changeModel=(url:string)=>{setModelUrl(url);setReport(null);setComponents([]);setGraph(null);setVisibleRole(undefined);setCandidateIndex(null)}
  return <main style={{width:'100vw',height:'100vh',background:'#090909',color:'#fff',fontFamily:'Inter,system-ui,sans-serif'}}>
    <div style={{position:'absolute',zIndex:10,top:18,left:20,maxWidth:620}}><div style={{display:'flex',gap:8,alignItems:'baseline'}}><strong style={{fontSize:13,letterSpacing:'.18em'}}>AMES ENGINE LAB</strong><span style={{fontSize:9,opacity:.45}}>{LAB_BUILD}</span></div><div style={{marginTop:6,fontSize:12,opacity:.65}}>{report?`${report.summary.meshCount} source meshes · ${report.summary.triangleCount.toLocaleString()} triangles`:'Reading jewelry asset…'}</div><div style={{marginTop:4,fontSize:11,color:'#9db7d5'}}>{graph?`${graph.nodes.length} addressable nodes · ${candidates.length} relational center-stone candidates`:'Building jewelry scene graph…'}</div><div style={{marginTop:12,display:'flex',gap:8}}>{MODELS.map(m=><button key={m.url} onClick={()=>changeModel(m.url)} style={{border:modelUrl===m.url?'1px solid #d6b76b':'1px solid #333',borderRadius:8,padding:'8px 11px',background:modelUrl===m.url?'#201c12':'#151515',color:'#fff'}}>{m.label}</button>)}</div>
    <div style={{marginTop:14,fontSize:9,letterSpacing:'.14em',opacity:.55}}>RELATIONAL CENTER-STONE CANDIDATES</div><div style={{marginTop:7,display:'flex',gap:7,flexWrap:'wrap'}}><button onClick={()=>setCandidateIndex(null)} style={{padding:'7px 9px',borderRadius:7,border:candidateIndex===null?'1px solid #fff':'1px solid #333',background:'#151515',color:'#fff'}}>ALL</button>{candidates.map((_,i)=><button key={i} onClick={()=>setCandidateIndex(i)} style={{padding:'7px 9px',borderRadius:7,border:candidateIndex===i?'1px solid #fff':'1px solid #333',background:'#151515',color:'#fff'}}>CANDIDATE {i+1}</button>)}</div><div style={{marginTop:10,fontSize:9,color:'#9db7d5'}}>v0.2 uses ring orientation + crown direction + neighborhood + size/detail. No material decisions.</div></div>
    <aside style={{position:'absolute',zIndex:20,top:18,right:20,width:340,padding:16,border:'1px solid #2b2b2b',borderRadius:12,background:'rgba(14,14,14,.92)'}}><div style={{fontSize:11,letterSpacing:'.16em',fontWeight:700,opacity:.65}}>AMES SPATIAL + RELATIONAL GRAPH</div><div style={{marginTop:6,fontSize:9,color:'#d6b76b'}}>v0.2 · jewelry structure reasoning</div><div style={{marginTop:12,padding:10,border:'1px solid #2d2d2d',borderRadius:9,background:'#151515',fontSize:10,lineHeight:1.6}}>Ring axis: {relationships?.ringAxis.map(v=>v.toFixed(2)).join(', ')??'—'}<br/>Crown direction: {relationships?.crownDirection.map(v=>v.toFixed(2)).join(', ')??'—'}<br/>Candidates retained: <strong>{candidates.length}</strong></div><div style={{marginTop:10,display:'grid',gap:7}}>{candidates.map((c,i)=><button key={c.id} onClick={()=>setCandidateIndex(i)} style={{textAlign:'left',border:candidateIndex===i?'1px solid #fff':'1px solid #2d2d2d',borderRadius:8,padding:10,background:'#151515',color:'#fff'}}><strong>Candidate {i+1}</strong><div style={{fontSize:9,opacity:.55,marginTop:4}}>size {c.size.toFixed(3)} · crown {c.crownScore.toFixed(2)} · neighbors {c.neighbors}</div></button>)}</div><div style={{marginTop:12,fontSize:9,lineHeight:1.5,opacity:.55}}>Click candidates one-by-one. The scene will show only that physical component. We are identifying the true center stone before changing semantic roles.</div></aside>
    <Canvas camera={{fov:42,position:[4,3,4]}} dpr={[1,1.5]}><color attach="background" args={['#090909']}/><Suspense fallback={null}><JewelryModel key={modelUrl} url={modelUrl} onRead={setReport} onComponents={setComponents} onGraph={setGraph}/>{graph&&<ExtractedComponents graph={graph} components={components} visibleRole={visibleRole} candidateId={candidateId}/>}</Suspense><OrbitControls makeDefault enableDamping dampingFactor={.07}/></Canvas>
  </main>
}
