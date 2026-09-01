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
  WebGLRenderer,
} from 'three'
import { DIAMOND_CALIBRATION, createReferenceCalibrationEnvironment } from '../calibration'
import { createRoundBrilliantGeometry } from '../jewelry/createRoundBrilliantGeometry'
import {
  createReferenceDiamondMaterial,
  REFERENCE_RENDER_SETTINGS,
} from './createReferenceDiamondMaterial'

export interface ReferenceDiamondViewerProps {
  rotationY?: number
  className?: string
}

export function ReferenceDiamondViewer({
  rotationY = DIAMOND_CALIBRATION.diamond.rotation[1],
  className = '',
}: ReferenceDiamondViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = DIAMOND_CALIBRATION.camera.exposure

    const scene = new Scene()
    scene.background = new Color(DIAMOND_CALIBRATION.background)
    const environment = createReferenceCalibrationEnvironment()
    scene.environment = environment

    const camera = new PerspectiveCamera(
      DIAMOND_CALIBRATION.camera.fov,
      1,
      DIAMOND_CALIBRATION.camera.near,
      DIAMOND_CALIBRATION.camera.far,
    )
    camera.position.set(...DIAMOND_CALIBRATION.camera.position)
    camera.lookAt(...DIAMOND_CALIBRATION.camera.target)

    const geometry = createRoundBrilliantGeometry()
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
    pathTracer.rasterizeScene = true

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
      pathTracer.dispose()
      bvhWorker.dispose()
      geometry.dispose()
      material.dispose()
      environment.dispose()
      renderer.dispose()
    }
  }, [rotationY])

  return <canvas ref={canvasRef} className={className} aria-label="AMES reference diamond renderer" />
}
