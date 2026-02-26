import { useEffect, useState } from "react"
import BhriguPhiHeader from "../components/BhriguPhiHeader"
import { deriveReading } from "../lib/reading-derive"

export default function Reading() {
  const [core, setCore] = useState(null)
  const [derived, setDerived] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const date = params.get("date") || ""
    fetch(`/api/frey-temporal${date ? `?date=${date}` : ""}`)
      .then(res => res.json())
      .then(json => {
        setCore(json)
        setDerived(deriveReading(json))
        setLoading(false)
      })
      .catch(() => {
        setError("API error")
        setLoading(false)
      })
  }, [])

  return (
    <>
      <BhriguPhiHeader />
      <main style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
        <h1>Reading</h1>

        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}

        {core && derived && (
          <>
            <section>
              <h2>Core Metrics</h2>
              <pre>{JSON.stringify(core, null, 2)}</pre>
            </section>

            <section style={{ marginTop: "32px" }}>
              <h2>Derived State</h2>
              <pre>{JSON.stringify(derived, null, 2)}</pre>
            </section>

            <section style={{ marginTop: "32px" }}>
              <button disabled>Export (coming soon)</button>
            </section>
          </>
        )}
      </main>
    </>
  )
}
