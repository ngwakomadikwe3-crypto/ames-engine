import { Suspense } from 'react'
import { RoundBrilliantDiamond } from '../jewelry'
import { DiamondEnvironment } from './DiamondEnvironment'
import { StudioLighting } from './StudioLighting'
import { ViewerControls } from './ViewerControls'

export function ViewerScene() {
  return (
    <>
      <color attach="background" args={['#050506']} />
      <StudioLighting />
      <Suspense fallback={null}>
        <DiamondEnvironment />
        <RoundBrilliantDiamond />
      </Suspense>
      <ViewerControls />
    </>
  )
}
