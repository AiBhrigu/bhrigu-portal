import { composeReadingV2 } from "../lib/contracts/reading-compose-v2"

export async function getServerSideProps(context) {
  const { date } = context.query
  const targetDate =
    typeof date === "string" && date.length > 0
      ? date
      : new Date().toISOString().slice(0, 10)

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  const response = await fetch(
    `${baseUrl}/api/frey-temporal?date=${targetDate}`
  )

  if (!response.ok) {
    return {
      props: {
        status: "api_error",
        surface_marker: "READING_V2_SURFACE_V0_2"
      }
    }
  }

  const raw = await response.json()

  const adapted = {
    core: raw,
    derived: raw.analysis || {}
  }

  const traceId = `trace_${Date.now()}`
  const composed = composeReadingV2(adapted, traceId)

  return {
    props: {
      snapshot_date: targetDate,
      reading: composed,
      surface_marker: "READING_V2_SURFACE_V0_2"
    }
  }
}

export default function Reading({ snapshot_date, reading, surface_marker }) {
  return (
    <div data-reading-surface="READING_V2_SURFACE_V0_2">
      <h1>Reading v2 Canonical</h1>

      <section>
        <h3>Snapshot Anchor</h3>
        <p>{snapshot_date}</p>
      </section>

      <section>
        <h3>Structural Metrics</h3>
        <pre>{JSON.stringify(reading?.meta_metrics || {}, null, 2)}</pre>
      </section>

      <section>
        <h3>System State</h3>
        <pre>{JSON.stringify(reading?.system_state || {}, null, 2)}</pre>
      </section>

      <section>
        <h3>Interpretation</h3>
        <pre>{JSON.stringify(reading?.summary || {}, null, 2)}</pre>
      </section>

      <div id="surface-marker">{surface_marker}</div>
    </div>
  )
}
