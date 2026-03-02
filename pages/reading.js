import { useMemo } from "react"

export default function Reading({ engineData }) {
  const baseState = engineData || null

  const fieldTension = useMemo(() => {
    if (!baseState) return 0
    return (baseState.analysis.volatility_index - baseState.structural_stability)
  }, [baseState])

  const resilience = useMemo(() => {
    if (!baseState) return 0
    return baseState.analysis.coherence_score * baseState.resonance_level
  }, [baseState])

  return (
    <main>
      <h1>{baseState ? baseState.engine : "Engine unavailable"}</h1>
      {baseState && <pre>{JSON.stringify(baseState, null, 2)}</pre>}
      <div>Field Tension: {fieldTension.toFixed(4)}</div>
      <div>Resilience: {resilience.toFixed(4)}</div>
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
      return { props: { engineData: null } }
    }

    const data = await res.json()
    return { props: { engineData: data } }

  } catch (e) {
    return { props: { engineData: null } }
  }
}
