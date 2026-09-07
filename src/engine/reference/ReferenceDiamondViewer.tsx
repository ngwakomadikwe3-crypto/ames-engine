import { useEffect, useRef } from 'react'
import { WebGLPathTracer } from 'three-gpu-pathtracer'
import { GenerateMeshBVHWorker } from 'three-mesh-bvh/worker'
import {
  ACESFilmicToneMapping,
  Color,
  Mesh,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type CubeTexture,
} from 'three'
import { DIAMOND_CALIBRATION, createReferenceCalibrationEnvironment } from '../calibration'
import {
  createCanonicalRoundBrilliantGeometry,
  getRoundBrilliantDiagnostics,
} from '../jewelry/canonicalRoundBrilliantGeometry'
import {
  createReferenceDiamondMaterial,
  REFERENCE_RENDER_SETTINGS,
} from './createReferenceDiamondMaterial'

export interface ReferenceDiamondViewerProps {
  rotationY?: number
  className?: string
  geometry?: BufferGeometry
  environment?: CubeTexture
  laptopProfile?: boolean
  onStatusChange?: (status: { state: 'INTERACTING' | 'REFINING'; samples: number; scale: number; fps: number }) => void
}

export function ReferenceDiamondViewer({
  rotationY = DIAMOND_CALIBRATION.diamond.rotation[1],
  className = '',
  geometry: providedGeometry,
  environment: providedEnvironment,
  laptopProfile = false,
  onStatusChange,
}: ReferenceDiamondViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const diagnostics = providedGeometry ? getRoundBrilliantDiagnostics(providedGeometry) : undefined

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = DIAMOND_CALIBRATION.camera.exposure

    const scene = new Scene()
    scene.background = new Color(DIAMOND_CALIBRATION.background)
    const environment = providedEnvironment ?? createReferenceCalibrationEnvironment()
    scene.environment = environment

    const camera = new PerspectiveCamera(
      DIAMOND_CALIBRATION.camera.fov,
      1,
      DIAMOND_CALIBRATION.camera.near,
      DIAMOND_CALIBRATION.camera.far,
    )
    camera.position.set(...DIAMOND_CALIBRATION.camera.position)
    camera.lookAt(...DIAMOND_CALIBRATION.camera.target)

    const geometry = providedGeometry ?? createCanonicalRoundBrilliantGeometry()
    const material = createReferenceDiamondMaterial()
    const diamond = new Mesh(geometry, material)
    diamond.scale.setScalar(DIAMOND_CALIBRATION.diamond.scale)
    diamond.rotation.set(
      DIAMOND_CALIBRATION.diamond.rotation[0],
      rotationY,
      DIAMOND_CALIBRATION.diamond.rotation[2],
    )
    scene.add(diamond)

    const pathTracer = new WebGLPathTracer(renderer)
    const bvhWorker = new GenerateMeshBVHWorker()
    pathTracer.setBVHWorker(bvhWorker)
    pathTracer.bounces = REFERENCE_RENDER_SETTINGS.bounces
    pathTracer.transmissiveBounces = REFERENCE_RENDER_SETTINGS.transmissiveBounces
    pathTracer.renderScale = REFERENCE_RENDER_SETTINGS.renderScale
    pathTracer.minSamples = REFERENCE_RENDER_SETTINGS.minSamples
    pathTracer.rasterizeScene = REFERENCE_RENDER_SETTINGS.rasterizeScene
    pathTracer.fadeDuration = 0
    pathTracer.renderDelay = laptopProfile ? 150 : 0
    pathTracer.dynamicLowRes = laptopProfile
    pathTracer.lowResScale = laptopProfile ? 0.2 : 0.25
    pathTracer.bounces = laptopProfile ? 4 : REFERENCE_RENDER_SETTINGS.bounces
    pathTracer.transmissiveBounces = laptopProfile ? 8 : REFERENCE_RENDER_SETTINGS.transmissiveBounces
    pathTracer.renderScale = laptopProfile ? 0.35 : REFERENCE_RENDER_SETTINGS.renderScale
    pathTracer.minSamples = laptopProfile ? 1 : REFERENCE_RENDER_SETTINGS.minSamples

    let interacting = false
    let statusFrames = 0
    let statusStartedAt = performance.now()
    let fps = 0
    let pointerId: number | null = null
    let lastX = 0
    let lastY = 0
    const target = new Vector3(...DIAMOND_CALIBRATION.camera.target)
    const offset = camera.position.clone().sub(target)
    let theta = Math.atan2(offset.x, offset.z)
    let phi = Math.asin(offset.y / offset.length())
    const updateStatus = () => {
      statusFrames += 1
      const elapsed = performance.now() - statusStartedAt
      if (elapsed >= 500) {
        fps = statusFrames * 1000 / elapsed
        statusFrames = 0
        statusStartedAt = performance.now()
      }
      onStatusChange?.({
        state: interacting ? 'INTERACTING' : 'REFINING',
        samples: pathTracer.samples,
        scale: pathTracer.renderScale,
        fps,
      })
    }
    const startInteraction = (event: PointerEvent) => {
      if (!laptopProfile) return
      interacting = true
      pointerId = event.pointerId
      lastX = event.clientX
      lastY = event.clientY
      pathTracer.pausePathTracing = true
      pathTracer.reset()
      canvas.setPointerCapture(event.pointerId)
      updateStatus()
    }
    const moveInteraction = (event: PointerEvent) => {
      if (!laptopProfile || pointerId !== event.pointerId) return
      theta -= (event.clientX - lastX) * 0.01
      phi = Math.max(-1.45, Math.min(1.45, phi + (event.clientY - lastY) * 0.01))
      lastX = event.clientX
      lastY = event.clientY
      camera.position.set(
        offset.length() * Math.cos(phi) * Math.sin(theta),
        offset.length() * Math.sin(phi),
        offset.length() * Math.cos(phi) * Math.cos(theta),
      ).add(target)
      camera.lookAt(target)
      pathTracer.updateCamera()
      updateStatus()
    }
    const endInteraction = (event: PointerEvent) => {
      if (!laptopProfile || pointerId !== event.pointerId) return
      pointerId = null
      interacting = false
      pathTracer.pausePathTracing = false
      pathTracer.renderScale = 1
      pathTracer.reset()
      canvas.releasePointerCapture(event.pointerId)
      updateStatus()
    }
    canvas.addEventListener('pointerdown', startInteraction)
    canvas.addEventListener('pointermove', moveInteraction)
    canvas.addEventListener('pointerup', endInteraction)
    canvas.addEventListener('pointercancel', endInteraction)
    updateStatus()

    let frame = 0
    let disposed = false
    const resize = () => {
      const parent = canvas.parentElement
      const width = Math.max(1, parent?.clientWidth ?? 1)
      const height = Math.max(1, parent?.clientHeight ?? 1)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      pathTracer.updateCamera()
      pathTracer.reset()
    }

    const observer = new ResizeObserver(resize)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    resize()

    void pathTracer.setSceneAsync(scene, camera).then(() => {
      const render = () => {
        if (disposed) return
        pathTracer.renderSample()
        updateStatus()
        if (pathTracer.samples < REFERENCE_RENDER_SETTINGS.maxSamples) {
          window.setTimeout(() => {
            frame = requestAnimationFrame(render)
          }, 75)
        }
      }
      render()
    }).catch((error: unknown) => {
      console.error('AMES reference renderer failed to initialize.', error)
    })

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener('pointerdown', startInteraction)
      canvas.removeEventListener('pointermove', moveInteraction)
      canvas.removeEventListener('pointerup', endInteraction)
      canvas.removeEventListener('pointercancel', endInteraction)
      pathTracer.dispose()
      bvhWorker.dispose()
      if (!providedGeometry) geometry.dispose()
      material.dispose()
      if (!providedEnvironment) environment.dispose()
      renderer.dispose()
    }
  }, [providedEnvironment, providedGeometry, rotationY])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label="AMES reference diamond renderer"
      data-geometry-uuid={diagnostics?.uuid}
      data-geometry-fingerprint={diagnostics?.fingerprint}
      data-environment-uuid={providedEnvironment?.uuid}
    />
  )
}
