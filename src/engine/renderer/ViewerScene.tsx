import { useEffect, useMemo } from 'react'
import type { BufferGeometry, CubeTexture } from 'three'
import { DIAMOND_CALIBRATION } from '../calibration'
import { RoundBrilliantDiamond } from '../jewelry'
import { DiamondEnvironment } from './DiamondEnvironment'
import { createDiamondStudioEnvironment } from './createDiamondStudioEnvironment'
import { StudioLighting } from './StudioLighting'
import { ViewerControls } from './ViewerControls'

export function ViewerScene({
  diamondRotationY,
  geometry,
  environment: providedEnvironment,
  controlsEnabled = true,
}: {
  diamondRotationY?: number
  geometry?: BufferGeometry
  environment?: CubeTexture
  controlsEnabled?: boolean
}) {
  const generatedEnvironment = useMemo(() => createDiamondStudioEnvironment(), [])
  const envMap = providedEnvironment ?? generatedEnvironment
  useEffect(() => () => generatedEnvironment.dispose(), [generatedEnvironment])

  return (
    <>
      <color attach="background" args={[DIAMOND_CALIBRATION.background]} />
      <StudioLighting />
      <DiamondEnvironment envMap={envMap} />
      <RoundBrilliantDiamond envMap={envMap} geometry={geometry} rotationY={diamondRotationY} />
      {controlsEnabled ? <ViewerControls /> : null}
    </>
  )
}
