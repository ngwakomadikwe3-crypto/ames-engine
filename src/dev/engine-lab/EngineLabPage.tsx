import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Box3, Color, Group, Mesh, MeshPhysicalMaterial, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createJewelryMetalMaterial } from '../../engine/materials/createJewelryMetalMaterial'

const MODEL_URL = '/models/benchmark_02.glb'

type Counts = {
  centerDiamond: number
  accentDiamonds: number
  prongs: number
  metal: number
  total: number
}

function roleFromName(name: string) {
  const n = name.toLowerCase()
  if (n.includes('diamond_round')) return 'diamond' as const
  if (n.includes('prong_on_surface')) return 'prong' as const
  return 'metal' as const
}

function worldBox(mesh: Mesh) {
  mesh.updateWorldMatrix(true, false)
  return new Box3().setFromObject(mesh)
}

function boxVolume(mesh: Mesh) {
  const size = worldBox(mesh).getSize(new Vector3())
  return Math.abs(size.x * size.y * size.z)
}

function fitCamera(camera: any, controls: any, object: Group) {
  const box = new Box3().setFromObject(object)
  if (box.isEmpty()) return
  const center = box.getCenter(new Vector3())
  const size = box.getSize(new Vector3())
  const radius = Math.max(size.x, size.y, size.z, 0.05)
  const distance = radius * 1.75
  camera.position.set(center.x + distance, center.y + distance * 0.58, center.z + distance)
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

  const materials = useMemo(() => {
    const centerDiamond = new MeshPhysicalMaterial({
      name: 'AMES Center Diamond Stage 1',
      color: new Color('#ffffff'),
      metalness: 0,
      roughness: 0.02,
      transmission: 1,
      thickness: 1.8,
      ior: 2.417,
      clearcoat: 1,
      clearcoatRoughness: 0.01,
      attenuationColor: new Color('#f7fbff'),
      attenuationDistance: 8,
      dispersion: 0.075,
      envMapIntensity: 2.2,
    })

    const accentDiamond = new MeshPhysicalMaterial({
      name: 'AMES Accent Diamond Stage 1',
      color: new Color('#ffffff'),
      metalness: 0,
      roughness: 0.035,
      transmission: 0.96,
      thickness: 0.8,
      ior: 2.417,
      clearcoat: 1,
      clearcoatRoughness: 0.015,
      attenuationColor: new Color('#f5f9ff'),
      attenuationDistance: 5,
      dispersion: 0.04,
      envMapIntensity: 1.8,
    })

    const gold = createJewelryMetalMaterial('18K_YELLOW_GOLD', { roughness: 0.13 })
    gold.envMapIntensity = 1.8

    return { centerDiamond, accentDiamond, gold }
  }, [])

  useEffect(() => {
    let cancelled = false

    new GLTFLoader().load(MODEL_URL, gltf => {
      if (cancelled) return
      const loaded = gltf.scene
      const diamondMeshes: Mesh[] = []
      const prongMeshes: Mesh[] = []
      const metalMeshes: Mesh[] = []

      loaded.traverse(child => {
        if (!(child instanceof Mesh)) return
        const role = roleFromName(child.name)
        if (role === 'diamond') diamondMeshes.push(child)
        else if (role === 'prong') prongMeshes.push(child)
        else metalMeshes.push(child)
      })

      const centerDiamond = [...diamondMeshes].sort((a, b) => boxVolume(b) - boxVolume(a))[0]

      for (const mesh of diamondMeshes) {
        mesh.material = mesh === centerDiamond ? materials.centerDiamond : materials.accentDiamond
      }
      for (const mesh of [...prongMeshes, ...metalMeshes]) mesh.material = materials.gold

      const counts: Counts = {
        centerDiamond: centerDiamond ? 1 : 0,
        accentDiamonds: Math.max(0, diamondMeshes.length - (centerDiamond ? 1 : 0)),
        prongs: prongMeshes.length,
        metal: metalMeshes.length,
        total: diamondMeshes.length + prongMeshes.length + metalMeshes.length,
      }

      setObject(loaded)
      onCounts(counts)
      requestAnimationFrame(() => fitCamera(camera, controls, loaded))
    }, undefined, error => console.error('Benchmark 02 Stage 1 GLB load failed', error))

    return () => { cancelled = true }
  }, [camera, controls, materials, onCounts])

  useEffect(() => () => {
    materials.centerDiamond.dispose()
    materials.accentDiamond.dispose()
    materials.gold.dispose()
  }, [materials])

  return object ? <primitive object={object} /> : null
}

