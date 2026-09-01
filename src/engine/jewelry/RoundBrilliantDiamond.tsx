import { useEffect, useMemo, useState } from 'react'
import type { CubeTexture } from 'three'
import { DiamondMaterial } from '../materials'
import { DIAMOND_CALIBRATION } from '../calibration'
import { createRoundBrilliantGeometry } from './createRoundBrilliantGeometry'

function useConstrainedDiamondProfile() {
  const query = '(pointer: coarse), (max-width: 700px)'
  const [constrained, setConstrained] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setConstrained(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return constrained
}

export function RoundBrilliantDiamond({
  envMap,
  rotationY = DIAMOND_CALIBRATION.diamond.rotation[1],
}: {
  envMap: CubeTexture
  rotationY?: number
}) {
  const geometry = useMemo(() => createRoundBrilliantGeometry(), [])
  const constrained = useConstrainedDiamondProfile()

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh
      geometry={geometry}
      rotation={[
        DIAMOND_CALIBRATION.diamond.rotation[0],
        rotationY,
        DIAMOND_CALIBRATION.diamond.rotation[2],
      ]}
      scale={DIAMOND_CALIBRATION.diamond.scale}
    >
      <DiamondMaterial envMap={envMap} constrained={constrained} />
    </mesh>
  )
}
