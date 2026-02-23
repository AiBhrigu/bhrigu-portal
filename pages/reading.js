export default function Reading() {
  return (
    <main style={{ padding: "80px 24px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1>FREY · PROJECT STATE MODEL</h1>

      <p style={{ opacity: 0.7, maxWidth: "640px" }}>
        Frey models project evolution through structured metrics.
        Each scenario below represents a systemic configuration.
        Capital impact can be simulated through readiness shifts.
      </p>

      <pre style={{ marginTop: "40px" }}>
{`FIELD_TENSION     = (W - R) × (S / 200) × (H / 12)
SYSTEM_RESILIENCE = R × (1 - W) × (S / 200)`}
      </pre>

      <section style={{ marginTop: "60px" }}>
        <pre>
{`STATE 03 · Capital Alignment

SCALE_INDEX         180
EXECUTION_READINESS 0.62
RISK_WEIGHT         0.71
HORIZON_MONTHS      9–18

FIELD_TENSION       0.12
SYSTEM_RESILIENCE   0.14

Investment Simulation:
If EXECUTION_READINESS = 0.72

FIELD_TENSION       -0.01
SYSTEM_RESILIENCE   0.20`}
        </pre>
      </section>

      <p style={{ marginTop: "80px", opacity: 0.6 }}>
        Frey measures structural balance between scale, risk and readiness.
      </p>
    </main>
  )
}
