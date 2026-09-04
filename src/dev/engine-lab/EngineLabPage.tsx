import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { ACESFilmicToneMapping, Box3, Color, Group, Mesh, MeshPhysicalMaterial, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createJewelryMetalMaterial } from '../../engine/materials/createJewelryMetalMaterial'

const MODEL_URL = '/models/benchmark_02.glb'

type Counts = { centerDiamond:number; accentDiamonds:number; prongs:number; metal:number; total:number }

function roleFromName(name:string) {
  const n = name.toLowerCase()
  if (n.includes('diamond_round')) return 'diamond' as const
  if (n.includes('prong_on_surface')) return 'prong' as const
  return 'metal' as const
}

function boxVolume(mesh:Mesh) {
  mesh.updateWorldMatrix(true, false)
  const size = new Box3().setFromObject(mesh).getSize(new Vector3())
  return Math.abs(size.x * size.y * size.z)
}

function fitCamera(camera:any, controls:any, object:Group) {
  const box = new Box3().setFromObject(object)
  if (box.isEmpty()) return
  const center = box.getCenter(new Vector3())
  const size = box.getSize(new Vector3())
  const radius = Math.max(size.x, size.y, size.z, .05)
  const d = radius * 1.72
  camera.position.set(center.x + d, center.y + d * .58, center.z + d)
  camera.near = Math.max(d / 1000, .001)
  camera.far = Math.max(d * 100, 100)
  camera.updateProjectionMatrix()
  controls?.target.copy(center)
  controls?.update()
}

