import { useState } from "react"

const states = [
  { id: "01", title: "Pre-Formation" },
  { id: "02", title: "Structural Build" },
  { id: "03", title: "Capital Alignment" },
  { id: "04", title: "Expansion Threshold" },
  { id: "05", title: "Structural Stability" }
]

export default function Reading() {
  const [active, setActive] = useState("03")

  return (
    <main style={{ display: "flex", minHeight: "100vh", padding: "80px 24px" }}>

      <aside style={{
        width: "25%",
        position: "sticky",
        top: "120px",
        height: "fit-content",
        fontSize: "14px"
      }}>
        {states.map((s) => (
          <div
            key={s.id}
            onClick={() => setActive(s.id)}
            style={{
              padding: "12px 0",
              cursor: "pointer",
              opacity: active === s.id ? 1 : 0.5,
              borderLeft: active === s.id ? "2px solid #c6a85b" : "2px solid transparent",
              paddingLeft: "12px"
            }}
          >
            {s.id} · {s.title}
          </div>
        ))}
      </aside>

      <section style={{ width: "75%", paddingLeft: "60px" }}>

        <h1>FREY · PROJECT STATE MODEL</h1>

        <pre style={{ marginTop: "40px" }}>
{`FIELD_TENSION     = (W - R) × (S / 200) × (H / 12)
SYSTEM_RESILIENCE = R × (1 - W) × (S / 200)`}
        </pre>

        <div style={{ marginTop: "60px", fontFamily: "monospace" }}>

          {active === "03" && (
            <pre>
{`STATE 03 · Capital Alignment

SCALE_INDEX         180
EXECUTION_READINESS 0.62
RISK_WEIGHT         0.71
HORIZON_MONTHS      9–18

FIELD_TENSION       0.12
SYSTEM_RESILIENCE   0.14

CAPITAL EFFECT:
Capital shifts system from structural stress to balance.`}
            </pre>
          )}

          {active !== "03" && (
            <pre>
{`STATE ${active}

Core metrics and simulation for this phase.
Numbers to be finalized in next iteration.`}
            </pre>
          )}

        </div>

      </section>
    </main>
  )
}
