import { Environment } from '@react-three/drei'

export function DiamondEnvironment() {
  return <Environment preset="studio" background={false} environmentIntensity={1.15} />
}
