import { useEffect, useState } from "react"
import BhriguPhiHeader from "../components/BhriguPhiHeader"

const VECTOR_TEXT = {
  expansion: "Expansion phase. Structural growth window.",
  contraction: "Contraction phase. Consolidation window."
}

export default function Reading() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const date = params.get("date") || ""
    fetch(`/api/frey-temporal${date ? `?date=${date}` : ""}`)
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
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

        {data && (
          <>
            <section>
              <h2>Structural Metrics</h2>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </section>

            <section style={{ marginTop: "32px" }}>
              <h2>Interpretation</h2>
              <p>{VECTOR_TEXT[data.vector] || "No interpretation available."}</p>
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
