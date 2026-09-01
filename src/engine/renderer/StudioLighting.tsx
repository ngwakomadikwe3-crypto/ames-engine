export function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 5]} intensity={3.2} color="#fff4dc" castShadow />
      <directionalLight position={[-4, 1, 3]} intensity={1.7} color="#cadcff" />
      <spotLight position={[0, 5, -4]} intensity={2.5} color="#ffffff" angle={0.6} penumbra={1} />
    </>
  )
}
