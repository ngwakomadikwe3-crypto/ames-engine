import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="three-canvas" />,
}))

import App from '../src/App'

test('mounts the reusable AMES jewelry viewer', () => {
  render(<App />)

  expect(
    screen.getByRole('region', { name: 'AMES Engine 3D jewelry viewer' }),
  ).toBeInTheDocument()
})
