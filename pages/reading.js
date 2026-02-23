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

  const summary = readiness > 0.75
    ? "Structure is strong. Expansion window is open."
    : readiness > 0.6
    ? "Structure is stable. Growth is possible. Risk discipline defines expansion speed."
    : "Execution strength is emerging. Focus on internal reinforcement."

  return (
    <main style={{ padding: "80px 24px", maxWidth: "1000px", margin: "0 auto" }}>

      <h1>FREY · Project State Model</h1>

      <p style={{ opacity: 0.5, fontSize: "14px", marginTop: "8px" }}>
        Demo Interface · Strategic System Simulation
      </p>

      <h2 style={{ marginTop: "28px" }}>
        You are in: {baseState.title}
      </h2>

      <p style={{ marginTop: "16px", maxWidth: "680px", opacity: 0.85 }}>
        {summary}
      </p>

      <section style={{ marginTop: "48px" }}>
        <h3>What this phase enables</h3>
        <ul>
          <li>Fundraising readiness window</li>
          <li>Strategic partnership alignment</li>
          <li>Controlled product expansion</li>
        </ul>
      </section>

      <section style={{ marginTop: "40px" }}>
        <h3>To move forward</h3>
        <ul>
          <li>Increase execution readiness</li>
          <li>Reduce structural risk</li>
          <li>Extend capital horizon</li>
        </ul>
      </section>

      <section style={{ marginTop: "60px" }}>
        <h3>Key Indicators</h3>
        <pre>
{`Execution Readiness   ${readiness.toFixed(2)}
Risk Weight            ${baseState.risk.toFixed(2)}
Horizon (months)       ${baseState.horizon}
Field Tension          ${fieldTension.toFixed(2)}
System Resilience      ${resilience.toFixed(2)}`}
        </pre>
      </section>

      <section style={{ marginTop: "40px" }}>
        <label style={{ display: "block", marginBottom: "12px" }}>
          Adjust Execution Readiness
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
      </section>

      <section style={{ marginTop: "80px", paddingTop: "40px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <h3>Powered by Frey Architecture</h3>
        <p style={{ maxWidth: "720px", opacity: 0.75 }}>
          This model is part of a broader strategic system used for capital structuring,
          ecosystem design, AI-native venture architecture and frontier-scale projects.
        </p>
      </section>

    </main>
  )
}
