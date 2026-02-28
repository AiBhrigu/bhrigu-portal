export default function Reading({ data, date }) {
  return (
    <main style={{ padding: "60px 20px", maxWidth: 720, margin: "0 auto" }}>
      <h1>Reading v2 Canonical</h1>
      <p><strong>Snapshot Anchor:</strong> {date}</p>

      <h3>Field Metrics</h3>
      <ul>
        <li>Phase Density: {data.phase_density}</li>
        <li>Harmonic Tension: {data.harmonic_tension}</li>
        <li>Resonance Level: {data.resonance_level}</li>
        <li>Eclipse Proximity: {data.eclipse_proximity}</li>
        <li>Structural Stability: {data.structural_stability}</li>
      </ul>

      <h3>Analytical Layer</h3>
      <ul>
        <li>Volatility Index: {data.analysis.volatility_index}</li>
        <li>Coherence Score: {data.analysis.coherence_score}</li>
        <li>Phase Bias: {data.analysis.phase_bias}</li>
      </ul>
    </main>
  )
}

export async function getServerSideProps(context) {
  const date =
    context.query.date || new Date().toISOString().slice(0, 10)

  const protocol =
    context.req.headers["x-forwarded-proto"] || "https"

  const host = context.req.headers.host
  const baseUrl = `${protocol}://${host}`

  const res = await fetch(
    `${baseUrl}/api/frey-temporal?date=${date}`
  )

  if (!res.ok) {
    return { notFound: true }
  }

  const json = await res.json()

  return {
    props: {
      data: json,
      date
    }
  }
}
