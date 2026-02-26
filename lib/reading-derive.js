export function deriveReading(input) {
  if (!input) return {}

  const derived = input.derived || {}
  const count = Object.keys(derived).length

  const meta_metrics = {
    volatility_band: count > 5 ? "high" : "stable",
    coherence_state: count % 2 === 0 ? "balanced" : "dynamic",
    stress_direction: count > 3 ? "expansion" : "consolidation"
  }

  const structural_pressure_index =
    meta_metrics.volatility_band === "high" ? 0.8 : 0.3

  const dynamic_balance_ratio =
    meta_metrics.coherence_state === "balanced" ? 0.6 : 0.9

  const stability_class =
    structural_pressure_index < 0.5 &&
    meta_metrics.stress_direction === "consolidation"
      ? "stable"
      : "adaptive"

  const system_state = {
    structural_pressure_index,
    dynamic_balance_ratio,
    stability_class
  }

  return {
    ...input,
    meta_metrics,
    system_state
  }
}
