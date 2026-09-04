import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, useEnvironment } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { ACESFilmicToneMapping, Box3, BufferGeometry, Mesh, Quaternion, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DiamondMaterial } from '../../engine/materials/DiamondMaterial'

const MODEL_URL = '/models/benchmark_02.glb'

type CenterStone = {
  geometry: BufferGeometry
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
  sourceName: string
}

function roleFromName(name: string) {
  return name.toLowerCase().includes('diamond_round') ? 'diamond' : 'other'
}

function volume(mesh: Mesh) {
  mesh.updateWorldMatrix(true, false)
  const size = new Box3().setFromObject(mesh).getSize(new Vector3())
  return Math.abs(size.x * size.y * size.z)
}

function fitToBox(camera: any, controls: any, box: Box3) {
  if (box.isEmpty()) return
  const center = box.getCenter(new Vector3())
  const size = box.getSize(new Vector3())
  const radius = Math.max(size.x, size.y, size.z, 0.01)
  const distance = radius * 2.5
  camera.position.set(center.x + distance * 0.9, center.y + distance * 0.6, center.z + distance)
  camera.near = Math.max(distance / 1000, 0.0001)
  camera.far = Math.max(distance * 100, 100)
  camera.updateProjectionMatrix()
  controls?.target.copy(center)
  controls?.update()
}

function IsolatedDiamond({ onReady }: { onReady: (name: string) => void }) {
  const [stone, setStone] = useState<CenterStone | null>(null)
  const camera = useThree(s => s.camera)
  const controls = useThree(s => (s as any).controls)
  const envMap = useEnvironment({ preset: 'studio' })

  useEffect(() => {
    let cancelled = false
    new GLTFLoader().load(MODEL_URL, gltf => {
      if (cancelled) return
      const diamonds: Mesh[] = []
      gltf.scene.traverse(child => {
        if (child instanceof Mesh && roleFromName(child.name) === 'diamond') diamonds.push(child)
      })
      const center = [...diamonds].sort((a, b) => volume(b) - volume(a))[0]
      if (!center) return

      center.updateWorldMatrix(true, false)
      const box = new Box3().setFromObject(center)
      const isolated: CenterStone = {
        geometry: center.geometry,
        position: center.getWorldPosition(new Vector3()),
        quaternion: center.getWorldQuaternion(new Quaternion()),
        scale: center.getWorldScale(new Vector3()),
        sourceName: center.name,
      }
      setStone(isolated)
      onReady(center.name)
      requestAnimationFrame(() => fitToBox(camera, controls, box))
    }, undefined, error => console.error('Center-stone optics benchmark failed to load', error))
    return () => { cancelled = true }
  }, [camera, controls, onReady])

  if (!stone) return null

  return <>
    <Environment map={envMap} background={false} />
    <mesh geometry={stone.geometry} position={stone.position} quaternion={stone.quaternion} scale={stone.scale}>
      <DiamondMaterial envMap={envMap} constrained={false} />
    </mesh>
  </>
}

export function EngineLabPage() {
  const [stoneName, setStoneName] = useState<string | null>(null)
  const ready = useMemo(() => stoneName !== null, [stoneName])

  return <main style={{ width:'100vw', height:'100vh', background:'#0b0b0d', color:'#fff', fontFamily:'Inter,system-ui,sans-serif' }}>
    <div style={{ position:'absolute', zIndex:10, top:20, left:22 }}>
      <strong style={{ fontSize:13, letterSpacing:'.18em' }}>AMES ENGINE LAB</strong>
      <span style={{ fontSize:9, opacity:.5, marginLeft:8 }}>Optics Benchmark</span>
      <div style={{ marginTop:9, fontSize:13, opacity:.78 }}>Center Diamond — isolated validation</div>
      <div style={{ marginTop:5, fontSize:10, color:'#9fb5cf' }}>No ring · no prongs · no gold · no custom shader guessing</div>
    </div>

    <aside style={{ position:'absolute', zIndex:20, top:20, right:20, width:320, padding:16, border:'1px solid #2b2b2f', borderRadius:12, background:'rgba(13,13,15,.95)' }}>
      <div style={{ fontSize:11, letterSpacing:'.16em', fontWeight:700, opacity:.68 }}>DIAMOND OPTICS CHECKPOINT</div>
      <div style={{ marginTop:7, fontSize:9, color:'#d6b76b' }}>PROVEN REFRACTION PATH</div>
      <div style={{ marginTop:14, padding:11, border:'1px solid #303035', borderRadius:8, background:'#171719' }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}><strong>CENTER STONE</strong><strong>{ready ? 'READY' : '…'}</strong></div>
        <div style={{ marginTop:5, fontSize:9, opacity:.5 }}>{stoneName ?? 'Finding largest Diamond_Round…'}</div>
      </div>
      <div style={{ marginTop:10, padding:11, border:'1px solid #303035', borderRadius:8, background:'#171719', fontSize:10, lineHeight:1.6 }}>
        Renderer: <strong>MeshRefractionMaterial</strong><br/>
        Environment: <strong>Studio HDR</strong><br/>
        IOR: <strong>AMES diamond profile</strong><br/>
        Multi-bounce: <strong>enabled</strong>
      </div>
      <div style={{ marginTop:11, fontSize:9, lineHeight:1.55, opacity:.5 }}>This is a pass/fail checkpoint. If the isolated stone does not look convincingly like a diamond, we stop and change rendering technology instead of tuning another stage.</div>
    </aside>

    <Canvas camera={{ fov:36, position:[3,2,4] }} dpr={[1,1.5]} gl={{ antialias:true, toneMapping:ACESFilmicToneMapping, toneMappingExposure:1.1 }}>
      <color attach="background" args={['#0b0b0d']} />
      <Suspense fallback={null}><IsolatedDiamond onReady={setStoneName} /></Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.06} />
    </Canvas>
  </main>
}
