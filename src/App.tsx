import { JewelryViewer } from './engine/renderer'

export default function App() {
  return (
    <main className="app-shell">
      <JewelryViewer />
      <div className="brand-mark" aria-hidden="true">
        <span>AMES</span>
        <small>ENGINE</small>
      </div>
    </main>
  )
}
