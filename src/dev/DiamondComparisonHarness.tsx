import { useEffect, useMemo, useState } from 'react'
import { DIAMOND_CALIBRATION, createRealtimeCalibrationEnvironment } from '../engine/calibration'
import {
  createCanonicalRoundBrilliantGeometry,
  getRoundBrilliantDiagnostics,
} from '../engine/jewelry'
import { ReferenceDiamondViewer } from '../engine/reference'
import { JewelryViewer } from '../engine/renderer'

const panelStyle = {
  position: 'relative',
  minWidth: 0,
  minHeight: 0,
  background: DIAMOND_CALIBRATION.background,
} as const

const labelStyle = {
  position: 'absolute',
  zIndex: 2,
  top: 16,
  left: 18,
  color: '#f5f2ea',
  fontSize: 10,
  letterSpacing: '0.28em',
  pointerEvents: 'none',
} as const

const diagnosticsStyle = {
  position: 'absolute',
  zIndex: 2,
  top: 38,
  left: 18,
  margin: 0,
  color: '#aeb5bc',
  font: '9px/1.55 ui-monospace, SFMono-Regular, Consolas, monospace',
  pointerEvents: 'none',
  whiteSpace: 'pre-wrap',
} as const

function Diagnostics({
  renderer,
  uuid,
  fingerprint,
  vertexCount,
  triangleCount,
  rotationY,
  environmentUuid,
}: {
  renderer: string
  uuid: string
  fingerprint: string
  vertexCount: number
  triangleCount: number
  rotationY: number
  environmentUuid: string
}) {
  const { camera, diamond, environment } = DIAMOND_CALIBRATION
  return (
    <pre data-diagnostics={renderer} style={diagnosticsStyle}>
      {[
        `geometry uuid  ${uuid}`,
        `fingerprint    ${fingerprint}`,
        `vertices       ${vertexCount}`,
        `triangles      ${triangleCount}`,
        `camera         [${camera.position.join(', ')}]`,
        `target         [${camera.target.join(', ')}]`,
        `fov            ${camera.fov}`,
        `rotation       [${diamond.rotation[0]}, ${rotationY.toFixed(6)}, ${diamond.rotation[2]}]`,
        `scale          ${diamond.scale}`,
        `exposure       ${camera.exposure}`,
        `environment    ${environment.cards.length} canonical cards`,
        `environment id ${environmentUuid}`,
      ].join('\n')}
    </pre>
  )
}

export function DiamondComparisonHarness() {
  const [rotationIndex, setRotationIndex] = useState(0)
  const rotationY = DIAMOND_CALIBRATION.capture.rotations[rotationIndex]
  const geometry = useMemo(() => createCanonicalRoundBrilliantGeometry(), [])
  const environment = useMemo(() => createRealtimeCalibrationEnvironment(), [])
  const diagnostics = useMemo(() => getRoundBrilliantDiagnostics(geometry), [geometry])

  useEffect(() => () => {
    geometry.dispose()
    environment.dispose()
  }, [environment, geometry])

  return (
    <main
      data-ames-development-tool="diamond-comparison"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gridTemplateRows: 'minmax(0, 1fr)',
        width: '100%',
        height: '100%',
        gap: 1,
        background: '#303238',
      }}
    >
      <section data-renderer="realtime" style={panelStyle}>
        <span style={labelStyle}>REALTIME</span>
        <Diagnostics
          renderer="realtime"
          {...diagnostics}
          rotationY={rotationY}
          environmentUuid={environment.uuid}
        />
        <JewelryViewer
          diamondRotationY={rotationY}
          geometry={geometry}
          environment={environment}
          controlsEnabled={false}
        />
      </section>
      <section data-renderer="reference" style={panelStyle}>
        <span style={labelStyle}>REFERENCE</span>
        <Diagnostics
          renderer="reference"
          {...diagnostics}
          rotationY={rotationY}
          environmentUuid={environment.uuid}
        />
        <ReferenceDiamondViewer
          key={rotationY}
          rotationY={rotationY}
          className="reference-diamond-canvas"
          geometry={geometry}
          environment={environment}
        />
      </section>
      <button
        type="button"
        aria-label="Advance calibration rotation"
        onClick={() => setRotationIndex((rotationIndex + 1) % DIAMOND_CALIBRATION.capture.rotations.length)}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 3,
          border: '1px solid #5d6169',
          borderRadius: 2,
          padding: '8px 10px',
          color: '#ddd9ce',
          background: '#15171b',
          font: '10px ui-sans-serif, system-ui',
          letterSpacing: '0.16em',
          cursor: 'pointer',
        }}
      >
        NEXT ANGLE
      </button>
    </main>
  )
}
