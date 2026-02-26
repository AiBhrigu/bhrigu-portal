export function deriveReading(input) {
  if (!input) return {}

  const derived = input.derived || {}

  const count = Object.keys(derived).length

  const meta_metrics = {
    volatility_band: count > 5 ? "high" : "stable",
    coherence_state: count % 2 === 0 ? "balanced" : "dynamic",
    stress_direction: count > 3 ? "expansion" : "consolidation"
  }

  return {
    ...input,
    meta_metrics
  }
}
