import { OrbitControls } from '@react-three/drei'

export function ViewerControls() {
  return (
    <OrbitControls
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      minDistance={2.5}
      maxDistance={8}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.85}
    />
  )
}
