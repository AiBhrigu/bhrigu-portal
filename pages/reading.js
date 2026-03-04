import { useState } from "react"

export async function getServerSideProps({ query }) {

  const date = query.date || "2025-01-26"

  const res = await fetch(`http://localhost:3000/api/frey-temporal?date=${date}`)
  const data = await res.json()

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
