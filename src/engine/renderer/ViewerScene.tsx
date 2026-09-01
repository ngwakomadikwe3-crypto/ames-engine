import { useEffect, useMemo } from 'react'
import { RoundBrilliantDiamond } from '../jewelry'
import { DiamondEnvironment } from './DiamondEnvironment'
import { createDiamondStudioEnvironment } from './createDiamondStudioEnvironment'
import { StudioLighting } from './StudioLighting'
import { ViewerControls } from './ViewerControls'

export function ViewerScene() {
  const envMap = useMemo(() => createDiamondStudioEnvironment(), [])
  useEffect(() => () => envMap.dispose(), [envMap])

  return (
    <>
      <color attach="background" args={['#050506']} />
      <StudioLighting />
      <DiamondEnvironment envMap={envMap} />
      <RoundBrilliantDiamond envMap={envMap} />
      <ViewerControls />
    </>
  )
}