export function EngineLabPage() {
  const [counts, setCounts] = useState<Counts | null>(null)

  return <main style={{ width:'100vw', height:'100vh', background:'#070707', color:'#fff', fontFamily:'Inter,system-ui,sans-serif' }}>
    <div style={{ position:'absolute', zIndex:10, top:18, left:20 }}>
      <strong style={{ fontSize:13, letterSpacing:'.18em' }}>AMES ENGINE LAB</strong>
      <span style={{ fontSize:9, opacity:.45, marginLeft:8 }}>Benchmark 02 · Render Stage 1</span>
      <div style={{ marginTop:8, fontSize:12, opacity:.72 }}>Double Halo Ring · semantic roles locked</div>
      <div style={{ marginTop:4, fontSize:10, color:'#a8bdd6' }}>Largest diamond → center · remaining 50 → accents · prongs + structure → 18K gold</div>
    </div>

    <aside style={{ position:'absolute', zIndex:20, top:18, right:20, width:315, padding:16, border:'1px solid #2b2b2b', borderRadius:12, background:'rgba(12,12,12,.94)' }}>
      <div style={{ fontSize:11, letterSpacing:'.16em', fontWeight:700, opacity:.65 }}>RENDER STAGE 1</div>
      <div style={{ marginTop:6, fontSize:9, color:'#d6b76b' }}>SEMANTICS → MATERIAL EXECUTION</div>
      <div style={{ marginTop:14, display:'grid', gap:8 }}>
        <Row label="CENTER DIAMOND" value={counts?.centerDiamond} detail="largest Diamond_Round" />
        <Row label="ACCENT DIAMONDS" value={counts?.accentDiamonds} detail="optimized diamond material" />
        <Row label="18K GOLD PRONGS" value={counts?.prongs} detail="Prong_On_Surface" />
        <Row label="18K GOLD STRUCTURE" value={counts?.metal} detail="remaining meshes" />
      </div>
      <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid #292929', fontSize:10, opacity:.65 }}>Meshes rendered: <strong>{counts?.total ?? '…'}</strong></div>
      <div style={{ marginTop:8, fontSize:9, lineHeight:1.5, opacity:.5 }}>Stage 1 uses physical transmission/IOR/dispersion for diamonds and polished 18K gold. Photoreal lighting and the full AMES diamond shader come next.</div>
    </aside>

    <Canvas camera={{ fov:40, position:[4,3,4] }} dpr={[1,1.5]} gl={{ antialias:true }}>
      <color attach="background" args={['#070707']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[6,8,6]} intensity={5.5} />
      <directionalLight position={[-5,4,-3]} intensity={3.2} />
      <pointLight position={[0,7,-6]} intensity={85} distance={35} decay={2} />
      <Suspense fallback={null}><BenchmarkModel onCounts={setCounts} /></Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.07} />
    </Canvas>
  </main>
}

function Row({ label, value, detail }: { label:string; value?:number; detail:string }) {
  return <div style={{ padding:10, border:'1px solid #2d2d2d', borderRadius:8, background:'#151515' }}>
    <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}><strong>{label}</strong><strong>{value ?? '…'}</strong></div>
    <div style={{ marginTop:4, fontSize:9, opacity:.45 }}>{detail}</div>
  </div>
}
