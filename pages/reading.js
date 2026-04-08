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

  let structural = "Balanced."
  if (s === "HIGH" && c === "HIGH") structural = "Stable. Coherent."
  else if (s === "HIGH" && c === "MID") structural = "Stable. Moderately coherent."
  else if (s === "HIGH" && c === "LOW") structural = "Stable. Internally mixed."
  else if (s === "MID" && c === "HIGH") structural = "Forming. Coherent."
  else if (s === "MID" && c === "LOW") structural = "Weak structure. Low coherence."
  else if (s === "LOW" && c === "HIGH") structural = "Fragile. Coherent."
  else if (s === "LOW" && c === "MID") structural = "Unstable. Partial coherence."
  else if (s === "LOW" && c === "LOW") structural = "Unstable. Low coherence."

  let tension = "Moderate tension. Balanced field."
  if (t === "HIGH" && v === "HIGH") tension = "High pressure. Unstable field."
  else if (t === "HIGH" && v === "MID") tension = "High tension. Controlled instability."
  else if (t === "HIGH" && v === "LOW") tension = "High tension. Localized stress."
  else if (t === "MID" && v === "HIGH") tension = "Moderate tension. Wide instability."
  else if (t === "MID" && v === "LOW") tension = "Moderate tension. Stable containment."
  else if (t === "LOW" && v === "HIGH") tension = "Low tension. Chaotic dispersion."
  else if (t === "LOW" && v === "MID") tension = "Low tension. Mild instability."
  else if (t === "LOW" && v === "LOW") tension = "Low tension. Stable field."

  let resonance = "Moderate resonance. Balanced field."
  if (r === "HIGH" && d === "HIGH") resonance = "Aligned. Dense structure."
  else if (r === "HIGH" && d === "MID") resonance = "Aligned. Moderate support."
  else if (r === "HIGH" && d === "LOW") resonance = "Aligned. Thin support."
  else if (r === "MID" && d === "HIGH") resonance = "Moderate alignment. Dense structure."
  else if (r === "MID" && d === "LOW") resonance = "Moderate alignment. Thin support."
  else if (r === "LOW" && d === "HIGH") resonance = "Misaligned. Dense structure."
  else if (r === "LOW" && d === "MID") resonance = "Weak alignment. Moderate structure."
  else if (r === "LOW" && d === "LOW") resonance = "Weak alignment. Low support."

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
      <main style={styles.main}>
        <h1 style={styles.title}>Frey Temporal Reading</h1>
        <p style={styles.value}>Temporal engine unavailable.</p>
      </main>
    )
  }

  const cosmo = mapCosmographer(temporal)

  return (
    <main style={styles.main} data-reading-tone="FREY_READING_SURFACE_TONE_BRIDGE_V0_4">
      <h1 style={styles.title}>Frey Temporal Reading</h1>

      <div style={styles.cluster}>
        <div style={styles.kicker}>Date anchor</div>
        <div style={styles.value}>{temporal.date}</div>
      </div>

      <div style={styles.cluster}>
        <div style={styles.section}>Structural State</div>
        <div style={styles.value}>Stability: {temporal.structural_stability}</div>
      </div>

      <div style={styles.cluster}>
        <div style={styles.section}>Tension Field</div>
        <div style={styles.value}>Tension: {temporal.harmonic_tension}</div>
      </div>

      <div style={styles.cluster}>
        <div style={styles.section}>Resonance Field</div>
        <div style={styles.value}>Resonance: {temporal.resonance_level}</div>
      </div>

      <div style={styles.bridge}>
        <div style={styles.bridgeLine} />
        <button
          type="button"
          onClick={() => setCosmoActive(v => !v)}
          style={styles.trigger}
        >
          Unfold interpretation
        </button>
      </div>

      {cosmoActive && (
        <section style={styles.unfold}>
          <div style={styles.block}>
            <div style={styles.label}>Structural State</div>
            <div style={styles.readout}>{cosmo.structural}</div>
          </div>

          <div style={styles.block}>
            <div style={styles.label}>Tension Field</div>
            <div style={styles.readout}>{cosmo.tension}</div>
          </div>

          <div style={styles.block}>
            <div style={styles.label}>Resonance Field</div>
            <div style={styles.readout}>{cosmo.resonance}</div>
          </div>

          <div style={styles.vectorWrap}>
            <div style={styles.vectorLabel}>Direction Vector</div>
            <div style={styles.vector}>→ {cosmo.direction}</div>
          </div>
        </section>
      )}
    </main>
  )
}

const styles = {
  main: {
    maxWidth: 760,
    margin: "92px auto",
    padding: "0 20px 120px",
    fontFamily: "system-ui",
  },
  title: {
    fontSize: 58,
    lineHeight: 1.02,
    letterSpacing: "-0.03em",
    margin: "0 0 34px",
    fontWeight: 650,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    opacity: 0.56,
    marginBottom: 8,
  },
  cluster: {
    marginTop: 26,
  },
  section: {
    fontSize: 14,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.72,
    marginBottom: 10,
  },
  value: {
    fontSize: 18,
    lineHeight: 1.45,
  },
  bridge: {
    marginTop: 36,
  },
  bridgeLine: {
    width: "100%",
    height: 1,
    background: "rgba(255,255,255,0.08)",
    marginBottom: 28,
  },
  trigger: {
    display: "block",
    margin: "0 auto",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "inherit",
    padding: "12px 18px",
    borderRadius: 999,
    cursor: "pointer",
    opacity: 0.82,
    fontSize: 14,
  },
  unfold: {
    marginTop: 34,
  },
  block: {
    marginTop: 28,
  },
  label: {
    fontSize: 13,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    opacity: 0.56,
    marginBottom: 10,
  },
  readout: {
    fontSize: 22,
    lineHeight: 1.35,
    fontWeight: 520,
  },
  vectorWrap: {
    marginTop: 38,
    paddingTop: 26,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  vectorLabel: {
    fontSize: 13,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    opacity: 0.56,
    marginBottom: 12,
  },
  vector: {
    fontSize: 42,
    lineHeight: 1.08,
    fontWeight: 650,
    letterSpacing: "-0.03em",
  },
}
