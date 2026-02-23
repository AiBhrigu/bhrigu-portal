import { useState, useMemo } from "react"

const baseState = {
  id: "03",
  title: "Capital Alignment",
  scale: 180,
  risk: 0.71,
  horizon: 12
}

export default function Reading() {
  const [readiness, setReadiness] = useState(0.62)

  const fieldTension = useMemo(() => {
    return (baseState.risk - readiness) * (baseState.scale / 200) * (baseState.horizon / 12)
  }, [readiness])

  const resilience = useMemo(() => {
    return readiness * (1 - baseState.risk) * (baseState.scale / 200)
  }, [readiness])

  const maxScale = 450
  const maxTension = 0.5

  const x = 40 + (baseState.scale / maxScale) * 520
  const y = 240 - ((fieldTension + maxTension) / (maxTension * 2)) * 220

  return (
    <main style={{ padding: "80px 24px", maxWidth: "1100px", margin: "0 auto" }}>

      <h1>FREY · PROJECT STATE MODEL</h1>

      <div style={{ marginTop: "40px", marginBottom: "40px" }}>
        <label style={{ display: "block", marginBottom: "12px" }}>
          EXECUTION_READINESS: {readiness.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.2"
          max="1"
          step="0.01"
          value={readiness}
          onChange={(e) => setReadiness(parseFloat(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      <svg width="100%" height="280" viewBox="0 0 600 280">
        <line x1="40" y1="20" x2="40" y2="240" stroke="#333" />
        <line x1="40" y1="240" x2="580" y2="240" stroke="#333" />

        <circle cx={x} cy={y} r="6" fill="#c6a85b" />
      </svg>

      <pre style={{ marginTop: "40px" }}>
{`FIELD_TENSION       ${fieldTension.toFixed(2)}
SYSTEM_RESILIENCE    ${resilience.toFixed(2)}`}
      </pre>

    </main>
  )
}
