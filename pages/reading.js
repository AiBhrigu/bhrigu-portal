import { useState } from "react"

const states = [
  { id: "01", title: "Pre-Formation", scale: 40, tension: 0.45 },
  { id: "02", title: "Structural Build", scale: 95, tension: 0.32 },
  { id: "03", title: "Capital Alignment", scale: 180, tension: 0.12 },
  { id: "04", title: "Expansion Threshold", scale: 260, tension: 0.05 },
  { id: "05", title: "Structural Stability", scale: 420, tension: -0.02 }
]

export default function Reading() {
  const [active, setActive] = useState("03")

  const maxScale = 450
  const maxTension = 0.5

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

        {/* Phase Topology Map */}
        <div style={{ marginTop: "40px", marginBottom: "60px" }}>
          <svg width="100%" height="280" viewBox="0 0 600 280">
            <line x1="40" y1="20" x2="40" y2="240" stroke="#333" />
            <line x1="40" y1="240" x2="580" y2="240" stroke="#333" />

            {states.map((s, i) => {
              const x = 40 + (s.scale / maxScale) * 520
              const y = 240 - ((s.tension + maxTension) / (maxTension * 2)) * 220
              return (
                <circle
                  key={s.id}
                  cx={x}
                  cy={y}
                  r={active === s.id ? 6 : 4}
                  fill={active === s.id ? "#c6a85b" : "#888"}
                />
              )
            })}

            <polyline
              fill="none"
              stroke="#555"
              strokeWidth="1"
              points={states.map(s => {
                const x = 40 + (s.scale / maxScale) * 520
                const y = 240 - ((s.tension + maxTension) / (maxTension * 2)) * 220
                return `${x},${y}`
              }).join(" ")}
            />
          </svg>
        </div>

        <pre>
{`FIELD_TENSION     = (W - R) × (S / 200) × (H / 12)
SYSTEM_RESILIENCE = R × (1 - W) × (S / 200)`}
        </pre>

      </section>
    </main>
  )
}
