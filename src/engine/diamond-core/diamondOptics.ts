// AMES Diamond Core v0.2 — physical constants for diamond-specific transport.
// RGB wavelengths approximate Fraunhofer red / green / blue samples.

export const DIAMOND_OPTICS = {
  // Reference refractive index near the sodium D line.
  ior: 2.417,
  // Diamond dispersion (Abbe number). Lower means stronger spectral separation.
  abbeNumber: 55.3,
  wavelengthsNm: {
    red: 656.3,
    green: 587.6,
    blue: 486.1,
  },
  // Representative visible-spectrum indices derived from diamond dispersion data.
  spectralIor: {
    red: 2.407,
    green: 2.417,
    blue: 2.451,
  },
  maxInternalBounces: 16,
} as const

export function criticalAngleDegrees(ior = DIAMOND_OPTICS.ior) {
  return Math.asin(1 / ior) * 180 / Math.PI
}

export function schlickF0(ior = DIAMOND_OPTICS.ior) {
  const r = (ior - 1) / (ior + 1)
  return r * r
}
