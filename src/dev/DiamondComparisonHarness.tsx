import { useState } from 'react'
import { DIAMOND_CALIBRATION } from '../engine/calibration'
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

export function DiamondComparisonHarness() {
  const [rotationIndex, setRotationIndex] = useState(0)
  const rotationY = DIAMOND_CALIBRATION.capture.rotations[rotationIndex]

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
        <JewelryViewer diamondRotationY={rotationY} />
      </section>
      <section data-renderer="reference" style={panelStyle}>
        <span style={labelStyle}>REFERENCE</span>
        <ReferenceDiamondViewer
          key={rotationY}
          rotationY={rotationY}
          className="reference-diamond-canvas"
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
