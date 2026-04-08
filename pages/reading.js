import { useState } from "react"

function band(v) {
  if (v <= 0.33) return "LOW"
  if (v <= 0.66) return "MID"
  return "HIGH"
}

function mapCosmographer(temporal) {
  const s = band(Number(temporal?.structural_stability ?? 0))
  const c = band(Number(temporal?.analysis?.coherence_score ?? 0))
  const t = band(Number(temporal?.harmonic_tension ?? 0))
  const v = band(Number(temporal?.analysis?.volatility_index ?? 0))
  const r = band(Number(temporal?.resonance_level ?? 0))
  const d = band(Number(temporal?.phase_density ?? 0))

  let structural = "Balanced. Stable enough."
  if (s === "HIGH" && c === "HIGH") structural = "Stable. Coherent."
  else if (s === "HIGH" && c === "MID") structural = "Stable. Moderate coherence."
  else if (s === "HIGH" && c === "LOW") structural = "Stable. Internally mixed."
  else if (s === "MID" && c === "HIGH") structural = "Forming. Coherent."
  else if (s === "MID" && c === "LOW") structural = "Weak structure. Low coherence."
  else if (s === "LOW" && c === "HIGH") structural = "Fragile base. Coherent."
  else if (s === "LOW" && c === "MID") structural = "Unstable. Partial coherence."
  else if (s === "LOW" && c === "LOW") structural = "Unstable. Incoherent."

  let tension = "Moderate tension. Balanced field."
  if (t === "HIGH" && v === "HIGH") tension = "High pressure. Unstable field."
  else if (t === "HIGH" && v === "MID") tension = "High tension. Controlled spread."
  else if (t === "HIGH" && v === "LOW") tension = "High tension. Local stress."
  else if (t === "MID" && v === "HIGH") tension = "Moderate tension. Wide spread."
  else if (t === "MID" && v === "LOW") tension = "Moderate tension. Contained."
  else if (t === "LOW" && v === "HIGH") tension = "Low tension. Diffuse instability."
  else if (t === "LOW" && v === "MID") tension = "Low tension. Mild instability."
  else if (t === "LOW" && v === "LOW") tension = "Low tension. Stable field."

  let resonance = "Moderate alignment."
  if (r === "HIGH" && d === "HIGH") resonance = "Strong alignment. Dense support."
  else if (r === "HIGH" && d === "MID") resonance = "Strong resonance. Moderate support."
  else if (r === "HIGH" && d === "LOW") resonance = "Strong resonance. Thin support."
  else if (r === "MID" && d === "HIGH") resonance = "Aligned. Dense structure."
  else if (r === "MID" && d === "LOW") resonance = "Moderate resonance. Weak support."
  else if (r === "LOW" && d === "HIGH") resonance = "Low resonance. Dense but misaligned."
  else if (r === "LOW" && d === "MID") resonance = "Weak alignment. Moderate structure."
  else if (r === "LOW" && d === "LOW") resonance = "Weak resonance. Low support."

  let direction = "Move"
  if (s === "LOW") direction = "Stabilize"
  else if (t === "HIGH" && r === "LOW") direction = "Hold"
  else if (r === "HIGH" && s === "HIGH") direction = "Expand"

  return { structural, tension, resonance, direction }
}

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

  return { props: { temporal: data } }
}

export default function Reading({ temporal }) {
  const [cosmoActive, setCosmoActive] = useState(false)

  if (!temporal || !temporal.date) {
    return (
      <main style={{ maxWidth: 720, margin: "80px auto", fontFamily: "system-ui" }}>
        <h1>Frey Temporal Reading</h1>
        <p>Temporal engine unavailable.</p>
      </main>
    )
  }

  const cosmo = mapCosmographer(temporal)

  return (
    <main style={{ maxWidth: 720, margin: "80px auto", fontFamily: "system-ui" }}>
      <h1>Frey Temporal Reading</h1>

      <p>Date: {temporal.date}</p>

      <h3>Structural State</h3>
      <p>Stability: {temporal.structural_stability}</p>

      <h3>Tension Field</h3>
      <p>Tension: {temporal.harmonic_tension}</p>

      <h3>Resonance Field</h3>
      <p>Resonance: {temporal.resonance_level}</p>

      <div style={{ marginTop: 28, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => setCosmoActive(v => !v)}
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
            color: "inherit",
            padding: "9px 14px",
            borderRadius: 999,
            cursor: "pointer",
            opacity: 0.72,
            letterSpacing: "0.04em"
          }}
        >
          Unfold interpretation
        </button>
      </div>

      {cosmoActive && (
        <section style={{ marginTop: 26 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.56 }}>
            Structural State
          </div>
          <p style={{ marginTop: 10, fontSize: 18, lineHeight: 1.5 }}>{cosmo.structural}</p>

          <div style={{ marginTop: 22, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.56 }}>
            Tension Field
          </div>
          <p style={{ marginTop: 10, fontSize: 18, lineHeight: 1.5 }}>{cosmo.tension}</p>

          <div style={{ marginTop: 22, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.56 }}>
            Resonance Field
          </div>
          <p style={{ marginTop: 10, fontSize: 18, lineHeight: 1.5 }}>{cosmo.resonance}</p>

          <div style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.56 }}>
              Direction Vector
            </div>
            <p style={{ marginTop: 12, fontSize: 30, lineHeight: 1.15, fontWeight: 600 }}>→ {cosmo.direction}</p>
          </div>
        </section>
      )}
    </main>
  )
}
