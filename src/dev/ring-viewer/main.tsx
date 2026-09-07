import { createRoot } from 'react-dom/client'
import { RingViewerPage } from './RingViewerPage'

if (!import.meta.env.DEV) {
  throw new Error('The AMES ring viewer is development-only.')
}

createRoot(document.getElementById('root')!).render(<RingViewerPage />)