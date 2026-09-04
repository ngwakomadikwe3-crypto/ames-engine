import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { WebGLPathTracer } from 'three-gpu-pathtracer'
import { DIAMOND_OPTICS } from './diamondOptics'

/** Progressive beauty renderer for the isolated AMES Diamond Core scene. */
export function DiamondCorePathTracer({ enabled }: { enabled: boolean }) {
  const gl = useThree(state => state.gl)
  const scene = useThree(state => state.scene)
  const camera = useThree(state => state.camera)
  const controls = useThree(state => (state as any).controls)
  const tracer = useRef<WebGLPathTracer | null>(null)

  useEffect(() => {
    if (!enabled) return

    let disposed = false
    let pathTracer: WebGLPathTracer | null = null

    // Wait one frame so the diamond mesh and HDR environment are in the scene
    // before the path tracer builds its internal scene representation.
    const frame = requestAnimationFrame(() => {
      if (disposed) return
      pathTracer = new WebGLPathTracer(gl)
      pathTracer.bounces = DIAMOND_OPTICS.maxInternalBounces
      pathTracer.minSamples = 1
      pathTracer.renderDelay = 0
      pathTracer.fadeDuration = 250
      pathTracer.tiles.set(2, 2)
      pathTracer.setScene(scene, camera)
      tracer.current = pathTracer
    })

    const handleCameraChange = () => {
      if (!tracer.current) return
      tracer.current.updateCamera()
    }

    controls?.addEventListener?.('change', handleCameraChange)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      controls?.removeEventListener?.('change', handleCameraChange)
      tracer.current = null
      pathTracer?.dispose()
    }
  }, [camera, controls, enabled, gl, scene])

  useFrame(() => {
    if (!enabled || !tracer.current) return
    // Do not call updateCamera every frame: that invalidates accumulation.
    // Stationary frames must accumulate samples progressively.
    tracer.current.renderSample()
  }, 1)

  return null
}
