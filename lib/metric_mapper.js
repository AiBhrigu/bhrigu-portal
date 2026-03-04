function clamp(v) {
  if (v < 0) return 0
  if (v > 1) return 1
  return v
}

function fix(v) {
  return Number(v.toFixed(4))
}

export function mapEphemerisToMetrics(ephemeris) {

  const phase_density =
    clamp(Math.abs(Math.sin(ephemeris.sun_longitude * 0.017)))

  const harmonic_tension =
    clamp(Math.abs(Math.cos(ephemeris.moon_longitude * 0.017)))

  const resonance_level =
    clamp(ephemeris.planetary_density)

  const eclipse_proximity =
    clamp(ephemeris.eclipse_distance)

  const structural_stability =
    clamp(1 - harmonic_tension * 0.6)

  return {
    phase_density: fix(phase_density),
    harmonic_tension: fix(harmonic_tension),
    resonance_level: fix(resonance_level),
    eclipse_proximity: fix(eclipse_proximity),
    structural_stability: fix(structural_stability)
  }

}
