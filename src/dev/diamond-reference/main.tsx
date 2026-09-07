import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { ReferenceDiamondViewer } from '../../engine/reference'

function DiamondReferenceLab() {
  const [status, setStatus] = useState({ state: 'REFINING', samples: 0, scale: 0.35, fps: 0 })

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#050506' }}>
      <ReferenceDiamondViewer
        className="diamond-reference-canvas"
        laptopProfile
        onStatusChange={setStatus}
      />
      <pre style={{ position: 'fixed', top: 12, left: 12, margin: 0, color: '#fff', font: '12px monospace' }}>
        {`FPS  ${status.fps.toFixed(0)}\nSAMPLES ${status.samples}\nSCALE ${status.scale.toFixed(2)}\nSTATE ${status.state}`}
      </pre>
      <style>{`
        html, body, #root { width: 100%; height: 100%; margin: 0; }
        .diamond-reference-canvas { display: block; width: 100%; height: 100%; touch-action: none; }
      `}</style>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<DiamondReferenceLab />)
