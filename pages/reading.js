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

  let structural = "Balanced. Forming."
  if (s === "HIGH" && c === "HIGH") structural = "Stable. Coherent."
  else if (s === "HIGH" && c === "MID") structural = "Stable. Centered."
  else if (s === "LOW") structural = "Unstable. Fragile."

  let tension = "Moderate tension. Balanced field."
  if (t === "HIGH" && v === "HIGH") tension = "High tension. Unstable field."
  else if (t === "HIGH") tension = "High tension. Contained field."
  else if (t === "LOW" && v === "LOW") tension = "Low tension. Quiet field."

  let resonance = "Moderate alignment. Dense structure."
  if (r === "HIGH" && d === "HIGH") resonance = "Aligned. Dense structure."
  else if (r === "HIGH") resonance = "Aligned. Thin support."
  else if (r === "LOW") resonance = "Weak alignment. Sparse support."

  let direction = "Move"
  if (s === "LOW") direction = "Stabilize"
  else if (t === "HIGH" && r === "LOW") direction = "Hold"
  else if (r === "HIGH" && s === "HIGH") direction = "Expand"

  return { structural, tension, resonance, direction }
}

function fmt(v, digits = 4) {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(digits) : "—"
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
      <main style={{ maxWidth: 820, margin: "80px auto", padding: "0 24px 84px", fontFamily: "system-ui" }}>
        <h1>Frey Temporal Reading</h1>
        <p>Temporal engine unavailable.</p>
      </main>
    )
  }

  const cosmo = mapCosmographer(temporal)

  const shell = {
    maxWidth: 820,
    margin: "80px auto",
    padding: "0 24px 84px",
    fontFamily: "system-ui"
  }

  const label = {
    fontSize: 14,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.66,
    margin: 0
  }

  const metricValue = {
    fontSize: 20,
    lineHeight: 1.35,
    marginTop: 10,
    marginBottom: 0,
    opacity: 0.92,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em"
  }

  const unfoldWrap = {
    marginTop: 40,
    paddingTop: 32,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  }

  const gate = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 168,
    padding: "9px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    opacity: 0.74,
    fontSize: 15,
    letterSpacing: "0.01em"
  }

  return (
    <main data-reading-surface="READING_SURFACE_MICRO_POLISH_V0_2" style={shell}>
      <h1 style={{ fontSize: 80, lineHeight: 0.96, margin: 0, fontWeight: 700, letterSpacing: "-0.04em" }}>
        Frey Temporal Reading
      </h1>

      <section style={{ marginTop: 42 }}>
        <p style={label}>Date Anchor</p>
        <p style={{ ...metricValue, fontSize: 22 }}>{temporal.date}</p>
      </section>

      <section style={{ marginTop: 38 }}>
        <p style={label}>Structural State</p>
        <p style={metricValue}>{fmt(temporal.structural_stability, 3)}</p>
      </section>

      <section style={{ marginTop: 34 }}>
        <p style={label}>Tension Field</p>
        <p style={metricValue}>{fmt(temporal.harmonic_tension, 4)}</p>
      </section>

      <section style={{ marginTop: 34 }}>
        <p style={label}>Resonance Field</p>
        <p style={metricValue}>{fmt(temporal.resonance_level, 4)}</p>
      </section>

      <section style={unfoldWrap}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button type="button" onClick={() => setCosmoActive(v => !v)} style={gate}>
            Unfold
          </button>
        </div>
      </section>

      {cosmoActive && (
        <section style={{ marginTop: 64, paddingTop: 10 }}>
          <div style={{ marginTop: 24 }}>
            <p style={label}>Structural State</p>
            <p style={{ fontSize: 24, lineHeight: 1.28, marginTop: 18, marginBottom: 0, fontWeight: 560 }}>
              {cosmo.structural}
            </p>
          </div>

          <div style={{ marginTop: 40 }}>
            <p style={label}>Tension Field</p>
            <p style={{ fontSize: 24, lineHeight: 1.28, marginTop: 18, marginBottom: 0, fontWeight: 560 }}>
              {cosmo.tension}
            </p>
          </div>

          <div style={{ marginTop: 40 }}>
            <p style={label}>Resonance Field</p>
            <p style={{ fontSize: 24, lineHeight: 1.28, marginTop: 18, marginBottom: 0, fontWeight: 560 }}>
              {cosmo.resonance}
            </p>
          </div>

          <div style={{ marginTop: 42, paddingTop: 34, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={label}>Direction Vector</p>
            <p style={{ fontSize: 64, lineHeight: 1, marginTop: 22, marginBottom: 0, fontWeight: 700, letterSpacing: "-0.04em" }}>
              → {cosmo.direction}
            </p>
          </div>
        </section>
      )}
    </main>
  )
}
