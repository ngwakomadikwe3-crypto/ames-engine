import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, useEnvironment } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ACESFilmicToneMapping, Box3, BufferGeometry, CubeTexture, Matrix4, Mesh, Quaternion, ShaderMaterial, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshBVH, MeshBVHUniformStruct, SAH } from 'three-mesh-bvh'
import { createAmesDiamondRayMaterial } from '../../engine/diamond-core/AmesDiamondRayMaterial'
import { DIAMOND_OPTICS, criticalAngleDegrees } from '../../engine/diamond-core/diamondOptics'

const MODEL_URL='/models/benchmark_02.glb'
type CenterStone={geometry:BufferGeometry;position:Vector3;quaternion:Quaternion;scale:Vector3;sourceName:string}
function roleFromName(name:string){return name.toLowerCase().includes('diamond_round')?'diamond':'other'}
function volume(mesh:Mesh){mesh.updateWorldMatrix(true,false);const s=new Box3().setFromObject(mesh).getSize(new Vector3());return Math.abs(s.x*s.y*s.z)}
function fitToBox(camera:any,controls:any,box:Box3){if(box.isEmpty())return;const c=box.getCenter(new Vector3()),s=box.getSize(new Vector3()),r=Math.max(s.x,s.y,s.z,.01),d=r*2.5;camera.position.set(c.x+d*.9,c.y+d*.6,c.z+d);camera.near=Math.max(d/1000,.0001);camera.far=Math.max(d*100,100);camera.updateProjectionMatrix();controls?.target.copy(c);controls?.update()}

function RayDiamond({stone,envMap}:{stone:CenterStone;envMap:any}){
 const meshRef=useRef<Mesh>(null);const camera=useThree(s=>s.camera)
 const material=useMemo(()=>{
   const geometry=stone.geometry.index?stone.geometry.clone():stone.geometry.toNonIndexed();
   const tree=new MeshBVH(geometry,{strategy:SAH,maxLeafTris:1});
   const bvh=new MeshBVHUniformStruct();bvh.updateFrom(tree);
   const mat=createAmesDiamondRayMaterial(bvh,envMap as CubeTexture);
   ;(mat.userData as any).amesBVH=bvh;(mat.userData as any).amesGeometry=geometry
   return mat
 },[stone.geometry,envMap])
 useEffect(()=>()=>{const m=material as ShaderMaterial;(m.userData as any).amesBVH?.dispose?.();(m.userData as any).amesGeometry?.dispose?.();m.dispose()},[material])
 useFrame(()=>{const mesh=meshRef.current;if(!mesh)return;mesh.updateWorldMatrix(true,false);material.uniforms.invModelMatrix.value.copy(mesh.matrixWorld).invert();material.uniforms.cameraWorld.value.copy(camera.position)})
 return <mesh ref={meshRef} geometry={stone.geometry} material={material} position={stone.position} quaternion={stone.quaternion} scale={stone.scale}/>
}

function IsolatedDiamond({onReady}:{onReady:(name:string)=>void}){
 const [stone,setStone]=useState<CenterStone|null>(null);const camera=useThree(s=>s.camera);const controls=useThree(s=>(s as any).controls);const envMap=useEnvironment({preset:'studio'})
 useEffect(()=>{let cancelled=false;new GLTFLoader().load(MODEL_URL,gltf=>{if(cancelled)return;const diamonds:Mesh[]=[];gltf.scene.traverse(child=>{if(child instanceof Mesh&&roleFromName(child.name)==='diamond')diamonds.push(child)});const center=[...diamonds].sort((a,b)=>volume(b)-volume(a))[0];if(!center)return;center.updateWorldMatrix(true,false);const box=new Box3().setFromObject(center);setStone({geometry:center.geometry,position:center.getWorldPosition(new Vector3()),quaternion:center.getWorldQuaternion(new Quaternion()),scale:center.getWorldScale(new Vector3()),sourceName:center.name});onReady(center.name);requestAnimationFrame(()=>fitToBox(camera,controls,box))},undefined,e=>console.error('AMES facet engine load failed',e));return()=>{cancelled=true}},[camera,controls,onReady])
 if(!stone)return null
 return <><Environment map={envMap} background/><RayDiamond stone={stone} envMap={envMap}/></>
}

export function EngineLabPage(){const[stoneName,setStoneName]=useState<string|null>(null);const ready=stoneName!==null;return <main style={{width:'100vw',height:'100vh',background:'#0b0b0d',color:'#fff',fontFamily:'Inter,system-ui,sans-serif'}}>
 <div style={{position:'absolute',zIndex:10,top:20,left:22}}><strong style={{fontSize:13,letterSpacing:'.18em'}}>AMES FACET RAY ENGINE</strong><span style={{fontSize:9,opacity:.5,marginLeft:8}}>v0.1</span><div style={{marginTop:9,fontSize:13,opacity:.78}}>Center Diamond — dedicated facet transport</div><div style={{marginTop:5,fontSize:10,color:'#9fb5cf'}}>Real facet BVH · Snell refraction · TIR · RGB dispersion</div></div>
 <aside style={{position:'absolute',zIndex:20,top:20,right:20,width:300,padding:16,border:'1px solid #2b2b2f',borderRadius:12,background:'rgba(13,13,15,.95)'}}><div style={{fontSize:11,letterSpacing:'.16em',fontWeight:700,opacity:.68}}>FACET ENGINE CHECKPOINT</div><div style={{marginTop:7,fontSize:9,color:'#d6b76b'}}>GENERIC GLASS PATH REMOVED</div><div style={{marginTop:14,padding:11,border:'1px solid #303035',borderRadius:8,background:'#171719'}}><div style={{display:'flex',justifyContent:'space-between'}}><strong>CENTER STONE</strong><strong>{ready?'READY':'…'}</strong></div><div style={{marginTop:5,fontSize:9,opacity:.5}}>{stoneName??'Finding largest Diamond_Round…'}</div></div><div style={{marginTop:10,padding:11,border:'1px solid #303035',borderRadius:8,background:'#171719',fontSize:10,lineHeight:1.6}}>Renderer: <strong>AMES Facet Ray Engine</strong><br/>IOR R/G/B: <strong>{DIAMOND_OPTICS.spectralIor.red} / {DIAMOND_OPTICS.spectralIor.green} / {DIAMOND_OPTICS.spectralIor.blue}</strong><br/>Critical angle: <strong>{criticalAngleDegrees().toFixed(2)}°</strong><br/>Facet bounces: <strong>12 GPU</strong><br/>TIR: <strong>enabled</strong><br/>Dispersion: <strong>spectral RGB</strong></div></aside>
 <Canvas camera={{fov:36,position:[3,2,4]}} dpr={[1,1.25]} gl={{antialias:true,toneMapping:ACESFilmicToneMapping,toneMappingExposure:1.05}}><Suspense fallback={null}><IsolatedDiamond onReady={setStoneName}/></Suspense><OrbitControls makeDefault enableDamping dampingFactor={.06}/></Canvas></main>}
