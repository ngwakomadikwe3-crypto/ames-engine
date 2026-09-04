import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshTransmissionMaterial, OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { ACESFilmicToneMapping, Box3, Color, DoubleSide, Group, Mesh, MeshPhysicalMaterial, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createJewelryMetalMaterial } from '../../engine/materials/createJewelryMetalMaterial'

const MODEL_URL = '/models/benchmark_02.glb'
type Counts = { centerDiamond:number; accentDiamonds:number; prongs:number; metal:number; total:number }

type LoadedJewelry = { root:Group; center:Mesh|null; accents:Mesh[]; prongs:Mesh[]; metal:Mesh[] }

function roleFromName(name:string) {
  const n=name.toLowerCase()
  if(n.includes('diamond_round')) return 'diamond' as const
  if(n.includes('prong_on_surface')) return 'prong' as const
  return 'metal' as const
}
function boxVolume(mesh:Mesh){ mesh.updateWorldMatrix(true,false); const s=new Box3().setFromObject(mesh).getSize(new Vector3()); return Math.abs(s.x*s.y*s.z) }
function fitCamera(camera:any,controls:any,object:Group){
  const box=new Box3().setFromObject(object); if(box.isEmpty()) return
  const c=box.getCenter(new Vector3()), s=box.getSize(new Vector3()), r=Math.max(s.x,s.y,s.z,.05), d=r*1.72
  camera.position.set(c.x+d,c.y+d*.58,c.z+d); camera.near=Math.max(d/1000,.001); camera.far=Math.max(d*100,100); camera.updateProjectionMatrix()
  controls?.target.copy(c); controls?.update()
}
function JewelryStudio(){ return <>
  <Environment resolution={384} background={false}>
    <group rotation={[0,.35,0]}>
      <Lightformer form="rect" intensity={8} color="white" scale={[7,2.2,1]} position={[0,5,-4]} rotation={[Math.PI/2,0,0]}/>
      <Lightformer form="rect" intensity={6} color="#fff4dc" scale={[3,7,1]} position={[5,1,1]} rotation={[0,-Math.PI/2,0]}/>
      <Lightformer form="rect" intensity={5} color="#e5f1ff" scale={[3,6,1]} position={[-5,1,0]} rotation={[0,Math.PI/2,0]}/>
      <Lightformer form="rect" intensity={9} color="white" scale={[2,5,1]} position={[0,1,5]} rotation={[0,Math.PI,0]}/>
      <Lightformer form="ring" intensity={5} color="white" scale={3} position={[0,4,2]} rotation={[Math.PI/2,0,0]}/>
    </group>
  </Environment>
  <ambientLight intensity={.08}/><directionalLight position={[4,7,5]} intensity={1.7}/>
</> }

function BenchmarkModel({onCounts}:{onCounts:(c:Counts)=>void}){
  const [loaded,setLoaded]=useState<LoadedJewelry|null>(null)
  const camera=useThree(s=>s.camera), controls=useThree(s=>(s as any).controls)
  const mats=useMemo(()=>{
    const accent=new MeshPhysicalMaterial({name:'AMES Accent Diamond Stage 3',color:new Color('#ffffff'),metalness:0,roughness:.035,transmission:.82,thickness:.28,ior:2.417,clearcoat:1,clearcoatRoughness:.01,attenuationColor:new Color('#f8fbff'),attenuationDistance:12,dispersion:.025,envMapIntensity:2.4})
    const gold=createJewelryMetalMaterial('18K_YELLOW_GOLD',{color:'#d5a43a',roughness:.17,metalness:1}); gold.envMapIntensity=2.6
    return {accent,gold}
  },[])
  useEffect(()=>{
    let cancelled=false
    new GLTFLoader().load(MODEL_URL,gltf=>{
      if(cancelled)return
      const root=gltf.scene, diamonds:Mesh[]=[],prongs:Mesh[]=[],metal:Mesh[]=[]
      root.traverse(ch=>{if(!(ch instanceof Mesh))return; const r=roleFromName(ch.name); if(r==='diamond')diamonds.push(ch); else if(r==='prong')prongs.push(ch); else metal.push(ch)})
      const center=[...diamonds].sort((a,b)=>boxVolume(b)-boxVolume(a))[0]??null
      const accents=diamonds.filter(m=>m!==center)
      accents.forEach(m=>m.material=mats.accent); [...prongs,...metal].forEach(m=>m.material=mats.gold)
      if(center){ center.visible=false }
      setLoaded({root,center,accents,prongs,metal})
      onCounts({centerDiamond:center?1:0,accentDiamonds:accents.length,prongs:prongs.length,metal:metal.length,total:diamonds.length+prongs.length+metal.length})
      requestAnimationFrame(()=>fitCamera(camera,controls,root))
    },undefined,e=>console.error('Benchmark 02 Stage 3 load failed',e))
    return()=>{cancelled=true}
  },[camera,controls,mats,onCounts])
  useEffect(()=>()=>Object.values(mats).forEach(m=>m.dispose()),[mats])
  if(!loaded)return null
  const {root,center}=loaded
  return <>
    <primitive object={root}/>
    {center && <mesh geometry={center.geometry} position={center.getWorldPosition(new Vector3())} quaternion={center.getWorldQuaternion(center.quaternion.clone())} scale={center.getWorldScale(new Vector3())}>
      <MeshTransmissionMaterial
        samples={8} resolution={512} transmission={1} thickness={1.35} roughness={0}
        ior={2.417} chromaticAberration={0.055} anisotropy={0.08} distortion={0.025}
        distortionScale={0.12} temporalDistortion={0} backside backsideThickness={1.1}
        clearcoat={1} clearcoatRoughness={0} color="#ffffff" attenuationColor="#f8fbff"
        attenuationDistance={12} side={DoubleSide}
      />
    </mesh>}
  </>
}

