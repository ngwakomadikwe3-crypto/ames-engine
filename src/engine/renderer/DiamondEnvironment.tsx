import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { CubeTexture } from 'three'

export function DiamondEnvironment({ envMap }: { envMap: CubeTexture }) {
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const previous = scene.environment
    scene.environment = envMap
    scene.environmentIntensity = 1
    return () => {
      scene.environment = previous
    }
  }, [envMap, scene])

  return null
}
