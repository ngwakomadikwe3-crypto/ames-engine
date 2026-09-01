import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { ViewerScene } from './ViewerScene'

export interface JewelryViewerProps { className?: string }

export function JewelryViewer({ className = '' }: JewelryViewerProps) {
  const classes = ['jewelry-viewer', className].filter(Boolean).join(' ')

  return (
    <section className={classes} role="region" aria-label="AMES Engine 3D jewelry viewer">
      <Canvas
        camera={{ position: [0, 0.4, 5], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: ACESFilmicToneMapping,
          outputColorSpace: SRGBColorSpace,
        }}
        shadows
      >
        <ViewerScene />
      </Canvas>
    </section>
  )
}
