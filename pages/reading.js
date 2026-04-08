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

  if (!temporal || !temporal.date) {
    return (
      <main style={{maxWidth:720,margin:"80px auto",fontFamily:"system-ui"}}>
        <h1>Frey Temporal Reading</h1>
        <p>Temporal engine unavailable.</p>
      </main>
    )
  }

  return (
    <main style={{maxWidth:720,margin:"80px auto",fontFamily:"system-ui"}}>

      <h1>Frey Temporal Reading</h1>

      <p>Date: {temporal.date}</p>

      <h3>Structural State</h3>
      <p>Stability: {temporal.structural_stability}</p>

      <h3>Tension Field</h3>
      <p>Tension: {temporal.harmonic_tension}</p>

      <h3>Resonance Field</h3>
      <p>Resonance: {temporal.resonance_level}</p>

    </main>
  )
}
