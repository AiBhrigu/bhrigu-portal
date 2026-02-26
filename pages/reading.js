import { composeReadingV2 } from "../lib/contracts/reading-compose-v2"

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
  const composed = composeReadingV2(raw, traceId)

  return {
    props: {
      reading: composed
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

  return (
    <div style={{ padding: 40 }} data-reading-surface="READING_V2_SURFACE_V0_1">
      <h1>Reading v2</h1>

      <p>Status: {reading.status}</p>
      <p>Summary: {reading.summary}</p>
      <p>Metrics Count: {reading.metricsCount}</p>

      <hr />

      <h3>Core Metrics</h3>
      <p>Phase Density: {reading.phase_density}</p>
      <p>Harmonic Tension: {reading.harmonic_tension}</p>
      <p>Resonance Level: {reading.resonance_level}</p>
      <p>Structural Stability: {reading.structural_stability}</p>
      <p>Volatility Index: {reading.analysis?.volatility_index}</p>
      <p>Coherence Score: {reading.analysis?.coherence_score}</p>
      <p>Phase Bias: {reading.analysis?.phase_bias}</p>

      <div style={{ marginTop: 20, opacity: 0.6 }}>
        <p>Engine: {reading.engine}</p>
        <p>Reading Version: {reading.reading_version}</p>
        <p>Trace ID: {reading.trace_id}</p>
      </div>
    </div>
  )
}