export function EngineLabPage(){
  const [counts,setCounts]=useState<Counts|null>(null)
  return <main style={{width:'100vw',height:'100vh',background:'#090909',color:'#fff',fontFamily:'Inter,system-ui,sans-serif'}}>
    <div style={{position:'absolute',zIndex:10,top:18,left:20}}><strong style={{fontSize:13,letterSpacing:'.18em'}}>AMES ENGINE LAB</strong><span style={{fontSize:9,opacity:.45,marginLeft:8}}>Benchmark 02 · Render Stage 3</span><div style={{marginTop:8,fontSize:12,opacity:.72}}>AMES Diamond Optics · center-stone benchmark</div><div style={{marginTop:4,fontSize:10,color:'#a8bdd6'}}>True screen-space transmission · diamond IOR 2.417 · controlled fire · semantics locked</div></div>
    <aside style={{position:'absolute',zIndex:20,top:18,right:20,width:315,padding:16,border:'1px solid #2b2b2b',borderRadius:12,background:'rgba(12,12,12,.94)'}}><div style={{fontSize:11,letterSpacing:'.16em',fontWeight:700,opacity:.65}}>RENDER STAGE 3</div><div style={{marginTop:6,fontSize:9,color:'#d6b76b'}}>CENTER DIAMOND OPTICS</div><div style={{marginTop:14,display:'grid',gap:8}}><Row label="CENTER DIAMOND" value={counts?.centerDiamond} detail="high-quality transmission optics"/><Row label="ACCENT DIAMONDS" value={counts?.accentDiamonds} detail="Stage 2 optimized optics retained"/><Row label="18K GOLD PRONGS" value={counts?.prongs} detail="verified semantic role retained"/><Row label="18K GOLD STRUCTURE" value={counts?.metal} detail="verified semantic role retained"/></div><div style={{marginTop:12,paddingTop:10,borderTop:'1px solid #292929',fontSize:10,opacity:.65}}>Meshes rendered: <strong>{counts?.total??'…'}</strong></div><div style={{marginTop:8,fontSize:9,lineHeight:1.5,opacity:.5}}>Stage 3 replaces only the center stone renderer. If this stone reads correctly as crystal, the optical model becomes the basis for the AMES diamond engine.</div></aside>
    <Canvas camera={{fov:40,position:[4,3,4]}} dpr={[1,1.5]} gl={{antialias:true,toneMapping:ACESFilmicToneMapping,toneMappingExposure:1.18}}><color attach="background" args={['#090909']}/><JewelryStudio/><Suspense fallback={null}><BenchmarkModel onCounts={setCounts}/></Suspense><OrbitControls makeDefault enableDamping dampingFactor={.07}/></Canvas>
  </main>
}
function Row({label,value,detail}:{label:string;value?:number;detail:string}){return <div style={{padding:10,border:'1px solid #2d2d2d',borderRadius:8,background:'#151515'}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>{label}</strong><strong>{value??'…'}</strong></div><div style={{marginTop:4,fontSize:9,opacity:.45}}>{detail}</div></div>}
