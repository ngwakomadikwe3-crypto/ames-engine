import { TemporaryJewelry } from '../jewelry'
import { StudioLighting } from './StudioLighting'
import { ViewerControls } from './ViewerControls'

export function ViewerScene() {
  return (
    <>
      <color attach="background" args={['#050506']} />
      <StudioLighting />
      <TemporaryJewelry />
      <ViewerControls />
    </>
  )
}
