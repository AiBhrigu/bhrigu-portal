import { interpretReading } from "../reading-interpretation"
import { deriveReading } from "../reading-derive"
import { enrichWithObservability } from "./reading-observability"

export function composeReadingV2(raw, traceId) {
  const interpreted = interpretReading(raw)
  const derived = deriveReading(interpreted)
  const enriched = enrichWithObservability(derived, traceId)

  const metricsCount = Object.keys(raw || {}).length

  return {
    status: "ok",
    summary: `Temporal density ${raw?.phase_density ?? "n/a"}`,
    metricsCount,
    trace_id: traceId,
    engine: raw?.engine || "unknown",
    reading_version: "v2",
    ...enriched
  }
}

