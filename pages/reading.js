import { deriveReading } from "../lib/reading-derive"
import { interpretReading } from "../lib/reading-interpretation"
import { enrichWithObservability } from "../lib/contracts/reading-observability"

function generateTraceId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).substring(2, 6)
  )
}

export async function getServerSideProps(context) {
  const traceId = generateTraceId()
  const { date } = context.query

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.bhrigu.io"}/api/frey-temporal?date=${date || ""}&trace=${traceId}`
  )

  const raw = await res.json()
  const derived = deriveReading(raw)
  const interpreted = interpretReading(derived)
  const enriched = enrichWithObservability(interpreted, traceId)

  return {
    props: {
      reading: enriched
    }
  }
}

export default function ReadingPage({ reading }) {
  if (!reading || reading.status !== "ok") {
    return (
      <div style={{ padding: 40 }}>
        <h2>Reading unavailable</h2>
      </div>
    )
  }

  const isDev = process.env.NODE_ENV !== "production"

  return (
    <div style={{ padding: 40 }}>
      <h1>Reading v2</h1>
      <p>Status: {reading.status}</p>
      <p>Summary: {reading.summary}</p>
      <p>Metrics Count: {reading.metricsCount}</p>

      {isDev && (
        <div style={{ marginTop: 20, opacity: 0.6 }}>
          <p>Engine: {reading.engine}</p>
          <p>Reading Version: {reading.reading_version}</p>
          <p>Trace ID: {reading.trace_id}</p>
        </div>
      )}
    </div>
  )
}
