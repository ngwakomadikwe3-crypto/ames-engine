import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import type { BufferGeometry, CubeTexture } from 'three'
import { DIAMOND_CALIBRATION } from '../calibration'
import { getRoundBrilliantDiagnostics } from '../jewelry'
import { ViewerScene } from './ViewerScene'

export const DIAMOND_VIEWER_CAMERA = {
  position: [...DIAMOND_CALIBRATION.camera.position] as [number, number, number],
  fov: DIAMOND_CALIBRATION.camera.fov,
  near: DIAMOND_CALIBRATION.camera.near,
  far: DIAMOND_CALIBRATION.camera.far,
}

export const DIAMOND_TONE_MAPPING_EXPOSURE = DIAMOND_CALIBRATION.camera.exposure

export interface JewelryViewerProps {
  className?: string
  diamondRotationY?: number
  geometry?: BufferGeometry
  environment?: CubeTexture
  controlsEnabled?: boolean
}

export function JewelryViewer({
  className = '',
  diamondRotationY,
  geometry,
  environment,
  controlsEnabled = true,
}: JewelryViewerProps) {
  const classes = ['jewelry-viewer', className].filter(Boolean).join(' ')
  const diagnostics = geometry ? getRoundBrilliantDiagnostics(geometry) : undefined

  return (
    <section
      className={classes}
      role="region"
      aria-label="AMES Engine 3D jewelry viewer"
      data-geometry-uuid={diagnostics?.uuid}
      data-geometry-fingerprint={diagnostics?.fingerprint}
      data-environment-uuid={environment?.uuid}
    >
      <Canvas
        camera={DIAMOND_VIEWER_CAMERA}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: ACESFilmicToneMapping,
          outputColorSpace: SRGBColorSpace,
        }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(...DIAMOND_CALIBRATION.camera.target)
          camera.updateMatrixWorld()
          gl.toneMappingExposure = DIAMOND_TONE_MAPPING_EXPOSURE
        }}
        shadows
      >
        <ViewerScene
          diamondRotationY={diamondRotationY}
          geometry={geometry}
          environment={environment}
          controlsEnabled={controlsEnabled}
        />
      </Canvas>
    </section>
  )
}
