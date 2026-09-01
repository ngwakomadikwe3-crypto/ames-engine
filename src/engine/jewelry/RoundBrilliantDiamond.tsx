import { useEffect, useMemo, useState } from 'react'
import type { CubeTexture } from 'three'
import { DiamondMaterial } from '../materials'
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

export function RoundBrilliantDiamond({ envMap }: { envMap: CubeTexture }) {
  const geometry = useMemo(() => createRoundBrilliantGeometry(), [])
  const constrained = useConstrainedDiamondProfile()

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} rotation={[0, 0.28, 0]} scale={1.25}>
      <DiamondMaterial envMap={envMap} constrained={constrained} />
    </mesh>
  )
}
