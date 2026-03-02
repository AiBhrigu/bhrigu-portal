import { useMemo } from "react"

export default function Reading({ engineData }) {
  const baseState = engineData

  const fieldTension = useMemo(() => {
    return (baseState.analysis.volatility_index - baseState.structural_stability)
  }, [baseState])

  const resilience = useMemo(() => {
    return baseState.analysis.coherence_score * baseState.resonance_level
  }, [baseState])

  return (
    <main>
      <h1>{baseState.engine}</h1>
      <pre>{JSON.stringify(baseState, null, 2)}</pre>
      <div>Field Tension: {fieldTension.toFixed(4)}</div>
      <div>Resilience: {resilience.toFixed(4)}</div>
    </main>
  )
}

export async function getServerSideProps() {
  const res = await fetch("http://127.0.0.1:8811/run-temporal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      engine: "frey-temporal-core-v0.1",
      date: new Date().toISOString().slice(0, 10)
    })
  })

  const data = await res.json()

  return {
    props: {
      engineData: data
    }
  }
}
