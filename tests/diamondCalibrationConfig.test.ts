import { describe, expect, test } from 'vitest'
import { DIAMOND_CALIBRATION, serializeDiamondCalibration } from '../src/engine/calibration'

describe('diamond calibration specification', () => {
  test('locks shared geometry-independent camera, optics, transform and captures', () => {
    expect(DIAMOND_CALIBRATION.optics.ior).toBe(2.417)
    expect(DIAMOND_CALIBRATION.camera).toEqual({
      position: [0, 1.15, 5.4], target: [0, 0, 0], fov: 32, near: 0.1, far: 100, exposure: 0.9,
    })
    expect(DIAMOND_CALIBRATION.diamond).toEqual({ rotation: [0, 0.28, 0], scale: 1.25 })
    expect(DIAMOND_CALIBRATION.background).toBe('#050506')
    expect(DIAMOND_CALIBRATION.capture.rotations).toHaveLength(3)
    expect(serializeDiamondCalibration()).toBe(serializeDiamondCalibration())
    expect(Object.isFrozen(DIAMOND_CALIBRATION)).toBe(true)
  })
})
