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

function mapNavigator(temporal) {
  const s = band(Number(temporal?.structural_stability ?? 0))
  const c = band(Number(temporal?.analysis?.coherence_score ?? 0))
  const t = band(Number(temporal?.harmonic_tension ?? 0))
  const v = band(Number(temporal?.analysis?.volatility_index ?? 0))
  const r = band(Number(temporal?.resonance_level ?? 0))

  const lowSignal = t === "LOW" && v === "LOW" && c !== "LOW"
  let primaryBand = "ALIGNMENT"
  if (lowSignal) primaryBand = "LOW_SIGNAL"
  else if (s === "LOW") primaryBand = "STABILIZATION"
  else if (t === "HIGH" && r === "LOW") primaryBand = "CONTAINMENT"
  else if (t === "HIGH") primaryBand = "CONCENTRATION"
  else if (r === "HIGH" && s === "HIGH" && c === "HIGH") primaryBand = "OPENING"

  let modulation = "CLARITY"
  if (primaryBand === "LOW_SIGNAL") modulation = "SOFTENING"
  else if (s === "LOW") modulation = "FRAGILITY"
  else if (t === "HIGH" || v === "HIGH") modulation = "PRESSURE"

  const payload = {
    primaryBand,
    modulation,
    formula: "Align first, then move",
    origin: "This day continues a field that is still asking for better internal agreement.",
    gate: "Today's pivot is alignment before acceleration.",
    vector: "If the line is brought into order now, the near arc tends toward clearer direction and less inner resistance.",
    action: "Bring the main line into order.",
    boundary: "Do not move before alignment."
  }

  if (primaryBand === "LOW_SIGNAL") {
    payload.formula = "Hold the quiet line"
    payload.origin = "This day carries a quieter field, where pressure is low and meaning does not need force."
    payload.gate = "Today's pivot is not expansion but clean attention to what already stands."
    payload.vector = "If the line stays simple, the near arc tends toward steadier clarity without extra strain."
    payload.action = "Keep one light steady line."
    payload.boundary = "Do not force a turning point."
    return payload
  }

  if (primaryBand === "STABILIZATION") {
    payload.formula = "Stabilize before extension"
    payload.origin = "This day arrives through a thinner support layer, where structure asks for protection before movement."
    payload.gate = "Today's pivot is keeping the base coherent instead of asking it to carry more weight."
    payload.vector = "If the base is reinforced now, the near arc tends toward firmer support and less internal scatter."
    payload.action = "Reinforce the main base."
    payload.boundary = "Do not widen the field yet."
    return payload
  }

  if (primaryBand === "CONTAINMENT") {
    payload.formula = "Hold the line, reduce pressure"
    payload.origin = "This day continues a hotter field, where pressure rises faster than support."
    payload.gate = "Today's pivot is containment, not scale."
    payload.vector = "If pressure is held instead of amplified, the near arc tends toward steadier control."
    payload.action = "Reduce load on the main line."
    payload.boundary = "Do not turn pressure into speed."
    return payload
  }

  if (primaryBand === "CONCENTRATION") {
    payload.formula = "One line, less noise"
    payload.origin = "This day enters through a dense signal field, where too many fronts quickly blur the center."
    payload.gate = "Today's pivot is choosing the one line that can actually carry the day."
    payload.vector = "If the field is narrowed now, the near arc tends toward clearer movement and less wasted friction."
    payload.action = "Choose one leading line."
    payload.boundary = "Do not open new fronts."
    return payload
  }

  if (primaryBand === "OPENING") {
    payload.formula = "Open from stable ground"
    payload.origin = "This day arrives with strong coherence and enough support for measured outward motion."
    payload.gate = "Today's pivot is controlled opening, not raw push."
    payload.vector = "If the base stays visible, the near arc tends toward cleaner expansion with less drag."
    payload.action = "Extend one prepared line."
    payload.boundary = "Do not outrun the base."
    return payload
  }

  return payload
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
  const [selectedIntent, setSelectedIntent] = useState(null)

  if (!temporal || !temporal.date) {
    return (
      <main style={{ maxWidth: 820, margin: "80px auto", padding: "0 24px 84px", fontFamily: "system-ui" }}>
        <h1>Frey Temporal Reading</h1>
        <p>Temporal engine unavailable.</p>
      </main>
    )
  }

  const cosmo = mapCosmographer(temporal)
  const navigator = mapNavigator(temporal)

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

  const navigatorWrap = {
    marginTop: 52,
    paddingTop: 34,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  }

  const formulaWrap = {
    marginTop: 18,
    padding: "20px 22px 22px",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)"
  }

  const formulaLine = {
    fontSize: 34,
    lineHeight: 1.08,
    marginTop: 14,
    marginBottom: 0,
    fontWeight: 650,
    letterSpacing: "-0.03em"
  }

  const navGrid = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
    marginTop: 22
  }

  const navCard = {
    padding: "18px 20px 20px",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)"
  }

  const navLabel = {
    fontSize: 12,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    opacity: 0.52,
    margin: 0
  }

  const navText = {
    fontSize: 18,
    lineHeight: 1.45,
    marginTop: 12,
    marginBottom: 0,
    opacity: 0.94
  }

  const intentWrap = {
    marginTop: 52,
    paddingTop: 34,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  }

  const intentGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 20
  }

  const intentButton = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 48,
    padding: "12px 14px",
    borderRadius: 18,
    border: active ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.10)",
    background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 14,
    letterSpacing: "0.01em",
    textAlign: "center"
  })

  const responseCell = {
    marginTop: 22,
    padding: "22px 22px 24px",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)"
  }

  const responseLabel = {
    fontSize: 12,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    opacity: 0.52,
    margin: 0
  }

  const responseTitle = {
    fontSize: 28,
    lineHeight: 1.14,
    marginTop: 16,
    marginBottom: 0,
    fontWeight: 620,
    letterSpacing: "-0.02em"
  }

  const responseLine = {
    fontSize: 18,
    lineHeight: 1.45,
    marginTop: 16,
    marginBottom: 0,
    opacity: 0.92
  }

  const placeholder = {
    fontSize: 16,
    lineHeight: 1.5,
    marginTop: 16,
    marginBottom: 0,
    opacity: 0.58
  }

  const intents = {
    structure: {
      label: "Structural condition",
      summary: cosmo.structural,
      anchor: `Anchor: Structural State ${fmt(temporal.structural_stability, 3)}.`,
      implication: "Read this signal through form integrity, not through expansion."
    },
    tension: {
      label: "Tension pattern",
      summary: cosmo.tension,
      anchor: `Anchor: Tension Field ${fmt(temporal.harmonic_tension, 4)}.`,
      implication: "Read this signal through pressure behavior, not through narrative projection."
    },
    resonance: {
      label: "Resonance quality",
      summary: cosmo.resonance,
      anchor: `Anchor: Resonance Field ${fmt(temporal.resonance_level, 4)}.`,
      implication: "Read this signal through alignment strength, not through emotional amplification."
    },
    direction: {
      label: "Direction vector",
      summary: `→ ${cosmo.direction}`,
      anchor: "Anchor: current reading remains single-state.",
      implication: "Treat this as the bounded next move inside the present field."
    }
  }

  const activeCell = selectedIntent ? intents[selectedIntent] : null

  return (
    <main
      data-reading-surface="READING_SURFACE_MICRO_POLISH_V0_2"
      data-cosmographer-direction-gate="COSMOGRAPHER_DIRECTION_GATE_V0_1"
      data-reading-daily-navigator-foundation="READING_DAILY_NAVIGATOR_FOUNDATION_V0_1"
      style={shell}
    >
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

      <section style={navigatorWrap} data-reading-navigator-mode="READING_DAILY_NAVIGATOR_FOUNDATION_V0_1">
        <p style={label}>Formula of the Day</p>
        <div style={formulaWrap}>
          <p style={responseLabel}>Daily Navigator</p>
          <p style={formulaLine}>{navigator.formula}</p>
        </div>

        <div style={navGrid}>
          <div style={navCard}>
            <p style={navLabel}>Origin</p>
            <p style={navText}>{navigator.origin}</p>
          </div>
          <div style={navCard}>
            <p style={navLabel}>Current Gate</p>
            <p style={navText}>{navigator.gate}</p>
          </div>
          <div style={navCard}>
            <p style={navLabel}>Vector</p>
            <p style={navText}>{navigator.vector}</p>
          </div>
          <div style={navCard}>
            <p style={navLabel}>Right Action</p>
            <p style={navText}>{navigator.action}</p>
          </div>
          <div style={navCard}>
            <p style={navLabel}>Boundary</p>
            <p style={navText}>{navigator.boundary}</p>
          </div>
        </div>
      </section>

            <div
              data-reading-nav-action-cell-live="READING_NAVIGATOR_ACTION_CELL_LIVE_LAYER_V0_1"
              data-reading-nav-action-cell="READING_NAVIGATOR_ACTION_CELL_V0_1"
              style={{
                marginTop: 16,
                marginBottom: 16,
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)"
              }}
            >
              <p style={label}>Next step</p>
              <p style={{ fontSize: 16, lineHeight: 1.5, marginTop: 6, marginBottom: 0, opacity: 0.78 }}>
                Choose one lens below to continue this reading.
              </p>
            </div>

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

          <div style={intentWrap}>
            <p style={label}>Interpret this signal</p>

            <div style={intentGrid}>
              <button type="button" onClick={() => setSelectedIntent("structure")} style={intentButton(selectedIntent === "structure")}>
                Structural condition
              </button>
              <button type="button" onClick={() => setSelectedIntent("tension")} style={intentButton(selectedIntent === "tension")}>
                Tension pattern
              </button>
              <button type="button" onClick={() => setSelectedIntent("resonance")} style={intentButton(selectedIntent === "resonance")}>
                Resonance quality
              </button>
              <button type="button" onClick={() => setSelectedIntent("direction")} style={intentButton(selectedIntent === "direction")}>
                Direction vector
              </button>
            </div>

            <div style={responseCell}>
              <p style={responseLabel}>Cosmographer</p>

              {activeCell ? (
                <>
                  <p style={responseTitle}>{activeCell.label}</p>
                  <p style={responseLine}>{activeCell.summary}</p>
                  <p style={responseLine}>{activeCell.anchor}</p>
                  <p style={responseLine}>{activeCell.implication}</p>
                </>
              ) : (
                <p style={placeholder}>Select one bounded direction to read the present signal.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
