import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { ViewerScene } from './ViewerScene'

export const DIAMOND_VIEWER_CAMERA = {
  position: [0, 1.15, 5.4] as [number, number, number],
  fov: 32,
  near: 0.1,
  far: 100,
}

export const DIAMOND_TONE_MAPPING_EXPOSURE = 0.78

export interface JewelryViewerProps { className?: string }

export function JewelryViewer({ className = '' }: JewelryViewerProps) {
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
        <ViewerScene />
      </Canvas>
    </section>
  )
}
