export function assertReadingShape(reading) {
  if (!reading || typeof reading !== "object") return false

  const required = [
    "status",
    "summary",
    "metricsCount",
    "meta_metrics",
    "trace_id"
  ]

  return required.every((k) => k in reading)
}
