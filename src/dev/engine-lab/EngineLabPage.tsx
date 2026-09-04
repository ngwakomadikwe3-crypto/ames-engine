import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Box3, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const MODEL_URL = '/models/benchmark_02.glb'
const COLORS = { diamond: '#ffffff', prong: '#ff5ca8', metal: '#d6a84b' }

type Counts = { diamonds: number; prongs: number; metal: number; total: number }

function classify(name: string) {
  const n = name.toLowerCase()
  if (n.includes('diamond_round')) return 'diamond' as const
  if (n.includes('prong_on_surface')) return 'prong' as const
  return 'metal' as const
}

function fitCamera(camera: any, controls: any, object: Group) {
  const box = new Box3().setFromObject(object)
  if (box.isEmpty()) return
  const center = box.getCenter(new Vector3())
  const size = box.getSize(new Vector3())
  const radius = Math.max(size.x, size.y, size.z, 0.05)
  const distance = radius * 1.8
  camera.position.set(center.x + distance, center.y + distance * 0.65, center.z + distance)
  camera.near = Math.max(distance / 1000, 0.001)
  camera.far = Math.max(distance * 100, 100)
  camera.updateProjectionMatrix()
  if (controls) { controls.target.copy(center); controls.update() }
  else camera.lookAt(center)
}

function BenchmarkModel({ onCounts }: { onCounts: (counts: Counts) => void }) {
  const [object, setObject] = useState<Group | null>(null)
  const camera = useThree(s => s.camera)
  const controls = useThree(s => (s as any).controls)
  const materials = useMemo(() => ({
    diamond: new MeshBasicMaterial({ color: COLORS.diamond }),
    prong: new MeshBasicMaterial({ color: COLORS.prong }),
    metal: new MeshBasicMaterial({ color: COLORS.metal }),
  }), [])

  useEffect(() => {
    let cancelled = false
    new GLTFLoader().load(MODEL_URL, gltf => {
      if (cancelled) return
      const loaded = gltf.scene
      const counts: Counts = { diamonds: 0, prongs: 0, metal: 0, total: 0 }
      loaded.traverse(child => {
        if (!(child instanceof Mesh)) return
        const role = classify(child.name)
        child.material = materials[role]
        counts.total++
        if (role === 'diamond') counts.diamonds++
        else if (role === 'prong') counts.prongs++
        else counts.metal++
      })
      setObject(loaded)
      onCounts(counts)
      requestAnimationFrame(() => fitCamera(camera, controls, loaded))
    }, undefined, error => console.error('Benchmark 02 GLB load failed', error))
    return () => { cancelled = true }
  }, [camera, controls, materials, onCounts])

  useEffect(() => () => Object.values(materials).forEach(m => m.dispose()), [materials])
  return object ? <primitive object={object} /> : null
}

export function EngineLabPage() {
  const [counts, setCounts] = useState<Counts | null>(null)
  return <main style={{ width:'100vw', height:'100vh', background:'#090909', color:'#fff', fontFamily:'Inter,system-ui,sans-serif' }}>
    <div style={{ position:'absolute', zIndex:10, top:18, left:20 }}>
      <strong style={{ fontSize:13, letterSpacing:'.18em' }}>AMES ENGINE LAB</strong>
      <span style={{ fontSize:9, opacity:.45, marginLeft:8 }}>Benchmark 02 · GLB</span>
      <div style={{ marginTop:8, fontSize:12, opacity:.7 }}>Double Halo Ring · direct semantic verification</div>
      <div style={{ marginTop:4, fontSize:10, color:'#9db7d5' }}>Clean GLB pipeline · source names only · no scene-graph guessing</div>
    </div>

    <aside style={{ position:'absolute', zIndex:20, top:18, right:20, width:310, padding:16, border:'1px solid #2b2b2b', borderRadius:12, background:'rgba(14,14,14,.94)' }}>
      <div style={{ fontSize:11, letterSpacing:'.16em', fontWeight:700, opacity:.65 }}>BENCHMARK 02 VERIFICATION</div>
      <div style={{ marginTop:6, fontSize:9, color:'#d6b76b' }}>LOAD → IDENTIFY → COLOR-CODE → VERIFY</div>
      <div style={{ marginTop:14, display:'grid', gap:8 }}>
        <Row color={COLORS.diamond} label="DIAMOND_ROUND" value={counts?.diamonds} expected="51 expected" />
        <Row color={COLORS.prong} label="PRONG_ON_SURFACE" value={counts?.prongs} expected="100 expected" />
        <Row color={COLORS.metal} label="METAL STRUCTURE" value={counts?.metal} expected="remaining meshes" />
      </div>
      <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid #292929', fontSize:10, opacity:.65 }}>Meshes loaded: <strong>{counts?.total ?? '…'}</strong></div>
      <div style={{ marginTop:8, fontSize:9, lineHeight:1.5, opacity:.5 }}>White = diamonds · pink = prongs · gold = structural metal. No photorealistic materials yet.</div>
    </aside>

    <Canvas camera={{ fov:42, position:[4,3,4] }} dpr={[1,1.5]}>
      <color attach="background" args={['#090909']} />
      <Suspense fallback={null}><BenchmarkModel onCounts={setCounts} /></Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.07} />
    </Canvas>
  </main>
}

function Row({ color, label, value, expected }: { color:string; label:string; value?:number; expected:string }) {
  return <div style={{ padding:10, border:'1px solid #2d2d2d', borderRadius:8, background:'#151515' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}><strong style={{ color }}>{label}</strong><strong>{value ?? '…'}</strong></div>
    <div style={{ marginTop:4, fontSize:9, opacity:.45 }}>{expected}</div>
  </div>
}
