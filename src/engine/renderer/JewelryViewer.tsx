import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { DIAMOND_CALIBRATION } from '../calibration'
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
}

export function JewelryViewer({ className = '', diamondRotationY }: JewelryViewerProps) {
  const classes = ['jewelry-viewer', className].filter(Boolean).join(' ')

  return (
    <section className={classes} role="region" aria-label="AMES Engine 3D jewelry viewer">
      <Canvas
        camera={DIAMOND_VIEWER_CAMERA}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: ACESFilmicToneMapping,
          outputColorSpace: SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = DIAMOND_TONE_MAPPING_EXPOSURE
        }}
        shadows
      >
        <ViewerScene diamondRotationY={diamondRotationY} />
      </Canvas>
    </section>
  )
}
