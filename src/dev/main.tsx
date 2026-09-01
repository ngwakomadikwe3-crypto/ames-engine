import { createRoot } from 'react-dom/client'
import { DiamondComparisonHarness } from './DiamondComparisonHarness'
import '../styles.css'

if (!import.meta.env.DEV) {
  throw new Error('The AMES diamond comparison renderer is development-only.')
}

createRoot(document.getElementById('root')!).render(
  <DiamondComparisonHarness />,
)
