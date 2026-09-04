import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { WebGLPathTracer } from 'three-gpu-pathtracer'

/** Progressive beauty renderer for the isolated AMES Diamond Core scene. */
export function DiamondCorePathTracer({ enabled }: { enabled: boolean }) {
  const gl = useThree(state => state.gl)
  const scene = useThree(state => state.scene)
  const camera = useThree(state => state.camera)
  const tracer = useRef<WebGLPathTracer | null>(null)

  useEffect(() => {
    if (!enabled) return

    const pathTracer = new WebGLPathTracer(gl)
    pathTracer.bounces = 12
    pathTracer.minSamples = 1
    pathTracer.renderDelay = 0
    pathTracer.fadeDuration = 250
    pathTracer.tiles.set(2, 2)
    pathTracer.setScene(scene, camera)
    tracer.current = pathTracer

    return () => {
      tracer.current = null
      pathTracer.dispose()
    }
  }, [camera, enabled, gl, scene])

  useFrame(() => {
    if (!enabled || !tracer.current) return
    tracer.current.updateCamera()
    tracer.current.renderSample()
  }, 1)

  return null
}
