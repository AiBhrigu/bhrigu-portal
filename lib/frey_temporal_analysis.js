export function freyTemporalAnalysis(core) {
  const P = core.phase_density
  const H = core.harmonic_tension
  const R = core.resonance_level
  const E = core.eclipse_proximity
  const S = core.structural_stability

  const clamp01 = (x) => Math.max(0, Math.min(1, x))
  const clampSigned = (x) => Math.max(-1, Math.min(1, x))

  const volatility_index = clamp01(
    0.4 * H +
    0.35 * E +
    0.25 * (1 - S)
  )

  const coherence_score = clamp01(
    0.4 * P +
    0.35 * R +
    0.25 * S
  )

  const phase_bias = clampSigned(
    (P - E) * 0.6 +
    (R - H) * 0.4
  )

  return {
    volatility_index: Number(volatility_index.toFixed(4)),
    coherence_score: Number(coherence_score.toFixed(4)),
    phase_bias: Number(phase_bias.toFixed(4))
  }
}
