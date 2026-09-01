import { useEffect, useMemo } from 'react'
import { DIAMOND_CALIBRATION } from '../calibration'
import { RoundBrilliantDiamond } from '../jewelry'
import { DiamondEnvironment } from './DiamondEnvironment'
import { createDiamondStudioEnvironment } from './createDiamondStudioEnvironment'
import { StudioLighting } from './StudioLighting'
import { ViewerControls } from './ViewerControls'

export function ViewerScene({ diamondRotationY }: { diamondRotationY?: number }) {
  const envMap = useMemo(() => createDiamondStudioEnvironment(), [])
  useEffect(() => () => envMap.dispose(), [envMap])

  return (
    <>
      <color attach="background" args={[DIAMOND_CALIBRATION.background]} />
      <StudioLighting />
      <DiamondEnvironment envMap={envMap} />
      <RoundBrilliantDiamond envMap={envMap} rotationY={diamondRotationY} />
      <ViewerControls />
    </>
  )
}
