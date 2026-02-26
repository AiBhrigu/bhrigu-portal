export function deriveReading(core) {
  if (!core) return null

  const volatility = core.analysis?.volatility_index ?? 0
  const stability = core.structural_stability ?? 0
  const phaseBias = core.analysis?.phase_bias ?? 0

  return {
    volatility_band:
      volatility > 0.7 ? "HIGH" :
      volatility > 0.4 ? "MEDIUM" : "LOW",

    stability_flag:
      stability < 0.3 ? "FRAGILE" : "STABLE",

    phase_state:
      phaseBias > 0.5 ? "EXPANSION" : "CONSOLIDATION"
  }
}
