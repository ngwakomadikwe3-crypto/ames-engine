import { Float } from '@react-three/drei'

/** Temporary geometry used only to prove the renderer, lighting, and controls. */
export function TemporaryJewelry() {
  return (
    <Float speed={1.2} rotationIntensity={0.14} floatIntensity={0.18}>
      <mesh castShadow receiveShadow rotation={[0.3, 0.2, 0]}>
        <torusKnotGeometry args={[1, 0.32, 192, 32]} />
        <meshStandardMaterial color="#d8d3c8" metalness={0.92} roughness={0.18} />
      </mesh>
    </Float>
  )
}
