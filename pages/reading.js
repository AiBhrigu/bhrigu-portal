import { useMemo } from "react"

export default function Reading({ engineData, engine_status }) {
  const isUnavailable = engine_status === "unavailable"

  const fieldTension = useMemo(() => {
    if (isUnavailable) return null
    return (engineData.analysis.volatility_index - engineData.structural_stability)
  }, [engineData, isUnavailable])

  const resilience = useMemo(() => {
    if (isUnavailable) return null
    return engineData.analysis.coherence_score * engineData.resonance_level
  }, [engineData, isUnavailable])

  return (
    <main>
      {isUnavailable ? (
        <div>Temporal engine temporarily unavailable.</div>
      ) : (
        <>
          <h1>{engineData.engine}</h1>
          <pre>{JSON.stringify(engineData, null, 2)}</pre>
          <div>Field Tension: {fieldTension?.toFixed(4)}</div>
          <div>Resilience: {resilience?.toFixed(4)}</div>
        </>
      )}
    </main>
  )
}

export async function getServerSideProps() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/run-temporal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engine: "frey-temporal-core-v0.1",
        date: new Date().toISOString().slice(0, 10)
      })
    })

    if (!res.ok) {
      return { props: { engineData: null, engine_status: "unavailable" } }
    }

    const data = await res.json()

    return {
      props: {
        engineData: data,
        engine_status: "live"
      }
    }

  } catch (e) {
    return { props: { engineData: null, engine_status: "unavailable" } }
  }
}
