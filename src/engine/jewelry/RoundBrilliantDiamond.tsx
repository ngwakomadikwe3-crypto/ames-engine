import { useEnvironment } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
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

export function RoundBrilliantDiamond() {
  const geometry = useMemo(() => createRoundBrilliantGeometry(), [])
  const envMap = useEnvironment({ preset: 'studio' })
  const constrained = useConstrainedDiamondProfile()

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} rotation={[0.08, 0.32, 0]} scale={1.25}>
      <DiamondMaterial envMap={envMap} constrained={constrained} />
    </mesh>
  )
}