function JewelryStudio() {
  return <>
    <Environment resolution={256} background={false}>
      <group rotation={[0, 0.35, 0]}>
        <Lightformer form="rect" intensity={7} color="white" scale={[7, 2.2, 1]} position={[0, 5, -4]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer form="rect" intensity={6} color="#fff7e8" scale={[3, 7, 1]} position={[5, 1, 1]} rotation={[0, -Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={5} color="#eaf3ff" scale={[3, 6, 1]} position={[-5, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={8} color="white" scale={[2, 5, 1]} position={[0, 1, 5]} rotation={[0, Math.PI, 0]} />
        <Lightformer form="ring" intensity={4} color="white" scale={3} position={[0, 4, 2]} rotation={[Math.PI / 2, 0, 0]} />
      </group>
    </Environment>
    <ambientLight intensity={0.12} />
    <directionalLight position={[4, 7, 5]} intensity={2.2} />
  </>
}

function BenchmarkModel({ onCounts }:{ onCounts:(counts:Counts)=>void }) {
  const [object, setObject] = useState<Group|null>(null)
  const camera = useThree(s => s.camera)
  const controls = useThree(s => (s as any).controls)

  const materials = useMemo(() => {
    const centerDiamond = new MeshPhysicalMaterial({
      name:'AMES Center Diamond Stage 2', color:new Color('#ffffff'), metalness:0,
      roughness:.015, transmission:1, thickness:1.15, ior:2.417,
      clearcoat:1, clearcoatRoughness:.005, attenuationColor:new Color('#ffffff'),
      attenuationDistance:20, dispersion:.085, envMapIntensity:3.4,
    })
    const accentDiamond = new MeshPhysicalMaterial({
      name:'AMES Accent Diamond Stage 2', color:new Color('#ffffff'), metalness:0,
      roughness:.025, transmission:.93, thickness:.35, ior:2.417,
      clearcoat:1, clearcoatRoughness:.008, attenuationColor:new Color('#ffffff'),
      attenuationDistance:15, dispersion:.035, envMapIntensity:2.7,
    })
    const gold = createJewelryMetalMaterial('18K_YELLOW_GOLD', { color:'#d8a83e', roughness:.16, metalness:1 })
    gold.envMapIntensity = 2.8
    return { centerDiamond, accentDiamond, gold }
  }, [])

  useEffect(() => {
    let cancelled = false
    new GLTFLoader().load(MODEL_URL, gltf => {
      if (cancelled) return
      const loaded = gltf.scene
      const diamonds:Mesh[] = [], prongs:Mesh[] = [], metal:Mesh[] = []
      loaded.traverse(child => {
        if (!(child instanceof Mesh)) return
        const role = roleFromName(child.name)
        if (role === 'diamond') diamonds.push(child)
        else if (role === 'prong') prongs.push(child)
        else metal.push(child)
      })
      const center = [...diamonds].sort((a,b) => boxVolume(b)-boxVolume(a))[0]
      diamonds.forEach(mesh => { mesh.material = mesh === center ? materials.centerDiamond : materials.accentDiamond })
      ;[...prongs, ...metal].forEach(mesh => { mesh.material = materials.gold })
      const counts = { centerDiamond:center?1:0, accentDiamonds:diamonds.length-(center?1:0), prongs:prongs.length, metal:metal.length, total:diamonds.length+prongs.length+metal.length }
      setObject(loaded); onCounts(counts)
      requestAnimationFrame(() => fitCamera(camera, controls, loaded))
    }, undefined, error => console.error('Benchmark 02 Stage 2 load failed', error))
    return () => { cancelled = true }
  }, [camera, controls, materials, onCounts])

  useEffect(() => () => Object.values(materials).forEach(m => m.dispose()), [materials])
  return object ? <primitive object={object} /> : null
}

export function EngineLabPage() {
  const [counts, setCounts] = useState<Counts|null>(null)
  return <main style={{width:'100vw',height:'100vh',background:'#090909',color:'#fff',fontFamily:'Inter,system-ui,sans-serif'}}>
    <div style={{position:'absolute',zIndex:10,top:18,left:20}}>
      <strong style={{fontSize:13,letterSpacing:'.18em'}}>AMES ENGINE LAB</strong>
      <span style={{fontSize:9,opacity:.45,marginLeft:8}}>Benchmark 02 · Render Stage 2</span>
      <div style={{marginTop:8,fontSize:12,opacity:.72}}>AMES Jewelry Studio · semantic roles locked</div>
      <div style={{marginTop:4,fontSize:10,color:'#a8bdd6'}}>Softbox environment · ACES tone mapping · diamond/gold reflection control</div>
    </div>
    <aside style={{position:'absolute',zIndex:20,top:18,right:20,width:315,padding:16,border:'1px solid #2b2b2b',borderRadius:12,background:'rgba(12,12,12,.94)'}}>
      <div style={{fontSize:11,letterSpacing:'.16em',fontWeight:700,opacity:.65}}>RENDER STAGE 2</div>
      <div style={{marginTop:6,fontSize:9,color:'#d6b76b'}}>JEWELRY STUDIO LIGHTING</div>
      <div style={{marginTop:14,display:'grid',gap:8}}>
        <Row label="CENTER DIAMOND" value={counts?.centerDiamond} detail="high-dispersion physical material" />
        <Row label="ACCENT DIAMONDS" value={counts?.accentDiamonds} detail="optimized physical material" />
        <Row label="18K GOLD PRONGS" value={counts?.prongs} detail="softbox-reflective metal" />
        <Row label="18K GOLD STRUCTURE" value={counts?.metal} detail="polished 18K yellow gold" />
      </div>
      <div style={{marginTop:12,paddingTop:10,borderTop:'1px solid #292929',fontSize:10,opacity:.65}}>Meshes rendered: <strong>{counts?.total ?? '…'}</strong></div>
      <div style={{marginTop:8,fontSize:9,lineHeight:1.5,opacity:.5}}>Stage 2 changes lighting and material response only. The verified 51/100/20 semantic pipeline remains untouched.</div>
    </aside>
    <Canvas camera={{fov:40,position:[4,3,4]}} dpr={[1,1.5]} gl={{antialias:true,toneMapping:ACESFilmicToneMapping,toneMappingExposure:1.35}}>
      <color attach="background" args={['#090909']} />
      <JewelryStudio />
      <Suspense fallback={null}><BenchmarkModel onCounts={setCounts} /></Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={.07} />
    </Canvas>
  </main>
}

function Row({label,value,detail}:{label:string;value?:number;detail:string}) {
  return <div style={{padding:10,border:'1px solid #2d2d2d',borderRadius:8,background:'#151515'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>{label}</strong><strong>{value ?? '…'}</strong></div>
    <div style={{marginTop:4,fontSize:9,opacity:.45}}>{detail}</div>
  </div>
}
