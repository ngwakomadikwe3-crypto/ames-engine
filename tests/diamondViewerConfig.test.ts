import { describe, expect, test } from 'vitest'
import {
  DIAMOND_TONE_MAPPING_EXPOSURE,
  DIAMOND_VIEWER_CAMERA,
} from '../src/engine/renderer/JewelryViewer'

describe('diamond macro viewer configuration', () => {
  test('uses highlight-preserving exposure and product camera framing', () => {
    expect(DIAMOND_TONE_MAPPING_EXPOSURE).toBe(0.78)
    expect(DIAMOND_VIEWER_CAMERA).toEqual({
      position: [0, 1.15, 5.4],
      fov: 32,
      near: 0.1,
      far: 100,
    })
  })
})
