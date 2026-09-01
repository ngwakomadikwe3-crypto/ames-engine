import { describe, expect, test } from 'vitest'
import {
  DIAMOND_STUDIO_CARDS,
  DIAMOND_STUDIO_PALETTE,
} from '../src/engine/renderer/createDiamondStudioEnvironment'

describe('structured diamond studio environment', () => {
  test('uses broad white cards, neutral fill, and charcoal flags', () => {
    expect(DIAMOND_STUDIO_PALETTE).toEqual({
      highlight: '#ffffff',
      warmHighlight: '#f7f2e8',
      fill: '#969ca3',
      shadowFill: '#59616a',
      flag: '#20262d',
    })

    expect(DIAMOND_STUDIO_CARDS.filter((card) => card.role === 'highlight')).toHaveLength(3)
    expect(DIAMOND_STUDIO_CARDS.filter((card) => card.role === 'flag')).toHaveLength(3)
    expect(DIAMOND_STUDIO_CARDS.some((card) => card.width >= 120)).toBe(true)
    expect(new Set(DIAMOND_STUDIO_CARDS.map((card) => `${card.x}:${card.y}`)).size).toBe(
      DIAMOND_STUDIO_CARDS.length,
    )
    expect(Object.values(DIAMOND_STUDIO_PALETTE)).not.toContain('#000000')
  })
})
