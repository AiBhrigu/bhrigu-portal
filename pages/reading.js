import { useState } from "react"

export async function getServerSideProps({ query }) {

  const rawDate = Array.isArray(query?.d)
    ? query.d[0]
    : (query?.d ?? (Array.isArray(query?.date) ? query.date[0] : query?.date))
  const date = typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : new Date().toISOString().slice(0, 10)

  const { default: handler } = await import("./api/frey-temporal")

  const reqMock = { query: { date } }

  let data = {}

  const resMock = {
    status() { return this },
    json(obj) { data = obj }
  }

  await handler(reqMock, resMock)

  return {
    props: {
      temporal: data
    }
  }
}

export default function Reading({ temporal }) {

  const [readiness, setReadiness] = useState(0.62)

  const fieldTension =
    (temporal.harmonic_tension - readiness) *
    temporal.phase_density *
    temporal.structural_stability

  return (
    <main style={{maxWidth:720,margin:"80px auto",fontFamily:"system-ui"}}>

      <h1>Frey Temporal Reading</h1>

      <p>Date: {temporal.date}</p>

      <h3>Core Metrics</h3>

      <pre>
{JSON.stringify(temporal, null, 2)}
      </pre>

      <h3>Derived Signal</h3>

      <p>Field tension: {fieldTension.toFixed(4)}</p>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={readiness}
        onChange={(e)=>setReadiness(parseFloat(e.target.value))}
      />

    </main>
  )
}
