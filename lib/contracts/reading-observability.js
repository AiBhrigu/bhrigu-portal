export function enrichWithObservability(payload, traceId) {
  return {
    ...payload,
    reading_version: "reading-v2",
    trace_id: traceId
  }
}
