const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value)

const camera = freeze({
  position: freeze([0, 1.15, 5.4] as [number, number, number]),
  target: freeze([0, 0, 0] as [number, number, number]),
  fov: 32,
  near: 0.1,
  far: 100,
  exposure: 0.9,
})

const diamond = freeze({
  rotation: freeze([0, 0.28, 0] as [number, number, number]),
  scale: 1.25,
})

export const DIAMOND_CALIBRATION = freeze({
  camera,
  diamond,
  optics: freeze({ ior: 2.417, attenuationColor: '#ffffff', attenuationDistance: 100 }),
  background: '#050506',
  capture: freeze({
    width: 960,
    height: 960,
    rotations: freeze([0, Math.PI / 8, Math.PI / 4]),
  }),
  environment: freeze({
    size: 512,
    palette: freeze({
      highlight: '#ffffff', warmHighlight: '#f7f2e8', fill: '#969ca3', shadowFill: '#59616a', flag: '#20262d',
    }),
    cards: freeze([
      freeze({ face: 0, role: 'highlight', x: 26, y: 58, width: 142, height: 396, color: '#ffffff' }),
      freeze({ face: 2, role: 'highlight', x: 156, y: 26, width: 228, height: 116, color: '#f7f2e8' }),
      freeze({ face: 4, role: 'highlight', x: 334, y: 72, width: 126, height: 366, color: '#ffffff' }),
      freeze({ face: 1, role: 'flag', x: 218, y: 44, width: 54, height: 352, color: '#20262d' }),
      freeze({ face: 3, role: 'flag', x: 78, y: 214, width: 286, height: 46, color: '#20262d' }),
      freeze({ face: 5, role: 'flag', x: 382, y: 106, width: 42, height: 292, color: '#20262d' }),
    ]),
  }),
})

export function serializeDiamondCalibration() {
  return JSON.stringify(DIAMOND_CALIBRATION)
}
